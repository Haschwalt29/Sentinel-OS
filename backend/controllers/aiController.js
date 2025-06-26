const { classifyText, extractLocations } = require('../services/aiService');
const Threat = require('../models/Threat');
const { geocodeLocation } = require('../utils/geocode');

// POST /api/ai/classify-news
async function classifyNews(req, res) {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields: title and content' });
    }

    // 1. Classify the threat
    const classificationResult = await classifyText(title, content);
    if (!classificationResult) {
      return res.status(500).json({ error: 'Failed to get classification result' });
    }

    // 2. Extract locations using NER
    const locations = await extractLocations(content);
    let coordinates = null;

    // 3. Geocode the first valid location found
    if (locations && locations.length > 0) {
      for (const loc of locations) {
        const coords = await geocodeLocation(loc);
        if (coords) {
          coordinates = coords;
          break; // Stop after finding the first valid coordinate
        }
      }
    }

    // 4. Save the threat to the database
    const threatData = {
      title,
      content,
      threatLevel: classificationResult.prediction,
      confidence: classificationResult.confidence,
    };
    
    if (coordinates) {
      threatData.coordinates = coordinates;
    }

    const newThreat = await Threat.create(threatData);
    console.log("Threat saved:", newThreat);
    
    return res.json(classificationResult);
    
  } catch (err) {
    console.error('Error in classifyNews pipeline:', err);
    return res.status(500).json({ error: 'Failed to classify news content' });
  }
}

module.exports = {
  classifyNews,
}; 