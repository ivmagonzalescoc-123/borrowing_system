const db = require('../config/db');
const BorrowModel = require('../models/borrow.model');
const BookModel = require('../models/book.model');
const NotificationModel = require('../models/notification.model');
const WaitlistModel = require('../models/waitlist.model');
const { today, addDays, formatHuman } = require('../utils/dates');

// Time-based housekeeping for the borrowing lifecycle:
//   1. reservations not picked up by their pickup deadline expire and the
//      copy goes back on the shelf (waitlisted students are told);
//   2. students get one reminder when a loan is due today/tomorrow;
//   3. students and staff get one notice when a loan becomes overdue.
// Runs on an interval and also lazily before borrow lists are read, so the
// data is correct even when a free-tier host slept through the interval.
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;

let lastRun = 0;
let running = null;

async function expireReservations(todayDate) {
  const ids = await BorrowModel.findExpiredReservationIds(todayDate);
  for (const id of ids) {
    await db.withTransaction(async (conn) => {
      const record = await BorrowModel.lockById(id, conn);
      if (!record || record.status !== 'reserved') return; // handled meanwhile
      const closed = await BorrowModel.close(id, { status: 'expired', reason: 'Not picked up by the pickup deadline' }, conn);
      await BookModel.releaseCopy(record.book_id, conn);
      await NotificationModel.create(
        {
          userId: record.student_id,
          message: `Your reservation for "${record.book_title}" expired because it wasn't picked up by ${formatHuman(record.pickup_deadline)}.`,
          link: '/student/reservations',
        },
        conn
      );
      const book = await BookModel.findById(closed.book_id, conn);
      await WaitlistModel.notifyAndClear(book, conn);
    });
  }
}

async function remindDueSoon(todayDate) {
  const records = await BorrowModel.findDueSoonUnnotified(todayDate, addDays(todayDate, 1));
  for (const record of records) {
    const when = record.due_date.slice(0, 10) === todayDate ? 'today' : 'tomorrow';
    await NotificationModel.create({
      userId: record.student_id,
      message: `Reminder: "${record.book_title}" is due ${when} (${formatHuman(record.due_date)}). Please return it to the library desk.`,
      link: '/student/borrowed',
    });
    await BorrowModel.setFlag(record.id, 'due_soon_notified');
  }
}

async function noticeOverdue(todayDate) {
  const records = await BorrowModel.findOverdueUnnotified(todayDate);
  for (const record of records) {
    await NotificationModel.create({
      userId: record.student_id,
      message: `"${record.book_title}" is overdue (was due ${formatHuman(record.due_date)}). Please return it as soon as possible — you can't reserve other books until you do.`,
      link: '/student/borrowed',
    });
    await NotificationModel.notifyAllStaff({
      message: `Overdue: "${record.book_title}" borrowed by ${record.student_name} (${record.student_id_number}) was due ${formatHuman(record.due_date)}.`,
      link: '/staff/borrowed?tab=overdue',
    });
    await BorrowModel.setFlag(record.id, 'overdue_notified');
  }
}

async function runSweep() {
  const todayDate = today();
  await expireReservations(todayDate);
  await remindDueSoon(todayDate);
  await noticeOverdue(todayDate);
}

// Never runs two sweeps at once and skips if one finished under a minute ago.
async function sweepIfDue() {
  if (running) return running;
  if (Date.now() - lastRun < MIN_GAP_MS) return undefined;
  running = runSweep()
    .catch((err) => console.error('Borrow sweep failed:', err))
    .finally(() => {
      lastRun = Date.now();
      running = null;
    });
  return running;
}

function startSweepSchedule() {
  sweepIfDue();
  setInterval(sweepIfDue, SWEEP_INTERVAL_MS).unref();
}

module.exports = { sweepIfDue, startSweepSchedule };
