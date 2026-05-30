import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/employee.controller';

const router = Router();

// ─── Employee self-service (must be before /:id) ─────────────────────────────
router.get('/me/profile', authenticate as any, ctrl.getMyProfile as any);
router.put('/me/profile', authenticate as any, ctrl.updateMyProfile as any);

// ─── Department Head: view own team ──────────────────────────────────────────
router.get('/my-team', authenticate as any, requireRole('DEPARTMENT_HEAD') as any, ctrl.myTeam as any);

// ─── HR/Admin only ────────────────────────────────────────────────────────────
router.get('/', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.list as any);
router.post('/', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.create as any);
router.get('/:id', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.getOne as any);
router.put('/:id', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.update as any);
router.delete('/:id', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.deactivate as any);

export default router;
