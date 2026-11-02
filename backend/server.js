const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

// Load env vars - try multiple environment files
try {
  dotenv.config({ path: __dirname + '/.env.dev' });
} catch (error) {
  try {
    dotenv.config({ path: __dirname + '/.env.local' });
  } catch (error2) {
    try {
      dotenv.config({ path: __dirname + '/.env' });
    } catch (error3) {
      dotenv.config();
    }
  }
}

console.log('Environment loaded. OPENCAGE_API_KEY present:', !!process.env.OPENCAGE_API_KEY);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);

// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set these environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('');
  console.error('For local development, create a .env file in the backend directory with:');
  console.error('MONGODB_URI=mongodb://localhost:27017/sentinel-os');
  console.error('');
  console.error('The server will start but database operations will fail.');
}

// Import database connection
const { connectDB, waitForConnection } = require('./config/db');

// Import news services (but don't start them if database is not available)
let startGlobalNewsFetcher, startLocalNewsFetcher;

if (process.env.MONGODB_URI) {
  try {
    const globalNewsFetcher = require('./services/globalNewsFetcher');
    const localNewsFetcher = require('./services/localNewsFetcher');
    
    startGlobalNewsFetcher = globalNewsFetcher.startGlobalNewsFetcher;
    startLocalNewsFetcher = localNewsFetcher.startLocalNewsFetcher;
  } catch (error) {
    console.error('❌ Error loading news services:', error.message);
  }
}

// Connect to database and start services asynchronously
let servicesStarted = false;

function startBackgroundServices() {
  if (servicesStarted) return;
  servicesStarted = true;
  console.log('🚀 Starting background ingestion services...');

  if (startGlobalNewsFetcher) {
    try {
      startGlobalNewsFetcher();
      console.log('✅ Global news fetcher scheduled');
    } catch (error) {
      console.error('❌ Failed to start global news fetcher:', error.message);
    }
  }
  
  if (startLocalNewsFetcher) {
    try {
      startLocalNewsFetcher();
      console.log('✅ Local news fetcher scheduled');
    } catch (error) {
      console.error('❌ Failed to start local news fetcher:', error.message);
    }
  }
}

// Ensure services start when database connects (either immediately or upon reconnect)
mongoose.connection.on('connected', () => {
  startBackgroundServices();
});

if (process.env.MONGODB_URI) {
  (async () => {
    try {
      const connected = await connectDB();
      if (connected) {
        console.log('✅ Database connection confirmed, starting services...');
        startBackgroundServices();
      } else {
        console.log('⏳ Database not ready immediately; background retry will establish connection.');
      }
    } catch (error) {
      console.error('❌ Error during initial database connection attempt:', error.message);
    }
  })();
} else {
  console.log('⚠️  Skipping database connection and news services due to missing MONGODB_URI');
}

const app = express();
const server = createServer(app);

// Initialize Socket.IO with dynamic CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      let allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
      allowedOrigin = allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin;
      
      const originsToAllow = [
        allowedOrigin,
        allowedOrigin + '/'
      ];
      
      if (!origin || originsToAllow.includes(origin)) {
        callback(null, origin);
      } else {
        console.log(`Socket.IO CORS blocked request from: ${origin}`);
        callback(null, false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available globally
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Body parser
app.use(express.json());

// Enable CORS with dynamic origin
app.use(cors({
  origin: function(origin, callback) {
    let allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    allowedOrigin = allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin;
    
    const originsToAllow = [
      allowedOrigin,
      allowedOrigin + '/'
    ];
    
    if (!origin || originsToAllow.includes(origin)) {
      callback(null, origin);
    } else {
      console.log(`CORS blocked request from: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));

// Root endpoint
app.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    message: 'Sentinel OS API',
    version: '1.0.0',
    status: isDbConnected ? 'running' : 'degraded',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      aiFeed: '/api/ai/feed',
      aiAsk: '/api/ai/ask',
      classifyNews: '/api/ai/classify-news',
      admin: '/api/admin'
    },
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected,
    dbReadyState: mongoose.connection.readyState,
    missingEnvVars: missingEnvVars
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    status: isDbConnected ? 'OK' : 'DEGRADED', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected,
    dbReadyState: mongoose.connection.readyState,
    missingEnvVars: missingEnvVars
  });
});

// Mount routers only if database is configured
if (process.env.MONGODB_URI) {
  app.use('/api', require('./routes/api'));
  console.log('✅ API routes mounted');
} else {
  app.use('/api', (req, res) => {
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: 'Database connection not configured. Please set MONGODB_URI environment variable.',
      missingEnvVars: missingEnvVars
    });
  });
  console.log('⚠️  API routes disabled due to missing database connection');
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/health`);
  
  if (missingEnvVars.length > 0) {
    console.log('⚠️  Server is running but some features are disabled due to missing environment variables');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  console.log('Stack trace:', err.stack);
});
