import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    // In production, use the Render backend URL
    return import.meta.env.VITE_BACKEND_URL || 'https://your-render-url.onrender.com/api';
  } else {
    // In development, use the proxy
    return '/api';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Enable credentials for CORS
});

export default api; 