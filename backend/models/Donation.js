const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  donorName: {
    type: String,
    default: 'Anonymous',
    trim: true,
  },
  donorEmail: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  // This project uses a simulated/mock payment flow (no real payment
  // gateway wired in) so this feature can be demoed without requiring
  // business KYC verification. Designed to be swapped for a real gateway
  // (Razorpay/Stripe) later - status and paymentRef reflect that intent.
  status: {
    type: String,
    enum: ['completed'],
    default: 'completed',
  },
  paymentRef: {
    type: String, // mock reference id, e.g. "MOCK-<timestamp>-<random>"
  },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);