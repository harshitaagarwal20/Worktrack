import { Response } from 'express';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/attendance.service';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const checkInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  checkInTime: z.string().datetime({ offset: true }),
});

const checkOutSchema = z.object({
  attendanceId: z.string().min(1),
  checkOutTime: z.string().datetime({ offset: true }),
  workHours: z.number().min(0),
});

const editSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  checkIn: z.string().datetime({ offset: true }).nullable().optional(),
  checkOut: z.string().datetime({ offset: true }).nullable().optional(),
  workHours: z.number().nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  remarks: z.string().max(500).nullable().optional(),
});

// ─── Employee: Check In ───────────────────────────────────────────────────────

export async function checkIn(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = checkInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.checkIn(req.user!.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

// ─── Employee: Check Out ──────────────────────────────────────────────────────

export async function checkOut(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = checkOutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.checkOut(req.user!.userId, parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

// ─── Employee: Today ─────────────────────────────────────────────────────────

export async function today(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getTodayAttendance(req.user!.userId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

// ─── Employee: My Attendance ──────────────────────────────────────────────────

export async function myAttendance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyAttendance(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

// ─── HR/Admin ─────────────────────────────────────────────────────────────────

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listAttendances(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function edit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.editAttendance(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
