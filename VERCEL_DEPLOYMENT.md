# Vercel Frontend Deployment Guide

## Prerequisites
- Vercel account (free tier available)
- Your Render backend URL
- GitHub repository connected to Vercel

## Required Environment Variables

Set these in your Vercel dashboard under Environment Variables:

### Backend URL
- `VITE_BACKEND_URL` - Your Render backend URL (e.g., https://your-app.onrender.com)

## Deployment Steps

### Option 1: Using Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_BACKEND_URL` with your Render backend URL

6. **Deploy**
   - Click "Deploy"

### Option 2: Using Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts and set environment variables**

## Configuration Files

### vercel.json
The `vercel.json` file is already configured with:
- Build settings
- API rewrites (if needed)
- Security headers

### Environment Variables
Create a `.env.production` file in the frontend directory:
```env
VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version is compatible (Vercel uses Node 18+)

2. **API Connection Issues**
   - Verify `VITE_BACKEND_URL` is set correctly
   - Check CORS settings on your Render backend
   - Ensure backend is running and accessible

3. **Socket.IO Connection Issues**
   - Verify WebSocket connections are allowed
   - Check if your Render backend supports WebSockets

4. **Environment Variables Not Loading**
   - Ensure variables start with `VITE_` prefix
   - Redeploy after adding environment variables

### Debugging

1. **Check Build Logs**
   - Go to Vercel dashboard → Project → Deployments
   - Click on deployment to view logs

2. **Check Runtime Logs**
   - Use browser developer tools
   - Check console for API errors

3. **Test API Connection**
   - Visit your backend health endpoint directly
   - Test API calls from browser console

## Post-Deployment

### Update Backend CORS
Make sure your Render backend has the correct CORS settings:

```javascript
// In your backend server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://your-vercel-app.vercel.app",
  credentials: true
}));
```

### Update Environment Variables
Set `FRONTEND_URL` in your Render dashboard to your Vercel app URL.

## Performance Optimization

### Vercel Features
- **Automatic HTTPS**: Enabled by default
- **CDN**: Global content delivery
- **Edge Functions**: Available if needed
- **Analytics**: Built-in performance monitoring

### Build Optimization
- Vite automatically optimizes the build
- Code splitting is enabled
- Assets are compressed

## Monitoring

### Vercel Analytics
- Built-in performance monitoring
- Real user metrics
- Error tracking

### Custom Monitoring
- Add error tracking (Sentry, etc.)
- Monitor API response times
- Track user interactions

## Security

### Headers
The `vercel.json` includes security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

### Environment Variables
- Never commit sensitive data
- Use Vercel's environment variable system
- Rotate API keys regularly 