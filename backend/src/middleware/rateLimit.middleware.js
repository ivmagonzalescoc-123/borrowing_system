const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Baseline for all API traffic: generous enough for normal use, but caps how
// hard a single client can hammer the API (defense-in-depth against
// scripted abuse/DDoS-style flooding; a real WAF/CDN should sit in front of
// this in production — see SECURITY.md).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Once a client is past half the general window's allowance, start adding
// latency instead of hard-failing — smooths out bursty/automated traffic
// without punishing normal interactive use.
const SLOW_DOWN_AFTER = 150;
const generalSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: SLOW_DOWN_AFTER,
  delayMs: (used) => Math.max(0, used - SLOW_DOWN_AFTER) * 100,
});

// Login/register/OTP endpoints are the target of credential-stuffing and
// brute-force attacks, so they get a much tighter, IP-scoped limit than the
// rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many attempts, please try again later.' },
});

module.exports = { generalLimiter, generalSlowDown, authLimiter };
