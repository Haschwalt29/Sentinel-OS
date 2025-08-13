# Deployment Guide for Render

## Prerequisites
- MongoDB database (MongoDB Atlas recommended)
- API keys for required services

## Required Environment Variables

Set these in your Render dashboard under Environment Variables:

### Database
- `MONGODB_URI` - Your MongoDB connection string

### AI Services
- `COHERE_API_KEY` - Your Cohere AI API key

### News APIs
- `NEWS_API_KEY` - NewsAPI.org API key
- `GNEWS_API_KEY` - GNews API key (optional, for local news)

### Geocoding
- `OPENCAGE_API_KEY` - OpenCage Geocoding API key

### Frontend URL
- `FRONTEND_URL` - Your frontend URL (e.g., https://your-app.netlify.app)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)
1. Push the `render.yaml` file to your repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect and use the `render.yaml` configuration

### Option 2: Manual Configuration
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: sentinel-os-backend
   - **Environment**: Node
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `npm run start-direct`
   - **Health Check Path**: `/health`

### 3. Set Environment Variables
Add all required environment variables in the Render dashboard.

### 4. Deploy
Click "Create Web Service" to start deployment.

## Troubleshooting

### Common Issues

1. **"Cannot find module 'express'" Error**
   - **Solution**: The build script ensures backend dependencies are installed
   - Make sure the `build.sh` script is executable and runs during build

2. **"Missing script: start" Error**
   - **Solution**: Use `npm run start-direct` as the start command
   - This bypasses the need for npm start in the backend directory

3. **Environment Variables Not Loading**
   - Ensure all required env vars are set in Render dashboard
   - Check logs for missing variable errors

4. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Ensure MongoDB Atlas IP whitelist includes Render's IPs

5. **CORS Errors**
   - Set `FRONTEND_URL` to your actual frontend domain
   - Update frontend to use the new backend URL

6. **API Key Issues**
   - Verify all API keys are valid and have sufficient credits
   - Check API rate limits

### Health Check
Visit `https://your-render-url.onrender.com/health` to verify the service is running.

## Frontend Configuration

Update your frontend API calls to use the new Render URL:

```javascript
// In frontend/src/services/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-render-url.onrender.com' 
  : 'http://localhost:5000';
```

## Build Process

The deployment process works as follows:
1. **Build**: `chmod +x build.sh && ./build.sh` → 
   - Installs root dependencies
   - Installs backend dependencies
2. **Start**: `npm run start-direct` → Directly runs `node server.js` in backend directory

## Alternative Build Commands

If the build script doesn't work, you can also try these manual commands in Render:

- **Build Command**: `npm install && cd backend && npm install`
- **Start Command**: `cd backend && node server.js` 