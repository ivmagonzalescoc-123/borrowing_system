// Thrown from models/services for expected, caller-facing failures. The error
// middleware passes `message` through for any status below 500.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
