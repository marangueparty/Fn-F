// server/routes/achievementsRoutes.js
const express = require('express');
const { listAchievements } = require('../controllers/achievementsController');
const router  = express.Router();

// GET /achievements → returns this user’s unlocked achievements
router.get('/', listAchievements);

module.exports = router;