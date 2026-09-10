const db = require('../config/db');

const NotificationModel = {
  async create({ userId, message }) {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  async findByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows;
  },

  async markAllRead(userId) {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  },
};

module.exports = NotificationModel;
