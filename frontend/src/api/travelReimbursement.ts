import client from './client';
import { PaginatedResponse } from '../types';

export type TransportMode = 'BIKE' | 'SCOOTY' | 'AUTO' | 'CAB' | 'CAR' | 'TRAIN' | 'AIRPLANE';

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  BIKE:     'Bike',
  SCOOTY:   'Scooty',
  AUTO:     'Auto',
  CAB:      'Cab',
  CAR:      'Car',
  TRAIN:    'Train',
  AIRPLANE: 'Airplane',
};

export const TRAVEL_TRANSPORT_MODES: TransportMode[] = ['BIKE', 'SCOOTY', 'AUTO', 'CAB'];
export const OUTSTATION_TRANSPORT_MODES: TransportMode[] = ['CAB', 'CAR', 'TRAIN', 'AIRPLANE'];

export interface TravelReimbursement {
  id: string;
  employeeId: string;
  travelDate: string;
  clientName: string;
  reason: string;
  transportMode?: TransportMode | null;
  ratePerKm: number;
  kilometers: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvalRemark?: string;
  payrollId?: string;
  createdAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
  };
}

export async function getMyReimbursements(
  params?: { status?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<TravelReimbursement>> {
  const res = await client.get('/travel-reimbursements/my', { params });
  return res.data.data;
}

export async function submitReimbursement(data: {
  travelDate: string;
  clientName: string;
  reason: string;
  transportMode?: TransportMode;
  ratePerKm: number;
  kilometers: number;
}): Promise<TravelReimbursement> {
  const res = await client.post('/travel-reimbursements', data);
  return res.data.data;
}

export async function getAllReimbursements(
  params?: { status?: string; employeeId?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<TravelReimbursement>> {
  const res = await client.get('/travel-reimbursements', { params });
  return res.data.data;
}

export async function approveReimbursement(
  id: string,
  approvalRemark?: string,
): Promise<TravelReimbursement> {
  const res = await client.put(`/travel-reimbursements/${id}/approve`, { approvalRemark });
  return res.data.data;
}

export async function rejectReimbursement(
  id: string,
  approvalRemark?: string,
): Promise<TravelReimbursement> {
  const res = await client.put(`/travel-reimbursements/${id}/reject`, { approvalRemark });
  return res.data.data;
}
