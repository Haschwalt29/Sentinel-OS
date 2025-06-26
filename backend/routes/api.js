const express = require('express');
const router = express.Router();

const { 
  getArticles, 
  getRegions, 
  getRegion,
  fetchNews
} = require('../controllers/newsController');
const aiRoutes = require('./aiRoutes');

// @desc    Get recent articles
// @route   GET /api/articles
router.get('/articles', getArticles);

// @desc    Get all region scores
// @route   GET /api/regions
router.get('/regions', getRegions);

// @desc    Get full breakdown for a specific region
// @route   GET /api/region/:code
router.get('/region/:code', getRegion);

// @desc    Trigger a manual fetch and classification of news
// @route   POST /api/fetch-news
router.post('/fetch-news', fetchNews);

// Mount ai routes
router.use('/ai', aiRoutes);

module.exports = router; 