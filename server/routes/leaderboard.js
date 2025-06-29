// server/routes/leaderboard.js
const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');
const router = express.Router();

router.get('/', getLeaderboard); // GET /leaderboard

module.exports = router;