# Papyrus Sync Service — Experimental Cloud Sync Gateway

Node.js + Express microservice for the Papyrus offline-first sync architecture. This service is currently in an **experimental/early development stage**. It is functional in local development environments, but is not yet production-hardened.

## Features

- **`POST /sync`** — accepts offline delta payloads from any client, applies Last-Write-Wins conflict resolution, and persists to PostgreSQL via Prisma
- **`GET/POST/PATCH/DELETE /patients`** — full CRUD with Firebase Auth ownership enforcement and audit logging
- **`GET /sync/events`** — audit trail of all sync events
- **Firebase Admin SDK** middleware — verifies Firebase ID tokens (with dev-bypass mode when no credentials are configured)
- **Railway.app** ready — `railway.toml` runs `prisma migrate deploy` automatically on each deploy

---

## Quick Start (Local)

### Prerequisites
- Node.js ≥ 20
- PostgreSQL running locally (or use the Docker Compose setup)
- Firebase project (or use dev-bypass mode — no config needed locally)

### 1. Install dependencies
```bash
cd sync-service
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in DATABASE_URL and Firebase credentials
```

### 3. Run database migrations
```bash
npm run prisma:migrate
```

### 4. Start the server
```bash
npm run dev
```

### 5. Test the health endpoint
```bash
curl http://localhost:3001/health
```

---

## Docker Compose (Full Stack)

From the repo root, spin up the entire stack (web app + sync-service + postgres + prometheus + grafana):

```bash
docker-compose up -d
```

Services:
| Service | URL |
|---|---|
| Web App | http://localhost:80 |
| Sync API | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

---

## Railway.app Deployment

1. Create a new Railway project
2. Add a **PostgreSQL** plugin (Railway provides the `DATABASE_URL` automatically)
3. Link this repository and set the **root directory** to `sync-service/`
4. Add environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `ALLOWED_ORIGINS` (your deployed web app URL)
5. Railway will run `prisma migrate deploy && node src/index.js` on every deploy

---

## API Reference

### `GET /health`
```json
{ "status": "ok", "service": "papyrus-sync-service", "version": "1.0.0" }
```

### `POST /sync`
**Headers:** `Authorization: Bearer <firebase-id-token>`

**Body:**
```json
{
  "sync_timestamp": 1794567210,
  "client_device": "Web_Chrome",
  "deltas": {
    "patients": [{ "id": 1, "name": "...", "last_modified": 1794567205 }],
    "mood_logs": [{ "id": 89, "patientId": 1, "moodScore": 8, "last_modified": 1794567200 }]
  }
}
```

**Response:**
```json
{
  "accepted": { "patients": [1], "mood_logs": [89] },
  "created": {},
  "conflicts": {},
  "server_timestamp": 1794567500
}
```

### `GET /patients`
Returns all patients owned by the authenticated Firebase user.

### `POST /patients`
Creates a new patient record owned by the authenticated user.

---

## Dev Bypass Mode

If no Firebase credentials are configured (`.env` has no `GOOGLE_APPLICATION_CREDENTIALS` or inline `FIREBASE_*` vars), the auth middleware automatically creates a mock user:

```json
{ "uid": "dev-user-001", "email": "dev@psypyrus.local", "role": "CLINICIAN" }
```

This lets you develop locally without a Firebase project.

> ⚠️ **Never deploy to production without Firebase credentials configured.**

---

## 🚦 Development Status & Milestones

> [!IMPORTANT]
> This sync service is experimental. It is functional as a dev-mode local backend but is not yet production-hardened for a deployed clinical environment.

### 1. What is Implemented:
- PostgreSQL-backed patient and mood log tables via Prisma ORM.
- Last-Write-Wins delta sync endpoint (`POST /sync`).
- Firebase Admin SDK authentication middleware with dev-bypass mode.
- Railway.app deployment configuration with auto-migration.
- Full audit log for sync events (`GET /sync/events`).

### 2. What is Mocked / Not Yet Production-Ready:
- **Conflict resolution**: Uses simple Last-Write-Wins, which can cause data loss in multi-device concurrent writes. Operational Transform or CRDT approaches are needed for clinical safety.
- **End-to-end encryption**: Patient data is transmitted over HTTPS but stored as plaintext in the PostgreSQL database. Field-level encryption is planned.
- **Rate limiting and DDoS protection**: Basic Express configuration — no production-grade rate limiting or WAF layer.

### 3. Compliance Note:
> Storing patient health information in a PostgreSQL database accessible via the internet requires your own independent HIPAA/DISHA compliance assessment, signed BAAs with your cloud provider, encryption at rest, and breach notification procedures. This codebase demonstrates a **HIPAA-aware architectural pattern** — not a certified solution.

### 4. Next Milestones:
- Implement field-level AES-256 encryption for PHI columns.
- Add CRDT-based merge strategy for conflict resolution.
- Add rate limiting middleware (`express-rate-limit`).
- Add comprehensive audit trail with immutable log storage.
