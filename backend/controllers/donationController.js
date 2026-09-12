const Donation = require('../models/Donation');

// Create a new (simulated) donation - public, no login required
const createDonation = async (req, res) => {
  try {
    const { amount, donorName, donorEmail, message } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid donation amount is required' });
    }

    const paymentRef = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const donation = await Donation.create({
      amount: parsedAmount,
      donorName: donorName?.trim() || 'Anonymous',
      donorEmail: donorEmail?.trim(),
      message: message?.trim(),
      status: 'completed',
      paymentRef,
    });

    const io = req.app.get('io');
    io.emit('new_donation', donation);

    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get fund summary - total raised + donor count - public
const getDonationSummary = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRaised: { $sum: '$amount' },
          donorCount: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { totalRaised: 0, donorCount: 0 };
    res.status(200).json({
      totalRaised: summary.totalRaised,
      donorCount: summary.donorCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get recent donations (for a "recent donors" list) - public
const getRecentDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('amount donorName message createdAt');

    res.status(200).json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createDonation, getDonationSummary, getRecentDonations };