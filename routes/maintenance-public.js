const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenanceController');
const { validateMaintenance, validateId } = require('../middleware/validation');

// All routes are now public (no authentication required)
router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', validateId, maintenanceController.getMaintenanceById);
router.get('/stats/summary', maintenanceController.getMaintenanceStats);

// Create maintenance record (no auth required)
router.post('/', validateMaintenance, maintenanceController.createMaintenance);

// Update maintenance record (no auth required)
router.put('/:id', validateId, validateMaintenance, maintenanceController.updateMaintenance);

// Delete maintenance record (no auth required)
router.delete('/:id', validateId, maintenanceController.deleteMaintenance);

module.exports = router;
