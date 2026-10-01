const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const policy = require('./policy');

// Runs the schema.sql file against MySQL on every server start. Every
// statement in it is idempotent (CREATE ... IF NOT EXISTS, ON DUPLICATE KEY
// UPDATE), so this safely creates the database/tables/seed data the first
// time and is a cheap no-op on every restart after that.
async function migrate() {
  const dbName = process.env.DB_NAME || 'library_db';

  // Best-effort: create the database if it doesn't exist yet, for a fresh
  // local MySQL/XAMPP install. Hosted providers (Render, Clever Cloud, etc.)
  // provision the database ahead of time and don't grant CREATE privileges
  // outside it, so this is expected to fail there — safe to ignore since
  // the database already exists in that case.
  try {
    const setup = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await setup.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await setup.end();
  } catch {
    // Ignore — see comment above.
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(sql);
    await upgrade(connection, dbName);
  } finally {
    await connection.end();
  }
}

// schema.sql's CREATE TABLE IF NOT EXISTS never touches a table that already
// exists, so databases created by older versions are brought up to date
// here. Each step checks information_schema first (works on MySQL and
// MariaDB alike), so this is also a no-op on every restart.
const ADDED_COLUMNS = [
  ['books', 'archived_at', 'TIMESTAMP NULL DEFAULT NULL AFTER available_copies'],
  ['notifications', 'link', 'VARCHAR(255) DEFAULT NULL AFTER message'],
  ['borrow_records', 'pickup_deadline', 'DATE DEFAULT NULL AFTER reserved_at'],
  ['borrow_records', 'renewal_count', 'INT NOT NULL DEFAULT 0 AFTER due_date'],
  ['borrow_records', 'closed_at', 'TIMESTAMP NULL DEFAULT NULL AFTER returned_at'],
  ['borrow_records', 'close_reason', 'VARCHAR(255) DEFAULT NULL AFTER closed_at'],
  ['borrow_records', 'due_soon_notified', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['borrow_records', 'overdue_notified', 'TINYINT(1) NOT NULL DEFAULT 0'],
];

const ADDED_INDEXES = [
  ['borrow_records', 'idx_borrow_status', '(status)'],
  ['borrow_records', 'idx_borrow_student_status', '(student_id, status)'],
  ['borrow_records', 'idx_borrow_due_date', '(due_date)'],
  ['notifications', 'idx_notifications_user_created', '(user_id, created_at)'],
];

const BORROW_STATUSES = "'reserved', 'borrowed', 'returned', 'cancelled', 'rejected', 'expired'";

async function upgrade(connection, dbName) {
  for (const [table, column, definition] of ADDED_COLUMNS) {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
      [dbName, table, column]
    );
    if (rows.length === 0) {
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }

  for (const [table, index, columns] of ADDED_INDEXES) {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
      [dbName, table, index]
    );
    if (rows.length === 0) {
      await connection.query(`ALTER TABLE \`${table}\` ADD INDEX \`${index}\` ${columns}`);
    }
  }

  const [[statusColumn]] = await connection.query(
    "SELECT column_type AS type FROM information_schema.columns WHERE table_schema = ? AND table_name = 'borrow_records' AND column_name = 'status'",
    [dbName]
  );
  if (statusColumn && !statusColumn.type.includes("'expired'")) {
    await connection.query(
      `ALTER TABLE borrow_records MODIFY COLUMN status ENUM(${BORROW_STATUSES}) NOT NULL DEFAULT 'reserved'`
    );
  }

  // Reservations made before pickup deadlines existed get one computed from
  // their requested start date (or reservation date), so they can expire.
  await connection.query(
    `UPDATE borrow_records
     SET pickup_deadline = DATE_ADD(COALESCE(request_start_date, DATE(reserved_at)), INTERVAL ? DAY)
     WHERE status = 'reserved' AND pickup_deadline IS NULL`,
    [policy.reservationHoldDays]
  );
}

module.exports = migrate;
