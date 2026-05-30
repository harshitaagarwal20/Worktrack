/**
 * All dates stored in MySQL @db.Date are serialized/deserialized by Prisma
 * as UTC midnight (e.g. 2025-06-01T00:00:00.000Z). We therefore build every
 * date value we send to Prisma using UTC so comparisons are consistent,
 * regardless of the server's local timezone.
 */

/** Convert a YYYY-MM-DD string or any Date to UTC-midnight Date. */
export function toDateOnly(value: string | Date): Date {
  if (typeof value === 'string') {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/** Today's date at UTC midnight. */
export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Inclusive UTC-midnight range for a calendar month (1-indexed month). */
export function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // day 0 of next month = last day of this month
  return { start, end };
}

/** Count calendar days between two UTC-midnight dates (inclusive). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

/**
 * Count working days in a month according to the configured mode.
 *   exclude_sundays — all days except Sundays (standard 6-day work week)
 *   fixed_26        — always 26 days regardless of month length
 *
 * Pass includeSundays=true for employees whose schedule includes Sundays.
 * When includeSundays is true the fixed_26 mode is ignored and all calendar
 * days in the month are counted.
 */
export function workingDaysInMonth(month: number, year: number, includeSundays = false): number {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (includeSundays) return daysInMonth;

  const mode = process.env.PAYROLL_WORKING_DAYS_MODE ?? 'exclude_sundays';
  if (mode === 'fixed_26') return 26;

  // Count every day in the month that is not a Sunday (getUTCDay() === 0)
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(Date.UTC(year, month - 1, d)).getUTCDay() !== 0) count++;
  }
  return count;
}
