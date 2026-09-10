const express = require('express');
const { getMine, create, markAllRead } = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/mine', requireAuth, getMine);
router.post('/', requireAuth, create);
router.patch('/mark-read', requireAuth, markAllRead);

module.exports = router;
