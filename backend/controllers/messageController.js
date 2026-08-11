const Message = require('../models/Message');
const Request = require('../models/Request');

// Get all messages for a request, oldest first
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ requestId: req.params.requestId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send a message on a request's chat thread
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const request = await Request.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const message = await Message.create({
      requestId: req.params.requestId,
      senderId: req.user.id,
      text,
    });

    const populated = await message.populate('senderId', 'name role');

    const io = req.app.get('io');
    io.to(`request_${req.params.requestId}`).emit('new_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMessages, sendMessage };