const mongoose = require('mongoose');
const { waitForConnection } = require('../config/db');

/**
 * Ensures database connection is ready before executing database operations
 * @param {number} maxWaitTime - Maximum time to wait for connection in ms (default: 5000)
 * @returns {Promise<boolean>} - Returns true if connected, false if timeout
 */
const ensureConnection = async (maxWaitTime = 5000) => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  // If connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    try {
      await waitForConnection(maxWaitTime);
      return true;
    } catch (error) {
      console.error('❌ Database connection timeout:', error.message);
      return false;
    }
  }
  
  // If disconnected or uninitialized, return false
  console.error(`❌ Database not connected. ReadyState: ${mongoose.connection.readyState}`);
  return false;
};

module.exports = { ensureConnection };

