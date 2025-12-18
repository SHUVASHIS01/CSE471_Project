import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

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
  register: (name, email, password, role, companyId = null) =>
    api.post('/auth/register', { name, email, password, role, companyId }),
  login: (email, password, additionalData = {}) =>
    api.post('/auth/login', { email, password, ...additionalData }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/profile'),
  updateProfileKeywords: (keywords) =>
    api.put('/profile/keywords', { keywords }),
  updateProfile: (formData) =>
    api.put('/profile', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updateCompanyProfile: (formData) =>
    api.put('/profile/company', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updatePassword: (currentPassword, newPassword) =>
    api.put('/profile/password', { currentPassword, newPassword }),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  verifyResetToken: (email, token) =>
    api.post('/auth/verify-reset-token', { email, token }),
  resetPassword: (email, token, newPassword) =>
    api.post('/auth/reset-password', { email, token, newPassword })
};

export const jobAPI = {
  getAllJobs: (params = {}) => api.get('/jobs/all', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs/create', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  closeJob: (id) => api.put(`/jobs/${id}/close`),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getRecruiterJobs: () => api.get('/jobs/recruiter/jobs'),
  getMyJobs: () => api.get('/jobs/recruiter/my-jobs'),
  applyForJob: (jobId, applicationData) =>
    api.post(`/jobs/${jobId}/apply`, applicationData, {
      headers: applicationData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  getApplications: () => api.get('/jobs/applicant/applications'),
  withdrawApplication: (applicationId) => api.delete(`/jobs/application/${applicationId}`),
  getRecommendations: (params = {}) => api.get('/jobs/recommendations', { params }),
  getJobApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (appId, status) =>
    api.put(`/jobs/application/${appId}/status`, { status }),
  compareCandidates: (jobId, candidateIds) =>
    api.post(`/jobs/${jobId}/compare-candidates`, { candidateIds }),
  getApplicationResume: (applicationId) => 
    api.get(`/jobs/application/${applicationId}/resume`, { responseType: 'blob' }),
  // Feedback endpoints
  submitRecruiterFeedback: (applicationId, feedbackData) =>
    api.post(`/jobs/application/${applicationId}/recruiter-feedback`, feedbackData),
  submitApplicantFeedback: (applicationId, feedbackData) =>
    api.post(`/jobs/application/${applicationId}/applicant-feedback`, feedbackData),
  getApplicationFeedback: (applicationId) =>
    api.get(`/jobs/application/${applicationId}/feedback`),
  getFeedbackStatus: (applicationId) =>
    api.get(`/jobs/application/${applicationId}/feedback-status`),
  getApplicantFeedback: (jobId, applicationId) =>
    api.get(`/jobs/job/${jobId}/feedback/${applicationId}`),
  getJobFeedbacks: (jobId) =>
    api.get(`/jobs/job/${jobId}/feedbacks`),
  getRecruiterFeedbacks: () =>
    api.get('/jobs/recruiter/feedbacks'),
  getRecruiterFeedbackCount: () =>
    api.get('/jobs/recruiter/feedbacks/count'),
  getCompanyAnalytics: (companyId) => api.get(`/jobs/company/${companyId}/analytics`),
  // Saved jobs endpoints
  saveJob: (jobId) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId) => api.delete(`/jobs/${jobId}/unsave`),
  getSavedJobs: () => api.get('/jobs/applicant/saved'),
  checkIfSaved: (jobId) => api.get(`/jobs/${jobId}/is-saved`)
};

export const companyAPI = {
  getCompanies: () => api.get('/companies'),
  getCompaniesPublic: () => api.get('/companies/public'), // Public endpoint for signup dropdown
  getAllCompanies: () => api.get('/companies/all'), // For applicants to browse all companies
  getCompany: (id) => api.get(`/companies/${id}`),
  getCompanyDetails: (id) => api.get(`/companies/${id}/details`), // For applicants to view company details
  getCompanyAnalytics: (id) => api.get(`/companies/${id}/analytics`), // For applicants to view company analytics
  createCompany: (formData) =>
    api.post('/companies', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updateCompany: (id, formData) =>
    api.put(`/companies/${id}`, formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    })
};

export const draftAPI = {
  saveDraft: (jobId, formData) => api.post('/drafts', { jobId, formData }),
  getDraft: (jobId) => api.get(`/drafts/${jobId}`),
  deleteDraft: (jobId) => api.delete(`/drafts/${jobId}`),
  getAllDrafts: () => api.get('/drafts')
};

export const interviewQuestionAPI = {
  getQuestions: (jobId) => api.get(`/jobs/${jobId}/questions`),
  addQuestion: (jobId, question, answer = '') => api.post(`/jobs/${jobId}/questions`, { question, answer }),
  updateQuestion: (jobId, questionId, question, answer = null) => api.put(`/jobs/${jobId}/questions/${questionId}`, { question, answer }),
  updateAnswer: (jobId, questionId, answer) => api.put(`/jobs/${jobId}/questions/${questionId}/answer`, { answer }),
  deleteQuestion: (jobId, questionId) => api.delete(`/jobs/${jobId}/questions/${questionId}`)
};

export const loginActivityAPI = {
  getLoginHistory: (limit = 50) => api.get(`/login-activity/history`, { params: { limit } }),
  getSuspiciousLogins: () => api.get(`/login-activity/suspicious`),
  getLoginStats: () => api.get(`/login-activity/stats`),
  acknowledgeLogin: (loginId) => api.put(`/login-activity/${loginId}/acknowledge`)
};

export const resumeAPI = {
  uploadResume: (formData) =>
    api.post('/resumes/upload', formData, {
      // Don't set Content-Type header - let axios set it automatically with boundary
      timeout: 30000 // 30 seconds timeout for file uploads
    }),
  getResumes: () => api.get('/resumes'),
  getResume: (id) => api.get(`/resumes/${id}`),
  updateResume: (id, data) => api.put(`/resumes/${id}`, data),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  setDefaultResume: (id) => api.put(`/resumes/${id}/set-default`),
  bulkDeleteResumes: (resumeIds) => api.post('/resumes/bulk-delete', { resumeIds })
};

export const achievementAPI = {
  getAchievements: (params = {}) => api.get('/achievements', { params }),
  getAchievement: (id) => api.get(`/achievements/${id}`),
  createAchievement: (data) => api.post('/achievements', data),
  updateAchievement: (id, data) => api.put(`/achievements/${id}`, data),
  deleteAchievement: (id) => api.delete(`/achievements/${id}`),
  getStats: () => api.get('/achievements/stats'),
  bulkImport: (achievements) => api.post('/achievements/bulk-import', { achievements }),
  exportAchievements: () => api.get('/achievements/export'),
  getPublicAchievements: (applicantId) => api.get(`/achievements/public/${applicantId}`)
};

export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteOldNotifications: (daysOld = 30) => api.delete(`/notifications/old/cleanup?daysOld=${daysOld}`)
};

export const notesAPI = {
  getNotes: () => api.get('/notes'),
  createNote: (content, jobId = null) => api.post('/notes', { content, jobId }),
  updateNote: (noteId, content, jobId = null) => api.put(`/notes/${noteId}`, { content, jobId }),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`)
};

export const careerQuizAPI = {
  getQuestions: () => api.get('/career-quiz/questions'),
  submitQuiz: (answers) => api.post('/career-quiz/submit', { answers })
};

export default api;
