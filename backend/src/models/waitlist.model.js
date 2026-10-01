const db = require('../config/db');
const NotificationModel = require('./notification.model');

const WaitlistModel = {
  async add(userId, bookId) {
    await db.query('INSERT IGNORE INTO book_waitlist (user_id, book_id) VALUES (?, ?)', [userId, bookId]);
  },

  async remove(userId, bookId, conn = db) {
    await conn.query('DELETE FROM book_waitlist WHERE user_id = ? AND book_id = ?', [userId, bookId]);
  },

  async countForBook(bookId) {
    const [[row]] = await db.query('SELECT COUNT(*) AS count FROM book_waitlist WHERE book_id = ?', [bookId]);
    return row.count;
  },

  // Called whenever a copy goes back on the shelf: tells everyone waiting
  // and clears the list (first to reserve gets it).
  async notifyAndClear(book, conn = db) {
    const [rows] = await conn.query('SELECT user_id FROM book_waitlist WHERE book_id = ?', [book.id]);
    if (rows.length === 0) return;
    await NotificationModel.createForUsers(
      rows.map((row) => row.user_id),
      { message: `"${book.title}" is available again. Reserve it before someone else does!`, link: `/student/catalog?book=${book.id}` },
      conn
    );
    await conn.query('DELETE FROM book_waitlist WHERE book_id = ?', [book.id]);
  },
};

module.exports = WaitlistModel;
