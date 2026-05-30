import client from './client';
import { PaginatedResponse } from '../types';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string; designation: string };
}

export async function getMyLeaves(params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<LeaveRequest>> {
  const res = await client.get('/leaves/my', { params });
  return res.data.data;
}

export async function submitLeave(data: { fromDate: string; toDate: string; reason: string }): Promise<LeaveRequest> {
  const res = await client.post('/leaves', data);
  return res.data.data;
}

export async function getAllLeaves(params?: { status?: string; employeeId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<LeaveRequest>> {
  const res = await client.get('/leaves', { params });
  return res.data.data;
}

export async function approveLeave(id: string): Promise<LeaveRequest> {
  const res = await client.put(`/leaves/${id}/approve`);
  return res.data.data;
}

export async function rejectLeave(id: string): Promise<LeaveRequest> {
  const res = await client.put(`/leaves/${id}/reject`);
  return res.data.data;
}
