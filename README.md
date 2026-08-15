# 🚨 Disaster Relief Coordination Platform

A full-stack, real-time platform that lets people report emergencies during disasters, uses AI to triage requests automatically, and coordinates volunteers and NGOs to respond — with live chat, live location tracking, and offline-capable submission.

**🔗 Live App:** [disaster-relief-platform-red.vercel.app](https://disaster-relief-platform-red.vercel.app)
**🔗 API:** [disaster-relief-backend-oale.onrender.com](https://disaster-relief-backend-oale.onrender.com)

![Backend Tests](https://github.com/utkarshcode2204/disaster-relief-platform/actions/workflows/backend-tests.yml/badge.svg)

> **Note on live demo speed:** the backend runs on Render's free tier, which spins down after 15 minutes of inactivity. The first request after a period of idleness can take 30-50 seconds to wake up — this is a hosting-tier limitation, not an application issue.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Engineering Notes](#engineering-notes)
- [Roadmap](#roadmap)

---

## Overview

In a disaster, two things are usually broken at once: **information** (who needs help, and how urgently) and **coordination** (who can respond, and with what). This platform addresses both:

- Anyone can submit a help request in seconds — no login required — with their location and a free-text description of the emergency.
- An LLM automatically classifies each request (category, urgency, people affected) so responders don't have to triage manually.
- Nearby requests of the same type automatically cluster into a single "incident," so 15 flood reports on the same street become 1 incident an NGO can act on, not 15 separate tickets.
- Volunteers list what resources they have (boat, medical kit, vehicle...) and get matched — and notified — when a high-urgency incident nearby needs exactly that.
- Once a volunteer claims a request, they get a live chat thread and can broadcast their live GPS position to the requester, so help is trackable in real time.
- The app works as an installable PWA and queues submissions locally if the network drops, syncing automatically once connectivity returns — a deliberate design choice given how unreliable connectivity often is during disasters.

## Key Features

### Core Request Flow
- Public request submission with browser geolocation (no login required)
- AI-powered classification (category, urgency score, people affected, tags) via LLM
- Live map (Leaflet) with category-coded markers, updated in real time via WebSockets
- Full lifecycle — submit → claim → resolve — usable entirely through the UI

### Admin Dashboard
- Role-based access control (requester / volunteer / ngo / admin)
- Live stats, priority queue sorted by AI urgency score
- User management with identity verification approve/reject workflow

### Coordination Intelligence
- Automatic geo-based incident clustering (MongoDB `$near` + 2dsphere indexes) — merges nearby same-category requests into a single incident
- Resource-to-incident matching: finds volunteers whose declared resources match an incident's needs

### Real-Time Operations
- Live chat scoped per-request via Socket.io rooms
- Live GPS tracking of responders while en route (`watchPosition`), visible to the requester in real time
- In-app push-style notifications: volunteers get notified instantly when a high-urgency incident matching their resources appears nearby

### Trust & Safety
- Identity verification submission and admin review workflow
- Emergency contact management

### Offline Resilience
- Installable Progressive Web App (manifest + service worker via `vite-plugin-pwa`)
- Offline request queuing with automatic background sync once connectivity returns

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS v4, React Router, React-Leaflet, Socket.io-client, vite-plugin-pwa
**Backend:** Node.js, Express, MongoDB Atlas (Mongoose), Socket.io, JWT + bcrypt
**AI:** Groq (Llama 3.3 70B) for request classification
**Testing:** Jest, Supertest, mongodb-memory-server
**CI/CD:** GitHub Actions
**Security:** Helmet, express-rate-limit, express-validator, custom NoSQL-injection sanitization
**Deployment:** Render (backend), Vercel (frontend)

## Architecture

```
┌─────────────┐         HTTPS/REST          ┌──────────────┐
│   React     │ ───────────────────────────▶│   Express    │
│  (Vercel)   │◀─────────────────────────── │  (Render)    │
└──────┬──────┘                              └──────┬───────┘
       │            WebSocket (Socket.io)            │
       └────────────────────────────────────────────▶│
                                                       │
                                              ┌────────┴────────┐
                                              │  MongoDB Atlas  │
                                              └─────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │   Groq LLM API  │
                                              └─────────────────┘
```

**Real-time design:** Socket.io rooms are used for three distinct purposes so traffic stays scoped instead of broadcasting everything to everyone:
- `request_<id>` rooms — per-request chat and live location updates
- `user_<id>` rooms — personal notification delivery
- Global emits — map-wide events like new/updated requests

**Geo-clustering:** new requests are matched against existing "active" incidents of the same category within a 2km radius using MongoDB's `$near` operator against a 2dsphere index, rather than a naive distance-loop — this keeps clustering performant as request volume grows.

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string
- A Groq API key ([console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

```bash
npm run dev      # starts with nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default the frontend points at the deployed production API. To point it at your local backend instead, update `baseURL` in `frontend/src/services/api.js` and the URL in `frontend/src/services/socket.js` to `http://localhost:5000`.

## Testing

The backend has 40 automated tests (Jest + Supertest) covering auth, request lifecycle, incident clustering, resource matching, and admin access control, run against an isolated in-memory MongoDB instance so tests never touch production data.

```bash
cd backend
npm test
```

Tests run automatically on every push via GitHub Actions ([workflow](.github/workflows/backend-tests.yml)).

| Suite | Coverage |
|---|---|
| `auth.test.js` | Registration, login, validation, duplicate handling |
| `requests.test.js` | Creation, retrieval, claim/resolve lifecycle |
| `clustering.test.js` | Incident merging by distance/category, severity aggregation |
| `resources.test.js` | Volunteer resource management, incident matching, role checks |
| `admin.test.js` | RBAC (401/403/200), stats, priority queue, verification |

## API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | — |
| POST | `/api/auth/login` | Log in | — |
| POST | `/api/requests` | Submit a help request (AI-classified) | — |
| GET | `/api/requests` | List/filter requests | — |
| PATCH | `/api/requests/:id/claim` | Claim a pending request | ✅ |
| PATCH | `/api/requests/:id/resolve` | Mark a request resolved | ✅ |
| GET | `/api/admin/stats` | Dashboard summary stats | Admin |
| GET | `/api/admin/incidents` | Clustered incidents, sorted by severity | Admin |
| PUT | `/api/resources/mine` | Update own volunteer resources | ✅ |
| GET | `/api/resources/match/:incidentId` | Find volunteers matching an incident | Admin |
| GET/POST | `/api/messages/:requestId` | Per-request chat thread | ✅ |

Full route definitions are in [`backend/routes`](backend/routes).

## Project Structure

```
disaster-relief-platform/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── middleware/      # Auth, role-based access
│   ├── utils/           # AI classifier, incident clustering
│   └── tests/           # Jest + Supertest test suites
├── frontend/
│   ├── src/
│   │   ├── components/  # Map, Chat, forms, notifications
│   │   ├── pages/       # Dashboard, Admin, Login, etc.
│   │   ├── context/     # Auth context
│   │   └── services/    # API client, Socket.io client, offline queue
│   └── public/          # PWA manifest, icons
└── .github/workflows/   # CI pipeline
```

## Engineering Notes

A few decisions worth calling out, since they came from real trade-offs rather than defaults:

- **AI provider:** initially attempted Anthropic and Gemini, both of which required billing setup that added friction for a student project; switched to Groq, which offered a free, fast Llama 3.3 endpoint with no billing barrier.
- **SMS notifications were deliberately skipped** in favor of in-app, Socket.io-based notifications — Twilio requires a paid account and phone number, which wasn't justified for the actual problem (alerting already-logged-in volunteers).
- **NoSQL sanitization is hand-rolled**, not from `express-mongo-sanitize`, because that package mutates `req.query`, which is read-only in current Express versions — a real compatibility issue surfaced during hardening, fixed with a small custom middleware instead.
- **CI installs with `npm install`, not `npm ci`**, after `npm ci`'s strict lockfile matching broke on platform-specific optional dependencies between the Windows dev machine and Linux CI runners.

## Roadmap

- [x] Core request lifecycle with AI classification
- [x] Admin dashboard & role-based access
- [x] Automatic incident clustering & resource matching
- [x] Live chat, live location tracking, in-app notifications
- [x] Identity verification & emergency contacts
- [x] Installable PWA with offline request queuing
- [x] Automated testing (40 tests) & CI pipeline
- [x] Security hardening
- [ ] Rating/reputation system
- [ ] Multi-language support

---

Built by [Utkarsh Sharma](https://github.com/utkarshcode2204)
