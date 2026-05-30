import { Router } from 'express';
import { login, signup, me, changePassword } from '../controllers/auth.controller';
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

export default router;
