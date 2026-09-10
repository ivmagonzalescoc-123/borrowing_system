const BookModel = require('../models/book.model');

async function getBooks(req, res, next) {
  try {
    const books = await BookModel.findAll();
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

async function getBook(req, res, next) {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (err) {
    next(err);
  }
}

async function createBook(req, res, next) {
  try {
    const { title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies } = req.body;
    if (!title || !author || !totalCopies) {
      return res.status(400).json({ message: 'title, author and totalCopies are required' });
    }
    const book = await BookModel.create({
      title,
      author,
      isbn,
      category,
      publisher,
      publishedDate,
      description,
      coverUrl,
      totalCopies,
    });
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const existing = await BookModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Book not found' });

    const { title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies } = req.body;
    const book = await BookModel.update(req.params.id, {
      title: title ?? existing.title,
      author: author ?? existing.author,
      isbn: isbn ?? existing.isbn,
      category: category ?? existing.category,
      publisher: publisher ?? existing.publisher,
      publishedDate: publishedDate ?? existing.published_date,
      description: description ?? existing.description,
      coverUrl: coverUrl ?? existing.cover_url,
      totalCopies: totalCopies ?? existing.total_copies,
    });
    res.json({ book });
  } catch (err) {
    next(err);
  }
}

async function deleteBook(req, res, next) {
  try {
    const existing = await BookModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Book not found' });
    await BookModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getBooks, getBook, createBook, updateBook, deleteBook };
