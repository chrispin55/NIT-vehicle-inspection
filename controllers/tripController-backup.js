const { getPool } = require('../database/config');

// Get all trips
const getAllTrips = async (req, res) => {
  try {
    const { status, driver_id, vehicle_id, start_date, end_date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get database pool
    const pool = await getPool();
    
    // Build query with parameters
    let query = `
      SELECT t.*, 
             d.full_name as driver_name,
             v.plate_number as vehicle_plate,
             v.vehicle_type as vehicle_type
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (driver_id) {
      query += ' AND t.driver_id = ?';
      params.push(driver_id);
    }
    
    if (vehicle_id) {
      query += ' AND t.vehicle_id = ?';
      params.push(vehicle_id);
    }
    
    if (start_date) {
      query += ' AND t.trip_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND t.trip_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY t.trip_date DESC, t.departure_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [trips] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM trips t 
      WHERE 1=1
    `;
    const countParams = [];
    
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    
    if (driver_id) {
      countQuery += ' AND t.driver_id = ?';
      countParams.push(driver_id);
    }
    
    if (vehicle_id) {
      countQuery += ' AND t.vehicle_id = ?';
      countParams.push(vehicle_id);
    }
    
    if (start_date) {
      countQuery += ' AND t.trip_date >= ?';
      countParams.push(start_date);
    }
    
    if (end_date) {
      countQuery += ' AND t.trip_date <= ?';
      countParams.push(end_date);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    
    res.json({
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch trips'
    });
  }
};

// Get trip by ID
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [trips] = await pool.execute(`
      SELECT t.*, 
             d.full_name as driver_name,
             d.phone_number as driver_phone,
             v.plate_number as vehicle_plate,
             v.vehicle_type as vehicle_type,
             v.model as vehicle_model
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = ?
    `, [id]);
    
    if (trips.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }
    
    res.json(trips[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch trip'
    });
  }
};

// Create new trip
const createTrip = async (req, res) => {
  try {
    const {
      route_from,
      route_to,
      driver_id,
      vehicle_id,
      trip_date,
      departure_time,
      arrival_time,
      distance_km,
      fuel_consumed,
      passenger_count = 0,
      notes,
      status = 'Scheduled'
    } = req.body;
    
    // Check if driver exists and is active
    const [driverCheck] = await pool.execute(
      'SELECT id, full_name, status FROM drivers WHERE id = ?',
      [driver_id]
    );
    
    if (driverCheck.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver not found'
      });
    }
    
    if (driverCheck[0].status !== 'Active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot assign trip to inactive driver'
      });
    }
    
    // Check if vehicle exists and is active
    const [vehicleCheck] = await pool.execute(
      'SELECT id, plate_number, status FROM vehicles WHERE id = ?',
      [vehicle_id]
    );
    
    if (vehicleCheck.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Vehicle not found'
      });
    }
    
    if (vehicleCheck[0].status !== 'Active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot assign trip to inactive vehicle'
      });
    }
    
    // Check for driver conflicts (same time)
    if (departure_time) {
      const [driverConflict] = await pool.execute(`
        SELECT id FROM trips 
        WHERE driver_id = ? AND trip_date = ? AND departure_time = ? 
        AND status IN ('Scheduled', 'In Progress')
      `, [driver_id, trip_date, departure_time]);
      
      if (driverConflict.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Driver already has a trip scheduled at this time'
        });
      }
    }
    
    // Check for vehicle conflicts (same time)
    if (departure_time) {
      const [vehicleConflict] = await pool.execute(`
        SELECT id FROM trips 
        WHERE vehicle_id = ? AND trip_date = ? AND departure_time = ? 
        AND status IN ('Scheduled', 'In Progress')
      `, [vehicle_id, trip_date, departure_time]);
      
      if (vehicleConflict.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Vehicle already has a trip scheduled at this time'
        });
      }
    }
    
    const [result] = await pool.execute(`
      INSERT INTO trips (
        route_from, route_to, driver_id, vehicle_id, trip_date,
        departure_time, arrival_time, distance_km, fuel_consumed,
        passenger_count, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      route_from, route_to, driver_id, vehicle_id, trip_date,
      departure_time, arrival_time, distance_km, fuel_consumed,
      passenger_count, notes, status
    ]);
    
    // Return the created trip
    const [newTrip] = await pool.execute(`
      SELECT t.*, 
             d.full_name as driver_name,
             v.plate_number as vehicle_plate,
             v.vehicle_type as vehicle_type
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      message: 'Trip created successfully',
      trip: newTrip[0]
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create trip'
    });
  }
};

// Update trip
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Check if trip exists
    const [existing] = await pool.execute(
      'SELECT id, status, driver_id, vehicle_id, trip_date, departure_time FROM trips WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }
    
    const trip = existing[0];
    
    // Prevent updating completed or cancelled trips
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot update completed or cancelled trips'
      });
    }
    
    // Validate driver and vehicle if being updated
    if (updateFields.driver_id) {
      const [driverCheck] = await pool.execute(
        'SELECT id, status FROM drivers WHERE id = ?',
        [updateFields.driver_id]
      );
      
      if (driverCheck.length === 0 || driverCheck[0].status !== 'Active') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or inactive driver'
        });
      }
    }
    
    if (updateFields.vehicle_id) {
      const [vehicleCheck] = await pool.execute(
        'SELECT id, status FROM vehicles WHERE id = ?',
        [updateFields.vehicle_id]
      );
      
      if (vehicleCheck.length === 0 || vehicleCheck[0].status !== 'Active') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or inactive vehicle'
        });
      }
    }
    
    // Check for conflicts if updating time, driver, or vehicle
    const newDriverId = updateFields.driver_id || trip.driver_id;
    const newVehicleId = updateFields.vehicle_id || trip.vehicle_id;
    const newDate = updateFields.trip_date || trip.trip_date;
    const newTime = updateFields.departure_time || trip.departure_time;
    
    if (newTime && (updateFields.driver_id || updateFields.vehicle_id || updateFields.trip_date || updateFields.departure_time)) {
      // Check driver conflicts
      const [driverConflict] = await pool.execute(`
        SELECT id FROM trips 
        WHERE driver_id = ? AND trip_date = ? AND departure_time = ? 
        AND status IN ('Scheduled', 'In Progress') AND id != ?
      `, [newDriverId, newDate, newTime, id]);
      
      if (driverConflict.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Driver already has a trip scheduled at this time'
        });
      }
      
      // Check vehicle conflicts
      const [vehicleConflict] = await pool.execute(`
        SELECT id FROM trips 
        WHERE vehicle_id = ? AND trip_date = ? AND departure_time = ? 
        AND status IN ('Scheduled', 'In Progress') AND id != ?
      `, [newVehicleId, newDate, newTime, id]);
      
      if (vehicleConflict.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Vehicle already has a trip scheduled at this time'
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
      `UPDATE trips SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
    
    // Return updated trip
    const [updatedTrip] = await pool.execute(`
      SELECT t.*, 
             d.full_name as driver_name,
             v.plate_number as vehicle_plate,
             v.vehicle_type as vehicle_type
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = ?
    `, [id]);
    
    res.json({
      message: 'Trip updated successfully',
      trip: updatedTrip[0]
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update trip'
    });
  }
};

// Delete trip
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if trip exists
    const [existing] = await pool.execute(
      'SELECT id, status FROM trips WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }
    
    const trip = existing[0];
    
    // Prevent deleting in-progress trips
    if (trip.status === 'In Progress') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete trip that is currently in progress'
      });
    }
    
    await pool.execute('DELETE FROM trips WHERE id = ?', [id]);
    
    res.json({
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete trip'
    });
  }
};

// Get trip statistics
const getTripStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE trip_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_trips,
        SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_trips,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_trips,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_trips,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_trips,
        SUM(passenger_count) as total_passengers,
        AVG(distance_km) as avg_distance,
        SUM(distance_km) as total_distance,
        AVG(fuel_consumed) as avg_fuel_consumed,
        SUM(fuel_consumed) as total_fuel_consumed
      FROM trips 
      ${dateFilter}
    `, params);
    
    const [byStatus] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM trips 
      ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `, params);
    
    const [topRoutes] = await pool.execute(`
      SELECT 
        CONCAT(route_from, ' → ', route_to) as route,
        COUNT(*) as trip_count,
        AVG(distance_km) as avg_distance
      FROM trips 
      ${dateFilter}
      GROUP BY route_from, route_to
      ORDER BY trip_count DESC
      LIMIT 10
    `, params);
    
    res.json({
      overview: stats[0],
      by_status: byStatus,
      top_routes: topRoutes
    });
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch trip statistics'
    });
  }
};

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats
};
