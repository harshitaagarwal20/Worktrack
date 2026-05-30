import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/attendance.controller';

const router = Router();

// Employee routes (must come before /:id)
router.post('/checkin', authenticate as any, requireRole('USER') as any, ctrl.checkIn as any);
router.post('/checkout', authenticate as any, requireRole('USER') as any, ctrl.checkOut as any);
router.get('/today', authenticate as any, requireRole('USER') as any, ctrl.today as any);
router.get('/my', authenticate as any, requireRole('USER') as any, ctrl.myAttendance as any);

// HR/Admin routes
router.get('/', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.list as any);
router.put('/:id', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.edit as any);

export default router;
