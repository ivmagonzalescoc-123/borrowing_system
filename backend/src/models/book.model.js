const db = require('../config/db');

// Live per-book counts so the catalog can show "2 out · 1 reserved" and so
// copy-count edits can be checked against copies that are actually out.
const BOOK_SELECT = `
  SELECT b.*,
         (SELECT COUNT(*) FROM borrow_records br WHERE br.book_id = b.id AND br.status = 'reserved') AS reserved_count,
         (SELECT COUNT(*) FROM borrow_records br WHERE br.book_id = b.id AND br.status = 'borrowed') AS borrowed_count
  FROM books b
`;

const BookModel = {
  // `userId` adds a `waitlisted` flag telling whether that user is waiting
  // for a copy of each book.
  async findAll({ userId } = {}) {
    const [rows] = await db.query(
      `SELECT x.*, EXISTS(SELECT 1 FROM book_waitlist w WHERE w.book_id = x.id AND w.user_id = ?) AS waitlisted
       FROM (${BOOK_SELECT} WHERE b.archived_at IS NULL) x
       ORDER BY x.title`,
      [userId || 0]
    );
    return rows;
  },

  async findById(id, conn = db) {
    const [rows] = await conn.query(`${BOOK_SELECT} WHERE b.id = ?`, [id]);
    return rows[0] || null;
  },

  async findByIsbn(isbn) {
    const [rows] = await db.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
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

  // Books are never deleted (their borrowing history must stay intact):
  // archiving hides them from the catalog, restoring brings them back.
  async findArchived() {
    const [rows] = await db.query(`${BOOK_SELECT} WHERE b.archived_at IS NOT NULL ORDER BY b.archived_at DESC`);
    return rows;
  },

  async archive(id) {
    await db.query('UPDATE books SET archived_at = NOW() WHERE id = ?', [id]);
    await db.query('DELETE FROM book_waitlist WHERE book_id = ?', [id]);
  },

  async restore(id) {
    await db.query('UPDATE books SET archived_at = NULL WHERE id = ?', [id]);
  },

  // Atomic: only succeeds while a copy is on the shelf, so two students
  // racing for the last copy can't both get it. Returns true on success.
  async takeCopy(id, conn = db) {
    const [result] = await conn.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0',
      [id]
    );
    return result.affectedRows === 1;
  },

  async releaseCopy(id, conn = db) {
    await conn.query(
      'UPDATE books SET available_copies = LEAST(available_copies + 1, total_copies) WHERE id = ?',
      [id]
    );
  },
};

module.exports = BookModel;
