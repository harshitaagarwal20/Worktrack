import { Response } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(res: Response, error: unknown): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Record already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return res.status(500).json({ success: false, message });
}
