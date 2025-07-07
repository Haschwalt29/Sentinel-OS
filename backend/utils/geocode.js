const axios = require('axios');

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
const GEOCODE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

// Fallback coordinates for major cities
const FALLBACK_COORDINATES = {
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'san jose': { lat: 37.3382, lng: -121.8863 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'moscow': { lat: 55.7558, lng: 37.6176 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'beijing': { lat: 39.9042, lng: 116.4074 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'montreal': { lat: 45.5017, lng: -73.5673 }
};

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

/**
 * Gets coordinates for a location, with fallback to predefined coordinates for major cities.
 * @param {string} locationName - The name of the location.
 * @returns {Promise<{lat: number, lng: number}|null>} - The coordinates object or null if not found.
 */
const getLocationCoordinates = async (locationName) => {
  if (!locationName) return null;
  
  // First try geocoding
  const geocoded = await geocodeLocation(locationName);
  if (geocoded) return geocoded;
  
  // Fallback to predefined coordinates
  const normalizedName = locationName.toLowerCase().trim();
  for (const [city, coords] of Object.entries(FALLBACK_COORDINATES)) {
    if (normalizedName.includes(city)) {
      console.log(`📍 Using fallback coordinates for "${locationName}": { lat: ${coords.lat}, lng: ${coords.lng} }`);
      return coords;
    }
  }
  
  console.log(`❌ No coordinates found for "${locationName}"`);
  return null;
};

module.exports = { geocodeLocation, getLocationCoordinates }; 