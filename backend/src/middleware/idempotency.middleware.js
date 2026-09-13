// Lets a client safely retry a state-changing request (e.g. after a dropped
// connection) without double-submitting it — the client sends the same
// `Idempotency-Key` header on the retry, and gets back the exact response
// from the first attempt instead of e.g. reserving the same book twice.
//
// In-memory + per-process is enough for this single-instance app; a
// multi-instance deployment would need this backed by a shared store
// (Redis, a DB table) instead.
const TTL_MS = 15 * 60 * 1000;
const store = new Map(); // key -> { status, body, expiresAt } | { pending: true }

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt && entry.expiresAt < now) store.delete(key);
  }
}, 60 * 1000).unref();

function idempotent(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const scopedKey = `${req.user?.id || 'anon'}:${req.method}:${req.originalUrl}:${key}`;
  const existing = store.get(scopedKey);

  if (existing?.pending) {
    return res.status(409).json({ message: 'A request with this Idempotency-Key is still being processed' });
  }
  if (existing) {
    return res.status(existing.status).json(existing.body);
  }

  store.set(scopedKey, { pending: true });

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      store.set(scopedKey, { status: res.statusCode, body, expiresAt: Date.now() + TTL_MS });
    } else {
      store.delete(scopedKey);
    }
    return originalJson(body);
  };

  res.on('close', () => {
    if (store.get(scopedKey)?.pending) store.delete(scopedKey);
  });

  next();
}

module.exports = { idempotent };
