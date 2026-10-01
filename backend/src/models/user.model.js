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

  // Students with their current borrowing load, for the staff Students page.
  async findStudentsWithCounts(todayDate) {
    const [rows] = await db.query(
      `SELECT u.id, u.id_number, u.full_name, u.email, u.course, u.created_at,
              SUM(br.status = 'reserved') AS reserved_count,
              SUM(br.status = 'borrowed') AS borrowed_count,
              SUM(br.status = 'borrowed' AND br.due_date < ?) AS overdue_count,
              COUNT(br.id) AS total_records
       FROM users u
       LEFT JOIN borrow_records br ON br.student_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.full_name`,
      [todayDate]
    );
    return rows.map((row) => ({
      ...row,
      reserved_count: Number(row.reserved_count) || 0,
      borrowed_count: Number(row.borrowed_count) || 0,
      overdue_count: Number(row.overdue_count) || 0,
    }));
  },

  async findAllStaff() {
    const [rows] = await db.query(
      "SELECT id, id_number, full_name, email, created_at FROM users WHERE role = 'staff' ORDER BY full_name"
    );
    return rows;
  },
};

module.exports = UserModel;
