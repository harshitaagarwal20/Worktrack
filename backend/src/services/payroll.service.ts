import { ApprovalStatus, AttendanceStatus, PayrollStatus, PayrollItemType } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { monthRange, workingDaysInMonth, daysBetween } from '../utils/date';

const round2 = (n: number) => Math.round(n * 100) / 100;

const PAYROLL_INCLUDE = {
  items: { orderBy: { type: 'asc' as const } },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      designation: true,
      monthlySalary: true,
    },
  },
} as const;

const PAID_LEAVES_ALLOWED = 1;

export async function generatePayroll(
  employeeId: string,
  month: number,
  year: number,
  generatedByUserId: string,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new AppError('Employee not found', 404);
  if (!employee.isActive) throw new AppError('Cannot generate payroll for inactive employee', 400);

  const duplicate = await prisma.payroll.findUnique({
    where: { employeeId_month_year: { employeeId, month, year } },
  });
  if (duplicate) {
    throw new AppError(`Payroll for ${month}/${year} already exists for this employee`, 409);
  }

  const { start: monthStart, end: monthEnd } = monthRange(month, year);

  if (!employee.monthlySalary || employee.monthlySalary <= 0) {
    throw new AppError('Monthly salary is not configured for this employee', 400);
  }

  const totalWorkingDays = workingDaysInMonth(month, year, employee.worksSundays);

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: monthStart, lte: monthEnd },
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  const holidays = await prisma.holiday.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: ApprovalStatus.APPROVED,
      fromDate: { lte: monthEnd },
      toDate: { gte: monthStart },
    },
  });

  const presentCount = attendances.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.WORK_FROM_HOME,
  ).length;
  const halfCount = attendances.filter((a) => a.status === AttendanceStatus.HALF_DAY).length;
  const absentCount = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;

  const presentDays = presentCount + halfCount * 0.5;
  const halfDays = halfCount;
  const absentDays = absentCount;
  const paidHolidays = holidays.filter((h) => h.isPaid).length;
  const unpaidHolidays = holidays.filter((h) => !h.isPaid).length;

  let approvedLeaves = 0;
  for (const leave of leaveRequests) {
    const effectiveStart = leave.fromDate > monthStart ? leave.fromDate : monthStart;
    const effectiveEnd = leave.toDate < monthEnd ? leave.toDate : monthEnd;
    approvedLeaves += daysBetween(effectiveStart, effectiveEnd);
  }

  const perDaySalary = round2(employee.monthlySalary / totalWorkingDays);
  const absentDeduction = round2(absentDays * perDaySalary);
  const halfDayDeduction = round2(halfDays * 0.5 * perDaySalary);
  const unpaidLeaveDays = Math.max(0, approvedLeaves - PAID_LEAVES_ALLOWED);
  const unpaidLeaveDeduction = round2(unpaidLeaveDays * perDaySalary);
  const totalDeductions = round2(absentDeduction + halfDayDeduction + unpaidLeaveDeduction);

  // Approved travel reimbursements for this month not yet assigned to a payroll
  const travelReimbursements = await prisma.travelReimbursement.findMany({
    where: {
      employeeId,
      status: ApprovalStatus.APPROVED,
      payrollId: null,
      travelDate: { gte: monthStart, lte: monthEnd },
    },
  });

  const travelTotal = round2(travelReimbursements.reduce((sum, t) => sum + t.amount, 0));

  const grossSalary = employee.monthlySalary;
  const manualAdjustment = 0;
  const netSalary = round2(Math.max(0, grossSalary - totalDeductions + manualAdjustment + travelTotal));

  return prisma.$transaction(async (tx) => {
    const payroll = await tx.payroll.create({
      data: {
        employeeId,
        month,
        year,
        totalWorkingDays,
        presentDays,
        absentDays,
        halfDays,
        paidHolidays,
        unpaidHolidays,
        approvedLeaves,
        grossSalary,
        totalDeductions,
        manualAdjustment,
        netSalary,
        status: PayrollStatus.DRAFT,
        generatedBy: generatedByUserId,
      },
    });

    const itemsData: { payrollId: string; label: string; type: PayrollItemType; amount: number }[] = [
      { payrollId: payroll.id, label: 'Base Salary', type: PayrollItemType.EARNING, amount: grossSalary },
    ];

    if (absentDeduction > 0) {
      itemsData.push({
        payrollId: payroll.id,
        label: `Absent Deduction (${absentDays} day${absentDays !== 1 ? 's' : ''})`,
        type: PayrollItemType.DEDUCTION,
        amount: absentDeduction,
      });
    }

    if (halfDayDeduction > 0) {
      itemsData.push({
        payrollId: payroll.id,
        label: `Half Day Deduction (${halfDays} half day${halfDays !== 1 ? 's' : ''})`,
        type: PayrollItemType.DEDUCTION,
        amount: halfDayDeduction,
      });
    }

    if (unpaidLeaveDeduction > 0) {
      itemsData.push({
        payrollId: payroll.id,
        label: `Unpaid Leave Deduction (${unpaidLeaveDays} day${unpaidLeaveDays !== 1 ? 's' : ''})`,
        type: PayrollItemType.DEDUCTION,
        amount: unpaidLeaveDeduction,
      });
    }

    // Add each approved travel reimbursement as a separate earning line item
    for (const t of travelReimbursements) {
      itemsData.push({
        payrollId: payroll.id,
        label: `Travel Reimbursement – ${t.clientName} (${t.kilometers} km × ₹${t.ratePerKm}/km)`,
        type: PayrollItemType.EARNING,
        amount: t.amount,
      });
    }

    await tx.payrollItem.createMany({ data: itemsData });

    // Link reimbursements to this payroll
    if (travelReimbursements.length > 0) {
      await tx.travelReimbursement.updateMany({
        where: { id: { in: travelReimbursements.map((t) => t.id) } },
        data: { payrollId: payroll.id },
      });
    }

    return tx.payroll.findUnique({ where: { id: payroll.id }, include: PAYROLL_INCLUDE });
  });
}

export interface BulkResult {
  generated: number;
  skipped: number;
  failed: number;
  results: Array<{ name: string; status: 'generated' | 'skipped' | 'failed'; error?: string }>;
}

export async function generateBulkPayroll(
  month: number,
  year: number,
  generatedByUserId: string,
): Promise<BulkResult> {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { firstName: 'asc' },
  });

  let generated = 0, skipped = 0, failed = 0;
  const results: BulkResult['results'] = [];

  for (const emp of employees) {
    try {
      await generatePayroll(emp.id, month, year, generatedByUserId);
      generated++;
      results.push({ name: `${emp.firstName} ${emp.lastName}`, status: 'generated' });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 409) {
        skipped++;
        results.push({ name: `${emp.firstName} ${emp.lastName}`, status: 'skipped' });
      } else {
        failed++;
        results.push({
          name: `${emp.firstName} ${emp.lastName}`,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  return { generated, skipped, failed, results };
}

export async function listPayrolls(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const employeeId = query.employeeId ? String(query.employeeId) : undefined;
  const month = query.month ? parseInt(String(query.month), 10) : undefined;
  const year = query.year ? parseInt(String(query.year), 10) : undefined;
  const status = query.status as PayrollStatus | undefined;

  const where = {
    ...(employeeId && { employeeId }),
    ...(month && { month }),
    ...(year && { year }),
    ...(status && { status }),
  };

  const [payrolls, total] = await prisma.$transaction([
    prisma.payroll.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: PAYROLL_INCLUDE,
    }),
    prisma.payroll.count({ where }),
  ]);

  return paginatedResponse(payrolls, total, page, limit);
}

export async function getPayroll(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id }, include: PAYROLL_INCLUDE });
  if (!payroll) throw new AppError('Payroll record not found', 404);
  return payroll;
}

export async function getPayslip(id: string) {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: {
      ...PAYROLL_INCLUDE,
      employee: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });
  if (!payroll) throw new AppError('Payroll record not found', 404);
  return payroll;
}

export async function adjustPayroll(
  id: string,
  manualAdjustment: number,
  adjustmentRemark?: string,
) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError('Payroll record not found', 404);
  if (payroll.status !== PayrollStatus.DRAFT) {
    throw new AppError('Only DRAFT payrolls can be adjusted', 409);
  }

  const netSalary = round2(Math.max(0, payroll.grossSalary - payroll.totalDeductions + manualAdjustment));

  return prisma.$transaction(async (tx) => {
    await tx.payrollItem.deleteMany({ where: { payrollId: id, label: 'Manual Adjustment' } });

    if (manualAdjustment !== 0) {
      await tx.payrollItem.create({
        data: {
          payrollId: id,
          label: 'Manual Adjustment',
          type: manualAdjustment > 0 ? PayrollItemType.EARNING : PayrollItemType.DEDUCTION,
          amount: round2(Math.abs(manualAdjustment)),
        },
      });
    }

    return tx.payroll.update({
      where: { id },
      data: { manualAdjustment, adjustmentRemark, netSalary },
      include: PAYROLL_INCLUDE,
    });
  });
}

export async function finalizePayroll(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError('Payroll record not found', 404);
  if (payroll.status !== PayrollStatus.DRAFT) {
    throw new AppError('Only DRAFT payrolls can be finalized', 409);
  }

  return prisma.payroll.update({
    where: { id },
    data: { status: PayrollStatus.FINALIZED },
    include: PAYROLL_INCLUDE,
  });
}

export async function markPaid(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError('Payroll record not found', 404);
  if (payroll.status !== PayrollStatus.FINALIZED) {
    throw new AppError('Only FINALIZED payrolls can be marked as PAID', 409);
  }

  return prisma.payroll.update({
    where: { id },
    data: { status: PayrollStatus.PAID },
    include: PAYROLL_INCLUDE,
  });
}

export async function getMyPayrolls(userId: string, query: Record<string, unknown>) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError('Employee profile not found', 404);

  const { page, limit, skip } = parsePagination(query);
  const year = query.year ? parseInt(String(query.year), 10) : undefined;

  const where = { employeeId: employee.id, ...(year && { year }) };

  const [payrolls, total] = await prisma.$transaction([
    prisma.payroll.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: PAYROLL_INCLUDE,
    }),
    prisma.payroll.count({ where }),
  ]);

  return paginatedResponse(payrolls, total, page, limit);
}

export async function getMyPayslip(userId: string, payrollId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError('Employee profile not found', 404);

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      ...PAYROLL_INCLUDE,
      employee: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });
  if (!payroll) throw new AppError('Payroll record not found', 404);

  if (payroll.employeeId !== employee.id) {
    throw new AppError('Access denied', 403);
  }

  return payroll;
}

export interface PayrollExportRow {
  'Employee Code': string;
  Name: string;
  Designation: string;
  Month: number;
  Year: number;
  'Working Days': number;
  'Present Days': number;
  'Absent Days': number;
  'Paid Holidays': number;
  'Unpaid Holidays': number;
  'Approved Leaves': number;
  'Gross Salary': number;
  'Total Deductions': number;
  'Manual Adjustment': number;
  'Net Salary': number;
  Status: string;
}

export async function getPayrollExportData(month: number, year: number): Promise<PayrollExportRow[]> {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    orderBy: { employee: { firstName: 'asc' } },
    include: {
      employee: {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          designation: true,
        },
      },
    },
  });

  return payrolls.map((p) => ({
    'Employee Code': p.employee.employeeCode,
    Name: `${p.employee.firstName} ${p.employee.lastName}`,
    Designation: p.employee.designation,
    Month: p.month,
    Year: p.year,
    'Working Days': p.totalWorkingDays,
    'Present Days': p.presentDays,
    'Absent Days': p.absentDays,
    'Paid Holidays': p.paidHolidays,
    'Unpaid Holidays': p.unpaidHolidays,
    'Approved Leaves': p.approvedLeaves,
    'Gross Salary': p.grossSalary,
    'Total Deductions': p.totalDeductions,
    'Manual Adjustment': p.manualAdjustment,
    'Net Salary': p.netSalary,
    Status: p.status,
  }));
}
