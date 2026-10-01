const db = require('../config/db');
const policy = require('../config/policy');
const BorrowModel = require('../models/borrow.model');
const BookModel = require('../models/book.model');
const NotificationModel = require('../models/notification.model');
const WaitlistModel = require('../models/waitlist.model');
const HttpError = require('../utils/httpError');
const { sweepIfDue } = require('../services/borrowSweep');
const { today, addDays, isValidDateString, daysBetween, formatHuman } = require('../utils/dates');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function validateReservation({ bookId, purpose, requestStartDate, requestEndDate, requestTime, policyAgreed }) {
  if (!Number.isInteger(Number(bookId)) || Number(bookId) < 1) return 'bookId is required';
  if (typeof purpose !== 'string' || !purpose.trim()) return 'Please choose a purpose for borrowing';
  if (purpose.length > 255) return 'Purpose must be 255 characters or fewer';
  if (!isValidDateString(requestStartDate) || !isValidDateString(requestEndDate)) {
    return 'Please pick valid borrow dates';
  }
  const todayDate = today();
  if (requestStartDate < todayDate) return 'The borrow start date cannot be in the past';
  if (requestStartDate > addDays(todayDate, policy.maxAdvanceDays)) {
    return `You can reserve at most ${policy.maxAdvanceDays} days ahead`;
  }
  if (requestEndDate < requestStartDate) return 'The end date must be on or after the start date';
  if (daysBetween(requestStartDate, requestEndDate) > policy.maxLoanDays) {
    return `A loan can be at most ${policy.maxLoanDays} days long`;
  }
  if (requestTime && !TIME_PATTERN.test(requestTime)) return 'Please pick a valid return time';
  if (!policyAgreed) return 'You must agree to the reservation policy';
  return null;
}

// The book's due date at handover: the student's requested end date when
// it's still ahead, otherwise the default loan length from today — always
// capped at the maximum loan length.
function defaultDueDate(record) {
  const todayDate = today();
  const requested = record.request_end_date ? record.request_end_date.slice(0, 10) : null;
  const due = requested && requested > todayDate ? requested : addDays(todayDate, policy.defaultLoanDays);
  const latest = addDays(todayDate, policy.maxLoanDays);
  return due > latest ? latest : due;
}

async function getPolicy(req, res) {
  res.json({ policy, today: today() });
}

async function reserveBook(req, res, next) {
  try {
    const studentId = req.user.id;
    const invalid = validateReservation(req.body);
    if (invalid) return res.status(400).json({ message: invalid });

    const { purpose, requestStartDate, requestEndDate, requestTime } = req.body;
    const bookId = Number(req.body.bookId);

    const record = await db.withTransaction(async (conn) => {
      // Serializes this student's reservations so the active-item limit
      // can't be bypassed with parallel requests.
      await conn.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [studentId]);

      const book = await BookModel.findById(bookId, conn);
      if (!book || book.archived_at) throw new HttpError(404, 'Book not found');

      if (await BorrowModel.hasOverdue(studentId, conn)) {
        throw new HttpError(403, 'You have an overdue book. Please return it before reserving another.');
      }
      if (await BorrowModel.findActiveByStudentAndBook(studentId, bookId, conn)) {
        throw new HttpError(409, 'You already have a reservation or loan for this book');
      }
      if ((await BorrowModel.countActiveByStudent(studentId, conn)) >= policy.maxActiveItems) {
        throw new HttpError(
          409,
          `You can only have ${policy.maxActiveItems} reservations or borrowed books at a time. Return or cancel one first.`
        );
      }
      if (!(await BookModel.takeCopy(bookId, conn))) {
        throw new HttpError(409, 'No copies are available right now. Join the waitlist to be notified.');
      }

      const pickupDeadline = addDays(requestStartDate, policy.reservationHoldDays);
      const created = await BorrowModel.create(
        {
          bookId,
          studentId,
          purpose: purpose.trim(),
          requestStartDate,
          requestEndDate,
          requestTime: requestTime || null,
          pickupDeadline,
        },
        conn
      );
      await WaitlistModel.remove(studentId, bookId, conn);

      await NotificationModel.create(
        {
          userId: studentId,
          message: `You reserved "${book.title}". Pick it up at the library desk by ${formatHuman(pickupDeadline)} using reference no. ${created.reference_no}.`,
          link: '/student/reservations',
        },
        conn
      );
      await NotificationModel.notifyAllStaff(
        {
          message: `${created.student_name} reserved "${book.title}" (pickup by ${formatHuman(pickupDeadline)}).`,
          link: `/staff/reservations?q=${created.reference_no}`,
        },
        conn
      );
      return created;
    });

    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
}

async function handoverBook(req, res, next) {
  try {
    const record = await db.withTransaction(async (conn) => {
      const existing = await BorrowModel.lockById(req.params.id, conn);
      if (!existing) throw new HttpError(404, 'Reservation not found');
      if (existing.status !== 'reserved') throw new HttpError(400, 'Only reserved books can be handed over');

      let dueDate = defaultDueDate(existing);
      if (req.body.dueDate) {
        const todayDate = today();
        if (!isValidDateString(req.body.dueDate)) throw new HttpError(400, 'Please pick a valid due date');
        if (req.body.dueDate <= todayDate || req.body.dueDate > addDays(todayDate, policy.maxLoanDays)) {
          throw new HttpError(400, `The due date must be between tomorrow and ${policy.maxLoanDays} days from today`);
        }
        dueDate = req.body.dueDate;
      }

      const updated = await BorrowModel.markBorrowed(existing.id, { staffId: req.user.id, dueDate }, conn);
      await NotificationModel.create(
        {
          userId: updated.student_id,
          message: `You've picked up "${updated.book_title}". Please return it by ${formatHuman(updated.due_date)}.`,
          link: '/student/borrowed',
        },
        conn
      );
      return updated;
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
}

async function returnBook(req, res, next) {
  try {
    const record = await db.withTransaction(async (conn) => {
      const existing = await BorrowModel.lockById(req.params.id, conn);
      if (!existing) throw new HttpError(404, 'Borrow record not found');
      if (existing.status !== 'borrowed') throw new HttpError(400, 'Only borrowed books can be returned');

      const updated = await BorrowModel.markReturned(existing.id, conn);
      await BookModel.releaseCopy(existing.book_id, conn);
      await NotificationModel.create(
        {
          userId: updated.student_id,
          message: `"${updated.book_title}" has been marked as returned. Thank you!`,
          link: '/student/borrowed?tab=history',
        },
        conn
      );
      await WaitlistModel.notifyAndClear(await BookModel.findById(existing.book_id, conn), conn);
      return updated;
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const record = await db.withTransaction(async (conn) => {
      const existing = await BorrowModel.lockById(req.params.id, conn);
      if (!existing || existing.student_id !== req.user.id) throw new HttpError(404, 'Reservation not found');
      if (existing.status !== 'reserved') throw new HttpError(400, 'Only pending reservations can be cancelled');

      const updated = await BorrowModel.close(existing.id, { status: 'cancelled', reason: 'Cancelled by student' }, conn);
      await BookModel.releaseCopy(existing.book_id, conn);
      await NotificationModel.notifyAllStaff(
        { message: `${existing.student_name} cancelled their reservation for "${existing.book_title}".`, link: '/staff/reservations' },
        conn
      );
      await WaitlistModel.notifyAndClear(await BookModel.findById(existing.book_id, conn), conn);
      return updated;
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
}

async function rejectReservation(req, res, next) {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) return res.status(400).json({ message: 'Please give a reason so the student knows what happened' });
    if (reason.length > 255) return res.status(400).json({ message: 'Reason must be 255 characters or fewer' });

    const record = await db.withTransaction(async (conn) => {
      const existing = await BorrowModel.lockById(req.params.id, conn);
      if (!existing) throw new HttpError(404, 'Reservation not found');
      if (existing.status !== 'reserved') throw new HttpError(400, 'Only pending reservations can be rejected');

      const updated = await BorrowModel.close(existing.id, { status: 'rejected', reason }, conn);
      await BookModel.releaseCopy(existing.book_id, conn);
      await NotificationModel.create(
        {
          userId: existing.student_id,
          message: `Your reservation for "${existing.book_title}" was declined by the library: ${reason}`,
          link: '/student/reservations?tab=history',
        },
        conn
      );
      await WaitlistModel.notifyAndClear(await BookModel.findById(existing.book_id, conn), conn);
      return updated;
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
}

async function renewLoan(req, res, next) {
  try {
    const record = await db.withTransaction(async (conn) => {
      const existing = await BorrowModel.lockById(req.params.id, conn);
      if (!existing || existing.student_id !== req.user.id) throw new HttpError(404, 'Loan not found');
      if (existing.status !== 'borrowed') throw new HttpError(400, 'Only borrowed books can be renewed');
      if (existing.is_overdue) throw new HttpError(400, 'Overdue books cannot be renewed. Please return it to the desk.');
      if (existing.renewal_count >= policy.maxRenewals) {
        throw new HttpError(400, `This loan has already been renewed ${policy.maxRenewals === 1 ? 'once' : `${policy.maxRenewals} times`}`);
      }
      if ((await WaitlistModel.countForBook(existing.book_id)) > 0) {
        throw new HttpError(409, 'Other students are waiting for this book, so it cannot be renewed');
      }

      const newDue = addDays(existing.due_date.slice(0, 10), policy.renewalDays);
      const updated = await BorrowModel.renew(existing.id, newDue, conn);
      await NotificationModel.notifyAllStaff(
        {
          message: `${existing.student_name} renewed "${existing.book_title}" — now due ${formatHuman(newDue)}.`,
          link: `/staff/borrowed?q=${existing.reference_no}`,
        },
        conn
      );
      return updated;
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
}

async function myBorrows(req, res, next) {
  try {
    await sweepIfDue();
    const records = await BorrowModel.findByStudent(req.user.id);
    res.json({ records, policy, today: today() });
  } catch (err) {
    next(err);
  }
}

async function allBorrows(req, res, next) {
  try {
    await sweepIfDue();
    const records = await BorrowModel.findAll();
    res.json({ records, policy, today: today() });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPolicy,
  reserveBook,
  handoverBook,
  returnBook,
  cancelReservation,
  rejectReservation,
  renewLoan,
  myBorrows,
  allBorrows,
};
