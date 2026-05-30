import { ApprovalStatus, TransportMode } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly } from '../utils/date';

const round2 = (n: number) => Math.round(n * 100) / 100;

async function requireEmployee(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError('Employee profile not found', 404);
  if (!employee.isActive) throw new AppError('Employee account is inactive', 403);
  return employee;
}

async function getManagerEmployeeId(userId: string): Promise<string> {
  const manager = await prisma.employee.findUnique({ where: { userId } });
  if (!manager) throw new AppError('Manager employee profile not found', 404);
  return manager.id;
}

export async function submitClaim(
  userId: string,
  data: {
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
  },
) {
  const employee = await requireEmployee(userId);

  const from = toDateOnly(data.fromDate);
  const to = toDateOnly(data.toDate);
  if (to < from) throw new AppError('End date cannot be before start date', 400);

  const travel = data.travelExpense ?? 0;
  const food = data.foodExpense ?? 0;
  const accommodation = data.accommodationExpense ?? 0;
  const other = data.otherExpense ?? 0;
  const totalAmount = round2(travel + food + accommodation + other);

  if (totalAmount <= 0) throw new AppError('At least one expense amount must be greater than 0', 400);

  return prisma.outstationClaim.create({
    data: {
      employeeId: employee.id,
      fromDate: from,
      toDate: to,
      destination: data.destination.trim(),
      purpose: data.purpose.trim(),
      transportMode: data.transportMode ?? null,
      travelExpense: travel,
      foodExpense: food,
      accommodationExpense: accommodation,
      otherExpense: other,
      otherExpenseNote: data.otherExpenseNote?.trim() || null,
      totalAmount,
    },
  });
}

export async function getMyClaims(userId: string, query: Record<string, unknown>) {
  const employee = await requireEmployee(userId);
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as ApprovalStatus | undefined;

  const where = {
    employeeId: employee.id,
    ...(status && { status }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.outstationClaim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fromDate: 'desc' },
    }),
    prisma.outstationClaim.count({ where }),
  ]);

  return paginatedResponse(items, total, page, limit);
}

export async function listClaims(
  query: Record<string, unknown>,
  requesterUserId?: string,
  requesterRole?: string,
) {
  const { page, limit, skip } = parsePagination(query);
  const employeeId = query.employeeId ? String(query.employeeId) : undefined;
  const status = query.status as ApprovalStatus | undefined;

  let managerEmployeeId: string | undefined;
  if (requesterRole === 'DEPARTMENT_HEAD' && requesterUserId) {
    managerEmployeeId = await getManagerEmployeeId(requesterUserId);
  }

  const where = {
    ...(employeeId && { employeeId }),
    ...(status && { status }),
    ...(managerEmployeeId && { employee: { managerId: managerEmployeeId } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.outstationClaim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fromDate: 'desc' },
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true },
        },
      },
    }),
    prisma.outstationClaim.count({ where }),
  ]);

  return paginatedResponse(items, total, page, limit);
}

export async function approveClaim(
  id: string,
  approvedByUserId: string,
  approvalRemark?: string,
  approvedByRole?: string,
) {
  const item = await prisma.outstationClaim.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true } } },
  });
  if (!item) throw new AppError('Outstation claim not found', 404);
  if (item.status !== ApprovalStatus.PENDING) throw new AppError('This claim has already been reviewed', 409);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (item.employee.managerId !== managerEmpId) {
      throw new AppError('You can only approve claims for your own team members', 403);
    }
  }

  return prisma.outstationClaim.update({
    where: { id },
    data: {
      status: ApprovalStatus.APPROVED,
      approvedBy: approvedByUserId,
      approvalRemark: approvalRemark?.trim() || null,
    },
    include: {
      employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
    },
  });
}

export async function rejectClaim(
  id: string,
  approvedByUserId: string,
  approvalRemark?: string,
  approvedByRole?: string,
) {
  const item = await prisma.outstationClaim.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true } } },
  });
  if (!item) throw new AppError('Outstation claim not found', 404);
  if (item.status !== ApprovalStatus.PENDING) throw new AppError('This claim has already been reviewed', 409);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (item.employee.managerId !== managerEmpId) {
      throw new AppError('You can only reject claims for your own team members', 403);
    }
  }

  return prisma.outstationClaim.update({
    where: { id },
    data: {
      status: ApprovalStatus.REJECTED,
      approvedBy: approvedByUserId,
      approvalRemark: approvalRemark?.trim() || null,
    },
  });
}
