const ChatbotConversation = require('../models/ChatbotConversation');
const { generateResponse } = require('../services/reactBoatService');

// ─── POST /api/react-boat/chat ─────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id;

    // Get or create conversation history
    let convo = await ChatbotConversation.findOne({ userId });
    if (!convo) {
      convo = await ChatbotConversation.create({ userId, messages: [], totalMessages: 0 });
    }

    // Generate AI response
    const response = await generateResponse(message.trim(), convo.messages);

    // Save both messages
    convo.messages.push({ role: 'user', content: message.trim() });
    convo.messages.push({ role: 'assistant', content: response });

    // Keep only last 100 messages in DB
    if (convo.messages.length > 100) {
      convo.messages = convo.messages.slice(-100);
    }

    convo.totalMessages += 1;
    await convo.save();

    res.json({
      success: true,
      response,
      provider: process.env.AI_PROVIDER || 'fallback',
    });
  } catch (err) {
    console.error('[ReactBoatController.chat]', err);
    res.status(500).json({ success: false, message: 'AI service error. Please try again.' });
  }
};

// ─── GET /api/react-boat/history ──────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const convo = await ChatbotConversation.findOne({ userId: req.user._id });

    res.json({
      success: true,
      messages: convo ? convo.messages : [],
      totalMessages: convo ? convo.totalMessages : 0,
    });
  } catch (err) {
    console.error('[ReactBoatController.getHistory]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch AI history' });
  }
};

// ─── DELETE /api/react-boat/history ───────────────────────────────────────
const deleteHistory = async (req, res) => {
  try {
    await ChatbotConversation.findOneAndUpdate(
      { userId: req.user._id },
      { messages: [], totalMessages: 0 }
    );

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    console.error('[ReactBoatController.deleteHistory]', err);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};

module.exports = { chat, getHistory, deleteHistory };
