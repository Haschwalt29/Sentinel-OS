const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not set. Database connection skipped.');
      return false;
    }

    // If already connected, return true
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }

    // Add connection options for better timeout handling
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds to select server
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
    });
    
    // Configure buffer settings to fail faster if connection isn't ready
    mongoose.set('bufferCommands', true); // Keep buffering enabled
    mongoose.set('bufferMaxEntries', 0); // No limit on buffered entries

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Helper function to wait for connection to be ready
const waitForConnection = async (maxWaitTime = 30000) => {
  const startTime = Date.now();
  
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Database connection timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
  }
  
  return true;
};

module.exports = { connectDB, waitForConnection };