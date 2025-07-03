const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// Get current user
router.get('/me', protect, getMe);

// Forgot password
router.post(
  '/forgotpassword',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  forgotPassword
);

// Reset password
router.put(
  '/resetpassword/:resettoken',
  [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  resetPassword
);

// Verify email
router.get('/verify-email/:verificationtoken', verifyEmail);

// Resend verification email
router.post(
  '/resend-verification',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  resendVerification
);

module.exports = router;
