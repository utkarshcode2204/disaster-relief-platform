const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPriorityQueue,
  getAllUsers,
  updateVerificationStatus,
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// All admin routes require login + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/priority-queue', getPriorityQueue);
router.get('/users', getAllUsers);
router.patch('/users/:id/verification', updateVerificationStatus);

module.exports = router;