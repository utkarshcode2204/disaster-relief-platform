const request = require('supertest');
const express = require('express');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const authRoutes = require('../routes/authRoutes');
const requestRoutes = require('../routes/requestRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.set('io', { emit: () => {}, to: () => ({ emit: () => {} }) }); // mock socket.io

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const registerAndLogin = async (overrides = {}) => {
  const user = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'password123',
    role: 'volunteer',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, userId: res.body.user.id };
};

describe('Request routes', () => {
  describe('POST /api/requests', () => {
    it('creates a new request with valid data', async () => {
      const res = await request(app).post('/api/requests').send({
        description: 'Need medical help urgently, chest pain',
        longitude: 77.4126,
        latitude: 23.2599,
      });
      expect(res.status).toBe(201);
      expect(res.body.request).toBeDefined();
      expect(res.body.request.status).toBe('pending');
    }, 15000);

    it('rejects a request without a description', async () => {
      const res = await request(app).post('/api/requests').send({
        longitude: 77.4126,
        latitude: 23.2599,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/requests', () => {
    it('returns an empty array when no requests exist', async () => {
      const res = await request(app).get('/api/requests');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns created requests', async () => {
      await request(app).post('/api/requests').send({
        description: 'Flooding, need rescue boat',
        longitude: 77.41,
        latitude: 23.25,
      });
      const res = await request(app).get('/api/requests');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    }, 15000);

    it('filters requests by category', async () => {
      await request(app).post('/api/requests').send({
        description: 'Need food supplies for family',
        longitude: 77.41,
        latitude: 23.25,
      });
      const res = await request(app).get('/api/requests?category=food');
      expect(res.status).toBe(200);
    }, 15000);
  });

  describe('PATCH /api/requests/:id/claim', () => {
    it('requires authentication to claim a request', async () => {
      const createRes = await request(app).post('/api/requests').send({
        description: 'Need shelter urgently',
        longitude: 77.41,
        latitude: 23.25,
      });
      const requestId = createRes.body.request._id;

      const res = await request(app).patch(`/api/requests/${requestId}/claim`);
      expect(res.status).toBe(401);
    }, 15000);

    it('allows an authenticated user to claim a pending request', async () => {
      const { token } = await registerAndLogin();
      const createRes = await request(app).post('/api/requests').send({
        description: 'Trapped, need rescue',
        longitude: 77.41,
        latitude: 23.25,
      });
      const requestId = createRes.body.request._id;

      const res = await request(app)
        .patch(`/api/requests/${requestId}/claim`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('claimed');
    }, 15000);

    it('rejects claiming an already-claimed request', async () => {
      const { token } = await registerAndLogin();
      const createRes = await request(app).post('/api/requests').send({
        description: 'Need medical attention',
        longitude: 77.41,
        latitude: 23.25,
      });
      const requestId = createRes.body.request._id;

      await request(app)
        .patch(`/api/requests/${requestId}/claim`)
        .set('Authorization', `Bearer ${token}`);

      const secondAttempt = await request(app)
        .patch(`/api/requests/${requestId}/claim`)
        .set('Authorization', `Bearer ${token}`);
      expect(secondAttempt.status).toBe(400);
    }, 15000);
  });

  describe('PATCH /api/requests/:id/resolve', () => {
    it('allows resolving a claimed request', async () => {
      const { token } = await registerAndLogin();
      const createRes = await request(app).post('/api/requests').send({
        description: 'Need help with evacuation',
        longitude: 77.41,
        latitude: 23.25,
      });
      const requestId = createRes.body.request._id;

      await request(app)
        .patch(`/api/requests/${requestId}/claim`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .patch(`/api/requests/${requestId}/resolve`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
    }, 15000);
  });
});