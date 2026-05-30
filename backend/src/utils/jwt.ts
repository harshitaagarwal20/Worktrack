import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function buildPayload(userId: string, email: string, role: Role): JwtPayload {
  return { userId, email, role };
}
