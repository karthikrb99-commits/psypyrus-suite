/**
 * Firebase Auth Middleware
 *
 * Verifies Firebase ID tokens passed in the Authorization header.
 * Attaches decoded user info to req.user for downstream route handlers.
 *
 * Usage:
 *   import { requireAuth } from './middleware/firebaseAuth.js';
 *   app.use('/protected', requireAuth, router);
 *
 * Client must send:
 *   Authorization: Bearer <firebase-id-token>
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (lazy singleton)
let firebaseApp;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (credentialPath) {
      // Option 1: Service account JSON file (local dev)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else if (projectId && clientEmail && privateKey) {
      // Option 2: Inline env vars (Railway, CI)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // Option 3: No Firebase config — run in dev bypass mode
      console.warn(
        '[firebaseAuth] ⚠️  No Firebase credentials found. ' +
          'Auth is BYPASSED — do not use in production!'
      );
      return null;
    }
  } catch (err) {
    // App already initialized (e.g. during tests)
    if (err.code === 'app/duplicate-app') {
      firebaseApp = admin.app();
    } else {
      throw err;
    }
  }

  return firebaseApp;
}

/**
 * Express middleware — verifies Firebase Bearer token.
 * In development (no credentials configured), passes through with a mock user.
 */
export async function requireAuth(req, res, next) {
  const app = getFirebaseApp();

  // Dev bypass mode
  if (!app) {
    req.user = {
      uid: 'dev-user-001',
      email: 'dev@psypyrus.local',
      role: 'CLINICIAN',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized — missing Bearer token',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      name: decoded.name,
      // Custom claims (set via Firebase Admin on role assignment)
      role: decoded.role || 'PATIENT',
    };
    return next();
  } catch (err) {
    console.error('[firebaseAuth] Token verification failed:', err.code);
    return res.status(401).json({
      error: 'Unauthorized — invalid or expired token',
      code: err.code,
    });
  }
}
