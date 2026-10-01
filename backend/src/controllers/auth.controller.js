const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const PasswordResetModel = require('../models/passwordReset.model');
const HttpError = require('../utils/httpError');
const { signToken } = require('../utils/jwt');

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// No SMTP is configured for this demo, so in non-production only the OTP is
// handed straight back to the caller instead of being emailed. In production
// that would be a serious auth bypass, so real email delivery must be wired
// up before deploying this behind NODE_ENV=production.
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = 12;
const GENERIC_RESET_MESSAGE = 'If that email is registered, a one-time code has been sent to it.';

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createAccount({ idNumber, fullName, email, password, role, course, department }) {
  if (await UserModel.findByEmail(email)) {
    throw new HttpError(409, 'Email already registered');
  }
  if (await UserModel.findByIdNumber(idNumber)) {
    throw new HttpError(409, 'That ID number is already registered');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  return UserModel.create({ idNumber, fullName, email, passwordHash, role, course, department });
}

// Public sign-up only ever creates student accounts. Staff accounts are
// created by an existing staff member (createStaff below), otherwise anyone
// could register as a librarian and approve their own requests.
async function register(req, res, next) {
  try {
    const { idNumber, fullName, email, password, course } = req.body;
    if (!idNumber || !fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await createAccount({ idNumber, fullName, email, password, role: 'student', course });
    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function createStaff(req, res, next) {
  try {
    const { idNumber, fullName, email, password, department } = req.body;
    const user = await createAccount({ idNumber, fullName, email, password, role: 'staff', department });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// Responds the same way whether or not the email exists, so this endpoint
// can't be used to discover which emails have accounts.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.json({ message: GENERIC_RESET_MESSAGE });
    }

    const otp = generateOtp();
    await PasswordResetModel.save(email, otp, OTP_TTL_MS);

    // Demo mode only: no SMTP configured, so the OTP is returned directly so
    // the frontend can auto-fill it. Never do this in production.
    if (process.env.NODE_ENV === 'production') {
      return res.json({ message: GENERIC_RESET_MESSAGE });
    }
    res.json({ message: GENERIC_RESET_MESSAGE, otp });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const valid = await PasswordResetModel.verify(email, otp, OTP_MAX_ATTEMPTS);
    const user = valid ? await UserModel.findByEmail(email) : null;
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await UserModel.updatePassword(user.id, passwordHash);
    await PasswordResetModel.remove(email);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, createStaff, login, me, forgotPassword, resetPassword };
