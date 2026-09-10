const db = require('../config/db');
const { generateReferenceNo } = require('../utils/referenceNumber');

const RECORD_SELECT = `
  SELECT br.*, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
         u.full_name AS student_name, u.id_number AS student_id_number
  FROM borrow_records br
  JOIN books b ON b.id = br.book_id
  JOIN users u ON u.id = br.student_id
`;

const BorrowModel = {
  async create({ bookId, studentId, purpose, requestStartDate, requestEndDate, requestTime }) {
    const referenceNo = generateReferenceNo();
    const [result] = await db.query(
      `INSERT INTO borrow_records
         (reference_no, book_id, student_id, purpose, request_start_date, request_end_date, request_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'reserved')`,
      [
        referenceNo,
        bookId,
        studentId,
        purpose || null,
        requestStartDate || null,
        requestEndDate || null,
        requestTime || null,
      ]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await db.query(`${RECORD_SELECT} WHERE br.id = ?`, [id]);
    return rows[0] || null;
  },

  async findActiveByStudentAndBook(studentId, bookId) {
    const [rows] = await db.query(
      `SELECT * FROM borrow_records
       WHERE student_id = ? AND book_id = ? AND status IN ('reserved', 'borrowed')`,
      [studentId, bookId]
    );
    return rows[0] || null;
  },

  async findByStudent(studentId) {
    const [rows] = await db.query(
      `${RECORD_SELECT} WHERE br.student_id = ? ORDER BY br.reserved_at DESC`,
      [studentId]
    );
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(`${RECORD_SELECT} ORDER BY br.reserved_at DESC`);
    return rows;
  },

  async markBorrowed(id, { staffId, dueDate }) {
    await db.query(
      `UPDATE borrow_records
       SET status = 'borrowed', staff_id = ?, borrowed_at = NOW(), due_date = ?
       WHERE id = ?`,
      [staffId, dueDate, id]
    );
    return this.findById(id);
  },

  async markReturned(id) {
    await db.query(
      `UPDATE borrow_records SET status = 'returned', returned_at = NOW() WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  },
};

module.exports = BorrowModel;
