import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    // In production, use the Render backend URL
    return import.meta.env.VITE_BACKEND_URL || 'https://your-render-backend-url.onrender.com/api';
  } else {
    // In development, use the proxy
    return '/api';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Enable credentials for CORS
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for better error handling
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api; 