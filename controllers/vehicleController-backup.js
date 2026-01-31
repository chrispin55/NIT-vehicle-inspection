const { getPool } = require('../database/config');

// Get all vehicles
const getAllVehicles = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get database pool
    const pool = await getPool();
    
    let query = `
      SELECT v.*, 
             d.full_name as assigned_driver_name,
             CASE 
               WHEN v.next_maintenance_date <= CURDATE() THEN 'Overdue'
               WHEN v.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
               ELSE 'OK'
             END as maintenance_status
      FROM vehicles v
      LEFT JOIN drivers d ON v.id = d.assigned_vehicle_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND v.vehicle_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [vehicles] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM vehicles WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (type) {
      countQuery += ' AND vehicle_type = ?';
      countParams.push(type);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    
    res.json({
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch vehicles'
    });
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [vehicles] = await pool.execute(`
      SELECT v.*, 
             d.full_name as assigned_driver_name,
             d.id as assigned_driver_id
      FROM vehicles v
      LEFT JOIN drivers d ON v.id = d.assigned_vehicle_id
      WHERE v.id = ?
    `, [id]);
    
    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }
    
    // Get maintenance history
    const [maintenance] = await pool.execute(`
      SELECT * FROM maintenance_records 
      WHERE vehicle_id = ? 
      ORDER BY maintenance_date DESC 
      LIMIT 5
    `, [id]);
    
    // Get fuel records
    const [fuelRecords] = await pool.execute(`
      SELECT fr.*, d.full_name as driver_name
      FROM fuel_records fr
      LEFT JOIN drivers d ON fr.driver_id = d.id
      WHERE fr.vehicle_id = ? 
      ORDER BY fuel_date DESC 
      LIMIT 5
    `, [id]);
    
    const vehicle = vehicles[0];
    vehicle.maintenance_history = maintenance;
    vehicle.fuel_records = fuelRecords;
    
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch vehicle'
    });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const {
      plate_number,
      vehicle_type,
      model,
      manufacture_year,
      capacity,
      status = 'Active',
      fuel_type = 'Diesel',
      last_maintenance_date,
      next_maintenance_date,
      insurance_expiry
    } = req.body;
    
    // Check if plate number already exists
    const [existing] = await pool.execute(
      'SELECT id FROM vehicles WHERE plate_number = ?',
      [plate_number]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Vehicle with this plate number already exists'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO vehicles (
        plate_number, vehicle_type, model, manufacture_year, capacity,
        status, fuel_type, last_maintenance_date, next_maintenance_date, insurance_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      plate_number, vehicle_type, model, manufacture_year, capacity,
      status, fuel_type, last_maintenance_date, next_maintenance_date, insurance_expiry
    ]);
    
    // Return the created vehicle
    const [newVehicle] = await pool.execute(
      'SELECT * FROM vehicles WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: newVehicle[0]
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create vehicle'
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Check if vehicle exists
    const [existing] = await pool.execute(
      'SELECT id FROM vehicles WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }
    
    // If updating plate number, check for duplicates
    if (updateFields.plate_number) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM vehicles WHERE plate_number = ? AND id != ?',
        [updateFields.plate_number, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Vehicle with this plate number already exists'
        });
      }
    }
    
    // Build dynamic update query
    const fields = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    if (fields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await pool.execute(
      `UPDATE vehicles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
    
    // Return updated vehicle
    const [updatedVehicle] = await pool.execute(
      'SELECT * FROM vehicles WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle[0]
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update vehicle'
    });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vehicle exists
    const [existing] = await pool.execute(
      'SELECT id, plate_number FROM vehicles WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }
    
    // Check if vehicle is assigned to any driver
    const [assigned] = await pool.execute(
      'SELECT id FROM drivers WHERE assigned_vehicle_id = ?',
      [id]
    );
    
    if (assigned.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete vehicle that is assigned to a driver'
      });
    }
    
    // Check for active trips
    const [activeTrips] = await pool.execute(
      'SELECT id FROM trips WHERE vehicle_id = ? AND status IN ("Scheduled", "In Progress")',
      [id]
    );
    
    if (activeTrips.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete vehicle with active trips'
      });
    }
    
    await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);
    
    res.json({
      message: 'Vehicle deleted successfully',
      vehicle: existing[0]
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete vehicle'
    });
  }
};

// Get vehicle statistics
const getVehicleStats = async (req, res) => {
  try {
    const pool = await getPool();
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_vehicles,
        SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_vehicles,
        SUM(CASE WHEN next_maintenance_date <= CURDATE() THEN 1 ELSE 0 END) as overdue_maintenance,
        SUM(CASE WHEN next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND next_maintenance_date > CURDATE() THEN 1 ELSE 0 END) as due_soon_maintenance
      FROM vehicles
    `);
    
    const [byType] = await pool.execute(`
      SELECT vehicle_type, COUNT(*) as count
      FROM vehicles
      GROUP BY vehicle_type
      ORDER BY count DESC
    `);
    
    res.json({
      overview: stats[0],
      by_type: byType
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch vehicle statistics'
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
};
