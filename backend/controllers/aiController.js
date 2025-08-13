const { classifyText, extractLocations } = require('../services/aiService');
const Threat = require('../models/Threat');
const { geocodeLocation } = require('../utils/geocode');

// POST /api/ai/classify-news
async function classifyNews(req, res) {
  try {
    const { title, content, description, url, type = 'global', region } = req.body;
    const articleContent = content || description;
    if (!title || !articleContent) {
      return res.status(400).json({ error: 'Missing required fields: title and content/description' });
    }

    // Validate type
    if (!['global', 'local'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "global" or "local"' });
    }

    // 1. Classify the threat
    const classificationResult = await classifyText(title, articleContent);
    if (!classificationResult) {
      return res.status(500).json({ error: 'Failed to get classification result' });
    }

    // 2. Extract locations using NER
    const locations = await extractLocations(articleContent);
    let coordinates = null;
    let finalRegion = region;

    // 3. Geocode the first valid location found
    if (locations && locations.length > 0) {
      for (const loc of locations) {
        const coords = await geocodeLocation(loc);
        if (coords) {
          coordinates = coords;
          if (!finalRegion) {
            finalRegion = loc;
          }
          break; // Stop after finding the first valid coordinate
        }
      }
    }

    // 4. Save the threat to the database
    const threatData = {
      title,
      content: articleContent,
      threatLevel: classificationResult.prediction,
      confidence: classificationResult.confidence,
      type,
      region: finalRegion || (type === 'global' ? 'Global' : 'Local'),
    };
    
    if (coordinates) {
      threatData.coordinates = coordinates;
    }
    if (url) {
      threatData.url = url;
    }

    const newThreat = await Threat.create(threatData);
    console.log("Threat saved:", newThreat);
    
    // 5. Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('new-threat', newThreat);
      console.log('Emitted new-threat event:', newThreat._id);
    }
    
    return res.json(classificationResult);
    
  } catch (err) {
    console.error('Error in classifyNews pipeline:', err);
    return res.status(500).json({ error: 'Failed to classify news content' });
  }
}

module.exports = {
  classifyNews,
}; 