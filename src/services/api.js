import axios from 'axios';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10-second timeout
});

// Track API call status
let lastApiCallFailed = false;

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Reset API failure flag on successful response
    if (lastApiCallFailed) {
      lastApiCallFailed = false;
      // Could trigger an event or dispatch a store action
      // to show that the API is available again
    }
    return response;
  },
  (error) => {
    // Track API failure
    lastApiCallFailed = true;
    
    // IMPORTANT: Check if we're currently in the chat/conversation page
    // If so, NEVER logout the user regardless of error
    const isInChatPage = window.location.pathname.includes('/conversation');
    
    // If we're in the chat page, just log the error but don't logout
    if (isInChatPage) {
      console.log('Error occurred in chat page, preventing logout');
      
      // Just return a rejection without logging out
      return Promise.reject({
        isHandled: true,
        originalError: error,
        message: 'Error occurred but logout prevented'
      });
    }
    
    // For non-chat pages, handle auth errors normally
    if (error.response && error.response.status === 401 && !isInChatPage) {
      console.log('401 Unauthorized error detected');
      
      // DISABLE AUTO-LOGOUT COMPLETELY FOR NOW
      console.log('Auto-logout disabled for stability');
      
      // Log the error but don't redirect
      console.error('Auth error:', error.response.data);
      
      /* DISABLED LOGOUT CODE
      // Clear localStorage and redirect to login page if not already there
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('hasSetupAccount');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      */
    }
    
    // Special handling for network errors - don't log out
    if (!error.response && error.request) {
      console.error('Network Error - No response received');
      // Return a customized error to prevent component crashes
      return Promise.reject({
        isNetworkError: true,
        message: 'Network connection issue, please try again later'
      });
    }
    
    // Log all API errors for debugging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    // No fallback mechanism - always reject the promise
    return Promise.reject(error);
  }
);

// Export the api instance for direct use
export const apiClient = api;

export default {
  // Auth endpoints
  auth: {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (userData) => api.put('/auth/updatedetails', userData),
    logout: () => api.post('/auth/logout'),
  },

  // Business endpoints
  business: {
    setup: (businessData) => api.put('/business/setup', businessData),
    update: (businessData) => api.put('/business', businessData),
    get: () => api.get('/business'),
  },

  // Transaction endpoints
  transactions: {
    getAll: (params) => api.get('/transactions', { params }),
    get: (id) => api.get(`/transactions/${id}`),
    create: (transaction) => api.post('/transactions', transaction),
    update: (id, transaction) => api.put(`/transactions/${id}`, transaction),
    delete: (id) => api.delete(`/transactions/${id}`),
    getSummary: (params) => api.get('/transactions/summary', { params }),
  },

  // Messages endpoints
  messages: {
    getAll: (params) => api.get('/messages', { params }),
    create: (message) => api.post('/messages', message),
    createBatch: (messages) => api.post('/messages/batch', { messages }),
    deleteAll: () => api.delete('/messages'),
  },
};