# 🆘 Disaster Relief Platform

**A real-time, crowd-sourced disaster relief coordination platform** that connects people in need with nearby volunteers, NGOs, and — when a disaster is too big to handle — government authorities. Built solo, end-to-end, as a full-stack MERN project.

[![Live Frontend](https://img.shields.io/badge/Live%20Demo-Frontend-blue?style=for-the-badge)](https://disaster-relief-platform-red.vercel.app)
[![Live Backend](https://img.shields.io/badge/API-Backend-green?style=for-the-badge)](https://disaster-relief-backend-oale.onrender.com)
[![CI](https://img.shields.io/github/actions/workflow/status/utkarshcode2204/disaster-relief-platform/backend-tests.yml?branch=main&style=for-the-badge&label=Tests)](https://github.com/utkarshcode2204/disaster-relief-platform/actions)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)](#license)

> ⚠️ The backend runs on Render's free tier, which spins down after 15 minutes of inactivity. The **first** request after idle time can take 30–50 seconds to wake it up — this is a hosting limitation, not a bug.

---

## 🔗 Quick Links

| | |
|---|---|
| 🌐 **Live App** | https://disaster-relief-platform-red.vercel.app |
| ⚙️ **Live API** | https://disaster-relief-backend-oale.onrender.com |
| 💰 **Donate Page** | https://disaster-relief-platform-red.vercel.app/donate |
| 📦 **Repository** | https://github.com/utkarshcode2204/disaster-relief-platform |
| ✅ **CI Pipeline** | [GitHub Actions](https://github.com/utkarshcode2204/disaster-relief-platform/actions) |

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Engineering Decisions & Trade-offs](#-engineering-decisions--trade-offs)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚨 The Problem

During disasters — floods, earthquakes, fires — the hardest part often isn't a lack of willing help, it's **coordination**: victims don't know who's nearby and available, volunteers don't know where help is needed most, and NGOs/authorities have no real-time visibility into which incidents are escalating out of control.

**Disaster Relief Platform** solves this by giving everyone a shared, real-time view of active requests, automatically clustering related reports into incidents, matching volunteers by the resources they actually have, and providing a direct line to escalate large-scale disasters to government authorities — all live, on a map, with no manual coordination overhead.

---

## ✨ Features

### Core request lifecycle
- 📍 Submit a help request with one-tap geolocation
- 🤖 **AI-powered triage** — every request is automatically classified by category, urgency (1–5), and estimated people affected using an LLM (Groq)
- 🗺️ Live map (Leaflet) showing all requests, updating in real time via Socket.io — no refresh needed
- ✅ Claim → Chat → Resolve lifecycle, fully usable from the map UI

### Coordination intelligence
- 🧩 **Automatic incident clustering** — nearby requests of the same category auto-merge into a single tracked incident
- 🎯 **Resource matching** — volunteers list what they have (boat, medical kit, vehicle, etc.); the system matches them to incidents that need exactly that
- 🔔 In-app real-time notifications to volunteers when a high-urgency incident matching their resources appears

### Real-time operations
- 💬 Live chat between requester and responder, scoped per-request via Socket.io rooms
- 📞 **In-app voice calling** — peer-to-peer WebRTC audio, signaled over the existing Socket.io connection (no third-party calling service, no per-minute cost)
- 📡 Live responder location tracking (continuous GPS, not a manual refresh)
- 🚨 **Escalate to Authorities** — for disaster-level requests (urgency 5/5), the claiming volunteer can escalate directly to a government contact, which automatically sends a formatted email alert with the location, description, and severity

### Trust & resilience
- 🪪 ID verification submission + emergency contacts
- 📶 **Full PWA support** — installable as a standalone app, and requests submitted while offline are queued locally and auto-synced the moment connectivity returns
- 🛡️ Admin dashboard with priority queue (sorted by AI urgency), incident overview, and user verification controls

### Community support
- 💰 **Donation page** — a public fundraising flow (no login required) supporting the platform's relief fund, with a live running total and recent-donor feed
  - *Currently runs on a simulated/mock payment flow (no real gateway wired in yet) — see [Engineering Decisions](#-engineering-decisions--trade-offs) for why, and it's built to drop in a real gateway later.*

---

## 🛠️ Tech Stack

**Frontend:** React (Vite) · Tailwind CSS v4 · React Router · React-Leaflet · Socket.io-client
**Backend:** Node.js · Express · MongoDB Atlas (Mongoose, 2dsphere geo-indexing) · Socket.io · JWT Auth
**AI:** Groq API (`openai/gpt-oss-120b`) for request classification
**Real-time:** Socket.io (chat, live location, notifications, WebRTC signaling)
**Voice:** WebRTC (peer-to-peer audio, STUN-only)
**Email:** Nodemailer + Brevo SMTP (escalation alerts)
**Testing:** Jest · Supertest · mongodb-memory-server (40 tests, 100% passing)
**CI/CD:** GitHub Actions
**Deployment:** Vercel (frontend) · Render (backend)
**PWA:** vite-plugin-pwa

---

## 🏗️ Architecture

### Real-time layer (Socket.io rooms)
Every claimed request gets its own room (`request_<id>`) that both parties join. This single room pattern powers **four** independent real-time features without extra infrastructure:
- Live chat messages
- Live responder GPS updates
- WebRTC call signaling (offer/answer/ICE candidates — audio itself is peer-to-peer, never touches the server)
- Escalation status updates

Each user also joins a personal room (`user_<id>`) used for targeted in-app notifications (e.g. "a high-urgency incident near you needs your resource type").

### Geo-clustering
When a new request comes in, `assignToIncident()` runs a `$near` geo-query (2km radius) filtered by category + active status. A match merges the request into the existing incident (updating its urgency/people-affected totals); no match creates a new incident. This turns dozens of individual reports into a handful of trackable, prioritized incidents automatically.

### AI classification pipeline
Every request description is sent to Groq's LLM with a structured prompt, returning `{ category, urgencyScore, peopleAffected, tags }` as strict JSON. This score drives clustering priority, notification thresholds, and the escalation gate (only urgency-5 requests can be escalated).

---

## 📸 Screenshots

> _Add screenshots or a short demo GIF here — a live map with active markers, the chat/call popup, and the admin dashboard priority queue make for a strong visual._

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A MongoDB Atlas cluster (free tier is fine)
- A free [Groq API key](https://console.groq.com)
- A free [Brevo](https://www.brevo.com) account (for escalation emails) — optional

### 1. Clone the repo
```bash
git clone https://github.com/utkarshcode2204/disaster-relief-platform.git
cd disaster-relief-platform
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create `backend/.env` (see [Environment Variables](#-environment-variables) below), then:
```bash
node server.js
```
Backend runs on `http://localhost:5000`.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`. Update `frontend/src/services/api.js` and `socket.js` to point at `http://localhost:5000` for local development.

### 4. Run tests
```bash
cd backend
npm test
```

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/` with:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key

# Escalation emails (optional - only needed for the escalate-to-authorities feature)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your_brevo_smtp_login
BREVO_SMTP_KEY=your_brevo_smtp_key
GOV_CONTACT_EMAIL=where_escalation_alerts_should_go
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Register a new user |
| POST | `/api/auth/login` | – | Log in, receive JWT |
| POST | `/api/requests` | – | Submit a help request (AI-classified automatically) |
| GET | `/api/requests` | – | List requests (supports geo/category filters) |
| PATCH | `/api/requests/:id/claim` | ✅ | Claim a pending request |
| PATCH | `/api/requests/:id/resolve` | ✅ | Mark a request resolved |
| PATCH | `/api/requests/:id/escalate` | ✅ | Escalate a disaster-level request to authorities (claiming volunteer only) |
| GET | `/api/admin/stats` | ✅ (admin) | Dashboard stats |
| GET | `/api/admin/incidents` | ✅ (admin) | Clustered active incidents |
| GET/PUT | `/api/resources/mine` | ✅ (volunteer) | Manage your listed resources |
| GET | `/api/resources/match/:incidentId` | ✅ (admin) | Find volunteers matching an incident's needs |
| GET/POST | `/api/messages/:requestId` | ✅ | Per-request chat |
| POST | `/api/donations` | – | Submit a donation (public) |
| GET | `/api/donations/summary` | – | Total raised + donor count (public) |
| GET | `/api/donations/recent` | – | Recent donations feed (public) |

Full route definitions live in `backend/routes/`.

---

## 🧪 Testing

- **40 backend tests**, 100% passing — covering auth, request CRUD, geo-clustering, resource matching, and admin routes
- Runs against an in-memory MongoDB instance (`mongodb-memory-server`) — completely isolated, never touches production data
- **CI**: every push/PR to `main` automatically runs the full suite via GitHub Actions

```bash
cd backend
npm test
```

---

## 🤔 Engineering Decisions & Trade-offs

Being upfront about deliberate trade-offs made under real constraints:

- **Groq over OpenAI/Anthropic/Gemini** for AI classification — free tier with no billing setup required, and fast enough for real-time triage. (Also had to migrate models mid-project after Groq deprecated `llama-3.3-70b-versatile`.)
- **In-app notifications instead of Twilio/SMS** — avoids requiring a paid account for a demo project; same alerting value without a billing dependency.
- **WebRTC + existing Socket.io instead of a third-party calling API** — zero per-minute cost, reuses infrastructure already built for chat.
- **Brevo instead of Gmail SMTP** for escalation emails — Gmail requires 2-Step Verification + App Passwords, which added friction; Brevo's free tier (300 emails/day) was simpler to wire up cleanly.
- **Simulated donation flow instead of Stripe/Razorpay** — Stripe is invite-only in India, and Razorpay requires real KYC (PAN, bank details) just to obtain sandbox credentials. Rather than hand over real identity documents for a portfolio demo, the donation flow was built with a full UI, backend, and fund-tracking system designed to plug into a real gateway later — the integration point is intentionally isolated to one function.
- **Custom NoSQL-injection sanitizer** — `express-mongo-sanitize` proved incompatible with newer Express versions (read-only `req.query`); rebuilt the sanitization logic in-house rather than downgrading dependencies.

---

## 🗺️ Roadmap

- [ ] Rating/reputation system for volunteers
- [ ] Real payment gateway integration for donations (pending KYC completion)
- [ ] File/image-based ID verification
- [ ] Multi-language support for wider accessibility during disasters

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are welcome! This project started solo but is very open to collaborators.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add: your feature"`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure existing tests pass (`npm test` in `backend/`) before submitting, and add tests for new backend functionality where possible. For larger changes, opening an issue first to discuss the approach is appreciated.

Good first areas to contribute:
- UI/UX polish and accessibility improvements
- Additional test coverage (frontend currently has none)
- Real payment gateway integration
- Internationalization

---

## 📄 License

This project is licensed under the MIT License — free to use, modify, and distribute.

---

## 📬 Contact

**Utkarsh Sharma**

- ✉️ Email: [sharmautkarsh2204@gmail.com](mailto:sharmautkarsh2204@gmail.com)
- 💼 LinkedIn: [linkedin.com/in/utkarsh-sharma-79209b267](https://www.linkedin.com/in/utkarsh-sharma-79209b267)
- 💻 GitHub: [github.com/utkarshcode2204](https://github.com/utkarshcode2204)

If this project helped you or you'd like to collaborate, feel free to reach out or open an issue!

---

⭐ **If you find this project useful, consider giving it a star — it helps a lot!**
