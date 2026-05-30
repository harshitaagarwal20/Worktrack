import { AttendanceStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { todayDateOnly, monthRange, workingDaysInMonth } from '../utils/date';

export async function getAttendanceSummary(month: number, year: number, employeeId?: string) {
  const { start, end } = monthRange(month, year);
  const totalWorkingDaysInMonth = workingDaysInMonth(month, year);

  const employees = await prisma.employee.findMany({
    where: { isActive: true, ...(employeeId ? { id: employeeId } : {}) },
    select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
    orderBy: { employeeCode: 'asc' },
  });

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(employeeId ? { employeeId } : {}),
    },
    select: { employeeId: true, status: true },
  });

  const byEmployee = new Map<string, typeof records>();
  for (const r of records) {
    const list = byEmployee.get(r.employeeId) ?? [];
    list.push(r);
    byEmployee.set(r.employeeId, list);
  }

  const summary = employees.map(emp => {
    const empRecords = byEmployee.get(emp.id) ?? [];
    const presentDays = empRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const wfhDays     = empRecords.filter(r => r.status === AttendanceStatus.WORK_FROM_HOME).length;
    const absentDays  = empRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const leaveDays   = empRecords.filter(r => r.status === AttendanceStatus.LEAVE).length;
    const effectiveDays = presentDays + wfhDays;
    const attendanceRate = totalWorkingDaysInMonth > 0
      ? Math.round((effectiveDays / totalWorkingDaysInMonth) * 1000) / 10
      : 0;

    return {
      employee: emp,
      totalWorkingDays: totalWorkingDaysInMonth,
      presentDays,
      wfhDays,
      absentDays,
      leaveDays,
      attendanceRate,
    };
  });

  return { month, year, records: summary };
}

export async function getPayrollSummary(month: number, year: number) {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
      },
    },
    orderBy: { employee: { employeeCode: 'asc' } },
  });

  const payrollRecords = payrolls.map(p => ({
    employee: p.employee,
    grossSalary: p.grossSalary,
    totalDeductions: p.totalDeductions,
    netSalary: p.netSalary,
    status: p.status,
    presentDays: p.presentDays,
    absentDays: p.absentDays,
  }));

  return {
    month,
    year,
    totalEmployees: payrollRecords.length,
    totalGross:       payrolls.reduce((s, p) => s + p.grossSalary, 0),
    totalDeductions:  payrolls.reduce((s, p) => s + p.totalDeductions, 0),
    totalNet:         payrolls.reduce((s, p) => s + p.netSalary, 0),
    records: payrollRecords,
  };
}

export async function getDashboardSummary() {
  const today = todayDateOnly();
  const now = new Date();
  const { start: monthStart, end: monthEnd } = monthRange(now.getUTCMonth() + 1, now.getUTCFullYear());

  const [
    totalEmployees,
    presentToday,
    absentToday,
    pendingLeaves,
    payrollThisMonth,
  ] = await prisma.$transaction([
    // Total active employees
    prisma.employee.count({ where: { isActive: true } }),

    // Present today — status PRESENT or WFH, any approval state
    prisma.attendance.count({
      where: {
        date: { equals: today },
        status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.WORK_FROM_HOME] },
      },
    }),

    // Absent today — status ABSENT, any approval state
    prisma.attendance.count({
      where: { date: { equals: today }, status: AttendanceStatus.ABSENT },
    }),

    // Pending leave requests
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),

    // Total net salary of all payroll records for the current month (all statuses)
    prisma.payroll.aggregate({
      where: { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() },
      _sum: { netSalary: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalEmployees,
    attendance: {
      presentToday,
      absentToday,
      // Employees with no attendance marked today
      notMarkedToday: totalEmployees - presentToday - absentToday,
    },
    pendingApprovals: {
      attendance: 0,
      leaves: pendingLeaves,
    },
    payrollCurrentMonth: {
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
      totalRecords: payrollThisMonth._count.id,
      totalNetSalary: payrollThisMonth._sum.netSalary ?? 0,
    },
  };
}
