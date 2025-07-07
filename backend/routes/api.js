const express = require('express');
const router = express.Router();
const Threat = require('../models/Threat');

const { 
  getArticles, 
  getRegions, 
  getRegion,
  fetchNews
} = require('../controllers/newsController');
const aiRoutes = require('./aiRoutes');
const adminRoutes = require('./adminRoutes');

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

// @desc    Create test threats with coordinates
// @route   POST /api/test-threats
router.post('/test-threats', async (req, res) => {
  try {
    const testThreats = [
      {
        title: "Test Global Threat - Cyber Attack in New York",
        content: "A major cyber attack has been detected in New York City affecting multiple government systems.",
        threatLevel: "High Threat",
        confidence: 0.9,
        type: "global",
        region: "New York",
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      {
        title: "Test Local Threat - Fire in Los Angeles",
        content: "A large fire has broken out in downtown Los Angeles, affecting multiple buildings.",
        threatLevel: "Medium Threat",
        confidence: 0.8,
        type: "local",
        region: "Los Angeles",
        coordinates: { lat: 34.0522, lng: -118.2437 }
      },
      {
        title: "Test Global Threat - Political Crisis in London",
        content: "Political tensions are rising in London following recent parliamentary decisions.",
        threatLevel: "Medium Threat",
        confidence: 0.7,
        type: "global",
        region: "London",
        coordinates: { lat: 51.5074, lng: -0.1278 }
      },
      {
        title: "Test Local Threat - Traffic Accident in Toronto",
        content: "A major traffic accident has occurred on the main highway in Toronto.",
        threatLevel: "Low Threat",
        confidence: 0.6,
        type: "local",
        region: "Toronto",
        coordinates: { lat: 43.6532, lng: -79.3832 }
      }
    ];

    for (const threatData of testThreats) {
      const existingThreat = await Threat.findOne({ title: threatData.title });
      if (!existingThreat) {
        const newThreat = new Threat(threatData);
        await newThreat.save();
        console.log(`✅ Created test threat: ${threatData.title}`);
        
        // Emit socket event
        if (global.io) {
          global.io.emit('new-threat', newThreat);
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Test threats created successfully',
      count: testThreats.length
    });
  } catch (error) {
    console.error('Error creating test threats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create test threats',
      error: error.message 
    });
  }
});

// @desc    Test OpenCage API status
// @route   GET /api/test-opencage
router.get('/test-opencage', async (req, res) => {
  try {
    const { getLocationCoordinates } = require('../utils/geocode');
    
    // Test with a known location
    const testLocation = 'Paris, France';
    console.log(`🧪 Testing OpenCage API with: ${testLocation}`);
    
    const coordinates = await getLocationCoordinates(testLocation);
    
    if (coordinates) {
      console.log(`✅ OpenCage API test successful: ${testLocation} -> ${JSON.stringify(coordinates)}`);
      res.json({ 
        success: true, 
        message: 'OpenCage API is working',
        testLocation,
        coordinates,
        apiKeyPresent: !!process.env.OPENCAGE_API_KEY
      });
    } else {
      console.log(`❌ OpenCage API test failed: ${testLocation}`);
      res.json({ 
        success: false, 
        message: 'OpenCage API test failed',
        testLocation,
        apiKeyPresent: !!process.env.OPENCAGE_API_KEY
      });
    }
  } catch (error) {
    console.error('Error testing OpenCage API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing OpenCage API',
      error: error.message,
      apiKeyPresent: !!process.env.OPENCAGE_API_KEY
    });
  }
});

// Mount ai routes
router.use('/ai', aiRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);

module.exports = router; 