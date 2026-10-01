const db = require('../config/db');
const { generateReferenceNo } = require('../utils/referenceNumber');
const { today } = require('../utils/dates');

const RECORD_SELECT = `
  SELECT br.*, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url, b.isbn AS book_isbn,
         u.full_name AS student_name, u.id_number AS student_id_number, u.course AS student_course
  FROM borrow_records br
  JOIN books b ON b.id = br.book_id
  JOIN users u ON u.id = br.student_id
`;

// Overdue is derived, never stored: a borrowed record past its due date.
function decorate(record) {
  if (!record) return record;
  const isOverdue = record.status === 'borrowed' && record.due_date && record.due_date.slice(0, 10) < today();
  return { ...record, is_overdue: Boolean(isOverdue) };
}

const BorrowModel = {
  async create(
    { bookId, studentId, purpose, requestStartDate, requestEndDate, requestTime, pickupDeadline },
    conn = db
  ) {
    const referenceNo = generateReferenceNo();
    const [result] = await conn.query(
      `INSERT INTO borrow_records
         (reference_no, book_id, student_id, purpose, request_start_date, request_end_date, request_time,
          pickup_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reserved')`,
      [
        referenceNo,
        bookId,
        studentId,
        purpose || null,
        requestStartDate || null,
        requestEndDate || null,
        requestTime || null,
        pickupDeadline,
      ]
    );
    return this.findById(result.insertId, conn);
  },

  async findById(id, conn = db) {
    const [rows] = await conn.query(`${RECORD_SELECT} WHERE br.id = ?`, [id]);
    return decorate(rows[0] || null);
  },

  // Locks the record row for the rest of the transaction so two staff
  // clicking "Hand Over" / "Mark Returned" at once can't both apply.
  async lockById(id, conn) {
    await conn.query('SELECT id FROM borrow_records WHERE id = ? FOR UPDATE', [id]);
    return this.findById(id, conn);
  },

  async findActiveByStudentAndBook(studentId, bookId, conn = db) {
    const [rows] = await conn.query(
      `SELECT * FROM borrow_records
       WHERE student_id = ? AND book_id = ? AND status IN ('reserved', 'borrowed')`,
      [studentId, bookId]
    );
    return rows[0] || null;
  },

  async countActiveByStudent(studentId, conn = db) {
    const [[row]] = await conn.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE student_id = ? AND status IN ('reserved', 'borrowed')",
      [studentId]
    );
    return row.count;
  },

  async hasOverdue(studentId, conn = db) {
    const [rows] = await conn.query(
      "SELECT 1 FROM borrow_records WHERE student_id = ? AND status = 'borrowed' AND due_date < ? LIMIT 1",
      [studentId, today()]
    );
    return rows.length > 0;
  },

  async countActiveByBook(bookId) {
    const [[row]] = await db.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE book_id = ? AND status IN ('reserved', 'borrowed')",
      [bookId]
    );
    return row.count;
  },

  async findByStudent(studentId) {
    const [rows] = await db.query(
      `${RECORD_SELECT} WHERE br.student_id = ? ORDER BY br.reserved_at DESC, br.id DESC`,
      [studentId]
    );
    return rows.map(decorate);
  },

  async findAll() {
    const [rows] = await db.query(`${RECORD_SELECT} ORDER BY br.reserved_at DESC, br.id DESC`);
    return rows.map(decorate);
  },

  async markBorrowed(id, { staffId, dueDate }, conn = db) {
    await conn.query(
      `UPDATE borrow_records
       SET status = 'borrowed', staff_id = ?, borrowed_at = NOW(), due_date = ?
       WHERE id = ?`,
      [staffId, dueDate, id]
    );
    return this.findById(id, conn);
  },

  async markReturned(id, conn = db) {
    await conn.query(`UPDATE borrow_records SET status = 'returned', returned_at = NOW() WHERE id = ?`, [id]);
    return this.findById(id, conn);
  },

  // Ends a reservation without a loan: cancelled / rejected / expired.
  async close(id, { status, reason = null }, conn = db) {
    await conn.query(
      'UPDATE borrow_records SET status = ?, closed_at = NOW(), close_reason = ? WHERE id = ?',
      [status, reason, id]
    );
    return this.findById(id, conn);
  },

  async renew(id, dueDate, conn = db) {
    await conn.query(
      `UPDATE borrow_records
       SET due_date = ?, renewal_count = renewal_count + 1, due_soon_notified = 0, overdue_notified = 0
       WHERE id = ?`,
      [dueDate, id]
    );
    return this.findById(id, conn);
  },

  // --- Queries used by the scheduled sweep (services/borrowSweep.js) ---

  async findExpiredReservationIds(todayDate) {
    const [rows] = await db.query(
      "SELECT id FROM borrow_records WHERE status = 'reserved' AND pickup_deadline < ?",
      [todayDate]
    );
    return rows.map((row) => row.id);
  },

  async findDueSoonUnnotified(todayDate, tomorrowDate) {
    const [rows] = await db.query(
      `${RECORD_SELECT}
       WHERE br.status = 'borrowed' AND br.due_soon_notified = 0 AND br.due_date BETWEEN ? AND ?`,
      [todayDate, tomorrowDate]
    );
    return rows;
  },

  async findOverdueUnnotified(todayDate) {
    const [rows] = await db.query(
      `${RECORD_SELECT} WHERE br.status = 'borrowed' AND br.overdue_notified = 0 AND br.due_date < ?`,
      [todayDate]
    );
    return rows;
  },

  async setFlag(id, flag) {
    if (!['due_soon_notified', 'overdue_notified'].includes(flag)) throw new Error(`Unknown flag ${flag}`);
    await db.query(`UPDATE borrow_records SET ${flag} = 1 WHERE id = ?`, [id]);
  },
};

module.exports = BorrowModel;
