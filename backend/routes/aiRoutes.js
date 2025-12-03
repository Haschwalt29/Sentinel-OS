const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const { askCohere } = require("../services/aiService");
const ThreatReport = require('../models/ThreatReport');
const { classifyNews } = require('../controllers/aiController');
const Threat = require('../models/Threat');

router.post("/ask", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const answer = await askCohere(prompt);
  res.json({ answer });
});

// POST /api/ai/test-threat
router.post('/test-threat', async (req, res) => {
  try {
    const dummyReport = new ThreatReport({
      title: 'Dummy Threat Report',
      source: 'Automated Test',
      region: 'US',
      content: 'This is a dummy threat report for testing purposes.',
      summary: 'A test threat report.',
      threatLevel: 'Moderate',
    });
    const savedReport = await dummyReport.save();
    res.status(201).json({ success: true, data: savedReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/classify-news
router.post('/classify-news', classifyNews);

// GET /api/ai/feed
router.get('/feed', async (req, res) => {
  // Set a timeout for the entire request
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('[ERROR] Request timeout after 8 seconds');
      res.status(504).json({ error: 'Request timeout', message: 'Database query took too long' });
    }
  }, 8000); // 8 second timeout (less than client's 10s timeout)

  try {
    console.log('[DEBUG] /api/ai/feed called with query:', req.query);
    
    // Check database connection state
    if (mongoose.connection.readyState !== 1) {
      clearTimeout(timeout);
      console.error('[ERROR] Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database not available', 
        message: 'Database connection is not established. Please check server logs.',
        readyState: mongoose.connection.readyState
      });
    }

    const { 
      threatLevel, 
      minConfidence,
      timeRange = 'all',
      sortBy = 'createdAt', 
      order = 'desc',
      type // New parameter for filtering by type
    } = req.query;

    let query = Threat.find();
    
    // 1. Filter by type (global/local)
    if (type && ['global', 'local'].includes(type)) {
      query = query.where('type').equals(type);
    }
    
    // 2. Filter by threatLevel
    if (threatLevel && threatLevel !== 'all') {
      // Ensure the value is one of the allowed types to prevent NoSQL injection
      const allowedLevels = ["High Threat", "Medium Threat", "No Threat"];
      if(allowedLevels.includes(threatLevel)) {
        query = query.where('threatLevel').equals(threatLevel);
      } else {
        clearTimeout(timeout);
        console.error('[DEBUG] Invalid threatLevel:', threatLevel);
        return res.status(400).json({ error: "Invalid threatLevel" });
      }
    }

    // 3. Filter by minConfidence
    if (minConfidence) {
      const confidence = parseFloat(minConfidence);
      if (!isNaN(confidence)) {
        query = query.where('confidence').gte(confidence);
      } else {
        clearTimeout(timeout);
        console.error('[DEBUG] Invalid minConfidence:', minConfidence);
        return res.status(400).json({ error: "Invalid minConfidence, must be a number" });
      }
    }
    
    // 4. Filter by timeRange
    if (timeRange && timeRange !== 'all') {
      let startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          clearTimeout(timeout);
          console.error('[DEBUG] Invalid timeRange:', timeRange);
          return res.status(400).json({ error: "Invalid timeRange. Use '24h', '7d', or '30d'" });
      }
      query = query.where('createdAt').gte(startDate);
    }

    // 5. Apply sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };
    console.log('[DEBUG] Applying sort options:', sortOptions);
    query = query.sort(sortOptions);

    // 6. Apply limit and add maxTimeMS to prevent long-running queries
    console.log('[DEBUG] Final Mongoose query:', JSON.stringify(query.getQuery()), 'sort:', sortOptions);
    const threats = await query.limit(50).maxTimeMS(7000).exec(); // 7 second max query time
    console.log('[DEBUG] Threats fetched:', threats.length);
    
    clearTimeout(timeout);
    res.json(threats);
    
  } catch (err) {
    clearTimeout(timeout);
    console.error('[ERROR] Error fetching feed:', err);
    
    // Handle specific MongoDB timeout errors
    if (err.name === 'MongoServerError' && err.code === 50) {
      return res.status(504).json({ error: 'Database query timeout', message: 'The query took too long to execute' });
    }
    
    // Handle connection errors
    if (err.name === 'MongooseError' || err.message.includes('connection')) {
      return res.status(503).json({ error: 'Database connection error', message: err.message });
    }
    
    res.status(500).json({ error: 'Failed to fetch live feed', details: err.message });
  }
});

// GET /api/ai/region-heatmap
router.get('/region-heatmap', async (req, res) => {
  try {
    const heatmapData = await Threat.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
          highThreats: {
            $sum: {
              $cond: [{ $eq: ['$threatLevel', 'High Threat'] }, 1, 0]
            }
          },
          mediumThreats: {
            $sum: {
              $cond: [{ $eq: ['$threatLevel', 'Medium Threat'] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json(heatmapData);
  } catch (err) {
    console.error("Error fetching heatmap data:", err);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// ✅ Dev-only route to seed sample threats
router.post("/seed-threats", async (req, res) => {
  try {
    // Clear existing threats to ensure a clean slate
    await Threat.deleteMany({});
    
    const sampleThreatsData = [
      {
        title: "Earthquake strikes Turkey",
        content: "A 6.8 magnitude earthquake has hit central Turkey.",
        threatLevel: "High Threat",
        confidence: 0.93,
        type: "global",
        region: "Turkey",
        coordinates: { lat: 38.9637, lng: 35.2433 },
      },
      {
        title: "Cyber attack on German banks",
        content: "Multiple banks across Germany have been targeted by a cyber attack.",
        threatLevel: "Medium Threat",
        confidence: 0.87,
        type: "global",
        region: "Germany",
        coordinates: { lat: 52.52, lng: 13.405 },
      },
      {
        title: "Flood warnings in Bangladesh",
        content: "Severe flooding is expected in northern Bangladesh following heavy monsoon rains.",
        threatLevel: "High Threat",
        confidence: 0.91,
        type: "global",
        region: "Bangladesh",
        coordinates: { lat: 24.0, lng: 90.0 },
      },
      {
        title: "Political unrest in Venezuela",
        content: "Protesters clash with police amid ongoing political crisis.",
        threatLevel: "Medium Threat",
        confidence: 0.81,
        type: "global",
        region: "Venezuela",
        coordinates: { lat: 6.4238, lng: -66.5897 },
      },
      {
        title: "Calm weekend in Canada",
        content: "No major events reported across the country this weekend.",
        threatLevel: "No Threat",
        confidence: 0.98,
        type: "global",
        region: "Canada",
        coordinates: { lat: 56.1304, lng: -106.3468 },
      },
      {
        title: "Wildfires spread in California",
        content: "Uncontrolled wildfires threaten towns in northern California.",
        threatLevel: "High Threat",
        confidence: 0.94,
        type: "global",
        region: "USA > California",
        coordinates: { lat: 36.7783, lng: -119.4179 },
      },
    ];

    // Create new Threat models instance by instance to ensure schema is applied
    const threatPromises = sampleThreatsData.map(threatData => {
        const threat = new Threat(threatData);
        console.log('Mongoose document before save:', JSON.stringify(threat, null, 2));
        return threat.save();
    });

    await Promise.all(threatPromises);

    res.status(200).json({ message: "🌍 Sample threats seeded successfully!" });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Failed to seed threats" });
  }
});

// ✅ Dev-only route to seed local threats
router.post("/seed-local", async (req, res) => {
  try {
    const sampleLocalThreatsData = [
      {
        title: "Traffic accident on Main Street",
        content: "A multi-vehicle collision has caused major delays on Main Street during rush hour.",
        threatLevel: "Medium Threat",
        confidence: 0.85,
        type: "local",
        region: "New York > Manhattan",
        coordinates: { lat: 40.7589, lng: -73.9851 },
      },
      {
        title: "Fire breaks out in downtown building",
        content: "Firefighters are responding to a fire in a commercial building in downtown area.",
        threatLevel: "High Threat",
        confidence: 0.92,
        type: "local",
        region: "Los Angeles > Downtown",
        coordinates: { lat: 34.0522, lng: -118.2437 },
      },
      {
        title: "Protest planned for city hall",
        content: "Local activists are organizing a peaceful protest outside city hall tomorrow.",
        threatLevel: "Medium Threat",
        confidence: 0.78,
        type: "local",
        region: "Chicago > Loop",
        coordinates: { lat: 41.8781, lng: -87.6298 },
      },
      {
        title: "Weather warning for heavy rain",
        content: "Heavy rainfall expected in the area with potential for flash flooding.",
        threatLevel: "Medium Threat",
        confidence: 0.88,
        type: "local",
        region: "London > Central",
        coordinates: { lat: 51.5074, lng: -0.1278 },
      },
      {
        title: "Power outage in residential area",
        content: "Thousands of homes are without power due to a transformer failure.",
        threatLevel: "Medium Threat",
        confidence: 0.82,
        type: "local",
        region: "Paris > 8th Arrondissement",
        coordinates: { lat: 48.8566, lng: 2.3522 },
      },
      {
        title: "Gas leak reported in neighborhood",
        content: "Emergency services are responding to a gas leak in the residential area.",
        threatLevel: "High Threat",
        confidence: 0.95,
        type: "local",
        region: "Berlin > Mitte",
        coordinates: { lat: 52.5200, lng: 13.4050 },
      },
    ];

    // Create new Threat models for local threats
    const threatPromises = sampleLocalThreatsData.map(threatData => {
        const threat = new Threat(threatData);
        return threat.save();
    });

    await Promise.all(threatPromises);

    res.status(200).json({ message: "🏘️ Sample local threats seeded successfully!" });
  } catch (error) {
    console.error("Seed local error:", error);
    res.status(500).json({ error: "Failed to seed local threats" });
  }
});

module.exports = router;
