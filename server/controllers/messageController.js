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
      .populate('sender', 'username displayName avatar role')
      .populate('replyTo', 'text mediaUrl mediaType sender')
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
    const {
      conversationId,
      text,
      receiverId,
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      replyTo,
    } = req.body;

    if (!conversationId || (!text?.trim() && !mediaUrl)) {
      return res.status(400).json({ success: false, message: 'conversationId and content are required' });
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
      text: (text || '').trim(),
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      replyTo: replyTo || null,
      status: 'sent',
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar role')
      .populate('replyTo', 'text mediaUrl mediaType sender');

    // Update conversation lastMessage
    const previewText = (text || '').trim() || `[${mediaType || 'Media'}]`;
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: previewText,
        sender: req.user._id,
        timestamp: new Date(),
      },
      updatedAt: new Date(),
    });

    // Create notification for receiver
    if (receiverId && receiverId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: receiverId,
        type: 'message',
        title: `New message from ${req.user.displayName}`,
        content: previewText.slice(0, 100),
        relatedUser: req.user._id,
        relatedConversation: conversationId,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${receiverId}`).emit('notification:new', {
          type: 'message',
          from: req.user.displayName,
          text: previewText.slice(0, 100),
        });
      }
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('[MessageController.sendMessage]', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// ─── POST /api/messages/:id/react ─────────────────────────────────────────
const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      // Replace existing reaction from same user or push new
      const userReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId.toString()
      );
      if (userReactionIndex > -1) {
        message.reactions[userReactionIndex].emoji = emoji;
      } else {
        message.reactions.push({ user: userId, emoji });
      }
    }

    await message.save();

    const populated = await Message.findById(id)
      .populate('sender', 'username displayName avatar role')
      .populate('replyTo', 'text mediaUrl mediaType sender');

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('message:reaction_update', {
        messageId: id,
        conversationId: message.conversationId,
        reactions: populated.reactions,
      });
    }

    res.json({ success: true, reactions: populated.reactions });
  } catch (err) {
    console.error('[MessageController.reactToMessage]', err);
    res.status(500).json({ success: false, message: 'Failed to react to message' });
  }
};

// ─── PATCH /api/messages/:id ──────────────────────────────────────────────
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(id)
      .populate('sender', 'username displayName avatar role')
      .populate('replyTo', 'text mediaUrl mediaType sender');

    const io = req.app.get('io');
    if (io) {
      io.emit('message:edited', {
        messageId: id,
        conversationId: message.conversationId,
        message: populated,
      });
    }

    res.json({ success: true, message: populated });
  } catch (err) {
    console.error('[MessageController.editMessage]', err);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

// ─── DELETE /api/messages/:id ─────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.text = 'This message was deleted';
    message.mediaUrl = null;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('message:deleted', {
        messageId: id,
        conversationId: message.conversationId,
      });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('[MessageController.deleteMessage]', err);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
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

module.exports = {
  getMessages,
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  markAsRead,
};

