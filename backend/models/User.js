const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['requester', 'volunteer', 'ngo', 'admin'],
    default: 'volunteer',
  },
  phone: {
    type: String,
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  emergencyContacts: [
    {
      name: String,
      phone: String,
      relation: String,
    },
  ],
resources: [
    {
      type: {
        type: String,
        enum: ['boat', 'vehicle', 'medical_kit', 'food_supplies', 'shelter_space', 'other'],
      },
      quantity: {
        type: Number,
        default: 1,
      },
      notes: String,
    },
  ],
idVerification: {
    idType: {
      type: String,
      enum: ['aadhaar', 'passport', 'driving_license', 'voter_id', 'other'],
    },
    idNumber: String,
    submittedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);