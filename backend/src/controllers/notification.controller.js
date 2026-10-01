const NotificationModel = require('../models/notification.model');

async function getMine(req, res, next) {
  try {
    const notifications = await NotificationModel.findByUser(req.user.id);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await NotificationModel.markAllRead(req.user.id);
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMine, markAllRead };
