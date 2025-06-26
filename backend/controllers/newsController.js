const Article = require('../models/Article');
const RegionRisk = require('../models/RegionRisk');
const { fetchAndClassifyNews } = require('../services/newsService');

// @desc    Get recent articles
// @route   GET /api/articles
exports.getArticles = async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ publishedAt: -1 }).limit(20);
    res.status(200).json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all region scores
// @route   GET /api/regions
exports.getRegions = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const regions = await RegionRisk.find({ date: today });
        res.status(200).json({ success: true, count: regions.length, data: regions });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get full breakdown for a specific region
// @route   GET /api/region/:code
exports.getRegion = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const regionCode = req.params.code.toUpperCase();
        
        const regionData = await RegionRisk.findOne({ region: regionCode, date: today })
            .populate('articleRefs');

        if (!regionData) {
            return res.status(404).json({ success: false, error: 'No risk data found for this region today.' });
        }

        // TODO: Add historical data for charts

        res.status(200).json({ success: true, data: regionData });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Trigger a manual fetch and classification of news
// @route   POST /api/fetch-news
exports.fetchNews = async (req, res, next) => {
  try {
    await fetchAndClassifyNews();
    res.status(200).json({ success: true, message: 'News fetching and classification initiated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}; 