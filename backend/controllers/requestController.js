const Request = require('../models/Request');
const classifyRequest = require('../utils/aiClassifier');
const { assignToIncident, notifyMatchingVolunteers } = require('../utils/incidentClustering');
// Create a new help request
const createRequest = async (req, res) => {
  try {
    const { name, phone, description, longitude, latitude } = req.body;

    const aiResult = await classifyRequest(description);

    const request = await Request.create({
      requesterId: req.user ? req.user.id : null,
      name,
      phone,
      category: aiResult.category,
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      aiExtracted: {
        urgencyScore: aiResult.urgencyScore,
        peopleAffected: aiResult.peopleAffected,
        tags: aiResult.tags,
      },
    });
const incident = await assignToIncident(request);

    const io = req.app.get('io');
    io.emit('new_request', request);
    io.emit('incident_updated', incident);
    await notifyMatchingVolunteers(io, incident);
    res.status(201).json({ request, incident });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all requests, with optional geo/category/urgency filters
const getRequests = async (req, res) => {
  try {
    const { lng, lat, radius, category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (lng && lat && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000, // radius in km -> meters
        },
      };
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a single request by ID
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Claim a request
const claimRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already claimed or resolved' });
    }

    request.status = 'claimed';
    request.claimedBy = req.user.id;
    await request.save();

    const io = req.app.get('io');
    io.emit('request_updated', request);

    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Resolve a request
const resolveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'resolved';
    await request.save();

    const io = req.app.get('io');
    io.emit('request_updated', request);

    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createRequest, getRequests, getRequestById, claimRequest, resolveRequest };