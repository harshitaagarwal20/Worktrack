import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/travelReimbursement.service';

const TRANSPORT_MODES = ['BIKE', 'SCOOTY', 'AUTO', 'CAB'] as const;

const submitSchema = z.object({
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  clientName: z.string().min(1, 'Client name is required').max(200),
  reason: z.string().min(1, 'Reason is required').max(1000),
  transportMode: z.enum(TRANSPORT_MODES).optional(),
  ratePerKm: z.number().positive('Rate per km must be positive'),
  kilometers: z.number().positive('Kilometers must be positive'),
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
    const data = await svc.submitReimbursement(req.user!.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myReimbursements(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyReimbursements(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listReimbursements(
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
    const data = await svc.approveReimbursement(req.params.id, req.user!.userId, remark, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function reject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    const remark = parsed.success ? parsed.data.approvalRemark : undefined;
    const data = await svc.rejectReimbursement(req.params.id, req.user!.userId, remark, req.user!.role);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
