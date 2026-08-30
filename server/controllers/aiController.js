'use strict';

const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');
const AIMemory = require('../models/AIMemory');
const AIKnowledge = require('../models/AIKnowledge');
const { generateAIResponse } = require('../services/aiService');

// ─── POST /api/ai/chat ──────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let activeConversation;

    if (conversationId) {
      activeConversation = await AIConversation.findOne({
        _id: conversationId,
        userId,
      });
    }

    if (!activeConversation) {
      // Create new conversation with auto-title from prompt
      const title = message.trim().slice(0, 35) + (message.trim().length > 35 ? '…' : '');
      activeConversation = await AIConversation.create({
        userId,
        title,
      });
    }

    // Load recent conversation history (last 30 messages in chronological order)
    const recentMessages = await AIMessage.find({
      conversationId: activeConversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const chronologicalHistory = recentMessages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 1. Save user message to DB
    const userMsgDoc = await AIMessage.create({
      conversationId: activeConversation._id,
      userId,
      role: 'user',
      content: message.trim(),
    });

    // 2. Generate AI response via Service (RAG + Memory + LLM/Fallback)
    const aiResult = await generateAIResponse({
      userId,
      userName: req.user?.displayName || req.user?.username || null,
      message: message.trim(),
      history: chronologicalHistory,
    });

    const safeContent =
      (aiResult && typeof aiResult.content === 'string' && aiResult.content.trim())
        ? aiResult.content.trim()
        : 'I am ready to assist you!';

    // 3. Save assistant message to DB
    const assistantMsgDoc = await AIMessage.create({
      conversationId: activeConversation._id,
      userId,
      role: 'assistant',
      content: safeContent,
      contextSources: aiResult?.contextSources || [],
    });

    // 4. Update conversation metadata
    activeConversation.lastMessage = {
      text: safeContent.slice(0, 80),
      role: 'assistant',
      timestamp: new Date(),
    };
    activeConversation.updatedAt = new Date();
    await activeConversation.save();

    const assistantPayload = {
      _id: assistantMsgDoc._id,
      role: 'assistant',
      content: safeContent,
      contextSources: aiResult?.contextSources || [],
      createdAt: assistantMsgDoc.createdAt,
    };

    res.json({
      success: true,
      conversationId: activeConversation._id,
      userMessage: userMsgDoc,
      assistantMessage: assistantPayload,
      message: assistantPayload,
      response: safeContent,
      memoryExtracted: aiResult?.memoryExtracted || 0,
    });
  } catch (err) {
    console.error('[AIController chat]', err);
    res.status(500).json({
      success: false,
      message: err.message || 'AI Assistant is temporarily unavailable. Please try again.',
    });
  }
};

// ─── GET /api/ai/conversations ──────────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await AIConversation.find({ userId })
      .sort({ pinned: -1, updatedAt: -1 })
      .lean();

    res.json({ success: true, conversations });
  } catch (err) {
    console.error('[AIController getConversations]', err);
    res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
};

// ─── POST /api/ai/conversations ─────────────────────────────────────────────
const createConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title } = req.body;

    const conversation = await AIConversation.create({
      userId,
      title: title?.trim() || 'New AI Conversation',
    });

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('[AIController createConversation]', err);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// ─── GET /api/ai/conversations/:id/messages ─────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await AIConversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await AIMessage.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, messages });
  } catch (err) {
    console.error('[AIController getMessages]', err);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
};

// ─── PATCH /api/ai/conversations/:id ────────────────────────────────────────
const updateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, pinned } = req.body;

    const updates = {};
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof pinned === 'boolean') updates.pinned = pinned;

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('[AIController updateConversation]', err);
    res.status(500).json({ success: false, message: 'Failed to update conversation' });
  }
};

// ─── DELETE /api/ai/conversations/:id ───────────────────────────────────────
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await AIConversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    await AIMessage.deleteMany({ conversationId: id });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('[AIController deleteConversation]', err);
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
};

// ─── GET /api/ai/memory ─────────────────────────────────────────────────────
const getMemories = async (req, res) => {
  try {
    const userId = req.user._id;
    const memories = await AIMemory.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, memories });
  } catch (err) {
    console.error('[AIController getMemories]', err);
    res.status(500).json({ success: false, message: 'Failed to load AI memories' });
  }
};

// ─── DELETE /api/ai/memory ──────────────────────────────────────────────────
const clearMemory = async (req, res) => {
  try {
    const userId = req.user._id;
    await AIMemory.deleteMany({ userId });
    res.json({ success: true, message: 'AI memory cleared successfully' });
  } catch (err) {
    console.error('[AIController clearMemory]', err);
    res.status(500).json({ success: false, message: 'Failed to clear AI memory' });
  }
};

// ─── Knowledge Management (Admin + Public Read) ────────────────────────────
const getKnowledge = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const items = await AIKnowledge.find(filter).sort({ priority: -1, updatedAt: -1 }).lean();
    res.json({ success: true, count: items.length, knowledge: items });
  } catch (err) {
    console.error('[AIController getKnowledge]', err);
    res.status(500).json({ success: false, message: 'Failed to load knowledge base' });
  }
};

const createKnowledge = async (req, res) => {
  try {
    const { category, title, content, tags, priority, enabled } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({ success: false, message: 'Category, title, and content required' });
    }

    const item = await AIKnowledge.create({
      category,
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
      priority: Number(priority) || 0,
      enabled: enabled !== undefined ? enabled : true,
      source: 'admin_panel',
    });

    res.status(201).json({ success: true, knowledge: item });
  } catch (err) {
    console.error('[AIController createKnowledge]', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create knowledge item' });
  }
};

const updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, content, tags, priority, enabled } = req.body;

    const updates = {};
    if (category) updates.category = category;
    if (title) updates.title = title.trim();
    if (content) updates.content = content.trim();
    if (tags) updates.tags = Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [];
    if (priority !== undefined) updates.priority = Number(priority);
    if (enabled !== undefined) updates.enabled = enabled;

    const item = await AIKnowledge.findByIdAndUpdate(id, updates, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Knowledge item not found' });
    }

    res.json({ success: true, knowledge: item });
  } catch (err) {
    console.error('[AIController updateKnowledge]', err);
    res.status(500).json({ success: false, message: 'Failed to update knowledge item' });
  }
};

const deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AIKnowledge.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Knowledge item not found' });
    }

    res.json({ success: true, message: 'Knowledge item deleted successfully' });
  } catch (err) {
    console.error('[AIController deleteKnowledge]', err);
    res.status(500).json({ success: false, message: 'Failed to delete knowledge item' });
  }
};

module.exports = {
  chat,
  getConversations,
  createConversation,
  getMessages,
  updateConversation,
  deleteConversation,
  getMemories,
  clearMemory,
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
};
