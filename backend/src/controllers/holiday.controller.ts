import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/holiday.service';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  isPaid: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isPaid: z.boolean().optional(),
});

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listHolidays(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.createHoliday(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.updateHoliday(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.deleteHoliday(req.params.id);
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    handleError(res, error);
  }
}
