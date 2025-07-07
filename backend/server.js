const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { startNewsIngestionService } = require('./services/newsIngestionService');
const { startGlobalNewsFetcher } = require('./services/globalNewsFetcher');
const { startLocalNewsFetcher } = require('./services/localNewsFetcher');

// Load env vars from .env.dev
dotenv.config({ path: __dirname + '/.env.dev' });
console.log('OPENCAGE_API_KEY:', process.env.OPENCAGE_API_KEY);


// Connect to database
connectDB();

// Start the news ingestion services
startNewsIngestionService(); // Legacy service (can be removed later)
startGlobalNewsFetcher(); // New global news fetcher
startLocalNewsFetcher(); // New local news fetcher

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"]
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

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 