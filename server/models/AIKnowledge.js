const mongoose = require('mongoose');

const aiKnowledgeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      index: true,
      enum: [
        'saba_profile',
        'quotes',
        'values',
        'interests',
        'programming',
        'java',
        'python',
        'javascript',
        'typescript',
        'cpp',
        'dsa',
        'dbms',
        'os',
        'computer_networks',
        'software_engineering',
        'ai',
        'machine_learning',
        'deep_learning',
        'llm',
        'rag',
        'mathematics',
        'general',
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    source: {
      type: String,
      default: 'curated_system',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound text index for search and RAG retrieval
aiKnowledgeSchema.index({ title: 'text', content: 'text', tags: 'text' });
aiKnowledgeSchema.index({ category: 1, enabled: 1 });

module.exports = mongoose.model('AIKnowledge', aiKnowledgeSchema);
