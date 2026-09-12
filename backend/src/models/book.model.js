const db = require('../config/db');

const BookModel = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM books ORDER BY title');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies }) {
    const [result] = await db.query(
      `INSERT INTO books (title, author, isbn, category, publisher, published_date, description, cover_url, total_copies, available_copies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        author,
        isbn || null,
        category || null,
        publisher || null,
        publishedDate || null,
        description || null,
        coverUrl || null,
        totalCopies,
        totalCopies,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, { title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies, availableCopies }) {
    await db.query(
      `UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, publisher = ?,
              published_date = ?, description = ?, cover_url = ?, total_copies = ?, available_copies = ?
       WHERE id = ?`,
      [
        title,
        author,
        isbn || null,
        category || null,
        publisher || null,
        publishedDate || null,
        description || null,
        coverUrl || null,
        totalCopies,
        availableCopies,
        id,
      ]
    );
    return this.findById(id);
  },

  async remove(id) {
    await db.query('DELETE FROM books WHERE id = ?', [id]);
  },

  async decrementAvailable(id) {
    await db.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0',
      [id]
    );
  },

  async incrementAvailable(id) {
    await db.query(
      'UPDATE books SET available_copies = LEAST(available_copies + 1, total_copies) WHERE id = ?',
      [id]
    );
  },
};

module.exports = BookModel;
