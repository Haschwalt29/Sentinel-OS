const axios = require('axios');
const Article = require('../models/Article');
const RegionRisk = require('../models/RegionRisk');
const { classifyArticle } = require('./aiService');
const countryList = require('../utils/countries'); // We'll create this file

async function fetchAndClassifyNews() {
  console.log('Starting news fetch and classification...');
  
  for (const country of countryList) {
    try {
      console.log(`Fetching news for ${country.name} (${country.code})...`);
      const articles = await fetchTopHeadlines(country.code);

      for (const article of articles) {
        // Avoid re-classifying old articles
        const existingArticle = await Article.findOne({ url: article.url });
        if (existingArticle) {
          console.log(`Article already exists: ${article.title}`);
          continue;
        }

        console.log(`Classifying: ${article.title}`);
        const classification = await classifyArticle(article.title, article.description);
        
        const newArticle = new Article({
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          sourceName: article.source.name,
          publishedAt: article.publishedAt,
          region: country.code.toUpperCase(),
          classification: classification,
        });

        const savedArticle = await newArticle.save();
        await updateRegionRisk(savedArticle);
      }
    } catch (error) {
      console.error(`Error processing country ${country.code}:`, error.message);
    }
  }
  console.log('Finished news fetch and classification.');
}

async function fetchTopHeadlines(countryCode) {
  const url = `https://newsapi.org/v2/top-headlines?country=${countryCode.toLowerCase()}&apiKey=${process.env.NEWS_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error(`Could not fetch news for ${countryCode}: ${error.response ? error.response.data.message : error.message}`);
    return [];
  }
}

async function updateRegionRisk(article) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { region, classification, _id } = article;

  const riskUpdate = {
    $inc: {
      totalRisk: classification.severity,
      [`riskBreakdown.${classification.category}`]: classification.severity,
    },
    $addToSet: { articleRefs: _id },
  };

  await RegionRisk.findOneAndUpdate(
    { region: region, date: today },
    riskUpdate,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Updated risk score for ${region}`);
}

// Optional: Set up a recurring job
// setInterval(fetchAndClassifyNews, 30 * 60 * 1000); // Every 30 minutes

module.exports = { fetchAndClassifyNews }; 