const mongoose = require('mongoose');

let isConnecting = false;
let connectPromise = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30000;
let listenersInitialized = false;

function initConnectionListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    scheduleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;

  const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
  reconnectAttempts++;
  console.log(`⏳ Scheduling MongoDB reconnection in ${(delay / 1000).toFixed(1)}s (attempt ${reconnectAttempts})...`);
  
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectDB();
    } catch (err) {
      console.error('❌ Reconnect attempt failed:', err.message);
    }
  }, delay);
}

const connectDB = async () => {
  initConnectionListeners();

  // If already connected, return true
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If already in-flight connecting, return existing promise
  if (isConnecting && connectPromise) {
    return connectPromise;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set. Database connection skipped.');
    return false;
  }

  isConnecting = true;
  connectPromise = (async () => {
    try {
      console.log('🔌 Connecting to MongoDB...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      reconnectAttempts = 0;
      return true;
    } catch (error) {
      console.error(`❌ Database connection error: ${error.message}`);
      if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
        console.error('   DNS resolution failed. Check MongoDB URI and network connectivity.');
      } else if (error.message.includes('authentication')) {
        console.error('   Authentication failed. Check MongoDB username and password.');
      } else if (error.message.includes('timeout') || error.name === 'MongooseServerSelectionError') {
        console.error('   Connection timeout / server selection error. Check network and MongoDB Atlas IP access list (0.0.0.0/0).');
      }
      scheduleReconnect();
      return false;
    } finally {
      isConnecting = false;
      connectPromise = null;
    }
  })();

  return connectPromise;
};

// Helper function to wait for connection to be ready
const waitForConnection = async (maxWaitTime = 10000) => {
  if (mongoose.connection.readyState === 1) return true;

  const startTime = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Database connection timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return true;
};

module.exports = { connectDB, waitForConnection };
