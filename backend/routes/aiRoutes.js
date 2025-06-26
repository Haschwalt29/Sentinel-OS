const express = require("express");
const router = express.Router();
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
  try {
    const { 
      threatLevel, 
      minConfidence,
      timeRange = 'all',
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    let query = Threat.find();
    
    // 1. Filter by threatLevel
    if (threatLevel && threatLevel !== 'all') {
      // Ensure the value is one of the allowed types to prevent NoSQL injection
      const allowedLevels = ["High Threat", "Medium Threat", "No Threat"];
      if(allowedLevels.includes(threatLevel)) {
        query = query.where('threatLevel').equals(threatLevel);
      } else {
        return res.status(400).json({ error: "Invalid threatLevel" });
      }
    }

    // 2. Filter by minConfidence
    if (minConfidence) {
      const confidence = parseFloat(minConfidence);
      if (!isNaN(confidence)) {
        query = query.where('confidence').gte(confidence);
      } else {
         return res.status(400).json({ error: "Invalid minConfidence, must be a number" });
      }
    }
    
    // 3. Filter by timeRange
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
          return res.status(400).json({ error: "Invalid timeRange. Use '24h', '7d', or '30d'" });
      }
      query = query.where('createdAt').gte(startDate);
    }

    // 4. Apply sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };
    query = query.sort(sortOptions);

    // 5. Apply limit
    const threats = await query.limit(50).exec();
    
    res.json(threats);
    
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: 'Failed to fetch live feed' });
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
        coordinates: { lat: 38.9637, lng: 35.2433 },
      },
      {
        title: "Cyber attack on German banks",
        content: "Multiple banks across Germany have been targeted by a cyber attack.",
        threatLevel: "Medium Threat",
        confidence: 0.87,
        coordinates: { lat: 52.52, lng: 13.405 },
      },
      {
        title: "Flood warnings in Bangladesh",
        content: "Severe flooding is expected in northern Bangladesh following heavy monsoon rains.",
        threatLevel: "High Threat",
        confidence: 0.91,
        coordinates: { lat: 24.0, lng: 90.0 },
      },
      {
        title: "Political unrest in Venezuela",
        content: "Protesters clash with police amid ongoing political crisis.",
        threatLevel: "Medium Threat",
        confidence: 0.81,
        coordinates: { lat: 6.4238, lng: -66.5897 },
      },
      {
        title: "Calm weekend in Canada",
        content: "No major events reported across the country this weekend.",
        threatLevel: "No Threat",
        confidence: 0.98,
        coordinates: { lat: 56.1304, lng: -106.3468 },
      },
      {
        title: "Wildfires spread in California",
        content: "Uncontrolled wildfires threaten towns in northern California.",
        threatLevel: "High Threat",
        confidence: 0.94,
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

module.exports = router;
