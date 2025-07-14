const express = require('express');
const { login, signup, checkUsername, lookupEmail, updateUsername, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

// POST /auth/login
router.post('/login', login);

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/check-username
router.post('/check-username', checkUsername);
// POST /auth/lookup-email
router.post('/lookup-email', lookupEmail);
// POST /auth/update-username (protected)
router.post('/update-username', authenticate, updateUsername);

// GET /profile (protected)
router.get('/profile', authenticate, getProfile);

module.exports = router;