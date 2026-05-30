import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/outstationClaim.service';

const TRANSPORT_MODES = ['CAB', 'CAR', 'TRAIN', 'AIRPLANE'] as const;

const submitSchema = z.object({
  fromDate:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  toDate:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  destination:          z.string().min(1, 'Destination is required').max(200),
  purpose:              z.string().min(1, 'Purpose is required').max(1000),
  transportMode:        z.enum(TRANSPORT_MODES).optional(),
  travelExpense:        z.number().min(0).optional(),
  foodExpense:          z.number().min(0).optional(),
  accommodationExpense: z.number().min(0).optional(),
  otherExpense:         z.number().min(0).optional(),
  otherExpenseNote:     z.string().max(500).optional(),
});

const reviewSchema = z.object({
  approvalRemark: z.string().max(500).optional(),
});

export async function submit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.submitClaim(req.user!.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myClaims(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyClaims(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listClaims(
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
    const parsed = reviewSchema.safeParse(req.body);
    const remark = parsed.success ? parsed.data.approvalRemark : undefined;
    const data = await svc.approveClaim(req.params.id, req.user!.userId, remark, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function reject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    const remark = parsed.success ? parsed.data.approvalRemark : undefined;
    const data = await svc.rejectClaim(req.params.id, req.user!.userId, remark, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
