const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  content: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  sourceName: {
    type: String,
    required: true,
  },
  publishedAt: {
    type: Date,
    required: true,
  },
  region: {
    type: String, // e.g., 'US', 'GB', 'DE'
    required: true,
  },
  classification: {
    category: {
      type: String,
      enum: ['political', 'economic', 'conflict', 'health', 'environmental', 'cyber', 'other'],
      default: 'other',
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Article', ArticleSchema); 