const Incident = require('../models/Incident');
const User = require('../models/User');

const CATEGORY_TO_RESOURCE = {
  rescue: ['boat', 'vehicle'],
  medical: ['medical_kit', 'vehicle'],
  food: ['food_supplies', 'vehicle'],
  shelter: ['shelter_space', 'vehicle'],
};

const notifyMatchingVolunteers = async (io, incident) => {
  if (incident.maxUrgencyScore < 4) return; // only notify for high-urgency incidents

  const relevantTypes = CATEGORY_TO_RESOURCE[incident.category] || [];
  const volunteers = await User.find({
    role: 'volunteer',
    'resources.type': { $in: relevantTypes },
  }).select('_id');

  volunteers.forEach((v) => {
    io.to(`user_${v._id}`).emit('notification', {
      type: 'high_urgency_incident',
      incidentId: incident._id,
      category: incident.category,
      urgencyScore: incident.maxUrgencyScore,
      message: `High-urgency ${incident.category} incident nearby needs your help`,
      createdAt: new Date(),
    });
  });
};

const CLUSTER_RADIUS_METERS = 2000; // 2km

// Finds an active nearby incident of the same category, or creates a new one.
// Then adds the request to it and updates the incident's stats.
const assignToIncident = async (request) => {
  const [lng, lat] = request.location.coordinates;

  let incident = await Incident.findOne({
    category: request.category,
    status: 'active',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: CLUSTER_RADIUS_METERS,
      },
    },
  });

  if (!incident) {
    incident = await Incident.create({
      category: request.category,
      location: { type: 'Point', coordinates: [lng, lat] },
      requestIds: [request._id],
      totalPeopleAffected: request.aiExtracted?.peopleAffected || 0,
      maxUrgencyScore: request.aiExtracted?.urgencyScore || 0,
    });
  } else {
    incident.requestIds.push(request._id);
    incident.totalPeopleAffected += request.aiExtracted?.peopleAffected || 0;
    incident.maxUrgencyScore = Math.max(
      incident.maxUrgencyScore,
      request.aiExtracted?.urgencyScore || 0
    );
    await incident.save();
  }

return incident;
};

module.exports = { assignToIncident, notifyMatchingVolunteers };