const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ─── GET /api/conversations ───────────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username displayName avatar isOnline lastSeen')
      .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (err) {
    console.error('[ConversationController.getConversations]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// ─── POST /api/conversations ──────────────────────────────────────────────
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }

    // Prevent self-conversation
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, participantId], $size: 2 },
    }).populate('participants', 'username displayName avatar isOnline lastSeen');

    if (existing) {
      return res.json({ success: true, conversation: existing });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      type: 'direct',
    });

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'username displayName avatar isOnline lastSeen'
    );

    res.status(201).json({ success: true, conversation: populated });
  } catch (err) {
    console.error('[ConversationController.createOrGetConversation]', err);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// ─── GET /api/conversations/:id ───────────────────────────────────────────
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).populate('participants', 'username displayName avatar isOnline lastSeen');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('[ConversationController.getConversationById]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
};

module.exports = { getConversations, createOrGetConversation, getConversationById };
