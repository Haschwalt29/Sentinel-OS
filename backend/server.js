const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { startNewsIngestionService } = require('./services/newsIngestionService');
const { startGlobalNewsFetcher } = require('./services/globalNewsFetcher');
const { startLocalNewsFetcher } = require('./services/localNewsFetcher');

// Load env vars - try .env.dev first, then fall back to default dotenv behavior
try {
  dotenv.config({ path: __dirname + '/.env.dev' });
} catch (error) {
  // If .env.dev doesn't exist, use default dotenv behavior
  dotenv.config();
}

console.log('Environment loaded. OPENCAGE_API_KEY present:', !!process.env.OPENCAGE_API_KEY);

// Connect to database
connectDB();

// Start the news ingestion services
startNewsIngestionService(); // Legacy service (can be removed later)
startGlobalNewsFetcher(); // New global news fetcher
startLocalNewsFetcher(); // New local news fetcher

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routers
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 