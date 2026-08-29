const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New AI Conversation',
      trim: true,
      maxlength: 100,
    },
    lastMessage: {
      text: { type: String, default: '' },
      role: { type: String, enum: ['user', 'assistant'], default: 'assistant' },
      timestamp: { type: Date, default: Date.now },
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
