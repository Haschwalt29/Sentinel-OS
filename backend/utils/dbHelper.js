const mongoose = require('mongoose');
const { connectDB, waitForConnection } = require('../config/db');

/**
 * Ensures database connection is ready before executing database operations
 * @param {number} maxWaitTime - Maximum time to wait for connection in ms (default: 5000)
 * @returns {Promise<boolean>} - Returns true if connected, false if timeout
 */
const ensureConnection = async (maxWaitTime = 5000) => {
  // 1. If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // 2. If connecting (readyState === 2), wait for it to finish
  if (mongoose.connection.readyState === 2) {
    try {
      await waitForConnection(Math.min(maxWaitTime, 4000));
      return mongoose.connection.readyState === 1;
    } catch (error) {
      console.warn('⚠️  Database connection wait timed out while in connecting state');
      return false;
    }
  }

  // 3. If disconnected (0) or uninitialized (99), initiate connection and wait
  try {
    const connectTask = connectDB();
    const waitTask = waitForConnection(maxWaitTime);
    await Promise.race([connectTask, waitTask]);
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('❌ ensureConnection failed:', error.message);
    return false;
  }
};

module.exports = { ensureConnection };
