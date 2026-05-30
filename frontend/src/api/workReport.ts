import client from './client';
import { WorkReport, PaginatedResponse } from '../types';

export interface WorkReportEntry {
  clientName?: string;
  tasks: string[];
}

export async function submitWorkReport(data: {
  date: string;
  remarks?: string;
  entries: WorkReportEntry[];
}): Promise<WorkReport> {
  const res = await client.post('/work-reports', data);
  return res.data.data;
}

export async function getMyWorkReports(params?: { month?: number; year?: number; page?: number; limit?: number }): Promise<PaginatedResponse<WorkReport>> {
  const res = await client.get('/work-reports/my', { params });
  return res.data.data;
}

export async function getAllWorkReports(params?: { employeeId?: string; month?: number; year?: number; page?: number; limit?: number }): Promise<PaginatedResponse<WorkReport & { employee: { firstName: string; lastName: string; employeeCode: string } }>> {
  const res = await client.get('/work-reports', { params });
  return res.data.data;
}
