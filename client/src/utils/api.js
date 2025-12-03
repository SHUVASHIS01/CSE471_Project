/**
 * API Service
 *
 * Centralized API service for making HTTP requests to the backend.
 * Handles request configuration, error handling, and response formatting.
 */

import axios from 'axios';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Add authentication token or other headers before request is sent
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handle responses and errors globally
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly from successful responses
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('Bad Request:', data.message || data.error);
          break;
        case 401:
          console.error('Unauthorized:', data.message || data.error);
          // Could redirect to login page here
          break;
        case 403:
          console.error('Forbidden:', data.message || data.error);
          break;
        case 404:
          console.error('Not Found:', data.message || data.error);
          break;
        case 500:
          console.error('Server Error:', data.message || data.error);
          break;
        default:
          console.error('Error:', data.message || data.error);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server. Please check your connection.');
    } else {
      // Error in request configuration
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Jobs API Service
 */
export const jobsAPI = {
  /**
   * Fetch jobs with filters and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.title - Filter by job title
   * @param {string} params.location - Filter by location
   * @param {string} params.keywords - Filter by keywords (comma-separated)
   * @param {string} params.q - General search query
   * @param {string} params.sortBy - Sort order (recent, salary_high, salary_low, relevant)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} Promise resolving to jobs data
   */
  getJobs: async (params = {}) => {
    try {
      // Remove empty parameters
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await apiClient.get('/api/jobs', { params: cleanParams });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch a single job by ID
   * @param {string} id - Job ID
   * @returns {Promise} Promise resolving to job data
   */
  getJobById: async (id) => {
    try {
      const response = await apiClient.get(`/api/jobs/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job statistics
   * @returns {Promise} Promise resolving to statistics data
   */
  getJobStats: async () => {
    try {
      const response = await apiClient.get('/api/jobs/stats/summary');
      return response;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Health check API
 */
export const healthAPI = {
  /**
   * Check server health
   * @returns {Promise} Promise resolving to health status
   */
  check: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Generic API methods for custom requests
 */
export const api = {
  /**
   * Make GET request
   * @param {string} url - Request URL
   * @param {Object} config - Axios config
   * @returns {Promise} Promise resolving to response data
   */
  get: (url, config = {}) => apiClient.get(url, config),

  /**
   * Make POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   * @returns {Promise} Promise resolving to response data
   */
  post: (url, data, config = {}) => apiClient.post(url, data, config),

  /**
   * Make PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   * @returns {Promise} Promise resolving to response data
   */
  put: (url, data, config = {}) => apiClient.put(url, data, config),

  /**
   * Make DELETE request
   * @param {string} url - Request URL
   * @param {Object} config - Axios config
   * @returns {Promise} Promise resolving to response data
   */
  delete: (url, config = {}) => apiClient.delete(url, config),

  /**
   * Make PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   * @returns {Promise} Promise resolving to response data
   */
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
};

/**
 * Export configured axios instance for advanced use cases
 */
export default apiClient;
