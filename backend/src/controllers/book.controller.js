const BookModel = require('../models/book.model');
const BorrowModel = require('../models/borrow.model');
const BookmarkModel = require('../models/bookmark.model');
const WaitlistModel = require('../models/waitlist.model');

const MAX_COPIES = 999;

function parseCopies(value) {
  const copies = Number(value);
  return Number.isInteger(copies) && copies >= 1 && copies <= MAX_COPIES ? copies : null;
}

async function getBooks(req, res, next) {
  try {
    const books = await BookModel.findAll({ userId: req.user.id });
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

async function getBook(req, res, next) {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book || book.archived_at) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (err) {
    next(err);
  }
}

async function ensureIsbnFree(isbn, exceptId) {
  if (!isbn) return null;
  const existing = await BookModel.findByIsbn(isbn);
  if (!existing || existing.id === Number(exceptId)) return null;
  return existing.archived_at
    ? 'This ISBN belongs to an archived book. Use a different ISBN.'
    : `A book with this ISBN already exists ("${existing.title}").`;
}

async function createBook(req, res, next) {
  try {
    const { title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies } = req.body;
    if (!title || !author) return res.status(400).json({ message: 'Title and author are required' });
    const copies = parseCopies(totalCopies);
    if (!copies) return res.status(400).json({ message: `Total copies must be a whole number from 1 to ${MAX_COPIES}` });

    const isbnProblem = await ensureIsbnFree(isbn);
    if (isbnProblem) return res.status(409).json({ message: isbnProblem });

    const book = await BookModel.create({
      title,
      author,
      isbn,
      category,
      publisher,
      publishedDate,
      description,
      coverUrl,
      totalCopies: copies,
    });
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const existing = await BookModel.findById(req.params.id);
    if (!existing || existing.archived_at) return res.status(404).json({ message: 'Book not found' });

    const { title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies } = req.body;
    const nextTotalCopies = totalCopies === undefined ? existing.total_copies : parseCopies(totalCopies);
    if (!nextTotalCopies) {
      return res.status(400).json({ message: `Total copies must be a whole number from 1 to ${MAX_COPIES}` });
    }

    // Copies currently reserved or on loan can't be removed from the count;
    // availability is recomputed from them so it can never drift.
    const copiesOut = Number(existing.reserved_count) + Number(existing.borrowed_count);
    if (nextTotalCopies < copiesOut) {
      return res.status(400).json({
        message: `${copiesOut} ${copiesOut === 1 ? 'copy is' : 'copies are'} currently reserved or on loan, so total copies can't be lower than ${copiesOut}.`,
      });
    }

    const isbnProblem = await ensureIsbnFree(isbn, existing.id);
    if (isbnProblem) return res.status(409).json({ message: isbnProblem });

    const book = await BookModel.update(req.params.id, {
      title: title ?? existing.title,
      author: author ?? existing.author,
      isbn: isbn ?? existing.isbn,
      category: category ?? existing.category,
      publisher: publisher ?? existing.publisher,
      publishedDate: publishedDate ?? existing.published_date,
      description: description ?? existing.description,
      coverUrl: coverUrl ?? existing.cover_url,
      totalCopies: nextTotalCopies,
      availableCopies: nextTotalCopies - copiesOut,
    });
    if (book.available_copies > 0 && existing.available_copies === 0) {
      await WaitlistModel.notifyAndClear(book);
    }
    res.json({ book });
  } catch (err) {
    next(err);
  }
}

async function uploadCover(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file was uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
}

// Books with borrowing history are archived (hidden from the catalog) rather
// than deleted, so past records stay intact. Books with copies out can't be
// removed at all until they're back.
async function deleteBook(req, res, next) {
  try {
    const existing = await BookModel.findById(req.params.id);
    if (!existing || existing.archived_at) return res.status(404).json({ message: 'Book not found' });

    const active = await BorrowModel.countActiveByBook(existing.id);
    if (active > 0) {
      return res.status(409).json({
        message: `"${existing.title}" has ${active} active ${active === 1 ? 'reservation or loan' : 'reservations or loans'}. Resolve ${active === 1 ? 'it' : 'them'} before removing the book.`,
      });
    }

    if ((await BookModel.countRecords(existing.id)) > 0) {
      await BookModel.archive(existing.id);
      return res.json({ archived: true, message: 'Book archived — its borrowing history was kept' });
    }
    await BookModel.remove(existing.id);
    res.json({ archived: false, message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
}

async function joinWaitlist(req, res, next) {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book || book.archived_at) return res.status(404).json({ message: 'Book not found' });
    if (book.available_copies > 0) {
      return res.status(400).json({ message: 'This book has copies available — you can reserve it now' });
    }
    await WaitlistModel.add(req.user.id, book.id);
    res.json({ waitlisted: true });
  } catch (err) {
    next(err);
  }
}

async function leaveWaitlist(req, res, next) {
  try {
    await WaitlistModel.remove(req.user.id, req.params.id);
    res.json({ waitlisted: false });
  } catch (err) {
    next(err);
  }
}

async function getMyBookmarks(req, res, next) {
  try {
    res.json({ bookIds: await BookmarkModel.findBookIdsByUser(req.user.id) });
  } catch (err) {
    next(err);
  }
}

async function addBookmark(req, res, next) {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book || book.archived_at) return res.status(404).json({ message: 'Book not found' });
    await BookmarkModel.add(req.user.id, book.id);
    res.json({ bookmarked: true });
  } catch (err) {
    next(err);
  }
}

async function removeBookmark(req, res, next) {
  try {
    await BookmarkModel.remove(req.user.id, req.params.id);
    res.json({ bookmarked: false });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  uploadCover,
  joinWaitlist,
  leaveWaitlist,
  getMyBookmarks,
  addBookmark,
  removeBookmark,
};
