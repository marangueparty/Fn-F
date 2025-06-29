// server/routes/achievementsRoute.js

const express = require('express');
const achievementsController = require('../controllers/achievementsController');
const router = express.Router();

// GET  /achievements/current  → return this user’s current achievements
router.get('/current', achievementsController.getCurrent);

// POST /achievements/current  → update this user’s current achievement flags
router.post('/current', achievementsController.postCurrent);

module.exports = router;