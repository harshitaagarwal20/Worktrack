import { AttendanceStatus, ApprovalStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly, todayDateOnly, monthRange } from '../utils/date';

// Auto status rules:
// workHours < 4  → ABSENT
// workHours >= 4 && workHours < 8 → HALF_DAY
// workHours >= 8 → PRESENT
// Status is calculated server-side on checkout; frontend calculation is display-only.
// Attendance is auto-approved once checkout is completed.
// Employee cannot modify attendance after check-in or check-out.
// One attendance record per employee per day — enforced by unique constraint in DB.

async function requireEmployee(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError('Employee profile not found', 404);
  if (!employee.isActive) throw new AppError('Employee account is inactive', 403);
  return employee;
}

function computeStatus(workHours: number): AttendanceStatus {
  if (workHours < 4) return AttendanceStatus.ABSENT;
  if (workHours < 8) return AttendanceStatus.HALF_DAY;
  return AttendanceStatus.PRESENT;
}


export async function checkIn(
  userId: string,
  data: {
    date: string;
    checkInTime: string;
  },
) {
  const employee = await requireEmployee(userId);
  const date = toDateOnly(data.date);
  const today = todayDateOnly();

  if (date.getTime() !== today.getTime()) {
    throw new AppError('Attendance can only be marked for today', 400);
  }

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });
  if (existing) throw new AppError('Attendance already marked for today', 409);

  return prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date,
      checkIn: new Date(data.checkInTime),
      approvalStatus: ApprovalStatus.PENDING,
    },
  });
}

// ─── Employee: Check Out ──────────────────────────────────────────────────────

export async function checkOut(
  userId: string,
  data: {
    attendanceId: string;
    checkOutTime: string;
    workHours: number;
  },
) {
  const employee = await requireEmployee(userId);

  const record = await prisma.attendance.findUnique({ where: { id: data.attendanceId } });
  if (!record) throw new AppError('Attendance record not found', 404);
  if (record.employeeId !== employee.id) throw new AppError('Unauthorized', 403);
  if (record.checkOut) throw new AppError('Already checked out for today', 409);

  const status = computeStatus(data.workHours);

  return prisma.attendance.update({
    where: { id: data.attendanceId },
    data: {
      checkOut: new Date(data.checkOutTime),
      workHours: data.workHours,
      status,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
}

// ─── Employee: Get Today ──────────────────────────────────────────────────────

export async function getTodayAttendance(userId: string) {
  const employee = await requireEmployee(userId);
  const today = todayDateOnly();

  const record = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });
  return record ?? null;
}

// ─── Employee: My Attendance ──────────────────────────────────────────────────

export async function getMyAttendance(userId: string, query: Record<string, unknown>) {
  const employee = await requireEmployee(userId);
  const { page, limit, skip } = parsePagination(query);

  const date = query.date ? toDateOnly(String(query.date)) : undefined;
  const month = query.month ? parseInt(String(query.month), 10) : undefined;
  const year = query.year ? parseInt(String(query.year), 10) : undefined;

  const dateFilter =
    date
      ? { equals: date }
      : month && year
      ? { gte: monthRange(month, year).start, lte: monthRange(month, year).end }
      : undefined;

  const where = {
    employeeId: employee.id,
    ...(dateFilter && { date: dateFilter }),
  };

  const [records, total] = await prisma.$transaction([
    prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.attendance.count({ where }),
  ]);

  return paginatedResponse(records, total, page, limit);
}

// ─── HR/Admin: List All ───────────────────────────────────────────────────────

export async function listAttendances(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const employeeId = query.employeeId ? String(query.employeeId) : undefined;
  const status = query.status as AttendanceStatus | undefined;
  const approvalStatus = query.approvalStatus as ApprovalStatus | undefined;
  const month = query.month ? parseInt(String(query.month), 10) : undefined;
  const year = query.year ? parseInt(String(query.year), 10) : undefined;
  const date = query.date ? toDateOnly(String(query.date)) : undefined;

  const dateFilter = date
    ? { equals: date }
    : month && year
      ? { gte: monthRange(month, year).start, lte: monthRange(month, year).end }
      : undefined;

  const where = {
    ...(employeeId && { employeeId }),
    ...(status && { status }),
    ...(approvalStatus && { approvalStatus }),
    ...(dateFilter && { date: dateFilter }),
  };

  const [records, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return paginatedResponse(records, total, page, limit);
}

// ─── HR/Admin: Edit ───────────────────────────────────────────────────────────

export async function editAttendance(
  id: string,
  data: {
    status?: AttendanceStatus;
    checkIn?: string | null;
    checkOut?: string | null;
    workHours?: number | null;
    location?: string | null;
    remarks?: string | null;
  },
) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new AppError('Attendance record not found', 404);

  return prisma.attendance.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.checkIn !== undefined && { checkIn: data.checkIn ? new Date(data.checkIn) : null }),
      ...(data.checkOut !== undefined && { checkOut: data.checkOut ? new Date(data.checkOut) : null }),
      ...(data.workHours !== undefined && { workHours: data.workHours }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
    },
  });
}
