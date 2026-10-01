const crypto = require('crypto');
const db = require('../config/db');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

// Stored in the database (not process memory) so codes survive restarts and
// work across multiple server instances. Only a hash of the code is kept.
const PasswordResetModel = {
  async save(email, otp, ttlMs) {
    const expiresAt = new Date(Date.now() + ttlMs);
    await db.query(
      `INSERT INTO password_resets (email, otp_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), attempts = 0`,
      [email, hashOtp(otp), expiresAt]
    );
  },

  // Returns true when the code matches an unexpired entry. Every wrong guess
  // counts toward `maxAttempts`, after which the code is burned.
  async verify(email, otp, maxAttempts) {
    const [rows] = await db.query('SELECT * FROM password_resets WHERE email = ?', [email]);
    const entry = rows[0];
    if (!entry || new Date(entry.expires_at) < new Date() || entry.attempts >= maxAttempts) return false;

    const expected = Buffer.from(entry.otp_hash, 'hex');
    const actual = Buffer.from(hashOtp(otp), 'hex');
    if (crypto.timingSafeEqual(expected, actual)) return true;

    await db.query('UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?', [email]);
    return false;
  },

  async remove(email) {
    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
  },
};

module.exports = PasswordResetModel;
