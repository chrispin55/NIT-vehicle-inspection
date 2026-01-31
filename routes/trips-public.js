const express = require('express');
const router = express.Router();

const tripController = require('../controllers/tripController');
const { validateTrip, validateId } = require('../middleware/validation');

// All routes are now public (no authentication required)
router.get('/', tripController.getAllTrips);
router.get('/:id', validateId, tripController.getTripById);
router.get('/stats/summary', tripController.getTripStats);

// Create trip (no auth required)
router.post('/', validateTrip, tripController.createTrip);

// Update trip (no auth required)
router.put('/:id', validateId, validateTrip, tripController.updateTrip);

// Delete trip (no auth required)
router.delete('/:id', validateId, tripController.deleteTrip);

module.exports = router;
