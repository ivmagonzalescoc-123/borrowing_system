const express = require('express');
const {
  reserveBook,
  handoverBook,
  returnBook,
  myBorrows,
  allBorrows,
} = require('../controllers/borrow.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', requireAuth, requireRole('student'), reserveBook);
router.patch('/:id/handover', requireAuth, requireRole('staff'), handoverBook);
router.patch('/:id/return', requireAuth, requireRole('staff'), returnBook);
router.get('/mine', requireAuth, requireRole('student'), myBorrows);
router.get('/', requireAuth, requireRole('staff'), allBorrows);

module.exports = router;
