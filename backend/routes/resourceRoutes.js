const express = require('express');
const router = express.Router();
const {
  updateMyResources,
  getMyResources,
  findMatchingVolunteers,
  submitIdVerification,
  updateEmergencyContacts,
  getMyProfile,
} = require('../controllers/resourceController');const protect = require('../middleware/authMiddleware');
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
router.get('/profile', protect, getMyProfile);
router.put('/id-verification', protect, submitIdVerification);
router.put('/emergency-contacts', protect, updateEmergencyContacts);
module.exports = router;