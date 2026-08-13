const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Request = require('../models/Request');
const Incident = require('../models/Incident');
const { assignToIncident } = require('../utils/incidentClustering');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const makeRequest = async (overrides = {}) => {
  return Request.create({
    category: 'medical',
    description: 'Test request',
    location: { type: 'Point', coordinates: [77.4126, 23.2599] },
    aiExtracted: { urgencyScore: 3, peopleAffected: 2, tags: [] },
    ...overrides,
  });
};

describe('Incident clustering', () => {
  it('creates a new incident for the first request in an area', async () => {
    const req = await makeRequest();
    const incident = await assignToIncident(req);

    expect(incident).toBeDefined();
    expect(incident.category).toBe('medical');
    expect(incident.requestIds.length).toBe(1);
    expect(incident.maxUrgencyScore).toBe(3);
  });

  it('merges a nearby request of the same category into the existing incident', async () => {
    const req1 = await makeRequest();
    const incident1 = await assignToIncident(req1);

    const req2 = await makeRequest({
      aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] },
    });
    const incident2 = await assignToIncident(req2);

    expect(incident2._id.toString()).toBe(incident1._id.toString());
    expect(incident2.requestIds.length).toBe(2);
  });

  it('updates maxUrgencyScore to the highest value among merged requests', async () => {
    const req1 = await makeRequest({ aiExtracted: { urgencyScore: 2, peopleAffected: 1, tags: [] } });
    await assignToIncident(req1);

    const req2 = await makeRequest({ aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] } });
    const incident = await assignToIncident(req2);

    expect(incident.maxUrgencyScore).toBe(5);
  });

  it('sums peopleAffected across merged requests', async () => {
    const req1 = await makeRequest({ aiExtracted: { urgencyScore: 3, peopleAffected: 2, tags: [] } });
    await assignToIncident(req1);

    const req2 = await makeRequest({ aiExtracted: { urgencyScore: 3, peopleAffected: 3, tags: [] } });
    const incident = await assignToIncident(req2);

    expect(incident.totalPeopleAffected).toBe(5);
  });

  it('creates a separate incident for a different category at the same location', async () => {
    const req1 = await makeRequest({ category: 'medical' });
    const incident1 = await assignToIncident(req1);

    const req2 = await makeRequest({ category: 'rescue' });
    const incident2 = await assignToIncident(req2);

    expect(incident2._id.toString()).not.toBe(incident1._id.toString());
  });

  it('creates a separate incident for a request far away, even same category', async () => {
    const req1 = await makeRequest({ location: { type: 'Point', coordinates: [77.4126, 23.2599] } });
    const incident1 = await assignToIncident(req1);

    // ~200km away, well outside the 2km cluster radius
    const req2 = await makeRequest({ location: { type: 'Point', coordinates: [79.0, 23.2599] } });
    const incident2 = await assignToIncident(req2);

    expect(incident2._id.toString()).not.toBe(incident1._id.toString());
  });

  it('does not merge into a resolved incident', async () => {
    const req1 = await makeRequest();
    const incident1 = await assignToIncident(req1);
    incident1.status = 'resolved';
    await incident1.save();

    const req2 = await makeRequest();
    const incident2 = await assignToIncident(req2);

    expect(incident2._id.toString()).not.toBe(incident1._id.toString());
    expect(incident2.status).toBe('active');
  });
});