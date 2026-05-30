import cron from 'node-cron';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { generatePayroll } from './payroll.service';

const AUTO_PAYROLL_CRON = '5 0 2 * *';
const AUTO_PAYROLL_TIMEZONE = 'Asia/Kolkata';
const AUTO_PAYROLL_DAY_OF_MONTH = 2;

function getPreviousMonthPeriod(referenceDate = new Date()) {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();

  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
}

async function getAutomationGeneratorUserId(): Promise<string | null> {
  const generator = await prisma.user.findFirst({
    where: { role: Role.HR_ADMIN },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return generator?.id ?? null;
}

export async function runAutoPayrollForPeriod(month: number, year: number) {
  const generatedByUserId = await getAutomationGeneratorUserId();

  if (!generatedByUserId) {
    console.warn('[Payroll Automation] Skipped: no HR admin account found.');
    return { month, year, totalEmployees: 0, generated: 0, skipped: 0, failed: 0, results: [] };
  }
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, employeeCode: true, firstName: true, lastName: true },
    orderBy: { firstName: 'asc' },
  });

  const results: Array<{
    employeeId: string;
    employeeCode: string;
    name: string;
    status: 'generated' | 'skipped' | 'failed';
    message?: string;
  }> = [];

  for (const employee of employees) {
    try {
      await generatePayroll(employee.id, month, year, generatedByUserId);
      results.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        status: 'generated',
      });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        results.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`,
          status: 'skipped',
          message: error.message,
        });
        continue;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      console.error(
        `[Payroll Automation] Failed for ${employee.employeeCode} (${employee.firstName} ${employee.lastName}) for ${month}/${year}:`,
        error,
      );
      results.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        status: 'failed',
        message,
      });
    }
  }

  return {
    month,
    year,
    totalEmployees: employees.length,
    generated: results.filter((r) => r.status === 'generated').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

export async function runAutoPayrollForLastCompletedMonth(referenceDate = new Date()) {
  const { month, year } = getPreviousMonthPeriod(referenceDate);
  return runAutoPayrollForPeriod(month, year);
}

export function startPayrollAutomation() {
  const run = () => {
    void runAutoPayrollForLastCompletedMonth().catch((error) => {
      console.error('[Payroll Automation] Monthly run failed:', error);
    });
  };

  if (new Date().getDate() === AUTO_PAYROLL_DAY_OF_MONTH) {
    run();
  }

  cron.schedule(
    AUTO_PAYROLL_CRON,
    run,
    {
      timezone: AUTO_PAYROLL_TIMEZONE,
    },
  );

  console.log(
    `[Payroll Automation] Scheduled monthly payroll generation on day ${AUTO_PAYROLL_DAY_OF_MONTH} at 00:05 (${AUTO_PAYROLL_TIMEZONE})`,
  );
}