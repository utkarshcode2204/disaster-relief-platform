const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  category: {
    type: String,
    enum: ['medical', 'food', 'shelter', 'rescue'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  aiExtracted: {
    urgencyScore: { type: Number, default: 0 },
    peopleAffected: { type: Number, default: null },
    tags: [String],
  },
  status: {
    type: String,
    enum: ['pending', 'claimed', 'resolved'],
    default: 'pending',
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Escalation to government authorities - only settable by the claiming
  // volunteer, and only meaningful for disaster-level requests (gated on
  // aiExtracted.urgencyScore on the frontend/backend).
  escalated: {
    type: Boolean,
    default: false,
  },
  escalatedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

requestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', requestSchema);