const User = require('../models/User');
const Incident = require('../models/Incident');

// Volunteer updates their own resource list
const updateMyResources = async (req, res) => {
  try {
    const { resources } = req.body; // array of { type, quantity, notes }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.resources = resources;
    await user.save();
    res.status(200).json({ resources: user.resources });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get the logged-in volunteer's current resources
const getMyResources = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('resources');
    res.status(200).json({ resources: user?.resources || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Find volunteers with resources relevant to a given incident's category,
// sorted by distance to the incident
const CATEGORY_TO_RESOURCE = {
  rescue: ['boat', 'vehicle'],
  medical: ['medical_kit', 'vehicle'],
  food: ['food_supplies', 'vehicle'],
  shelter: ['shelter_space', 'vehicle'],
};

const findMatchingVolunteers = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.incidentId);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const relevantTypes = CATEGORY_TO_RESOURCE[incident.category] || [];

    const volunteers = await User.find({
      role: 'volunteer',
      'resources.type': { $in: relevantTypes },
    }).select('name phone resources verificationStatus');

    res.status(200).json(volunteers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Submit ID verification details (text-based, no file upload)
const submitIdVerification = async (req, res) => {
  try {
    const { idType, idNumber } = req.body;
    if (!idType || !idNumber) {
      return res.status(400).json({ message: 'idType and idNumber are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.idVerification = { idType, idNumber, submittedAt: new Date() };
    user.verificationStatus = 'pending';
    await user.save();

    res.status(200).json({ idVerification: user.idVerification, verificationStatus: user.verificationStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update emergency contacts
const updateEmergencyContacts = async (req, res) => {
  try {
    const { emergencyContacts } = req.body; // array of { name, phone, relation }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.emergencyContacts = emergencyContacts;
    await user.save();
    res.status(200).json({ emergencyContacts: user.emergencyContacts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get logged-in user's own profile (resources, verification, emergency contacts)
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  updateMyResources,
  getMyResources,
  findMatchingVolunteers,
  submitIdVerification,
  updateEmergencyContacts,
  getMyProfile,
};