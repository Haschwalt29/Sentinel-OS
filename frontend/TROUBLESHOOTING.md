# Sentinel OS Frontend Troubleshooting Guide

## Common Connection Issues

### WebSocket Connection Errors

If you see errors like:
```
WebSocket connection to 'wss://your-render-backend-url.onrender.com/socket.io/?EIO=4&transport=websocket' failed: WebSocket is closed before the connection is established.
```

Or:
```
❌ Socket connection error: Error: timeout
```

### CORS Policy Errors

If you see errors like:
```
Access to XMLHttpRequest at 'https://your-render-backend-url.onrender.com/api/ai/feed?sortBy=createdAt' from origin 'https://sentinel-os.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

These errors occur when the frontend is trying to connect to a placeholder backend URL instead of your actual Render backend service URL. To fix this:

### 1. For Vercel Deployment

1. **Set Environment Variable in Vercel Dashboard:**
   - Go to your project in the Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add a new variable:
     - Name: `VITE_BACKEND_URL`
     - Value: Your actual Render backend URL (e.g., `https://your-actual-backend.onrender.com`)
   - Redeploy your application

2. **Update Vercel.json:**
   - Open `frontend/vercel.json`
   - Replace `BACKEND_URL_PLACEHOLDER` with your actual backend URL in the rewrites section

### 2. For Local Development

1. **Create `.env.local` in the frontend directory with:**
   ```
   VITE_BACKEND_URL=http://localhost:5000
   ```
   (Replace with your local backend URL if different)

### 3. Backend Configuration

Ensure your backend has the correct CORS settings in `server.js`:

```javascript
// In backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://your-frontend-url.vercel.app",
  credentials: true
}));
```

Set the `FRONTEND_URL` environment variable in your Render dashboard to your Vercel app URL.

## Verifying the Fix

After making these changes:

1. The console errors about WebSocket connections should disappear
2. API requests should succeed without CORS errors
3. Socket.IO connections should establish successfully

## Additional Resources

- See `VERCEL_DEPLOYMENT.md` for complete Vercel deployment instructions
- See `DEPLOYMENT.md` for complete Render backend deployment instructions
- Review `.env.production` for environment variable templates