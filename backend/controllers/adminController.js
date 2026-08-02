const Request = require('../models/Request');
const User = require('../models/User');

// Dashboard summary stats
const getDashboardStats = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const pending = await Request.countDocuments({ status: 'pending' });
    const claimed = await Request.countDocuments({ status: 'claimed' });
    const resolved = await Request.countDocuments({ status: 'resolved' });

    const byCategory = await Request.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const totalUsers = await User.countDocuments();
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });

    res.status(200).json({
      totalRequests,
      pending,
      claimed,
      resolved,
      byCategory,
      totalUsers,
      pendingVerifications,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Pending requests sorted by urgency (highest first)
const getPriorityQueue = async (req, res) => {
  try {
    const requests = await Request.find({ status: 'pending' })
      .sort({ 'aiExtracted.urgencyScore': -1, createdAt: 1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List users, optionally filtered by role or verificationStatus
const getAllUsers = async (req, res) => {
  try {
    const { role, verificationStatus } = req.query;
    let query = {};
    if (role) query.role = role;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const users = await User.find(query).select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Approve or reject a user's verification
const updateVerificationStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected', 'pending', 'unverified'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verificationStatus = status;
    await user.save();

    res.status(200).json({ id: user._id, verificationStatus: user.verificationStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getPriorityQueue,
  getAllUsers,
  updateVerificationStatus,
};