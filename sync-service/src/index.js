/**
 * PsyPyrus Sync Service — Entry Point
 * Node.js + Express + Prisma + Firebase Auth
 *
 * Routes:
 *   GET  /health         — Health check
 *   POST /sync           — Offline queue flush (delta sync)
 *   GET  /patients       — List patients for authenticated user
 *   POST /patients       — Create patient
 *   GET  /patients/:id   — Get single patient
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { syncRouter } from './routes/sync.js';
import { patientsRouter } from './routes/patients.js';
import { requireAuth } from './middleware/firebaseAuth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(compression());

// CORS — allow configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing & logging
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Public Routes ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'psypyrus-sync-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// ─── Protected Routes (require Firebase Auth JWT) ───────────
app.use('/sync', requireAuth, syncRouter);
app.use('/patients', requireAuth, patientsRouter);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏥 PsyPyrus Sync Service running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;
