const Incident = require('../models/Incident');

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

module.exports = { assignToIncident };