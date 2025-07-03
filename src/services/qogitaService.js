const axios = require('axios');
const QogitaToken = require('../models/qogitaTokenModel');

// Base URL for Qogita API
const QOGITA_API_URL = 'https://api.qogita.com';

/**
 * Create an axios instance for Qogita API requests
 */
const qogitaApi = axios.create({
  baseURL: QOGITA_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
// Store credentials for re-initialization
let qogitaCredentials = null;

/**
 * Initialize Qogita API authentication
 * This should be called during server startup or before making any Qogita API requests
 * @param {Object} credentials - Email and password
 * @returns {Object} - Access token and user data
 */
exports.initialize = async (credentials) => {
  try {
    console.log('Initializing Qogita API authentication...');

    // Store credentials for potential re-initialization
    qogitaCredentials = { ...credentials };

    const response = await qogitaApi.post('/auth/login/', credentials);
    // Store the token data in the database
    await QogitaToken.create({
      accessToken: response.data.accessToken,
      accessExp: response.data.accessExp,
      user: response.data.user,
      signature: response.data.signature
    });

    // Set up interceptors after successful initialization
    setupInterceptors();

    console.log('Qogita API authentication initialized successfully');
    return response.data;
  } catch (error) {
    console.error('Qogita initialization error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Set up axios interceptors for handling 401 errors
 */
const setupInterceptors = () => {
  // Remove any existing interceptors if they exist
  if (qogitaApi.interceptors.response.handlers && qogitaApi.interceptors.response.handlers.length > 0) {
    qogitaApi.interceptors.response.eject(qogitaApi.interceptors.response.handlers[0]);
  }

  // Add response interceptor
  qogitaApi.interceptors.response.use(
    (response) => response, // Return successful responses as-is
    async (error) => {
      const originalRequest = error.config;

      // If the error is 401 (Unauthorized) and the request hasn't been retried yet
      if (error.response?.status === 401) {
        console.log("status 401")
        try {
          await exports.initialize(qogitaCredentials);
          // Get the new token after re-initialization
          const tokenData = await QogitaToken.findOne().sort({ updatedAt: -1 });
          // Update the authorization header with the new token
          originalRequest.headers['Authorization'] = `Bearer ${tokenData.accessToken}`;
          // Retry the original request with the new token
          return qogitaApi(originalRequest);
        } catch (initError) {
          console.error('Re-initialization failed:', initError.message);
          return Promise.reject(initError);
        }
      }
      // For other errors, just reject the promise
      return Promise.reject(error);
    }
  );
};

/**
 * Refresh the access token
 * @returns {Object} - New access token and user data
 */
exports.refreshToken = async () => {
  try {
    console.log("in refresh")
    // Get the most recent token from the database
    const tokenData = await QogitaToken.findOne().sort({ updatedAt: -1 });

    if (!tokenData) {
      throw new Error('No token found. Please initialize Qogita API first.');
    }

    // Set the authorization header with the current access token
    const response = await qogitaApi.post('/auth/refresh/', {}, {
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`
      }
    });

    console.log(response,'response');

    // Update the token data in the database
    await QogitaToken.findByIdAndUpdate(tokenData._id, {
      accessToken: response.data.accessToken,
      accessExp: response.data.accessExp,
      user: response.data.user,
      signature: response.data.signature
    });

    return response.data;
  } catch (error) {
    console.error('Qogita token refresh error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get the current valid access token, refreshing if necessary
 * @returns {String} - Valid access token
 * @deprecated Use makeAuthenticatedRequest instead which handles token validation internally
 */
exports.getValidAccessToken = async () => {
  try {
    // Get the most recent token from the database
    const tokenData = await QogitaToken.findOne().sort({ updatedAt: -1 });

    if (!tokenData) {
      throw new Error('No token found. Please initialize Qogita API first.');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiresIn = tokenData.accessExp - currentTime;

    // If token is expired or about to expire, refresh it
    if (tokenExpiresIn < 300) {
      console.log('Qogita token is about to expire. Refreshing...');
      await exports.refreshToken();

      // Get the latest token after refresh
      const latestToken = await QogitaToken.findOne().sort({ updatedAt: -1 });
      return latestToken.accessToken;
    }

    return tokenData.accessToken;
  } catch (error) {
    console.error('Error getting valid access token:', error.message);
    throw error;
  }
};

/**
 * Make an authenticated request to the Qogita API
 * @param {String} method - HTTP method (get, post, put, delete)
 * @param {String} endpoint - API endpoint
 * @param {Object} data - Request data (for POST, PUT)
 * @returns {Object} - API response
 */
exports.makeAuthenticatedRequest = async (method, endpoint, data = null) => {
  try {
    // Get a valid access token
    const tokenData = await QogitaToken.findOne().sort({ updatedAt: -1 });

    if (!tokenData) {
      throw new Error('No token found. Please initialize Qogita API first.');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiresIn = tokenData.accessExp - currentTime;

    // If token is expired or about to expire, refresh it
    if (tokenExpiresIn < 300) {
      console.log('Qogita token is about to expire. Refreshing...');
      await exports.refreshToken();
    }

    // Get the latest token (which might be the refreshed one)
    const latestToken = await QogitaToken.findOne().sort({ updatedAt: -1 });
    const accessToken = latestToken.accessToken;

    const config = {
      method,
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
      config.data = data;
    }

    const response = await qogitaApi(config);
    return response.data;
  } catch (error) {
    console.error(`Qogita API request error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};
exports.qogitaApi=qogitaApi
