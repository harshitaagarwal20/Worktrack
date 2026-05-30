import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly, todayDateOnly, monthRange } from '../utils/date';

const ENTRY_INCLUDE = { entries: { select: { id: true, clientName: true, tasksCompleted: true } } };

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

async function requireAttendanceHours(employeeId: string, date: Date) {
  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date } },
    select: { workHours: true, checkOut: true },
  });

  if (!attendance) {
    throw new AppError('Attendance record not found for the selected date', 404);
  }

  if (attendance.checkOut == null || attendance.workHours == null) {
    throw new AppError('Check out attendance before submitting a work report', 400);
  }

  return attendance.workHours;
}

export async function submitReport(
  userId: string,
  data: {
    date?: string;
    remarks?: string;
    entries: Array<{ clientName?: string; tasks: string[] }>;
  },
) {
  const employee = await requireEmployee(userId);
  const date = data.date ? toDateOnly(data.date) : todayDateOnly();
  const workingHours = await requireAttendanceHours(employee.id, date);

  const existing = await prisma.workReport.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });
  if (existing) throw new AppError('Work report already submitted for this date', 409);

  return prisma.workReport.create({
    data: {
      employeeId: employee.id,
      date,
      workingHours,
      remarks: data.remarks,
      entries: {
        create: data.entries.map(e => ({
          clientName: e.clientName?.trim() || null,
          tasksCompleted: e.tasks.filter(Boolean).join('\n'),
        })),
      },
    },
    include: ENTRY_INCLUDE,
  });
}

export async function getMyReports(userId: string, query: Record<string, unknown>) {
  const employee = await requireEmployee(userId);
  const { page, limit, skip } = parsePagination(query);

  const month = query.month ? parseInt(String(query.month), 10) : undefined;
  const year = query.year ? parseInt(String(query.year), 10) : undefined;
  const dateFilter =
    month && year
      ? { gte: monthRange(month, year).start, lte: monthRange(month, year).end }
      : undefined;

  const where = {
    employeeId: employee.id,
    ...(dateFilter && { date: dateFilter }),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.workReport.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: ENTRY_INCLUDE }),
    prisma.workReport.count({ where }),
  ]);

  return paginatedResponse(reports, total, page, limit);
}

export async function listReports(
  query: Record<string, unknown>,
  requesterUserId?: string,
  requesterRole?: string,
) {
  const { page, limit, skip } = parsePagination(query);

  const employeeId = query.employeeId ? String(query.employeeId) : undefined;
  const month = query.month ? parseInt(String(query.month), 10) : undefined;
  const year = query.year ? parseInt(String(query.year), 10) : undefined;
  const date = query.date ? toDateOnly(String(query.date)) : undefined;

  const dateFilter = date
    ? { equals: date }
    : month && year
      ? { gte: monthRange(month, year).start, lte: monthRange(month, year).end }
      : undefined;

  let managerEmployeeId: string | undefined;
  if (requesterRole === 'DEPARTMENT_HEAD' && requesterUserId) {
    managerEmployeeId = await getManagerEmployeeId(requesterUserId);
  }

  const where = {
    ...(employeeId && { employeeId }),
    ...(dateFilter && { date: dateFilter }),
    ...(managerEmployeeId && { employee: { managerId: managerEmployeeId } }),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.workReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        ...ENTRY_INCLUDE,
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      },
    }),
    prisma.workReport.count({ where }),
  ]);

  return paginatedResponse(reports, total, page, limit);
}
