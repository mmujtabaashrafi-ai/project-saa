const mongoose = require('mongoose');

const aiMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: 'conversation',
    },
    confidence: {
      type: Number,
      default: 1.0,
    },
  },
  { timestamps: true }
);

aiMemorySchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('AIMemory', aiMemorySchema);
