// server/routes/sessions.js

const express            = require('express');
const sessionsController = require('../controllers/sessionsController');
const router             = express.Router();

// existing:
router.post('/',       sessionsController.addSession);
router.get('/',        sessionsController.listSessions);

// new:
router.post('/complete', sessionsController.completeSession);

module.exports = router;