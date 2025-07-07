const cron = require('node-cron');
const axios = require('axios');
const { classifyText, extractLocations } = require('./aiService');
const Threat = require('../models/Threat');
const { getLocationCoordinates } = require('../utils/geocode');

const NEWS_API_KEY = process.env.NEWS_API_KEY;

const fetchAndClassifyGlobalNews = async () => {
  console.log('🌍 Starting global news ingestion cycle...');
  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        language: 'en',
        pageSize: 15,
        apiKey: NEWS_API_KEY,
        q: 'war OR conflict OR attack OR cyberattack OR crisis OR disaster OR terrorism OR political OR economic OR military'
      }
    });

    const articles = response.data.articles;
    let processedCount = 0;

    for (const article of articles) {
      const { title, content, source } = article;

      if (!title || !content) {
        console.log(`⏩ Skipping global article with no title or content.`);
        continue;
      }

      // Prevent duplicate headlines
      const existingThreat = await Threat.findOne({ title });
      if (existingThreat) {
        console.log(`🚫 Duplicate global threat found, skipping: "${title}"`);
        continue;
      }
      
      console.log(`🧠 Classifying global article: "${title}"`);
      
      // Classify text using existing service
      const classificationResult = await classifyText(title, content);
      
      if (!classificationResult || !classificationResult.prediction) {
          console.error(`❌ Failed to classify global article: "${title}"`);
          continue;
      }
      
      // Extract locations using NER
      const locations = await extractLocations(content);
      let coordinates = null;
      let region = null;

      // Geocode the first valid location found
      if (locations && locations.length > 0) {
        for (const loc of locations) {
          const coords = await getLocationCoordinates(loc);
          if (coords) {
            coordinates = coords;
            region = loc; // Use the first found location as region
            break;
          }
        }
      }

      // Save to database
      const newThreat = new Threat({
        title,
        content,
        threatLevel: classificationResult.prediction,
        confidence: classificationResult.confidence,
        type: 'global',
        region: region || 'Global',
        coordinates,
      });

      await newThreat.save();
      console.log(`✅ Successfully saved global threat: "${title}"`);
      
      // Emit socket event for real-time updates
      if (global.io) {
        global.io.emit('new-threat', newThreat);
        console.log('Emitted new global threat event:', newThreat._id);
      }
      
      processedCount++;
    }

    console.log(`🌍 Global news ingestion completed. Processed ${processedCount} articles.`);

  } catch (error) {
    if (error.response) {
      console.error('❌ Global NewsAPI request failed:', error.response.data);
    } else {
      console.error('❌ An error occurred during global news ingestion:', error.message);
    }
  }
};

const startGlobalNewsFetcher = () => {
  // Run every 2 minutes
  cron.schedule('*/2 * * * *', fetchAndClassifyGlobalNews);
  
  // Also run once on startup, after a short delay
  setTimeout(fetchAndClassifyGlobalNews, 10000); 

  console.log('⏰ Global news fetcher scheduled to run every 2 minutes.');
};

module.exports = { startGlobalNewsFetcher, fetchAndClassifyGlobalNews }; 