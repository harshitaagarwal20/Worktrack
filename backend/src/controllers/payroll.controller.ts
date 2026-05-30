import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { handleError, AppError } from '../utils/errors';
import * as svc from '../services/payroll.service';

// ─── Validation schemas ───────────────────────────────────────────────────────

const generateSchema = z.object({
  employeeId: z.string().min(1, 'employeeId is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const generateBulkSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const adjustSchema = z.object({
  manualAdjustment: z.number({ required_error: 'manualAdjustment is required' }),
  adjustmentRemark: z.string().max(500).optional(),
});

const exportQuerySchema = z.object({
  month: z.string().regex(/^\d{1,2}$/).transform(Number),
  year: z.string().regex(/^\d{4}$/).transform(Number),
});

// ─── CSV helper ───────────────────────────────────────────────────────────────

/** Escape a value for RFC 4180-compliant CSV output. */
function escCsv(val: unknown): string {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCsv(rows: svc.PayrollExportRow[]): string {
  if (rows.length === 0) return Object.keys({} as svc.PayrollExportRow).join(',');
  const headers = Object.keys(rows[0]).join(',');
  const body = rows.map((r) => Object.values(r).map(escCsv).join(',')).join('\n');
  return `${headers}\n${body}`;
}

// ─── HR/Admin controllers ─────────────────────────────────────────────────────

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { employeeId, month, year } = parsed.data;
    const data = await svc.generatePayroll(employeeId, month, year, req.user!.userId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function generateBulk(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = generateBulkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { month, year } = parsed.data;
    const data = await svc.generateBulkPayroll(month, year, req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listPayrolls(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getPayroll(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adjust(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.adjustPayroll(req.params.id, parsed.data.manualAdjustment, parsed.data.adjustmentRemark);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function finalize(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.finalizePayroll(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function markPaid(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.markPaid(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function payslip(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getPayslip(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function exportCsv(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = exportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'month (1-12) and year (YYYY) are required query params',
      });
      return;
    }
    const { month, year } = parsed.data;
    const rows = await svc.getPayrollExportData(month, year);
    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-${year}-${String(month).padStart(2, '0')}.csv"`);
    res.send(csv);
  } catch (error) {
    handleError(res, error);
  }
}

// ─── Employee controllers ─────────────────────────────────────────────────────

export async function myPayrolls(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyPayrolls(req.user!.userId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myPayslip(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyPayslip(req.user!.userId, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
