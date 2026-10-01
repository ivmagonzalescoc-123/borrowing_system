const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  archiveBook,
  restoreBook,
  getArchivedBooks,
  uploadCover,
  joinWaitlist,
  leaveWaitlist,
  getMyBookmarks,
  addBookmark,
  removeBookmark,
} = require('../controllers/book.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { uploadCoverImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', requireAuth, getBooks);
router.get('/bookmarks', requireAuth, requireRole('student'), getMyBookmarks);
router.get('/archived', requireAuth, requireRole('staff'), getArchivedBooks);
router.get('/:id', requireAuth, getBook);
router.post('/', requireAuth, requireRole('staff'), createBook);
router.post('/upload-cover', requireAuth, requireRole('staff'), uploadCoverImage.single('cover'), uploadCover);
router.put('/:id', requireAuth, requireRole('staff'), updateBook);
// No DELETE: books are archived (and restorable), never removed.
router.patch('/:id/archive', requireAuth, requireRole('staff'), archiveBook);
router.patch('/:id/restore', requireAuth, requireRole('staff'), restoreBook);
router.put('/:id/bookmark', requireAuth, requireRole('student'), addBookmark);
router.delete('/:id/bookmark', requireAuth, requireRole('student'), removeBookmark);
router.put('/:id/waitlist', requireAuth, requireRole('student'), joinWaitlist);
router.delete('/:id/waitlist', requireAuth, requireRole('student'), leaveWaitlist);

module.exports = router;
