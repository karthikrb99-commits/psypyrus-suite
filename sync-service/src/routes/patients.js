/**
 * Patients Route — CRUD for patient records
 *
 * Routes:
 *   GET    /patients         — List all patients owned by the authenticated clinician
 *   POST   /patients         — Create a new patient
 *   GET    /patients/:id     — Get patient detail (with relations)
 *   PATCH  /patients/:id     — Update patient fields
 *   DELETE /patients/:id     — Soft delete (set archived flag)
 */

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Validation Schemas ─────────────────────────────────────

const CreatePatientSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  riskStatus: z.enum(['None', 'Low', 'Moderate', 'Severe']).optional(),
  specialty: z.string().optional(),
  abhaNumber: z.string().optional(),
  abhaAddress: z.string().optional(),
});

const UpdatePatientSchema = CreatePatientSchema.partial();

// ─── GET /patients ──────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { firebaseOwnerId: req.user.uid },
      orderBy: { registrationDate: 'desc' },
      include: {
        _count: {
          select: {
            appointments: true,
            assessments: true,
            moodLogs: true,
          },
        },
      },
    });

    return res.json({ patients, total: patients.length });
  } catch (err) {
    next(err);
  }
});

// ─── POST /patients ─────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const parseResult = CreatePatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
    }

    const patient = await prisma.patient.create({
      data: {
        ...parseResult.data,
        firebaseOwnerId: req.user.uid,
      },
    });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        action: 'PATIENT_CREATED',
        details: `New patient record created: ${patient.name}`,
        actor: req.user.email || req.user.uid,
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
});

// ─── GET /patients/:id ──────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    const patient = await prisma.patient.findFirst({
      where: { id, firebaseOwnerId: req.user.uid },
      include: {
        appointments: { orderBy: { createdAt: 'desc' }, take: 10 },
        clinicalNotes: { orderBy: { timestamp: 'desc' }, take: 10 },
        assessments: { orderBy: { date: 'desc' }, take: 10 },
        moodLogs: { orderBy: { date: 'desc' }, take: 30 },
        homeworkTasks: { orderBy: { assignedDate: 'desc' }, take: 10 },
        medications: { where: { isActive: true } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /patients/:id ────────────────────────────────────

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    const parseResult = UpdatePatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
    }

    // Verify ownership
    const existing = await prisma.patient.findFirst({
      where: { id, firebaseOwnerId: req.user.uid },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: parseResult.data,
    });

    return res.json({ patient: updated });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /patients/:id ───────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    // Verify ownership before deleting
    const existing = await prisma.patient.findFirst({
      where: { id, firebaseOwnerId: req.user.uid },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.patient.delete({ where: { id } });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        action: 'PATIENT_DELETED',
        details: `Patient record deleted: ${existing.name}`,
        actor: req.user.email || req.user.uid,
        ipAddress: req.ip,
      },
    });

    return res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

export { router as patientsRouter };
