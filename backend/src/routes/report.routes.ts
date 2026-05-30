import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { summary, attendanceSummary, payrollSummary } from '../controllers/report.controller';

const router = Router();

const auth  = [authenticate as any, requireRole('HR_ADMIN') as any];

router.get('/summary',            ...auth, summary            as any);
router.get('/attendance-summary', ...auth, attendanceSummary  as any);
router.get('/payroll-summary',    ...auth, payrollSummary     as any);

export default router;
