const db = require('../config/db');

const NotificationModel = {
  async create({ userId, message, link = null }, conn = db) {
    const [result] = await conn.query(
      'INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)',
      [userId, message, link]
    );
    const [rows] = await conn.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  // Same message to many users in one statement (e.g. every staff member).
  async createForUsers(userIds, { message, link = null }, conn = db) {
    if (userIds.length === 0) return;
    await conn.query('INSERT INTO notifications (user_id, message, link) VALUES ?', [
      userIds.map((userId) => [userId, message, link]),
    ]);
  },

  async notifyAllStaff({ message, link = null }, conn = db) {
    const [staff] = await conn.query("SELECT id FROM users WHERE role = 'staff'");
    await this.createForUsers(
      staff.map((s) => s.id),
      { message, link },
      conn
    );
  },

  async findByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
      [userId]
    );
    return rows;
  },

  async markAllRead(userId) {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  },
};

module.exports = NotificationModel;
