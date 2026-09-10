const BorrowModel = require('../models/borrow.model');
const BookModel = require('../models/book.model');
const NotificationModel = require('../models/notification.model');

const DEFAULT_LOAN_DAYS = 7;

async function reserveBook(req, res, next) {
  try {
    const studentId = req.user.id;
    const { bookId, purpose, requestStartDate, requestEndDate, requestTime, policyAgreed } = req.body;

    if (!bookId) return res.status(400).json({ message: 'bookId is required' });
    if (!policyAgreed) {
      return res.status(400).json({ message: 'You must agree to the reservation policy' });
    }

    const book = await BookModel.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.available_copies < 1) {
      return res.status(400).json({ message: 'No available copies for this book' });
    }

    const existing = await BorrowModel.findActiveByStudentAndBook(studentId, bookId);
    if (existing) {
      return res.status(409).json({ message: 'You already have a reservation or loan for this book' });
    }

    const record = await BorrowModel.create({
      bookId,
      studentId,
      purpose,
      requestStartDate,
      requestEndDate,
      requestTime,
    });
    await BookModel.decrementAvailable(bookId);
    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
}

async function handoverBook(req, res, next) {
  try {
    const record = await BorrowModel.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Reservation not found' });
    if (record.status !== 'reserved') {
      return res.status(400).json({ message: 'Only reserved books can be handed over' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_LOAN_DAYS);

    const updated = await BorrowModel.markBorrowed(req.params.id, {
      staffId: req.user.id,
      dueDate: dueDate.toISOString().slice(0, 10),
    });
    await NotificationModel.create({
      userId: updated.student_id,
      message: `Your reservation for "${updated.book_title}" has been handed over. Please return it by ${updated.due_date}.`,
    });
    res.json({ record: updated });
  } catch (err) {
    next(err);
  }
}

async function returnBook(req, res, next) {
  try {
    const record = await BorrowModel.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Borrow record not found' });
    if (record.status !== 'borrowed') {
      return res.status(400).json({ message: 'Only borrowed books can be returned' });
    }

    const updated = await BorrowModel.markReturned(req.params.id);
    await BookModel.incrementAvailable(record.book_id);
    await NotificationModel.create({
      userId: updated.student_id,
      message: `Your borrowed book "${updated.book_title}" has been marked as returned. Thank you!`,
    });
    res.json({ record: updated });
  } catch (err) {
    next(err);
  }
}

async function myBorrows(req, res, next) {
  try {
    const records = await BorrowModel.findByStudent(req.user.id);
    res.json({ records });
  } catch (err) {
    next(err);
  }
}

async function allBorrows(req, res, next) {
  try {
    const records = await BorrowModel.findAll();
    res.json({ records });
  } catch (err) {
    next(err);
  }
}

module.exports = { reserveBook, handoverBook, returnBook, myBorrows, allBorrows };
