import client from './client';

export async function getDashboardSummary() {
  const res = await client.get('/reports/summary');
  return res.data.data;
}

export async function getAttendanceSummary(params: { month: number; year: number; employeeId?: string }) {
  const res = await client.get('/reports/attendance-summary', { params });
  return res.data.data;
}

export async function getPayrollSummary(params: { month: number; year: number }) {
  const res = await client.get('/reports/payroll-summary', { params });
  return res.data.data;
}
