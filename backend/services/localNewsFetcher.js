const cron = require('node-cron');
const axios = require('axios');
const { classifyText, extractLocations } = require('./aiService');
const Threat = require('../models/Threat');
const { getLocationCoordinates } = require('../utils/geocode');

// For local news, we'll use GNews API (you'll need to add GNEWS_API_KEY to your .env)
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

const fetchAndClassifyLocalNews = async () => {
  console.log('🏘️ Starting local news ingestion cycle...');
  try {
    // Define major cities/regions for local news monitoring
    const localRegions = [
      { name: 'New York', country: 'US' },
      { name: 'Los Angeles', country: 'US' },
      { name: 'Chicago', country: 'US' },
      { name: 'London', country: 'GB' },
      { name: 'Paris', country: 'FR' },
      { name: 'Berlin', country: 'DE' },
      { name: 'Tokyo', country: 'JP' },
      { name: 'Mumbai', country: 'IN' },
      { name: 'Sydney', country: 'AU' },
      { name: 'Toronto', country: 'CA' }
    ];

    let totalProcessed = 0;

    for (const region of localRegions) {
      try {
        // Use GNews API for local news (fallback to NewsAPI if GNews not available)
        let response;
        if (GNEWS_API_KEY) {
          response = await axios.get(`https://gnews.io/api/v4/search`, {
            params: {
              q: `${region.name} AND (crime OR accident OR fire OR protest OR weather OR traffic)` ,
              lang: 'en',
              country: region.country,
              max: 5,
              apikey: GNEWS_API_KEY
            }
          });
        } else {
          // Fallback to NewsAPI with city-specific search
          response = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
              q: `${region.name} AND (crime OR accident OR fire OR protest OR weather OR traffic)` ,
              language: 'en',
              pageSize: 5,
              apiKey: process.env.NEWS_API_KEY,
              sortBy: 'publishedAt'
            }
          });
        }

        const articles = response.data.articles || response.data;
        let regionProcessed = 0;

        for (const article of articles) {
          const { title, content, description } = article;
          const articleContent = content || description;

          if (!title || !articleContent) {
            continue;
          }

          // Prevent duplicate headlines
          const existingThreat = await Threat.findOne({ title });
          if (existingThreat) {
            continue;
          }
          
          console.log(`🧠 Classifying local article from ${region.name}: "${title}"`);
          
          // Classify text using existing service
          const classificationResult = await classifyText(title, articleContent);
          
          if (!classificationResult || !classificationResult.prediction) {
              continue;
          }
          
          // Extract locations using NER
          const locations = await extractLocations(articleContent);
          let coordinates = null;
          let localRegion = region.name;

          // Try to get coordinates for the city first, then any other locations found
          coordinates = await getLocationCoordinates(region.name);
          
          if (locations && locations.length > 0) {
            for (const loc of locations) {
              const coords = await getLocationCoordinates(loc);
              if (coords) {
                coordinates = coords;
                localRegion = `${region.name} > ${loc}`;
                break;
              }
            }
          }

          // If still no coordinates, skip (should be rare with fallback coordinates)
          if (!coordinates) {
            console.error(`❌ Could not determine coordinates for threat: "${title}" in ${region.name}`);
            continue;
          }

          // Save to database
          const newThreat = new Threat({
            title,
            content: articleContent,
            threatLevel: classificationResult.prediction,
            confidence: classificationResult.confidence,
            type: 'local',
            region: localRegion,
            coordinates,
            url: article.url, // <-- Save the article URL
          });

          await newThreat.save();
          console.log(`✅ Successfully saved local threat from ${region.name}: "${title}"`);
          
          // Emit socket event for real-time updates
          if (global.io) {
            global.io.emit('new-threat', newThreat);
            console.log('Emitted new local threat event:', newThreat._id);
          }
          
          regionProcessed++;
          totalProcessed++;
        }

        console.log(`🏘️ Processed ${regionProcessed} articles from ${region.name}`);

        // Add delay between regions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (regionError) {
        console.error(`❌ Error processing ${region.name}:`, regionError.message);
        continue;
      }
    }

    console.log(`🏘️ Local news ingestion completed. Total processed: ${totalProcessed} articles.`);

  } catch (error) {
    console.error('❌ An error occurred during local news ingestion:', error.message);
  }
};

const startLocalNewsFetcher = () => {
  // Run every 9 minutes
  cron.schedule('*/9 * * * *', fetchAndClassifyLocalNews);
  
  // Also run once on startup, after a longer delay than global
  setTimeout(fetchAndClassifyLocalNews, 15000); 

  console.log('⏰ Local news fetcher scheduled to run every 9 minutes.');
};

module.exports = { startLocalNewsFetcher, fetchAndClassifyLocalNews }; 