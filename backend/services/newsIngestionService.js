const cron = require('node-cron');
const axios = require('axios');
const { classifyText, extractLocations } = require('./aiService');
const Threat = require('../models/Threat');
const { getLocationCoordinates } = require('../utils/geocode');
const { ensureConnection } = require('../utils/dbHelper');

const NEWS_API_KEY = process.env.NEWS_API_KEY;

const fetchAndClassifyNews = async () => {
  if (!NEWS_API_KEY) {
    console.log('⚠️  NEWS_API_KEY is missing. Skipping news ingestion.');
    return;
  }

  console.log('📰 Starting news ingestion cycle...');

  // Check database connection before proceeding
  const isConnected = await ensureConnection(5000);
  if (!isConnected) {
    console.error('❌ Database not connected, skipping news ingestion');
    return;
  }

  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        language: 'en',
        pageSize: 10,
        apiKey: NEWS_API_KEY,
        q: 'war OR conflict OR attack OR cyberattack OR crisis OR disaster'
      },
      timeout: 10000
    });

    const articles = response.data?.articles || [];

    for (const article of articles) {
      const { title, content, description } = article;
      const articleContent = content || description;

      if (!title || !articleContent) {
        console.log(`⏩ Skipping article with no title or content.`);
        continue;
      }

      // 1. Prevent duplicate headlines
      try {
        const existingThreat = await Threat.findOne({ title }).maxTimeMS(5000);
        if (existingThreat) {
          console.log(`🚫 Duplicate threat found, skipping: "${title}"`);
          continue;
        }
      } catch (dbError) {
        if (dbError.message && dbError.message.includes('buffering')) {
          console.error('❌ Error checking duplicates: Database connection not ready');
          throw dbError;
        }
        throw dbError;
      }

      console.log(`🧠 Classifying article: "${title}"`);
      // 2. Classify text using existing service
      const classificationResult = await classifyText(title, articleContent);

      if (!classificationResult || !classificationResult.prediction) {
        console.error(`❌ Failed to classify article: "${title}"`);
        continue;
      }

      // 3. Extract location & geocode (never assign random coordinates)
      const locations = await extractLocations(articleContent);
      let coordinates = null;
      let region = 'Global';

      if (locations && locations.length > 0) {
        for (const loc of locations) {
          const coords = await getLocationCoordinates(loc);
          if (coords) {
            coordinates = coords;
            region = loc;
            break;
          }
        }
      }

      // 4. Save to database
      const newThreat = new Threat({
        title,
        content: articleContent,
        threatLevel: classificationResult.prediction,
        confidence: classificationResult.confidence,
        type: 'global',
        region,
        coordinates,
        url: article.url,
      });

      try {
        await newThreat.save();
        console.log(`✅ Successfully saved threat: "${title}"`);
      } catch (saveError) {
        if (saveError.message && saveError.message.includes('buffering')) {
          console.error('❌ Error saving threat: Database connection not ready');
          throw saveError;
        }
        throw saveError;
      }

      // 5. Emit socket event for real-time updates
      if (global.io) {
        global.io.emit('new-threat', newThreat);
        console.log('Emitted new-threat event from news ingestion:', newThreat._id);
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ NewsAPI request failed:', error.response.status, error.response.data?.message || error.response.statusText);
    } else {
      console.error('❌ An error occurred during news ingestion:', error.message);
    }
  }
  console.log('🔄 News ingestion cycle finished.');
};

const startNewsIngestionService = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', fetchAndClassifyNews);
  console.log('⏰ News ingestion service scheduled.');
};

module.exports = { startNewsIngestionService, fetchAndClassifyNews };
