# PsyPyrus Sync Service

Node.js + Express microservice for the PsyPyrus offline-first sync architecture.

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
{ "status": "ok", "service": "psypyrus-sync-service", "version": "1.0.0" }
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
