'use strict';

const Notification = require('../models/Notification');

// ─── GET /api/notifications ─────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedUser', 'username displayName avatar')
      .populate('relatedPost', 'caption mediaUrl mediaType')
      .populate('relatedReel', 'caption videoUrl')
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    const total = await Notification.countDocuments({ userId });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (err) {
    console.error('[NotificationController getNotifications]', err);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

// ─── PATCH /api/notifications/:id/read ──────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error('[NotificationController markAsRead]', err);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// ─── DELETE /api/notifications ──────────────────────────────────────────────
const clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ userId });
    res.json({ success: true, message: 'Notifications cleared successfully' });
  } catch (err) {
    console.error('[NotificationController clearNotifications]', err);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  clearNotifications,
};
