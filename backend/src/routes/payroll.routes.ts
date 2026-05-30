import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/payroll.controller';

const router = Router();

// ─── Employee routes ──────────────────────────────────────────────────────────
// These MUST come before /:id to prevent "my" and "export" being treated as IDs

router.get('/my', authenticate as any, requireRole('USER') as any, ctrl.myPayrolls as any);
router.get('/my/:id/payslip', authenticate as any, requireRole('USER') as any, ctrl.myPayslip as any);

// ─── HR/Admin — static segments before parameterised ones ────────────────────

router.get('/export/csv', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.exportCsv as any);
router.post('/generate', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.generate as any);
router.post('/generate-bulk', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.generateBulk as any);
router.get('/', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.list as any);

// ─── HR/Admin — parameterised routes ─────────────────────────────────────────

router.put('/:id/adjust', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.adjust as any);
router.put('/:id/finalize', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.finalize as any);
router.put('/:id/mark-paid', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.markPaid as any);
router.get('/:id/payslip', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.payslip as any);
router.get('/:id', authenticate as any, requireRole('HR_ADMIN') as any, ctrl.getOne as any);

export default router;
