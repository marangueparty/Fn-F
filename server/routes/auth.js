const express = require('express');
const {
  login,
  signup,
  checkUsername,
  lookupEmail,
  updateUsername,
  getProfile,
  forgotPassword,       // ← newly added
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// public
router.post('/login',           login);
router.post('/signup',          signup);
router.post('/check-username',  checkUsername);
router.post('/lookup-email',    lookupEmail);
router.post('/forgot-password', forgotPassword);     // ← newly added

// protected
router.post('/update-username', authenticate, updateUsername);
router.get( '/profile',         authenticate, getProfile);

module.exports = router;