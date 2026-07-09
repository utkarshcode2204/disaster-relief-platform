const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  claimRequest,
  resolveRequest,
} = require('../controllers/requestController');
const protect = require('../middleware/authMiddleware');

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.patch('/:id/claim', protect, claimRequest);
router.patch('/:id/resolve', protect, resolveRequest);

module.exports = router;