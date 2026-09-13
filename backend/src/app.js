const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const borrowRoutes = require('./routes/borrow.routes');
const notificationRoutes = require('./routes/notification.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { securityHeaders, enforceHttps, sanitizeInput } = require('./middleware/security.middleware');
const { generalLimiter, generalSlowDown } = require('./middleware/rateLimit.middleware');

const app = express();

// Required so req.secure / req.ip reflect the original client, not the
// reverse proxy (Render, Railway, Cloudflare, nginx, ...) sitting in front
// of this app in production — both HTTPS enforcement and rate limiting
// depend on seeing the real client.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(enforceHttps);
app.use(securityHeaders);

// FRONTEND_URL restricts CORS to your deployed frontend's origin(s) — a
// comma-separated list, e.g. "https://app.example.com,https://admin.example.com".
// Never falls back to "*": with `*` any website on the internet can drive
// authenticated requests against this API from a visitor's browser.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '')) // tolerate stray quotes/trailing slash from pasting into a dashboard
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL must be set in production to configure CORS (no wildcard origin is allowed).');
  }
  console.warn('FRONTEND_URL is not set — allowing http://localhost:5173 for local frontend dev only.');
  allowedOrigins.push('http://localhost:5173');
}

// Optional: also allow Vercel's per-deployment preview URLs (a random hash
// per push, e.g. https://borrowing-system-5gew8rl6a-<team-slug>.vercel.app),
// which are otherwise a different origin every time and would never match
// FRONTEND_URL. Scoped to your own Vercel team/account via the suffix below
// so this doesn't open the API up to arbitrary vercel.app sites.
const previewSuffix = (process.env.VERCEL_PREVIEW_ORIGIN_SUFFIX || '').trim().replace(/^["']|["']$/g, '');
const previewOriginPattern = previewSuffix
  ? new RegExp(`^https://[a-z0-9-]+-${previewSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  : null;

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests, curl, health checks, etc. carry no Origin header.
      if (!origin || allowedOrigins.includes(origin) || previewOriginPattern?.test(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS rejected origin "${origin}" — allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: false, // auth uses a Bearer token, never cookies — no credentialed CORS needed
    maxAge: 600,
  })
);

// Caps request body size (defense-in-depth against oversized-payload DoS)
// and applies baseline rate limiting/slow-down to every route below.
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);
app.use(generalSlowDown);
app.use(sanitizeInput);

// Staff-uploaded book cover images (see book.routes.js POST /books/upload-cover).
// Note: on hosts with an ephemeral filesystem (e.g. Render's free tier), these
// files are lost on redeploy/restart — fine for a demo, not for production use.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
