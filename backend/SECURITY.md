# Security layer

What's implemented in the app, and what has to be configured outside it
(reverse proxy / hosting provider) to be complete.

## Implemented in this codebase

| Concern | Where | Notes |
|---|---|---|
| SQL injection | every model in `src/models/*` | All queries use `mysql2` parameterized placeholders (`?`) — no string-concatenated SQL anywhere. Already the case before this pass; verified, not changed. |
| XSS | `middleware/security.middleware.js` (`sanitizeInput`), `app.js` (`securityHeaders`) | Every request body/query/param string is stripped of script tags, event handlers, `javascript:` URLs, etc. before it reaches a controller. Helmet sets a strict `Content-Security-Policy` and other hardening headers. The React frontend also escapes all rendered output by default (no `dangerouslySetInnerHTML` in the codebase). |
| Rate limiting | `middleware/rateLimit.middleware.js` | `generalLimiter` (300 req/15min/IP) + `generalSlowDown` on all routes; a much tighter `authLimiter` (10 req/15min/IP) on `/api/auth/*`. |
| Idempotency | `middleware/idempotency.middleware.js` | Client sends an `Idempotency-Key` header on `POST /api/borrows` and `PATCH /api/borrows/:id/{handover,return}`; a retried request with the same key gets back the original response instead of re-applying the action. Frontend now sends a fresh UUID per submit. |
| CSRF | — (see below) | Not needed: the app authenticates with a `Bearer` token in the `Authorization` header, never a cookie. CSRF exploits a browser's automatic cookie attachment, so there's nothing for a forged cross-site request to ride on. **If session storage is ever switched to cookies, CSRF tokens (e.g. double-submit cookie) must be added at that point.** |
| RBAC | `middleware/auth.middleware.js` (`requireRole`), all routes | Every route already declares the role(s) allowed; students and staff only ever act on their own records (`req.user.id` from the verified token, never a client-supplied user id). |
| Authentication / password storage | `controllers/auth.controller.js` | `bcryptjs` with cost factor 12 (was 10). Password policy enforced server-side (`routes/auth.routes.js`, `express-validator`): min 8 chars, letters + numbers. |
| Session management | `utils/jwt.js` | JWT signed/verified with `issuer`/`audience` claims and a clock-tolerance window. Server refuses to start if `JWT_SECRET` is missing, short, or the sample placeholder value. |
| JWT hardening | `utils/jwt.js` | See above — strong-secret enforcement + `iss`/`aud` binding prevents tokens minted by/for another service from being accepted. |
| HTTPS enforcement | `middleware/security.middleware.js` (`enforceHttps`), `app.js` (HSTS header) | In production, any plain-HTTP request is 308-redirected to HTTPS, and HSTS tells browsers to only ever use HTTPS with this host afterwards. Local dev over `http://localhost` is left alone. |
| CORS | `app.js` | No wildcard, ever. `FRONTEND_URL` (comma-separated for multiple origins) is the only allow-list; a request from an origin not on it is rejected with 403. In production, the server refuses to start without `FRONTEND_URL` set. `credentials` is `false` since auth doesn't use cookies. |
| Request size limits | `app.js` | JSON bodies capped at 1MB; file uploads already capped at 5MB (`middleware/upload.middleware.js`). |
| Error handling | `middleware/error.middleware.js` | Unexpected (5xx) errors never leak stack traces or internal messages to the client in production. |

## Cannot be fully implemented at the app layer — needs infrastructure

- **WAF** (Web Application Firewall): a real WAF inspects traffic before it
  reaches this process. `helmet` + the rate limiter + input sanitization
  above are app-level defense-in-depth, not a substitute. For production,
  put this behind Cloudflare (free tier includes a basic WAF + DDoS
  protection) or, self-hosted, ModSecurity in front of Apache/nginx.
- **DDoS protection**: the rate limiter/slow-down mitigate application-layer
  abuse from a single process's perspective, but volumetric (network-layer)
  DDoS has to be absorbed upstream — a CDN/proxy (Cloudflare, AWS
  Shield, etc.), not this Node process.
- **HTTPS/TLS termination**: this app redirects to HTTPS and sends HSTS, but
  it doesn't terminate TLS itself. XAMPP's bundled Apache can be configured
  with a cert for local testing; in production, terminate TLS at a reverse
  proxy or hosting provider (Render/Railway/nginx + Let's Encrypt,
  Cloudflare, etc.) sitting in front of this Node process.

## Known trade-off specific to this prototype

`forgot-password` returns the OTP directly in the API response instead of
emailing it, because no SMTP provider is configured (see the comment in
`auth.controller.js`). This is now gated behind `NODE_ENV !== 'production'`
— it will refuse to leak the OTP if `NODE_ENV=production` is set, but real
email delivery (or an SMS/other out-of-band channel) must be wired up
before this is safe to deploy for real users.

## Required `.env` changes

- `JWT_SECRET` must be ≥32 random characters (the app now refuses to start
  otherwise) — generate with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `FRONTEND_URL` is required in production (comma-separated for multiple
  origins) — there's no wildcard fallback.
- `NODE_ENV=production` on the deployed server to enable HTTPS enforcement,
  suppress the OTP leak, and mask internal error details.
