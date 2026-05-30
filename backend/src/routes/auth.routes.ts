import { Router } from 'express';
import { login, signup, me, changePassword, forgotPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup
router.post('/signup', signup);

// GET /api/auth/me
router.get('/me', authenticate, me as any);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, changePassword as any);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

export default router;
