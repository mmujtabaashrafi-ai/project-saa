const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['post', 'reel'],
      default: 'post',
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

commentSchema.index({ targetId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
