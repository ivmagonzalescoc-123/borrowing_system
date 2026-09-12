const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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
  } finally {
    await connection.end();
  }
}

module.exports = migrate;
