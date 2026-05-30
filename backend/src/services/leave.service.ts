import { ApprovalStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly } from '../utils/date';

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

export async function submitLeave(
  userId: string,
  data: { fromDate: string; toDate: string; reason: string },
) {
  const employee = await requireEmployee(userId);

  const fromDate = toDateOnly(data.fromDate);
  const toDate = toDateOnly(data.toDate);

  if (toDate < fromDate) {
    throw new AppError('toDate must be on or after fromDate', 400);
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      fromDate,
      toDate,
      reason: data.reason,
    },
  });
}

export async function getMyLeaves(userId: string, query: Record<string, unknown>) {
  const employee = await requireEmployee(userId);
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as ApprovalStatus | undefined;

  const where = {
    employeeId: employee.id,
    ...(status && { status }),
  };

  const [leaves, total] = await prisma.$transaction([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return paginatedResponse(leaves, total, page, limit);
}

export async function listLeaves(
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

  const [leaves, total] = await prisma.$transaction([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return paginatedResponse(leaves, total, page, limit);
}

export async function approveLeave(
  id: string,
  approvedByUserId: string,
  approvedByRole?: string,
) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true } } },
  });
  if (!leave) throw new AppError('Leave request not found', 404);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (leave.employee.managerId !== managerEmpId) {
      throw new AppError('You can only approve leaves for your own team members', 403);
    }
  }

  if (leave.status !== ApprovalStatus.PENDING) {
    throw new AppError('Leave request has already been reviewed', 409);
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: { status: ApprovalStatus.APPROVED, approvedBy: approvedByUserId },
  });
}

export async function rejectLeave(
  id: string,
  approvedByUserId: string,
  approvedByRole?: string,
) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true } } },
  });
  if (!leave) throw new AppError('Leave request not found', 404);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (leave.employee.managerId !== managerEmpId) {
      throw new AppError('You can only reject leaves for your own team members', 403);
    }
  }

  if (leave.status !== ApprovalStatus.PENDING) {
    throw new AppError('Leave request has already been reviewed', 409);
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: { status: ApprovalStatus.REJECTED, approvedBy: approvedByUserId },
  });
}
