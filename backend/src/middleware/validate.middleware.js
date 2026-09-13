const { validationResult } = require('express-validator');

// Runs after an express-validator check chain; short-circuits with the
// first validation error instead of letting bad input reach a controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

module.exports = { validate };
