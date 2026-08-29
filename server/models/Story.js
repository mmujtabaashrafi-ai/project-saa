const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index for automatic MongoDB cleanup after 24h
    },
  },
  { timestamps: true }
);

storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
