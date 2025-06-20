import { Router } from 'express';
import { login, signup } from '../controllers/authController.js';

const router = new Router();

// POST /auth/signup { email, password }
router.post('/signup', signup);

// POST /auth/login  { email, password }
router.post('/login', login);

export default router;