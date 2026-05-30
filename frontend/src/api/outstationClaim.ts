import client from './client';
import { PaginatedResponse } from '../types';
import { type TransportMode, TRANSPORT_MODE_LABELS, OUTSTATION_TRANSPORT_MODES } from './travelReimbursement';

export type { TransportMode };
export { TRANSPORT_MODE_LABELS, OUTSTATION_TRANSPORT_MODES };

export interface OutstationClaim {
  id: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  destination: string;
  purpose: string;
  transportMode?: TransportMode | null;
  travelExpense: number;
  foodExpense: number;
  accommodationExpense: number;
  otherExpense: number;
  otherExpenseNote?: string | null;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string | null;
  approvalRemark?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
  };
}

export async function getMyClaims(
  params?: { status?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<OutstationClaim>> {
  const res = await client.get('/outstation-claims/my', { params });
  return res.data.data;
}

export async function submitClaim(data: {
  fromDate: string;
  toDate: string;
  destination: string;
  purpose: string;
  transportMode?: TransportMode;
  travelExpense?: number;
  foodExpense?: number;
  accommodationExpense?: number;
  otherExpense?: number;
  otherExpenseNote?: string;
}): Promise<OutstationClaim> {
  const res = await client.post('/outstation-claims', data);
  return res.data.data;
}

export async function getAllClaims(
  params?: { status?: string; employeeId?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<OutstationClaim>> {
  const res = await client.get('/outstation-claims', { params });
  return res.data.data;
}

export async function approveClaim(id: string, approvalRemark?: string): Promise<OutstationClaim> {
  const res = await client.put(`/outstation-claims/${id}/approve`, { approvalRemark });
  return res.data.data;
}

export async function rejectClaim(id: string, approvalRemark?: string): Promise<OutstationClaim> {
  const res = await client.put(`/outstation-claims/${id}/reject`, { approvalRemark });
  return res.data.data;
}
