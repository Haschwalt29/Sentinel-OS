const { fetchAndClassifyGlobalNews } = require('./services/globalNewsFetcher');
const { fetchAndClassifyLocalNews } = require('./services/localNewsFetcher');

function logWithTimestamp(msg) {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
}

// Exponential backoff helper
async function withBackoff(fn, label, initialDelay = 60000, maxDelay = 30 * 60000) {
  let delay = initialDelay;
  while (true) {
    try {
      await fn();
      return;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        logWithTimestamp(`⚠️ Rate limited on ${label}. Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        delay = Math.min(delay * 2, maxDelay);
      } else {
        logWithTimestamp(`❌ Error in ${label}: ${err.message}`);
        return;
      }
    }
  }
}

// Global News (NewsAPI) - every 15 minutes
setTimeout(() => {
  setInterval(() => {
    logWithTimestamp('🌍 Starting global news ingestion cycle...');
    withBackoff(fetchAndClassifyGlobalNews, 'Global News');
  }, 15 * 60 * 1000);
}, 0); // Start immediately

// Local News (GNews) - every 9 minutes, staggered by 1 minute
setTimeout(() => {
  setInterval(() => {
    logWithTimestamp('🏘️ Starting local news ingestion cycle...');
    withBackoff(fetchAndClassifyLocalNews, 'Local News');
  }, 9 * 60 * 1000);
}, 60 * 1000); // Start after 1 minute

logWithTimestamp('🕑 News scheduler started: Global every 15 min, Local every 9 min (staggered)'); 