const express = require('express');
const {
  getPolicy,
  reserveBook,
  handoverBook,
  returnBook,
  cancelReservation,
  rejectReservation,
  renewLoan,
  myBorrows,
  allBorrows,
} = require('../controllers/borrow.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { idempotent } = require('../middleware/idempotency.middleware');

const router = express.Router();

router.get('/policy', requireAuth, getPolicy);
router.post('/', requireAuth, requireRole('student'), idempotent, reserveBook);
router.patch('/:id/handover', requireAuth, requireRole('staff'), idempotent, handoverBook);
router.patch('/:id/return', requireAuth, requireRole('staff'), idempotent, returnBook);
router.patch('/:id/reject', requireAuth, requireRole('staff'), idempotent, rejectReservation);
router.patch('/:id/cancel', requireAuth, requireRole('student'), idempotent, cancelReservation);
router.patch('/:id/renew', requireAuth, requireRole('student'), idempotent, renewLoan);
router.get('/mine', requireAuth, requireRole('student'), myBorrows);
router.get('/', requireAuth, requireRole('staff'), allBorrows);

module.exports = router;
