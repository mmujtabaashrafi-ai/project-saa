const User = require('../models/User');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ─── GET /api/admin/users ─────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('username displayName role avatar isOnline isActive lastSeen createdAt')
      .sort({ createdAt: 1 });

    res.json({ success: true, users, total: users.length });
  } catch (err) {
    console.error('[AdminController.getAllUsers]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── GET /api/admin/sessions ──────────────────────────────────────────────
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'username displayName avatar role')
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions, count: sessions.length });
  } catch (err) {
    console.error('[AdminController.getAllSessions]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// ─── PATCH /api/admin/users/:id/status ───────────────────────────────────
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetId = req.params.id;

    // Prevent admin from deactivating themselves
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own account status' });
    }

    const user = await User.findByIdAndUpdate(
      targetId,
      { isActive: Boolean(isActive) },
      { new: true }
    ).select('username displayName role isActive');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If deactivated, invalidate all sessions
    if (!isActive) {
      await Session.updateMany({ userId: targetId }, { isActive: false });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('[AdminController.updateUserStatus]', err);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

// ─── DELETE /api/admin/sessions/:id ──────────────────────────────────────
const terminateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Mark user offline
    await User.findByIdAndUpdate(session.userId, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.json({ success: true, message: 'Session terminated' });
  } catch (err) {
    console.error('[AdminController.terminateSession]', err);
    res.status(500).json({ success: false, message: 'Failed to terminate session' });
  }
};

// ─── POST /api/admin/logout-all ───────────────────────────────────────────
const logoutAllSessions = async (req, res) => {
  try {
    // Keep admin's own session
    await Session.updateMany(
      { sessionId: { $ne: req.sessionId } },
      { isActive: false }
    );

    // Mark all other users offline
    await User.updateMany(
      { _id: { $ne: req.user._id } },
      { isOnline: false, lastSeen: new Date(), socketId: null }
    );

    res.json({ success: true, message: 'All sessions terminated (your session preserved)' });
  } catch (err) {
    console.error('[AdminController.logoutAllSessions]', err);
    res.status(500).json({ success: false, message: 'Failed to logout all sessions' });
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      onlineUsers,
      activeSessions,
      totalMessages,
      totalConversations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isOnline: true }),
      Session.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } }),
      Message.countDocuments(),
      Conversation.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        onlineUsers,
        activeSessions,
        maxSessions: parseInt(process.env.MAX_ACTIVE_USERS) || 5,
        totalMessages,
        totalConversations,
        availableSlots: Math.max(0, (parseInt(process.env.MAX_ACTIVE_USERS) || 5) - activeSessions),
      },
    });
  } catch (err) {
    console.error('[AdminController.getStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

module.exports = {
  getAllUsers,
  getAllSessions,
  updateUserStatus,
  terminateSession,
  logoutAllSessions,
  getStats,
};
