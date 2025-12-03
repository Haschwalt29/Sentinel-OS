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
  
  // If connecting, wait for it (but with a shorter timeout)
  if (mongoose.connection.readyState === 2) {
    try {
      await waitForConnection(Math.min(maxWaitTime, 3000)); // Max 3 seconds for connecting state
      // Double-check it's actually connected
      if (mongoose.connection.readyState === 1) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Database connection timeout:', error.message);
      return false;
    }
  }
  
  // If disconnected (0) or uninitialized (99), don't wait - fail immediately
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  const stateName = stateNames[mongoose.connection.readyState] || `unknown (${mongoose.connection.readyState})`;
  console.error(`❌ Database not connected. ReadyState: ${stateName} (${mongoose.connection.readyState})`);
  
  // If we're disconnected, don't attempt to reconnect here (let the main connection handler do it)
  return false;
};

module.exports = { ensureConnection };

