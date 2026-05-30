import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { nextEmployeeIdFromLast } from '../utils/orderId';

const EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  phone: true,
  designation: true,
  monthlySalary: true,
  dateOfJoining: true,
  isActive: true,
  worksSundays: true,
  managerId: true,
  user: { select: { id: true, email: true, role: true } },
} as const;

export async function listEmployees(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;

  const where = {
    ...(isActive !== undefined && { isActive }),
  };

  const [employees, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { firstName: 'asc' },
      select: EMPLOYEE_SELECT,
    }),
    prisma.employee.count({ where }),
  ]);

  return paginatedResponse(employees, total, page, limit);
}

export async function getMyTeam(userId: string) {
  const manager = await prisma.employee.findUnique({ where: { userId } });
  if (!manager) throw new AppError('Employee profile not found', 404);

  const subordinates = await prisma.employee.findMany({
    where: { managerId: manager.id },
    orderBy: { firstName: 'asc' },
    select: EMPLOYEE_SELECT,
  });

  return subordinates;
}

export async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: EMPLOYEE_SELECT,
  });
  if (!employee) throw new AppError('Employee not found', 404);
  return employee;
}

export async function createEmployee(data: {
  email: string;
  password: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  designation: string;
  monthlySalary: number;
  dateOfJoining: Date;
  phone?: string;
  role?: Role;
  managerId?: string;
  worksSundays?: boolean;
}) {
  const { email, password, role = Role.USER, managerId, ...employeeData } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  if (managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: managerId } });
    if (!manager) throw new AppError('Manager employee not found', 404);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role },
    });

    let code = (employeeData as any).employeeCode;
    if (!code) {
      const rows: Array<{ employeeCode: string } & Record<string, any>> = await tx.$queryRaw`SELECT employeeCode FROM employees ORDER BY CAST(SUBSTRING(employeeCode, 5) AS UNSIGNED) DESC LIMIT 1`;
      const lastCode = rows && rows.length ? rows[0].employeeCode : undefined;
      code = nextEmployeeIdFromLast(lastCode);
    }

    const employee = await tx.employee.create({
      data: { userId: user.id, ...employeeData, employeeCode: code, managerId: managerId ?? null },
      select: EMPLOYEE_SELECT,
    });

    return employee;
  });
}

export async function updateEmployee(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    designation?: string;
    monthlySalary?: number;
    dateOfJoining?: Date;
    managerId?: string | null;
    worksSundays?: boolean;
    email?: string;
    role?: Role;
    newPassword?: string;
  },
  requesterUserId?: string,
  requesterRole?: string,
) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new AppError('Employee not found', 404);

  if (requesterRole === 'DEPARTMENT_HEAD' && requesterUserId) {
    const manager = await prisma.employee.findUnique({ where: { userId: requesterUserId } });
    if (!manager || employee.managerId !== manager.id) {
      throw new AppError('You can only update members of your own team', 403);
    }
  }

  if (data.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: data.managerId } });
    if (!manager) throw new AppError('Manager employee not found', 404);
    if (data.managerId === id) throw new AppError('Employee cannot be their own manager', 400);
  }

  const { email, role, newPassword, ...employeeData } = data;

  const userUpdate: Partial<{ email: string; role: Role; password: string }> = {};
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== employee.userId) throw new AppError('Email already in use', 409);
    userUpdate.email = email;
  }
  if (role) userUpdate.role = role;
  if (newPassword) userUpdate.password = await bcrypt.hash(newPassword, 12);

  return prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({ where: { id: employee.userId }, data: userUpdate });
    }
    return tx.employee.update({
      where: { id },
      data: employeeData,
      select: EMPLOYEE_SELECT,
    });
  });
}

export async function deactivateEmployee(
  id: string,
  requesterUserId?: string,
  requesterRole?: string,
) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new AppError('Employee not found', 404);

  if (requesterRole === 'DEPARTMENT_HEAD' && requesterUserId) {
    const manager = await prisma.employee.findUnique({ where: { userId: requesterUserId } });
    if (!manager || employee.managerId !== manager.id) {
      throw new AppError('You can only deactivate members of your own team', 403);
    }
  }

  if (!employee.isActive) throw new AppError('Employee is already inactive', 409);

  return prisma.employee.update({
    where: { id },
    data: { isActive: false },
    select: EMPLOYEE_SELECT,
  });
}

export async function getMyProfile(userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: EMPLOYEE_SELECT,
  });
  if (!employee) throw new AppError('Employee profile not found', 404);
  return employee;
}

export async function updateMyProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string },
) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError('Employee profile not found', 404);

  return prisma.employee.update({
    where: { userId },
    data,
    select: EMPLOYEE_SELECT,
  });
}
