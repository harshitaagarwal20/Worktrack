import { Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { handleError } from '../utils/errors';
import * as svc from '../services/employee.service';

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeCode: z.string().min(1).max(20).optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  designation: z.string().min(1, 'Designation is required').max(100),
  monthlySalary: z.number().positive('Monthly salary is required'),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  phone: z.string().max(20).optional(),
  role: z.enum(['USER', 'DEPARTMENT_HEAD']).optional(),
  managerId: z.string().optional(),
  worksSundays: z.boolean().optional(),
});

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  designation: z.string().min(1).max(100).optional(),
  monthlySalary: z.number().positive().optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  managerId: z.string().nullable().optional(),
  worksSundays: z.boolean().optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'DEPARTMENT_HEAD']).optional(),
  newPassword: z.string().min(6).optional(),
});

const selfUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.listEmployees(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function myTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyTeam(req.user!.userId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getEmployee(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { dateOfJoining, role, managerId, ...rest } = parsed.data;
    const isDeptHead = req.user!.role === 'DEPARTMENT_HEAD';

    let resolvedManagerId = managerId;
    if (isDeptHead) {
      const managerEmployee = await svc.getMyProfile(req.user!.userId);
      resolvedManagerId = managerEmployee.id;
    }

    const data = await svc.createEmployee({
      ...rest,
      dateOfJoining: new Date(dateOfJoining),
      role: isDeptHead ? Role.USER : (role as Role | undefined),
      managerId: resolvedManagerId,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { dateOfJoining, email, role, newPassword, ...rest } = parsed.data;
    const isAdmin = req.user!.role === 'HR_ADMIN';

    const data = await svc.updateEmployee(
      req.params.id,
      {
        ...rest,
        ...(dateOfJoining && { dateOfJoining: new Date(dateOfJoining) }),
        ...(isAdmin && email ? { email } : {}),
        ...(isAdmin && role ? { role: role as Role } : {}),
        ...(isAdmin && newPassword ? { newPassword } : {}),
      },
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deactivate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.deactivateEmployee(req.params.id, req.user!.userId, req.user!.role);
    res.json({ success: true, message: 'Employee deactivated', data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await svc.getMyProfile(req.user!.userId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = selfUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.updateMyProfile(req.user!.userId, parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
