import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/outstationClaim.controller';

const router = Router();

router.post('/',           authenticate as any, requireRole('USER') as any,                       ctrl.submit as any);
router.get('/my',          authenticate as any, requireRole('USER') as any,                       ctrl.myClaims as any);
router.get('/',            authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any,    ctrl.list as any);
router.put('/:id/approve', authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any,    ctrl.approve as any);
router.put('/:id/reject',  authenticate as any, requireRole('HR_ADMIN', 'DEPARTMENT_HEAD') as any,    ctrl.reject as any);

export default router;
