const request = require('supertest');
const express = require('express');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const authRoutes = require('../routes/authRoutes');
const resourceRoutes = require('../routes/resourceRoutes');
const Request = require('../models/Request');
const { assignToIncident } = require('../utils/incidentClustering');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const registerVolunteer = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Volunteer',
    email: 'vol@example.com',
    password: 'password123',
    role: 'volunteer',
  });
  return res.body.token;
};

const registerAdmin = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });
  return res.body.token;
};

describe('Resource routes', () => {
  describe('PUT /api/resources/mine', () => {
    it('requires authentication', async () => {
      const res = await request(app).put('/api/resources/mine').send({ resources: [] });
      expect(res.status).toBe(401);
    });

    it('saves resources for the logged-in volunteer', async () => {
      const token = await registerVolunteer();
      const res = await request(app)
        .put('/api/resources/mine')
        .set('Authorization', `Bearer ${token}`)
        .send({ resources: [{ type: 'boat', quantity: 1, notes: 'test' }] });

      expect(res.status).toBe(200);
      expect(res.body.resources.length).toBe(1);
      expect(res.body.resources[0].type).toBe('boat');
    });
  });

  describe('GET /api/resources/mine', () => {
    it('returns the saved resources', async () => {
      const token = await registerVolunteer();
      await request(app)
        .put('/api/resources/mine')
        .set('Authorization', `Bearer ${token}`)
        .send({ resources: [{ type: 'medical_kit', quantity: 2 }] });

      const res = await request(app)
        .get('/api/resources/mine')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.resources.length).toBe(1);
    });
  });

  describe('GET /api/resources/match/:incidentId', () => {
    it('requires admin role', async () => {
      const volToken = await registerVolunteer();
      const req = await Request.create({
        category: 'rescue',
        description: 'Test',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] },
      });
      const incident = await assignToIncident(req);

      const res = await request(app)
        .get(`/api/resources/match/${incident._id}`)
        .set('Authorization', `Bearer ${volToken}`);
      expect(res.status).toBe(403);
    });

    it('returns volunteers with matching resources for the incident category', async () => {
      const volToken = await registerVolunteer();
      await request(app)
        .put('/api/resources/mine')
        .set('Authorization', `Bearer ${volToken}`)
        .send({ resources: [{ type: 'boat', quantity: 1 }] });

      const adminToken = await registerAdmin();

      const req = await Request.create({
        category: 'rescue',
        description: 'Test',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] },
      });
      const incident = await assignToIncident(req);

      const res = await request(app)
        .get(`/api/resources/match/${incident._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].resources[0].type).toBe('boat');
    });
  });

  describe('PUT /api/resources/id-verification', () => {
    it('submits ID verification and sets status to pending', async () => {
      const token = await registerVolunteer();
      const res = await request(app)
        .put('/api/resources/id-verification')
        .set('Authorization', `Bearer ${token}`)
        .send({ idType: 'aadhaar', idNumber: '1234-5678-9012' });

      expect(res.status).toBe(200);
      expect(res.body.verificationStatus).toBe('pending');
    });

    it('rejects submission without idType or idNumber', async () => {
      const token = await registerVolunteer();
      const res = await request(app)
        .put('/api/resources/id-verification')
        .set('Authorization', `Bearer ${token}`)
        .send({ idType: 'aadhaar' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/resources/emergency-contacts', () => {
    it('saves emergency contacts', async () => {
      const token = await registerVolunteer();
      const res = await request(app)
        .put('/api/resources/emergency-contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ emergencyContacts: [{ name: 'Parent', phone: '9999999999', relation: 'Father' }] });

      expect(res.status).toBe(200);
      expect(res.body.emergencyContacts.length).toBe(1);
    });
  });
});