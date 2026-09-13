function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }

  // multer (file upload) errors — e.g. LIMIT_FILE_SIZE — are client errors,
  // not server faults, so they shouldn't be masked as 500s in production.
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  // Never leak internal error details (stack traces, driver/SQL error text,
  // file paths) for unexpected 500s in production — only the deliberate,
  // caller-facing messages the controllers set on 4xx responses are safe to
  // pass through.
  const message =
    status < 500 ? err.message : process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
