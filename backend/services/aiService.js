// Load environment variables - try .env.dev first, then fall back to default
try {
  require("dotenv").config({ path: __dirname + "/../.env.dev" });
} catch (error) {
  // If .env.dev doesn't exist, use default dotenv behavior
  require("dotenv").config();
}

const { CohereClient } = require('cohere-ai');

// Initialize clients
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY ? new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Simple pattern-based classifier as fallback
function classifyTextPattern(title, content) {
  const text = (title + ' ' + (content || '')).toLowerCase();
  
  // High threat keywords
  const highThreatKeywords = ['attack', 'killed', 'crash', 'disaster', 'terror', 'war', 'bombing', 'shooting', 'explosion', 'fatal', 'casualties', 'death', 'severe', 'emergency'];
  // Medium threat keywords  
  const mediumThreatKeywords = ['accident', 'fire', 'protest', 'danger', 'warning', 'crime', 'alert', 'threat', 'incident', 'injured', 'hospitalized'];

  const highThreatCount = highThreatKeywords.filter(kw => text.includes(kw)).length;
  const mediumThreatCount = mediumThreatKeywords.filter(kw => text.includes(kw)).length;

  let prediction = 'No Threat';
  let confidence = 0.6;

  if (highThreatCount > 0) {
    prediction = 'High Threat';
    confidence = Math.min(0.95, 0.7 + (highThreatCount * 0.1));
  } else if (mediumThreatCount > 0) {
    prediction = 'Medium Threat';
    confidence = Math.min(0.9, 0.6 + (mediumThreatCount * 0.1));
  }

  return { prediction, confidence };
}

async function askAI(prompt) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      maxTokens: 100,
      temperature: 0.8,
    });

    return response.message.content[0].text.trim();
  } catch (err) {
    console.error("🛑 Cohere error:", err.message);
    return "Sorry, I couldn't process that.";
  }
}

async function classifyText(title, content) {
  try {
    // Use pattern-based classification as primary method (fast and reliable)
    return classifyTextPattern(title, content);
  } catch (err) {
    console.error('Classification error, using default:', err.message);
    // Fallback to neutral classification
    return { prediction: 'Medium Threat', confidence: 0.5 };
  }
}

/**
 * Compatibility adapter for legacy newsService.js
 */
async function classifyArticle(title, description) {
  const res = await classifyText(title, description);
  let severity = 2;
  let category = 'other';
  if (res.prediction === 'High Threat') severity = 8;
  else if (res.prediction === 'Medium Threat') severity = 5;
  
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (text.includes('cyber') || text.includes('hack')) category = 'cyber';
  else if (text.includes('war') || text.includes('military') || text.includes('conflict') || text.includes('attack')) category = 'conflict';
  else if (text.includes('economy') || text.includes('bank') || text.includes('market') || text.includes('price')) category = 'economic';
  else if (text.includes('protest') || text.includes('minister') || text.includes('election') || text.includes('political')) category = 'political';
  else if (text.includes('fire') || text.includes('flood') || text.includes('storm') || text.includes('disaster') || text.includes('quake')) category = 'environmental';
  else if (text.includes('health') || text.includes('virus') || text.includes('hospital') || text.includes('disease')) category = 'health';
  
  return {
    category,
    severity,
    prediction: res.prediction,
    confidence: res.confidence
  };
}

/**
 * Extracts location entities from text using pattern matching.
 * @param {string} text - The text to analyze.
 * @returns {Promise<string[]>} - An array of unique location names.
 */
async function extractLocations(text) {
  try {
    console.log('NER: Extracting locations...');
    
    // Common location name pattern - capitalized words that might be places
    // This is a simple heuristic that works reasonably well
    const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const matches = text.match(locationPattern) || [];
    
    // Filter out common non-location capitalized words
    const commonWords = new Set(['The', 'A', 'And', 'Or', 'But', 'In', 'On', 'At', 'By', 'For', 'With', 'Of', 'To', 'From', 'According', 'Reuters', 'Associated', 'Press', 'AP', 'Police', 'Officials', 'Sources', 'Report', 'Says', 'Said', 'Reported', 'According', 'Local', 'National', 'State', 'City', 'County', 'District', 'Video', 'Photo', 'Image', 'Breaking', 'Update', 'News', 'Alert', 'Emergency']);
    
    const locations = matches.filter(word => !commonWords.has(word));
    const uniqueLocations = [...new Set(locations)].slice(0, 10); // Limit to top 10
    
    if(uniqueLocations.length > 0) {
        console.log(`NER: Found locations: ${uniqueLocations.join(', ')}`);
    } else {
        console.log('NER: No locations found.');
    }
    
    return uniqueLocations;
  } catch (err) {
    console.error('extractLocations error:', err);
    return []; // Return empty array on error
  }
}

module.exports = { 
  askAI, 
  askCohere: askAI, 
  classifyText, 
  classifyArticle, 
  extractLocations 
};
