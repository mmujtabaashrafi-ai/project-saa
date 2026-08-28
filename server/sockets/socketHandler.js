const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Authenticated Socket.IO handler.
 * Sockets must authenticate via JWT token in the handshake.
 */
const initSocketHandler = (io) => {
  // ─── Authentication Middleware ───────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const session = await Session.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!session) return next(new Error('Session expired'));

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      socket.sessionId = decoded.sessionId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ──────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${socket.user.displayName} [${socket.id}]`);

    // Join personal room for direct messages and notifications
    socket.join(`user:${userId}`);

    // Update user online status
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Notify all users that this user is online
    socket.broadcast.emit('user:online', {
      userId,
      displayName: socket.user.displayName,
      avatar: socket.user.avatar,
    });

    // ─── Message: Send ─────────────────────────────────────────────────
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, text, receiverId } = data;

        if (!conversationId || !text?.trim()) {
          return callback?.({ error: 'Invalid message data' });
        }

        // Verify participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return callback?.({ error: 'Not authorized for this conversation' });
        }

        // Create message
        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId || null,
          text: text.trim(),
          status: 'sent',
        });

        const populated = await Message.findById(message._id).populate(
          'sender',
          'username displayName avatar'
        );

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: { text: text.trim(), sender: userId, timestamp: new Date() },
          updatedAt: new Date(),
        });

        // Emit to receiver if online
        if (receiverId) {
          io.to(`user:${receiverId}`).emit('message:receive', {
            message: populated,
            conversationId,
          });

          // Mark as delivered if receiver is connected
          const receiverSockets = await io.in(`user:${receiverId}`).fetchSockets();
          if (receiverSockets.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
              status: 'delivered',
              deliveredAt: new Date(),
            });

            socket.emit('message:delivered', { messageId: message._id, conversationId });
          }
        }

        // Confirm to sender
        callback?.({ success: true, message: populated });
      } catch (err) {
        console.error('[Socket message:send]', err.message);
        callback?.({ error: 'Failed to send message' });
      }
    });

    // ─── Message: Read ──────────────────────────────────────────────────
    socket.on('message:read', async (data) => {
      try {
        const { messageId, senderId, conversationId } = data;

        await Message.findByIdAndUpdate(messageId, { status: 'read', readAt: new Date() });

        // Notify original sender
        if (senderId) {
          io.to(`user:${senderId}`).emit('message:read', { messageId, conversationId });
        }
      } catch (err) {
        console.error('[Socket message:read]', err.message);
      }
    });

    // ─── Typing: Start ──────────────────────────────────────────────────
    socket.on('typing:start', (data) => {
      const { receiverId, conversationId } = data;
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:start', {
          userId,
          displayName: socket.user.displayName,
          conversationId,
        });
      }
    });

    // ─── Typing: Stop ───────────────────────────────────────────────────
    socket.on('typing:stop', (data) => {
      const { receiverId, conversationId } = data;
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:stop', {
          userId,
          conversationId,
        });
      }
    });

    // ─── Disconnect ─────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.displayName}`);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null,
      });

      io.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });
};

module.exports = initSocketHandler;
