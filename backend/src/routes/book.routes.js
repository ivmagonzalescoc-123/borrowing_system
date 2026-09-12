const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  uploadCover,
} = require('../controllers/book.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { uploadCoverImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', requireAuth, getBooks);
router.get('/:id', requireAuth, getBook);
router.post('/', requireAuth, requireRole('staff'), createBook);
router.post('/upload-cover', requireAuth, requireRole('staff'), uploadCoverImage.single('cover'), uploadCover);
router.put('/:id', requireAuth, requireRole('staff'), updateBook);
router.delete('/:id', requireAuth, requireRole('staff'), deleteBook);

module.exports = router;
