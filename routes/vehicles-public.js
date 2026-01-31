const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicleController');
const { validateVehicle, validateId } = require('../middleware/validation');

// All routes are now public (no authentication required)
router.get('/stats', vehicleController.getVehicleStats);
router.get('/', vehicleController.getAllVehicles);
router.get('/:id', validateId, vehicleController.getVehicleById);

// Create vehicle (no auth required)
router.post('/', validateVehicle, vehicleController.createVehicle);

// Update vehicle (no auth required)
router.put('/:id', validateId, validateVehicle, vehicleController.updateVehicle);

// Delete vehicle (no auth required)
router.delete('/:id', validateId, vehicleController.deleteVehicle);

module.exports = router;
