const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
}, { timestamps: true });

messageSchema.index({ requestId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);