const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { signToken } = require('../utils/jwt');

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
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

    const passwordHash = await bcrypt.hash(password, 10);
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

module.exports = { register, login, me };
