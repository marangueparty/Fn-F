const express = require('express');
const { login, signup } = require('../controllers/authController');
const router = express.Router();

// POST /auth/login
router.post('/login', login);

// POST /auth/signup
router.post('/signup', signup);

module.exports = router;