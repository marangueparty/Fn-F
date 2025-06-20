import { Router } from 'express';
import { addSession } from '../controllers/sessionsController.js';
const router = new Router();

// POST /sessions { studyDuration, breakDuration }
router.post('/', addSession);

export default router;