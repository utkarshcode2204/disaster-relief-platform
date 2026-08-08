const express = require('express');
const router = express.Router();
const {
  updateMyResources,
  getMyResources,
  findMatchingVolunteers,
} = require('../controllers/resourceController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// Volunteer manages their own resources
router.get('/mine', protect, getMyResources);
router.put('/mine', protect, updateMyResources);

// Admin looks up volunteers matching an incident's needs
router.get(
  '/match/:incidentId',
  protect,
  authorize('admin'),
  findMatchingVolunteers
);

module.exports = router;