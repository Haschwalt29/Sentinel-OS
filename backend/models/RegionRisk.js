const mongoose = require('mongoose');

const RegionRiskSchema = new mongoose.Schema({
  region: {
    type: String, // e.g., 'US', 'GB', 'DE'
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  totalRisk: {
    type: Number,
    default: 0,
  },
  riskBreakdown: {
    political: { type: Number, default: 0 },
    economic: { type: Number, default: 0 },
    conflict: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
    environmental: { type: Number, default: 0 },
    cyber: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  articleRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  }],
});

RegionRiskSchema.index({ region: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('RegionRisk', RegionRiskSchema); 