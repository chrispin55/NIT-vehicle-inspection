const { getPool } = require('../database/config');

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get database pool
    const pool = await getPool();
    
    let query = `
      SELECT d.*, 
             v.plate_number as assigned_vehicle_plate,
             v.vehicle_type as assigned_vehicle_type,
             COUNT(t.id) as total_trips
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      LEFT JOIN trips t ON d.id = t.driver_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY d.id ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [drivers] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM drivers WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    
    res.json({
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch drivers'
    });
  }
};

// Get driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [drivers] = await pool.execute(`
      SELECT d.*, 
             v.plate_number as assigned_vehicle_plate,
             v.vehicle_type as assigned_vehicle_type,
             v.model as assigned_vehicle_model
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE d.id = ?
    `, [id]);
    
    if (drivers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }
    
    // Get recent trips
    const [trips] = await pool.execute(`
      SELECT t.*, v.plate_number, v.vehicle_type
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.driver_id = ?
      ORDER BY t.trip_date DESC, t.departure_time DESC
      LIMIT 10
    `, [id]);
    
    const driver = drivers[0];
    driver.recent_trips = trips;
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch driver'
    });
  }
};

// Create new driver
const createDriver = async (req, res) => {
  try {
    const {
      full_name,
      license_number,
      phone_number,
      email,
      experience_years = 0,
      license_expiry,
      assigned_vehicle_id = null,
      status = 'Active'
    } = req.body;
    
    // Check if license number already exists
    const [existing] = await pool.execute(
      'SELECT id FROM drivers WHERE license_number = ?',
      [license_number]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Driver with this license number already exists'
      });
    }
    
    // If assigning a vehicle, check if it's available
    if (assigned_vehicle_id) {
      const [vehicleCheck] = await pool.execute(
        'SELECT id, status FROM vehicles WHERE id = ?',
        [assigned_vehicle_id]
      );
      
      if (vehicleCheck.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Assigned vehicle not found'
        });
      }
      
      if (vehicleCheck[0].status !== 'Active') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot assign driver to inactive vehicle'
        });
      }
      
      // Check if vehicle is already assigned
      const [assignedCheck] = await pool.execute(
        'SELECT id FROM drivers WHERE assigned_vehicle_id = ? AND status = "Active"',
        [assigned_vehicle_id]
      );
      
      if (assignedCheck.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Vehicle is already assigned to another driver'
        });
      }
    }
    
    const [result] = await pool.execute(`
      INSERT INTO drivers (
        id, full_name, license_number, phone_number, email, experience_years,
        license_expiry, assigned_vehicle_id, status
      ) VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM drivers), ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      full_name, license_number, phone_number, email, experience_years,
      license_expiry, assigned_vehicle_id, status
    ]);
    
    // Return the created driver
    const [newDriver] = await pool.execute(`
      SELECT d.*, 
             v.plate_number as assigned_vehicle_plate,
             v.vehicle_type as assigned_vehicle_type
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE d.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      message: 'Driver created successfully',
      driver: newDriver[0]
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create driver'
    });
  }
};

// Update driver
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Check if driver exists
    const [existing] = await pool.execute(
      'SELECT id, assigned_vehicle_id FROM drivers WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }
    
    // If updating license number, check for duplicates
    if (updateFields.license_number) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM drivers WHERE license_number = ? AND id != ?',
        [updateFields.license_number, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Driver with this license number already exists'
        });
      }
    }
    
    // Handle vehicle assignment changes
    if (updateFields.assigned_vehicle_id !== undefined) {
      const currentVehicleId = existing[0].assigned_vehicle_id;
      const newVehicleId = updateFields.assigned_vehicle_id;
      
      // If assigning a new vehicle
      if (newVehicleId && newVehicleId !== currentVehicleId) {
        const [vehicleCheck] = await pool.execute(
          'SELECT id, status FROM vehicles WHERE id = ?',
          [newVehicleId]
        );
        
        if (vehicleCheck.length === 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Assigned vehicle not found'
          });
        }
        
        if (vehicleCheck[0].status !== 'Active') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot assign driver to inactive vehicle'
          });
        }
        
        // Check if vehicle is already assigned to another active driver
        const [assignedCheck] = await pool.execute(
          'SELECT id FROM drivers WHERE assigned_vehicle_id = ? AND status = "Active" AND id != ?',
          [newVehicleId, id]
        );
        
        if (assignedCheck.length > 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Vehicle is already assigned to another driver'
          });
        }
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
      `UPDATE drivers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
    
    // Return updated driver
    const [updatedDriver] = await pool.execute(`
      SELECT d.*, 
             v.plate_number as assigned_vehicle_plate,
             v.vehicle_type as assigned_vehicle_type
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE d.id = ?
    `, [id]);
    
    res.json({
      message: 'Driver updated successfully',
      driver: updatedDriver[0]
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update driver'
    });
  }
};

// Delete driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if driver exists
    const [existing] = await pool.execute(
      'SELECT id, full_name FROM drivers WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }
    
    // Check for active trips
    const [activeTrips] = await pool.execute(
      'SELECT id FROM trips WHERE driver_id = ? AND status IN ("Scheduled", "In Progress")',
      [id]
    );
    
    if (activeTrips.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete driver with active trips'
      });
    }
    
    await pool.execute('DELETE FROM drivers WHERE id = ?', [id]);
    
    res.json({
      message: 'Driver deleted successfully',
      driver: existing[0]
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete driver'
    });
  }
};

// Get driver statistics
const getDriverStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_drivers,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_drivers,
        SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_drivers,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_drivers,
        SUM(CASE WHEN assigned_vehicle_id IS NOT NULL THEN 1 ELSE 0 END) as assigned_drivers,
        AVG(experience_years) as avg_experience_years
      FROM drivers
    `);
    
    const [licenseExpiry] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN license_expiry <= CURDATE() THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN license_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND license_expiry > CURDATE() THEN 1 ELSE 0 END) as expiring_soon
      FROM drivers 
      WHERE license_expiry IS NOT NULL
    `);
    
    res.json({
      overview: stats[0],
      license_status: licenseExpiry[0]
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch driver statistics'
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverStats
};
