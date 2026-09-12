const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  createDonation,
  getDonationSummary,
  getRecentDonations,
} = require('../controllers/donationController');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const validateCreateDonation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
  body('donorName').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  body('donorEmail').optional().trim().isEmail().withMessage('Invalid email address'),
  body('message').optional().trim().isLength({ max: 300 }).withMessage('Message too long'),
  handleValidationErrors,
];

router.post('/', validateCreateDonation, createDonation);
router.get('/summary', getDonationSummary);
router.get('/recent', getRecentDonations);

module.exports = router;