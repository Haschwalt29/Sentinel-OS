require('dotenv').config({ path: './.env.dev' });
const fs = require('fs');
console.log('DEBUG: MONGODB_URI:', process.env.MONGODB_URI);
console.log('DEBUG: MONGO_URI:', process.env.MONGO_URI);
console.log('DEBUG: NEWS_API_KEY:', process.env.NEWS_API_KEY);
console.log('DEBUG: Current working directory:', process.cwd());
console.log('DEBUG: env.dev exists:', fs.existsSync('./env.dev'));
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);
console.log('Loaded NEWS_API_KEY:', process.env.NEWS_API_KEY);
const mongoose = require('mongoose');
const axios = require('axios');
const Threat = require('./models/Threat');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

if (!MONGODB_URI || !NEWS_API_KEY) {
  console.error('Missing MONGO_URI (or MONGO_URI) or NEWS_API_KEY in environment variables.');
  process.exit(1);
}

async function backfillThreatURLs() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB.');

    const threats = await Threat.find({ $or: [ { url: { $exists: false } }, { url: null }, { url: '' } ] });
    console.log(`Found ${threats.length} threats with missing URLs.`);

    let updatedCount = 0;

    for (const threat of threats) {
      console.log(`Processing: "${threat.title}"`);
      try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
            q: threat.title,
            language: 'en',
            pageSize: 1,
            apiKey: NEWS_API_KEY,
          },
        });
        const articles = response.data.articles;
        if (articles && articles.length > 0) {
          const article = articles[0];
          threat.url = article.url;
          await threat.save();
          updatedCount++;
          console.log(`  → Updated with URL: ${article.url}`);
        } else {
          console.log('  → No matching article found.');
        }
      } catch (err) {
        console.error(`  → Error processing "${threat.title}":`, err.message);
      }
    }

    console.log(`\nBackfill complete. Updated ${updatedCount} out of ${threats.length} threats.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

backfillThreatURLs(); 