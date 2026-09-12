const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const borrowRoutes = require('./routes/borrow.routes');
const notificationRoutes = require('./routes/notification.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// FRONTEND_URL restricts CORS to your deployed frontend's origin. Leave it
// unset (as in local dev) to allow any origin.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

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
