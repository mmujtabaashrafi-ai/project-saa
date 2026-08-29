const mongoose = require('mongoose');

const storyViewSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

storyViewSchema.index({ storyId: 1, viewer: 1 }, { unique: true });

module.exports = mongoose.model('StoryView', storyViewSchema);
