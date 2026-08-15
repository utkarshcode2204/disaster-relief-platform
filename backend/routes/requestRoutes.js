const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  createRequest,
  getRequests,
  getRequestById,
  claimRequest,
  resolveRequest,
} = require('../controllers/requestController');
const protect = require('../middleware/authMiddleware');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const validateCreateRequest = [
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 1000 }).withMessage('Description must be between 5 and 1000 characters'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid number between -180 and 180'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid number between -90 and 90'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number too long'),
  handleValidationErrors,
];

router.post('/', validateCreateRequest, createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.patch('/:id/claim', protect, claimRequest);
router.patch('/:id/resolve', protect, resolveRequest);

module.exports = router;