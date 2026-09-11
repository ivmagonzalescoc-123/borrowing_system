const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Runs the schema.sql file against MySQL on every server start. Every
// statement in it is idempotent (CREATE ... IF NOT EXISTS, ON DUPLICATE KEY
// UPDATE), so this safely creates the database/tables/seed data the first
// time and is a cheap no-op on every restart after that.
async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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
