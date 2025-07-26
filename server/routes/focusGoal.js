const express = require('express');
const focusController = require('../controllers/focusController');
const router = express.Router();

// GET /focus-goal → get current user's focus goal
router.get('/', focusController.getFocusGoal);

// POST /focus-goal → update user's focus goal
router.post('/', focusController.updateFocusGoal);

module.exports = router;
