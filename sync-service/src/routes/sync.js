/**
 * Sync Route — POST /sync
 *
 * Accepts an offline-queue delta payload from any client (Web, Android, iOS).
 * Applies Last-Write-Wins (LWW) conflict resolution as defined in docs/05_backend_schema.md.
 *
 * Request body:
 * {
 *   "sync_timestamp": 1794567210,
 *   "client_device": "Web_Chrome",
 *   "deltas": {
 *     "patients": [ { "id": 1, "name": "...", "last_modified": 1794567205 } ],
 *     "mood_logs": [ { "id": 89, "patientId": 1, "moodScore": 8, "last_modified": 1794567200 } ]
 *   }
 * }
 *
 * Response:
 * {
 *   "accepted": { "patients": [1], "mood_logs": [89] },
 *   "conflicts": [],
 *   "server_timestamp": 1794567500
 * }
 */

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Zod Validation Schema ──────────────────────────────────

const DeltaItemSchema = z
  .object({
    id: z.number().optional(),
    last_modified: z.number(),
  })
  .passthrough(); // Allow any additional clinical fields

const SyncPayloadSchema = z.object({
  sync_timestamp: z.number(),
  client_device: z.string().optional().default('Unknown'),
  deltas: z.object({
    patients: z.array(DeltaItemSchema).optional().default([]),
    appointments: z.array(DeltaItemSchema).optional().default([]),
    clinical_notes: z.array(DeltaItemSchema).optional().default([]),
    assessments: z.array(DeltaItemSchema).optional().default([]),
    mood_logs: z.array(DeltaItemSchema).optional().default([]),
    homework_tasks: z.array(DeltaItemSchema).optional().default([]),
    medications: z.array(DeltaItemSchema).optional().default([]),
  }),
});

// ─── LWW Conflict Resolution Helper ────────────────────────

/**
 * Applies Last-Write-Wins conflict resolution.
 * Compares client's last_modified with server's last_modified.
 * Returns { accepted: boolean, serverRecord } for each item.
 */
async function applyLWW(table, item, ownerId) {
  const clientTimestamp = item.last_modified;

  try {
    // Find existing server record
    const existing = await prisma[table].findFirst({
      where: { id: item.id },
    });

    if (!existing) {
      // New record — insert directly
      const { last_modified, ...data } = item;
      const created = await prisma[table].create({
        data: {
          ...data,
          ...(table === 'patient' && { firebaseOwnerId: ownerId }),
        },
      });
      return { status: 'created', id: created.id };
    }

    const serverTimestamp = Math.floor(
      existing.lastModified?.getTime() / 1000
    );

    if (clientTimestamp >= serverTimestamp) {
      // Client wins — apply update
      const { last_modified, id, ...updateData } = item;
      await prisma[table].update({
        where: { id },
        data: updateData,
      });
      return { status: 'accepted', id };
    } else {
      // Server wins — reject client delta, return conflict info
      return {
        status: 'conflict',
        id: item.id,
        serverTimestamp,
        clientTimestamp,
      };
    }
  } catch (err) {
    console.error(`[sync] LWW error for ${table}#${item.id}:`, err.message);
    return { status: 'error', id: item.id, error: err.message };
  }
}

// Table name mapping (delta key → Prisma model name)
const TABLE_MAP = {
  patients: 'patient',
  appointments: 'appointment',
  clinical_notes: 'clinicalNote',
  assessments: 'assessment',
  mood_logs: 'moodLog',
  homework_tasks: 'homeworkTask',
  medications: 'medication',
};

// ─── POST /sync ─────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    // Validate payload
    const parseResult = SyncPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid sync payload',
        details: parseResult.error.flatten(),
      });
    }

    const { sync_timestamp, client_device, deltas } = parseResult.data;
    const ownerId = req.user.uid;

    const results = {
      accepted: {},
      created: {},
      conflicts: {},
      errors: {},
    };

    // Process each table's deltas
    for (const [deltaKey, items] of Object.entries(deltas)) {
      if (!items.length) continue;

      const prismaModel = TABLE_MAP[deltaKey];
      if (!prismaModel) continue;

      const tableResults = await Promise.all(
        items.map((item) => applyLWW(prismaModel, item, ownerId))
      );

      results.accepted[deltaKey] = tableResults
        .filter((r) => r.status === 'accepted')
        .map((r) => r.id);

      results.created[deltaKey] = tableResults
        .filter((r) => r.status === 'created')
        .map((r) => r.id);

      results.conflicts[deltaKey] = tableResults.filter(
        (r) => r.status === 'conflict'
      );

      results.errors[deltaKey] = tableResults.filter(
        (r) => r.status === 'error'
      );
    }

    // Log sync event to audit trail
    await prisma.syncEvent.create({
      data: {
        userId: ownerId,
        clientDevice: client_device,
        syncTimestamp: new Date(sync_timestamp * 1000),
        deltasJson: JSON.stringify(deltas),
        conflictsJson: JSON.stringify(results.conflicts),
        status: 'APPLIED',
      },
    });

    return res.json({
      ...results,
      server_timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /sync/events — Audit log of sync events ───────────

router.get('/events', async (req, res, next) => {
  try {
    const events = await prisma.syncEvent.findMany({
      where: { userId: req.user.uid },
      orderBy: { syncTimestamp: 'desc' },
      take: 50,
    });
    return res.json({ events });
  } catch (err) {
    next(err);
  }
});

export { router as syncRouter };
