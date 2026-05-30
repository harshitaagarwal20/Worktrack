import client from './client';
import { Employee, PaginatedResponse } from '../types';

export async function getMyProfile(): Promise<Employee> {
  const res = await client.get('/employees/me');
  return res.data.data;
}

export async function getAllEmployees(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Employee>> {
  const res = await client.get('/employees', { params });
  return res.data.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const res = await client.get(`/employees/${id}`);
  return res.data.data;
}

export async function createEmployee(data: object): Promise<Employee> {
  const res = await client.post('/employees', data);
  return res.data.data;
}

export async function updateEmployee(id: string, data: object): Promise<Employee> {
  const res = await client.put(`/employees/${id}`, data);
  return res.data.data;
}

export async function deactivateEmployee(id: string): Promise<Employee> {
  const res = await client.delete(`/employees/${id}`);
  return res.data.data;
}

export async function getMyTeam(): Promise<Employee[]> {
  const res = await client.get('/employees/my-team');
  return res.data.data;
}
