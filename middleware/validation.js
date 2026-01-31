const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Vehicle validation rules
const validateVehicle = [
  body('plate_number')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Plate number must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9\s-]+$/)
    .withMessage('Plate number can only contain letters, numbers, spaces, and hyphens'),
  
  body('vehicle_type')
    .isIn(['Bus', 'Minibus', 'SUV', 'Sedan', 'Pickup', 'Van'])
    .withMessage('Invalid vehicle type'),
  
  body('model')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Model must be between 2 and 100 characters'),
  
  body('manufacture_year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid manufacture year'),
  
  body('capacity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Under Maintenance', 'Inactive'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Driver validation rules
const validateDriver = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.-]+$/)
    .withMessage('Full name can only contain letters, spaces, dots, and hyphens'),
  
  body('license_number')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5 and 50 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('License number can only contain letters, numbers, and hyphens'),
  
  body('phone_number')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  
  body('assigned_vehicle_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid vehicle ID'),
  
  handleValidationErrors
];

// Trip validation rules
const validateTrip = [
  body('route_from')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Route from must be between 2 and 200 characters'),
  
  body('route_to')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Route to must be between 2 and 200 characters'),
  
  body('driver_id')
    .isInt({ min: 1 })
    .withMessage('Invalid driver ID'),
  
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('Invalid vehicle ID'),
  
  body('trip_date')
    .isISO8601()
    .withMessage('Invalid trip date format'),
  
  body('departure_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid departure time format (HH:MM)'),
  
  body('arrival_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid arrival time format (HH:MM)'),
  
  body('distance_km')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  
  body('fuel_consumed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fuel consumed must be a positive number'),
  
  body('passenger_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Passenger count must be a non-negative integer'),
  
  handleValidationErrors
];

// Maintenance validation rules
const validateMaintenance = [
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('Invalid vehicle ID'),
  
  body('service_type')
    .isIn(['Routine Maintenance', 'Oil Change', 'Brake Repair', 'Tire Replacement', 'Engine Repair'])
    .withMessage('Invalid service type'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  
  body('service_date')
    .isISO8601()
    .withMessage('Invalid service date format'),
  
  body('next_service_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid next service date format'),
  
  body('performed_by')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Performed by must be between 2 and 100 characters'),
  
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a non-negative integer'),
  
  handleValidationErrors
];

// Fuel record validation rules
const validateFuelRecord = [
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('Invalid vehicle ID'),
  
  body('fuel_date')
    .isISO8601()
    .withMessage('Invalid fuel date format'),
  
  body('fuel_type')
    .isIn(['Diesel', 'Petrol', 'Electric', 'Hybrid'])
    .withMessage('Invalid fuel type'),
  
  body('quantity_liters')
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be a positive number'),
  
  body('cost_per_liter')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per liter must be a positive number'),
  
  body('total_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total cost must be a positive number'),
  
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a non-negative integer'),
  
  body('fuel_station')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Fuel station must not exceed 100 characters'),
  
  body('driver_id')
    .isInt({ min: 1 })
    .withMessage('Invalid driver ID'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter'),
  
  handleValidationErrors
];

// Query validation for date ranges
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  handleValidationErrors
];

module.exports = {
  validateVehicle,
  validateDriver,
  validateTrip,
  validateMaintenance,
  validateFuelRecord,
  validateId,
  validateDateRange,
  handleValidationErrors
};
