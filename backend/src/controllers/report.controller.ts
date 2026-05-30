import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import { getDashboardSummary, getAttendanceSummary, getPayrollSummary } from '../services/report.service';

const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year:  z.coerce.number().int().min(2000).max(2100),
  employeeId: z.string().optional(),
});

export async function summary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await getDashboardSummary();
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function attendanceSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = monthYearSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'month and year are required' });
      return;
    }
    const { month, year, employeeId } = parsed.data;
    const data = await getAttendanceSummary(month, year, employeeId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function payrollSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = monthYearSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'month and year are required' });
      return;
    }
    const { month, year } = parsed.data;
    const data = await getPayrollSummary(month, year);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
