import client from './client';
import { AuthUser } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await client.post('/auth/login', { email, password });
  return res.data.data;
}

export async function signup(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  designation: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await client.post('/auth/signup', data);
  return res.data.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await client.get('/auth/me');
  return res.data.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.put('/auth/change-password', { currentPassword, newPassword });
}
