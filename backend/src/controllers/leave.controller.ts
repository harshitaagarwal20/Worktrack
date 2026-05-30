import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/leave.service';

const submitSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  reason: z.string().min(1, 'Reason is required').max(1000),
});

export async function submit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.submitLeave(req.user!.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myLeaves(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyLeaves(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listLeaves(
      req.query as Record<string, unknown>,
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function approve(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.approveLeave(req.params.id, req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function reject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.rejectLeave(req.params.id, req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
