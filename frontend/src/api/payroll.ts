import client from './client';
import { Payroll, PaginatedResponse } from '../types';

export async function getMyPayrolls(params?: { page?: number; limit?: number; year?: number }): Promise<PaginatedResponse<Payroll>> {
  const res = await client.get('/payroll/my', { params });
  return res.data.data;
}

export async function getAllPayrolls(params?: { employeeId?: string; month?: number; year?: number; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Payroll>> {
  const res = await client.get('/payroll', { params });
  return res.data.data;
}

export async function getPayroll(id: string): Promise<Payroll> {
  const res = await client.get(`/payroll/${id}`);
  return res.data.data;
}

export async function generatePayroll(data: { employeeId: string; month: number; year: number; manualAdjustment?: number; adjustmentRemark?: string }): Promise<Payroll> {
  const res = await client.post('/payroll/generate', data);
  return res.data.data;
}

export async function adjustPayroll(id: string, data: { manualAdjustment: number; adjustmentRemark?: string }): Promise<Payroll> {
  const res = await client.put(`/payroll/${id}/adjust`, data);
  return res.data.data;
}

export async function finalizePayroll(id: string): Promise<Payroll> {
  const res = await client.put(`/payroll/${id}/finalize`);
  return res.data.data;
}

export async function markPayrollPaid(id: string): Promise<Payroll> {
  const res = await client.put(`/payroll/${id}/mark-paid`);
  return res.data.data;
}

export interface BulkResult {
  generated: number;
  skipped: number;
  failed: number;
  results: Array<{ name: string; status: 'generated' | 'skipped' | 'failed'; error?: string }>;
}

export async function generateBulkPayroll(month: number, year: number): Promise<BulkResult> {
  const res = await client.post('/payroll/generate-bulk', { month, year });
  return res.data.data;
}
