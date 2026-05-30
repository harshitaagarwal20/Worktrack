import { Request, Response } from 'express';
import { z } from 'zod';
import { loginUser, signupUser, getMe, changePassword as changePasswordService } from '../services/auth.service';
import { AuthRequest } from '../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, message });
  }
}

const signupSchema = z.object({
  email:       z.string().email('Invalid email'),
  password:    z.string().min(6, 'Password must be at least 6 characters'),
  firstName:   z.string().min(1, 'First name is required').max(100),
  lastName:    z.string().min(1, 'Last name is required').max(100),
  designation: z.string().min(1, 'Designation is required').max(100),
});

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Validation error';
      res.status(400).json({ success: false, message });
      return;
    }
    const result = await signupUser(parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    res.status(400).json({ success: false, message });
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: Object.values(parsed.error.flatten().fieldErrors).flat()[0] });
      return;
    }
    const { currentPassword, newPassword } = parsed.data;
    await changePasswordService(req.user!.userId, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change password';
    res.status(400).json({ success: false, message });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await getMe(userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    res.status(404).json({ success: false, message });
  }
}
