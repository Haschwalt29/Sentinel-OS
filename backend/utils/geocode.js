const axios = require('axios');

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
const GEOCODE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

/**
 * Geocodes a location string to latitude and longitude.
 * @param {string} locationName - The name of the location to geocode (e.g., "Paris, France").
 * @returns {Promise<{lat: number, lng: number}|null>} - The coordinates object or null if not found.
 */
const geocodeLocation = async (locationName) => {
  if (!OPENCAGE_API_KEY) {
    console.error('❌ OpenCage API key is missing. Skipping geocoding.');
    return null;
  }

  try {
    const response = await axios.get(GEOCODE_API_URL, {
      params: {
        q: locationName,
        key: OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry;
      console.log(`✅ Geocoded "${locationName}" to { lat: ${lat}, lng: ${lng} }`);
      return { lat, lng };
    } else {
      console.log(`🟡 No geocoding results for "${locationName}"`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error geocoding "${locationName}":`, error.response ? error.response.data : error.message);
    return null;
  }
};

module.exports = { geocodeLocation }; 