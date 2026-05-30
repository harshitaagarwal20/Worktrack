import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { signToken, buildPayload } from '../utils/jwt';

const AUTH_EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  designation: true,
  monthlySalary: true,
} as const;

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      employee: {
        select: AUTH_EMPLOYEE_SELECT,
      },
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const payload = buildPayload(user.id, user.email, user.role);
  const token = signToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee,
    },
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

export async function signupUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  designation: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already in use');

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const rows: Array<{ employeeCode: string }> = await prisma.$queryRaw`SELECT employeeCode FROM employees ORDER BY CAST(SUBSTRING(employeeCode, 5) AS UNSIGNED) DESC LIMIT 1`;
  const lastCode = rows.length ? rows[0].employeeCode : undefined;

  const { nextEmployeeIdFromLast } = await import('../utils/orderId');
  const employeeCode = nextEmployeeIdFromLast(lastCode);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: data.email, password: hashedPassword, role: Role.USER },
    });
    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation,
        monthlySalary: 0,
        dateOfJoining: new Date(),
      },
    });
    return { user, employee };
  });

  const payload = buildPayload(result.user.id, result.user.email, result.user.role);
  const token = signToken(payload);

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      employee: {
        id: result.employee.id,
        employeeCode: result.employee.employeeCode,
        firstName: result.employee.firstName,
        lastName: result.employee.lastName,
        designation: result.employee.designation,
        monthlySalary: result.employee.monthlySalary,
      },
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      employee: {
        select: AUTH_EMPLOYEE_SELECT,
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
