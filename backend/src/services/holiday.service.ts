import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { toDateOnly } from '../utils/date';

export async function listHolidays(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const year = query.year ? parseInt(String(query.year), 10) : undefined;

  const where = year
    ? {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      }
    : {};

  const [holidays, total] = await prisma.$transaction([
    prisma.holiday.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'asc' },
    }),
    prisma.holiday.count({ where }),
  ]);

  return paginatedResponse(holidays, total, page, limit);
}

export async function createHoliday(data: {
  name: string;
  date: string;
  isPaid?: boolean;
}) {
  return prisma.holiday.create({
    data: {
      name: data.name,
      date: toDateOnly(data.date),
      isPaid: data.isPaid ?? true,
    },
  });
}

export async function updateHoliday(
  id: string,
  data: {
    name?: string;
    date?: string;
    isPaid?: boolean;
  },
) {
  const holiday = await prisma.holiday.findUnique({ where: { id } });
  if (!holiday) throw new AppError('Holiday not found', 404);

  return prisma.holiday.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.date !== undefined && { date: toDateOnly(data.date) }),
      ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
    },
  });
}

export async function deleteHoliday(id: string) {
  const holiday = await prisma.holiday.findUnique({ where: { id } });
  if (!holiday) throw new AppError('Holiday not found', 404);
  return prisma.holiday.delete({ where: { id } });
}
