const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// ─── GET /api/messages/:conversationId ───────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error('[MessageController.getMessages]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// ─── POST /api/messages ───────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;

    if (!conversationId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'conversationId and text are required' });
    }

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized for this conversation' });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId || null,
      text: text.trim(),
      status: 'sent',
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'username displayName avatar'
    );

    // Update conversation lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: text.trim(),
        sender: req.user._id,
        timestamp: new Date(),
      },
      updatedAt: new Date(),
    });

    // Create notification for receiver
    if (receiverId) {
      await Notification.create({
        userId: receiverId,
        type: 'message',
        title: `New message from ${req.user.displayName}`,
        content: text.trim().slice(0, 100),
        relatedUser: req.user._id,
        relatedConversation: conversationId,
      });

      // Emit via Socket.IO if receiver is online
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${receiverId}`).emit('notification:new', {
          type: 'message',
          from: req.user.displayName,
          text: text.trim().slice(0, 100),
        });
      }
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('[MessageController.sendMessage]', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// ─── PATCH /api/messages/:id/read ────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status: 'read', readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error('[MessageController.markAsRead]', err);
    res.status(500).json({ success: false, message: 'Failed to update message status' });
  }
};

module.exports = { getMessages, sendMessage, markAsRead };
