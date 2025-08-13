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

### 1. Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### 2. Configure Service
- **Name**: sentinel-os-backend
- **Environment**: Node
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Health Check Path**: `/health`

### 3. Set Environment Variables
Add all required environment variables in the Render dashboard.

### 4. Deploy
Click "Create Web Service" to start deployment.

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure all required env vars are set in Render dashboard
   - Check logs for missing variable errors

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Ensure MongoDB Atlas IP whitelist includes Render's IPs

3. **CORS Errors**
   - Set `FRONTEND_URL` to your actual frontend domain
   - Update frontend to use the new backend URL

4. **API Key Issues**
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