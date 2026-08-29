const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    audioTitle: {
      type: String,
      default: 'Original Audio · Saba’s World',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

reelSchema.index({ createdAt: -1 });
reelSchema.index({ author: 1, createdAt: -1 });
reelSchema.index({ tags: 1 });

module.exports = mongoose.model('Reel', reelSchema);
