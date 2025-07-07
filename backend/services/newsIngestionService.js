const cron = require('node-cron');
const axios = require('axios');
const { classifyText } = require('./aiService');
const Threat = require('../models/Threat');
const { getRandomCoordinates } = require('../utils/countryCoordinates');

const NEWS_API_KEY = process.env.NEWS_API_KEY;

const fetchAndClassifyNews = async () => {
  console.log('📰 Starting news ingestion cycle...');
  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        language: 'en',
        pageSize: 10, // Fetch a few more to increase chances of finding unique ones
        apiKey: NEWS_API_KEY,
        q: 'war OR conflict OR attack OR cyberattack OR crisis OR disaster' // Keywords to get relevant news
      }
    });

    const articles = response.data.articles;

    for (const article of articles) {
      const { title, content } = article;

      if (!title || !content) {
        console.log(`⏩ Skipping article with no title or content.`);
        continue;
      }

      // 1. Prevent duplicate headlines
      const existingThreat = await Threat.findOne({ title });
      if (existingThreat) {
        console.log(`🚫 Duplicate threat found, skipping: "${title}"`);
        continue;
      }
      
      console.log(`🧠 Classifying article: "${title}"`);
      // 2. Classify text using existing service
      const classificationResult = await classifyText(title, content);
      
      if (!classificationResult || !classificationResult.prediction) {
          console.error(`❌ Failed to classify article: "${title}"`);
          continue;
      }
      
      // 3. Get coordinates (dummy for now)
      const coordinates = getRandomCoordinates();

      // 4. Save to database
      const newThreat = new Threat({
        title,
        content,
        threatLevel: classificationResult.prediction,
        confidence: classificationResult.confidence,
        coordinates,
      });

      await newThreat.save();
      console.log(`✅ Successfully saved threat: "${title}"`);
      
      // 5. Emit socket event for real-time updates
      if (global.io) {
        global.io.emit('new-threat', newThreat);
        console.log('Emitted new-threat event from news ingestion:', newThreat._id);
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ NewsAPI request failed:', error.response.data);
    } else {
      console.error('❌ An error occurred during news ingestion:', error.message);
    }
  }
  console.log('🔄 News ingestion cycle finished.');
};


const startNewsIngestionService = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', fetchAndClassifyNews);
  
  // Also run once on startup, after a short delay
  setTimeout(fetchAndClassifyNews, 5000); 

  console.log('⏰ News ingestion service scheduled to run every 10 minutes.');
};

module.exports = { startNewsIngestionService }; 