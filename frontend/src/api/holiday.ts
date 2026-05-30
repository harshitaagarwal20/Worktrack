import client from './client';
import { Holiday, PaginatedResponse } from '../types';

export async function getHolidays(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Holiday>> {
  const res = await client.get('/holidays', { params });
  return res.data.data;
}

export async function createHoliday(data: object): Promise<Holiday> {
  const res = await client.post('/holidays', data);
  return res.data.data;
}

export async function updateHoliday(id: string, data: object): Promise<Holiday> {
  const res = await client.put(`/holidays/${id}`, data);
  return res.data.data;
}

export async function deleteHoliday(id: string): Promise<void> {
  await client.delete(`/holidays/${id}`);
}
