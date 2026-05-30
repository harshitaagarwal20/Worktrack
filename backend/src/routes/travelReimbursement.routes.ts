import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/travelReimbursement.controller';

const router = Router();

// ─── Employee routes ──────────────────────────────────────────────────────────
router.post('/', authenticate as any, requireRole('USER') as any, ctrl.submit as any);
router.get('/my', authenticate as any, requireRole('USER') as any, ctrl.myReimbursements as any);

// ─── HR Admin + Department Head routes ───────────────────────────────────────
router.get('/', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.list as any);
router.put('/:id/approve', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.approve as any);
router.put('/:id/reject', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any, ctrl.reject as any);

export default router;
