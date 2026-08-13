const request = require('supertest');
const express = require('express');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const Request = require('../models/Request');
const { assignToIncident } = require('../utils/incidentClustering');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const registerAdmin = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });
  return res.body.token;
};

const registerVolunteer = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Volunteer',
    email: 'vol@example.com',
    password: 'password123',
    role: 'volunteer',
  });
  return res.body.token;
};

describe('Admin routes', () => {
  describe('Role-based access control', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin users with 403', async () => {
      const token = await registerVolunteer();
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('allows admin users with 200', async () => {
      const token = await registerAdmin();
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('returns correct counts', async () => {
      const token = await registerAdmin();
      await Request.create({
        category: 'medical',
        description: 'Test',
        status: 'pending',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 3, peopleAffected: 1, tags: [] },
      });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.totalRequests).toBe(1);
      expect(res.body.pending).toBe(1);
      expect(res.body.totalUsers).toBe(1);
    });
  });

  describe('GET /api/admin/priority-queue', () => {
    it('returns pending requests sorted by urgency descending', async () => {
      const token = await registerAdmin();
      await Request.create({
        category: 'medical',
        description: 'Low urgency',
        status: 'pending',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 2, peopleAffected: 1, tags: [] },
      });
      await Request.create({
        category: 'rescue',
        description: 'High urgency',
        status: 'pending',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] },
      });

      const res = await request(app)
        .get('/api/admin/priority-queue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body[0].aiExtracted.urgencyScore).toBe(5);
      expect(res.body[1].aiExtracted.urgencyScore).toBe(2);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns users without password field', async () => {
      const token = await registerAdmin();
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body[0].password).toBeUndefined();
    });
  });

  describe('PATCH /api/admin/users/:id/verification', () => {
    it('updates a user verification status', async () => {
      const adminToken = await registerAdmin();
      const volRes = await request(app).post('/api/auth/register').send({
        name: 'Volunteer',
        email: 'vol2@example.com',
        password: 'password123',
        role: 'volunteer',
      });
      const volunteerId = volRes.body.user.id;

      const res = await request(app)
        .patch(`/api/admin/users/${volunteerId}/verification`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'verified' });

      expect(res.status).toBe(200);
      expect(res.body.verificationStatus).toBe('verified');
    });

    it('rejects an invalid status value', async () => {
      const adminToken = await registerAdmin();
      const volRes = await request(app).post('/api/auth/register').send({
        name: 'Volunteer',
        email: 'vol3@example.com',
        password: 'password123',
        role: 'volunteer',
      });
      const volunteerId = volRes.body.user.id;

      const res = await request(app)
        .patch(`/api/admin/users/${volunteerId}/verification`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'not_a_real_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/incidents', () => {
    it('returns active incidents sorted by severity', async () => {
      const token = await registerAdmin();

      const req1 = await Request.create({
        category: 'medical',
        description: 'Test 1',
        location: { type: 'Point', coordinates: [77.41, 23.25] },
        aiExtracted: { urgencyScore: 2, peopleAffected: 1, tags: [] },
      });
      await assignToIncident(req1);

      const req2 = await Request.create({
        category: 'rescue',
        description: 'Test 2',
        location: { type: 'Point', coordinates: [79.0, 23.25] },
        aiExtracted: { urgencyScore: 5, peopleAffected: 1, tags: [] },
      });
      await assignToIncident(req2);

      const res = await request(app)
        .get('/api/admin/incidents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].maxUrgencyScore).toBe(5);
    });
  });
});