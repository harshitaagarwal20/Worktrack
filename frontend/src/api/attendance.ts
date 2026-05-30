import client from './client';
import { Attendance, PaginatedResponse } from '../types';

export async function checkIn(data: { date: string; checkInTime: string }): Promise<Attendance> {
  const res = await client.post('/attendance/checkin', data);
  return res.data.data;
}

export async function checkOut(data: { attendanceId: string; checkOutTime: string; workHours: number; status: string }): Promise<Attendance> {
  const res = await client.post('/attendance/checkout', data);
  return res.data.data;
}

export async function getTodayAttendance(): Promise<Attendance | null> {
  const res = await client.get('/attendance/today');
  return res.data.data;
}

export async function getMyAttendance(params?: { date?: string; month?: number; year?: number; page?: number; limit?: number }): Promise<PaginatedResponse<Attendance>> {
  const res = await client.get('/attendance/my', { params });
  return res.data.data;
}

export async function getAllAttendance(params: { employeeId?: string; date?: string; month?: number; year?: number; status?: string; approvalStatus?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Attendance & { employee: { firstName: string; lastName: string; employeeCode: string; id: string } }>> {
  const res = await client.get('/attendance', { params });
  return res.data.data;
}

export async function editAttendance(id: string, data: object): Promise<Attendance> {
  const res = await client.put(`/attendance/${id}`, data);
  return res.data.data;
}
