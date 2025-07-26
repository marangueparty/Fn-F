const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const settingsController = require('../controllers/settingsController');

// Apply auth middleware to all routes
router.use(authenticate);

// GET /settings/goals - get user's study goals
router.get('/goals', settingsController.getGoals);

// POST /settings/goals - update user's study goals
router.post('/goals', settingsController.updateGoals);

module.exports = router; 