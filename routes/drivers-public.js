const express = require('express');
const router = express.Router();

const driverController = require('../controllers/driverController');
const { validateDriver, validateId } = require('../middleware/validation');

// All routes are now public (no authentication required)
router.get('/', driverController.getAllDrivers);
router.get('/:id', validateId, driverController.getDriverById);
router.get('/stats/summary', driverController.getDriverStats);

// Create driver (no auth required)
router.post('/', validateDriver, driverController.createDriver);

// Update driver (no auth required)
router.put('/:id', validateId, validateDriver, driverController.updateDriver);

// Delete driver (no auth required)
router.delete('/:id', validateId, driverController.deleteDriver);

module.exports = router;
