const mongoose = require('mongoose');

const ThreatReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    default: 'Unknown',
  },
  region: {
    type: String,
    default: 'Global',
  },
  content: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
  },
  threatLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Critical'],
    default: 'Low',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ThreatReport', ThreatReportSchema); 