// For now, this utility provides dummy coordinates as parsing country from a headline is complex.
// In a future version, this could be expanded to map ISO country codes to lat/lng.
const getRandomCoordinates = () => {
  const lat = Math.random() * 180 - 90;   // Latitude from -90 to 90
  const lng = Math.random() * 360 - 180;  // Longitude from -180 to 180
  return { lat, lng };
};

module.exports = { getRandomCoordinates }; 