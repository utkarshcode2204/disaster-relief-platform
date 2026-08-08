const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['medical', 'food', 'shelter', 'rescue'],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - centroid of the cluster
      required: true,
    },
  },
requestIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
    },
  ],
  totalPeopleAffected: {
    type: Number,
    default: 0,
  },
  maxUrgencyScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },
}, { timestamps: true });

incidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', incidentSchema);