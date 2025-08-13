const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load env vars - try .env.dev first, then fall back to default dotenv behavior
try {
  dotenv.config({ path: __dirname + '/.env.dev' });
} catch (error) {
  // If .env.dev doesn't exist, use default dotenv behavior
  dotenv.config();
}

console.log('Environment loaded. OPENCAGE_API_KEY present:', !!process.env.OPENCAGE_API_KEY);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);

// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set these environment variables in your Render dashboard:');
  missingEnvVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('The server will start but database operations will fail.');
}

// Import database connection
const connectDB = require('./config/db');

// Import news services (but don't start them if database is not available)
let startNewsIngestionService, startGlobalNewsFetcher, startLocalNewsFetcher;

if (process.env.MONGODB_URI) {
  try {
    const newsIngestionService = require('./services/newsIngestionService');
    const globalNewsFetcher = require('./services/globalNewsFetcher');
    const localNewsFetcher = require('./services/localNewsFetcher');
    
    startNewsIngestionService = newsIngestionService.startNewsIngestionService;
    startGlobalNewsFetcher = globalNewsFetcher.startGlobalNewsFetcher;
    startLocalNewsFetcher = localNewsFetcher.startLocalNewsFetcher;
  } catch (error) {
    console.error('❌ Error loading news services:', error.message);
  }
}

// Connect to database only if URI is available
if (process.env.MONGODB_URI) {
  connectDB();
  
  // Start the news ingestion services only if database is connected
  if (startNewsIngestionService) {
    try {
      startNewsIngestionService();
      console.log('✅ News ingestion service started');
    } catch (error) {
      console.error('❌ Failed to start news ingestion service:', error.message);
    }
  }
  
  if (startGlobalNewsFetcher) {
    try {
      startGlobalNewsFetcher();
      console.log('✅ Global news fetcher started');
    } catch (error) {
      console.error('❌ Failed to start global news fetcher:', error.message);
    }
  }
  
  if (startLocalNewsFetcher) {
    try {
      startLocalNewsFetcher();
      console.log('✅ Local news fetcher started');
    } catch (error) {
      console.error('❌ Failed to start local news fetcher:', error.message);
    }
  }
} else {
  console.log('⚠️  Skipping database connection and news services due to missing MONGODB_URI');
}

const app = express();
const server = createServer(app);

// Initialize Socket.IO with dynamic CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Use environment variable
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
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!process.env.MONGODB_URI,
    missingEnvVars: missingEnvVars
  });
});

// Mount routers only if database is available
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
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  // Don't exit the process, just log the error
  console.log('Stack trace:', err.stack);
}); 