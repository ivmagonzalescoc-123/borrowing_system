const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const ISSUER = 'library-borrowing-api';
const AUDIENCE = 'library-borrowing-client';

// Fail fast at startup rather than silently signing tokens with an empty or
// guessable secret (jsonwebtoken happily signs with `undefined`, which would
// let anyone forge a valid token).
if (!SECRET || SECRET.length < 32 || SECRET === 'change_this_to_a_long_random_string') {
  throw new Error(
    'JWT_SECRET is missing or too weak. Set a random string of at least 32 characters in backend/.env ' +
    '(e.g. `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`).'
  );
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN, issuer: ISSUER, audience: AUDIENCE });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET, { issuer: ISSUER, audience: AUDIENCE, clockTolerance: 5 });
}

module.exports = { signToken, verifyToken };
