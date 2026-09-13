const express = require('express');
const {
  reserveBook,
  handoverBook,
  returnBook,
  myBorrows,
  allBorrows,
} = require('../controllers/borrow.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { idempotent } = require('../middleware/idempotency.middleware');

const router = express.Router();

router.post('/', requireAuth, requireRole('student'), idempotent, reserveBook);
router.patch('/:id/handover', requireAuth, requireRole('staff'), idempotent, handoverBook);
router.patch('/:id/return', requireAuth, requireRole('staff'), idempotent, returnBook);
router.get('/mine', requireAuth, requireRole('student'), myBorrows);
router.get('/', requireAuth, requireRole('staff'), allBorrows);

module.exports = router;
