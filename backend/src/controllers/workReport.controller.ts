import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/workReport.service';

const entrySchema = z.object({
  clientName: z.string().max(200).optional(),
  tasks: z.array(z.string().min(1).max(1000)).min(1, 'At least one task per entry').max(50),
});

const submitSchema = z.object({
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional(),
  remarks: z.string().max(500).optional(),
  entries: z.array(entrySchema).min(1, 'At least one entry required').max(20),
});

export async function submit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.submitReport(req.user!.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myReports(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyReports(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listReports(
      req.query as Record<string, unknown>,
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
