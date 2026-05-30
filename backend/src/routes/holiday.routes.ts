import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/holiday.controller';

const router = Router();

// ─── Read: both roles ─────────────────────────────────────────────────────────
router.get('/', authenticate as any, ctrl.list as any);

// ─── Write: HR/Admin only ─────────────────────────────────────────────────────
router.post('/', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.create as any);
router.put('/:id', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.update as any);
router.delete('/:id', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.remove as any);

export default router;
