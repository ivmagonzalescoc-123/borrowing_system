const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { signToken } = require('../utils/jwt');

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// No SMTP is configured for this demo, so OTPs live in memory and — in
// non-production only — are handed straight back to the caller instead of
// being emailed. In production this would be a serious auth bypass (anyone
// who knows an account's email could reset its password without ever
// receiving the OTP), so real email delivery must be wired up before
// deploying this behind NODE_ENV=production.
const otpStore = new Map(); // email -> { otp, expiresAt }
const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = 12;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function register(req, res, next) {
  try {
    const { idNumber, fullName, email, password, role, course, department } = req.body;

    if (!idNumber || !fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!['staff', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Role must be staff or student' });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await UserModel.create({
      idNumber,
      fullName,
      email,
      passwordHash,
      role,
      course,
      department,
    });

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user });
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

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const otp = generateOtp();
    otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });

    // Demo mode only: no SMTP configured, so the OTP is returned directly so
    // the frontend can auto-fill it instead of it being emailed. Never do
    // this in production — see the comment on otpStore above.
    if (process.env.NODE_ENV === 'production') {
      return res.json({ message: 'If that email is registered, an OTP has been sent to it.' });
    }
    res.json({ message: 'OTP generated', otp });
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

    const entry = otpStore.get(email);
    if (!entry || entry.otp !== otp || entry.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await UserModel.updatePassword(user.id, passwordHash);
    otpStore.delete(email);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
