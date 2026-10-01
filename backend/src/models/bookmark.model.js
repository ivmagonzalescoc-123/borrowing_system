const db = require('../config/db');

const BookmarkModel = {
  async findBookIdsByUser(userId) {
    const [rows] = await db.query('SELECT book_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map((row) => row.book_id);
  },

  async add(userId, bookId) {
    await db.query('INSERT IGNORE INTO bookmarks (user_id, book_id) VALUES (?, ?)', [userId, bookId]);
  },

  async remove(userId, bookId) {
    await db.query('DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?', [userId, bookId]);
  },
};

module.exports = BookmarkModel;
