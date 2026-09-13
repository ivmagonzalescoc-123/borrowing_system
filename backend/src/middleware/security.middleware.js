const helmet = require('helmet');
const { filterXSS } = require('xss');

// Locks down response headers: no sniffing, no framing (clickjacking), a
// conservative CSP for the JSON API (this app has no server-rendered HTML),
// and HSTS so browsers remember to only ever use HTTPS with this host.
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true,
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // /uploads/covers is fetched from the frontend's origin
});

// Behind a reverse proxy / load balancer that terminates TLS (Render,
// Railway, Cloudflare, nginx, ...), req.secure is only accurate once
// `app.set('trust proxy', ...)` is configured — see app.js. Local dev over
// plain http:// is intentionally left alone.
function enforceHttps(req, res, next) {
  if (process.env.NODE_ENV !== 'production' || req.secure) {
    return next();
  }
  return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
}

// Strips <script> tags, event handlers, javascript: URLs, etc. out of every
// string in the request so stored fields (book title/description, full
// name, notification/purpose text, ...) can never carry a stored-XSS
// payload, even though React already escapes on render. Runs recursively so
// nested objects/arrays in the body are covered too.
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return filterXSS(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = sanitizeValue(value[key]);
    }
    return value;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body) sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);
  next();
}

module.exports = { securityHeaders, enforceHttps, sanitizeInput };
