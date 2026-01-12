import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Track API activity for idle detection
let lastApiCallTime = Date.now();

// Request interceptor to track API calls
api.interceptors.request.use(
  (config) => {
    lastApiCallTime = Date.now();
    // Dispatch custom event for idle detection
    window.dispatchEvent(new CustomEvent('api-activity'));
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    lastApiCallTime = Date.now();
    window.dispatchEvent(new CustomEvent('api-activity'));
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Export function to get last API call time
export const getLastApiCallTime = () => lastApiCallTime;

export const authAPI = {
  register: (name, email, password, role) =>
    api.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/profile'),
  updateProfileKeywords: (keywords) =>
    api.put('/profile/keywords', { keywords })
};

export const jobAPI = {
  getAllJobs: (params = {}) => api.get('/jobs/all', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs/create', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  closeJob: (id) => api.delete(`/jobs/${id}`),
  getRecruiterJobs: () => api.get('/jobs/recruiter/jobs'),
  applyForJob: (jobId, applicationData) =>
    api.post(`/jobs/${jobId}/apply`, applicationData),
  getApplications: () => api.get('/jobs/applicant/applications'),
  withdrawApplication: (applicationId) => api.delete(`/jobs/application/${applicationId}`),
  getRecommendations: (params = {}) => api.get('/jobs/recommendations', { params }),
  updateApplicationStatus: (appId, status) =>
    api.put(`/jobs/application/${appId}/status`, { status })
};

export const draftAPI = {
  saveDraft: (jobId, formData) => api.post('/drafts', { jobId, formData }),
  getDraft: (jobId) => api.get(`/drafts/${jobId}`),
  deleteDraft: (jobId) => api.delete(`/drafts/${jobId}`),
  getAllDrafts: () => api.get('/drafts')
};

export default api;
