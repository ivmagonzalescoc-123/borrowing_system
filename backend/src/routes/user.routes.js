const express = require('express');
const UserModel = require('../models/user.model');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { sweepIfDue } = require('../services/borrowSweep');
const { today } = require('../utils/dates');

const router = express.Router();

router.get('/students', requireAuth, requireRole('staff'), async (req, res, next) => {
  try {
    await sweepIfDue();
    res.json({ students: await UserModel.findStudentsWithCounts(today()) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
