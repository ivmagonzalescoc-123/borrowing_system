const express = require('express');
const { body } = require('express-validator');
const { register, createStaff, login, me, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// A password strength rule shared by register and reset-password: at least
// 8 characters with a mix of letters and numbers, so accounts can't be
// created with something like "1234567" or "password".
const strongPassword = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain at least one letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

const accountFields = [
  body('idNumber').isString().trim().isLength({ min: 1, max: 50 }).withMessage('ID number is required'),
  body('fullName').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Full name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPassword,
];

// Self sign-up is student-only; the role is set server-side.
router.post('/register', authLimiter, accountFields, validate, register);
// Existing staff create other staff accounts.
router.post('/staff', requireAuth, requireRole('staff'), accountFields, validate, createStaff);
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);
router.get('/me', requireAuth, me);
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('A valid email is required').normalizeEmail()],
  validate,
  forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('otp').isString().trim().notEmpty().withMessage('OTP is required'),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain at least one letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  validate,
  resetPassword
);

module.exports = router;
