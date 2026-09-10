const db = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findByIdNumber(idNumber) {
    const [rows] = await db.query('SELECT * FROM users WHERE id_number = ?', [idNumber]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, id_number, full_name, email, role, course, department, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ idNumber, fullName, email, passwordHash, role, course, department }) {
    const [result] = await db.query(
      `INSERT INTO users (id_number, full_name, email, password_hash, role, course, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [idNumber, fullName, email, passwordHash, role, course || null, department || null]
    );
    return this.findById(result.insertId);
  },

  async updatePassword(id, passwordHash) {
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  },

  async findAllStudents() {
    const [rows] = await db.query(
      "SELECT id, id_number, full_name, email, course, created_at FROM users WHERE role = 'student' ORDER BY full_name"
    );
    return rows;
  },
};

module.exports = UserModel;
