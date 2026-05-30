import { ApprovalStatus, TransportMode } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly } from '../utils/date';
import { sendTravelStatusEmail } from './email.service';

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

export async function submitReimbursement(
  userId: string,
  data: {
    travelDate: string;
    clientName: string;
    reason: string;
    transportMode?: TransportMode;
    ratePerKm: number;
    kilometers: number;
  },
) {
  const employee = await requireEmployee(userId);

  if (data.ratePerKm <= 0) throw new AppError('Rate per km must be greater than 0', 400);
  if (data.kilometers <= 0) throw new AppError('Kilometers must be greater than 0', 400);

  const amount = round2(data.ratePerKm * data.kilometers);

  return prisma.travelReimbursement.create({
    data: {
      employeeId: employee.id,
      travelDate: toDateOnly(data.travelDate),
      clientName: data.clientName.trim(),
      reason: data.reason.trim(),
      transportMode: data.transportMode ?? null,
      ratePerKm: data.ratePerKm,
      kilometers: data.kilometers,
      amount,
    },
  });
}

export async function getMyReimbursements(userId: string, query: Record<string, unknown>) {
  const employee = await requireEmployee(userId);
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as ApprovalStatus | undefined;

  const where = {
    employeeId: employee.id,
    ...(status && { status }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.travelReimbursement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { travelDate: 'desc' },
    }),
    prisma.travelReimbursement.count({ where }),
  ]);

  return paginatedResponse(items, total, page, limit);
}

export async function listReimbursements(
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
    prisma.travelReimbursement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { travelDate: 'desc' },
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true },
        },
      },
    }),
    prisma.travelReimbursement.count({ where }),
  ]);

  return paginatedResponse(items, total, page, limit);
}

export async function approveReimbursement(
  id: string,
  approvedByUserId: string,
  approvalRemark?: string,
  approvedByRole?: string,
) {
  const item = await prisma.travelReimbursement.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true, firstName: true, lastName: true, user: { select: { email: true } } } } },
  });
  if (!item) throw new AppError('Travel reimbursement not found', 404);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (item.employee.managerId !== managerEmpId) {
      throw new AppError('You can only approve claims for your own team members', 403);
    }
  }

  if (item.status !== ApprovalStatus.PENDING) {
    throw new AppError('This reimbursement has already been reviewed', 409);
  }

  const updated = await prisma.travelReimbursement.update({
    where: { id },
    data: { status: ApprovalStatus.APPROVED, approvedBy: approvedByUserId, approvalRemark: approvalRemark?.trim() || null },
    include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
  });

  sendTravelStatusEmail(
    item.employee.user.email,
    `${item.employee.firstName} ${item.employee.lastName}`,
    'APPROVED',
    item.travelDate.toISOString().slice(0, 10),
    item.amount,
    approvalRemark,
  );

  return updated;
}

export async function rejectReimbursement(
  id: string,
  approvedByUserId: string,
  approvalRemark?: string,
  approvedByRole?: string,
) {
  const item = await prisma.travelReimbursement.findUnique({
    where: { id },
    include: { employee: { select: { managerId: true, firstName: true, lastName: true, user: { select: { email: true } } } } },
  });
  if (!item) throw new AppError('Travel reimbursement not found', 404);

  if (approvedByRole === 'DEPARTMENT_HEAD') {
    const managerEmpId = await getManagerEmployeeId(approvedByUserId);
    if (item.employee.managerId !== managerEmpId) {
      throw new AppError('You can only reject claims for your own team members', 403);
    }
  }

  if (item.status !== ApprovalStatus.PENDING) {
    throw new AppError('This reimbursement has already been reviewed', 409);
  }

  const updated = await prisma.travelReimbursement.update({
    where: { id },
    data: { status: ApprovalStatus.REJECTED, approvedBy: approvedByUserId, approvalRemark: approvalRemark?.trim() || null },
  });

  sendTravelStatusEmail(
    item.employee.user.email,
    `${item.employee.firstName} ${item.employee.lastName}`,
    'REJECTED',
    item.travelDate.toISOString().slice(0, 10),
    item.amount,
    approvalRemark,
  );

  return updated;
}
