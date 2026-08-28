const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'ai'],
      default: 'direct',
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      timestamp: { type: Date, default: null },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure there are exactly 2 participants for direct conversations
conversationSchema.index({ participants: 1 });

// Compound index to find conversation between two users efficiently
conversationSchema.index({ participants: 1, type: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
