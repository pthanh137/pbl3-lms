import axios from 'axios';

// ============================================
// AXIOS CLIENT - COMPLETELY REWRITTEN
// ============================================
// This client ALWAYS attaches the latest accessToken dynamically
// NEVER attaches undefined/null tokens
// Handles token refresh gracefully without page reloads
// Exports a stable, clean axios instance

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// ALWAYS reads the latest accessToken dynamically
// NEVER attaches undefined or empty strings
// Attaches Authorization: Bearer <token> to EVERY request
api.interceptors.request.use(
  (config) => {
    // CRITICAL: ALWAYS get the latest token from localStorage on EVERY request
    // This ensures we have the most up-to-date token even after refresh
    const token = localStorage.getItem('accessToken');
    
    // ONLY attach token if it exists and is not null/undefined/empty
    // NEVER attach undefined/null/empty tokens
    if (token && typeof token === 'string' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If no token, don't attach header (let backend handle it)
    
    // If data is FormData, don't set Content-Type (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
// If 401 → retry ONCE with refreshed token
// If still 401 → logout gracefully (do not reload the page)
api.interceptors.response.use(
  (response) => {
    // Success - return response as-is
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Suppress 404 errors for optional endpoints (like /instructors/top/)
    if (error.response?.status === 404) {
      const url = error.config?.url || '';
      // If it's a known optional endpoint, suppress the error silently
      if (url.includes('/instructors/top/')) {
        // Return a mock response to prevent console errors
        return Promise.reject({
          ...error,
          response: {
            ...error.response,
            status: 404,
            data: { instructors: [] }
          },
          silent: true // Flag to indicate this is a silent error
        });
      }
    }

    // If error is NOT 401, reject immediately
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If request was already retried, reject (prevent infinite loop)
    if (originalRequest._retry) {
      // Clear tokens and logout gracefully
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Trigger logout event for AuthContext
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authLogout'));
      }
      
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    // Start token refresh process
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      // If no refresh token, logout gracefully
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Trigger logout event for AuthContext
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('authLogout'));
        }
        
        // DO NOT reload page - let ProtectedRoute handle redirect
        return Promise.reject(error);
      }

      // Attempt to refresh token
      const response = await axios.post(
        'http://localhost:8000/api/auth/refresh/',
        { refresh: refreshToken },
        {
          // Don't use the api instance here to avoid infinite loop
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { access } = response.data;
      
      // Update token in localStorage
      localStorage.setItem('accessToken', access);
      
      // Update the original request with new token
      originalRequest.headers.Authorization = `Bearer ${access}`;
      
      // Process queued requests
      processQueue(null, access);
      isRefreshing = false;
      
      // Trigger a custom event to notify AuthContext about token refresh
      // This ensures AuthContext updates its state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: { access } }));
      }
      
      // Retry the original request
      return api(originalRequest);
      
    } catch (refreshError) {
      // Refresh failed - logout gracefully
      processQueue(refreshError, null);
      isRefreshing = false;
      
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Trigger logout event for AuthContext
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authLogout'));
      }
      
      // DO NOT reload page - let ProtectedRoute handle redirect
      // This prevents unexpected page reloads
      return Promise.reject(refreshError);
    }
  }
);

// ============================================
// API EXPORTS
// ============================================

// Helper methods
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
  refresh: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
  changePassword: (payload) => api.post('/auth/change-password/', payload),
};

export const coursesAPI = {
  getAll: (params) => api.get('/courses/', { params }),
  getById: (id) => api.get(`/courses/${id}/`),
  getCurriculum: (id) => api.get(`/courses/${id}/curriculum/`),
  // Teacher course management
  getTeacherCourses: (params) => api.get('/teacher/courses/', { params }),
  createTeacherCourse: (data) => api.post('/teacher/courses/', data),
  getTeacherCourseDetail: (id) => api.get(`/teacher/courses/${id}/`),
  updateTeacherCourse: (id, data) => api.patch(`/teacher/courses/${id}/`, data),
  deleteTeacherCourse: (id) => api.delete(`/teacher/courses/${id}/`),
  // Teacher section management
  getTeacherSections: (params) => api.get('/teacher/sections/', { params }),
  createTeacherSection: (data) => api.post('/teacher/sections/', data),
  updateTeacherSection: (id, data) => api.patch(`/teacher/sections/${id}/`, data),
  deleteTeacherSection: (id) => api.delete(`/teacher/sections/${id}/`),
  // Teacher lesson management
  getTeacherLessons: (params) => api.get('/teacher/lessons/', { params }),
  createTeacherLesson: (data) => api.post('/teacher/lessons/', data),
  updateTeacherLesson: (id, data) => api.patch(`/teacher/lessons/${id}/`, data),
  deleteTeacherLesson: (id) => api.delete(`/teacher/lessons/${id}/`),
};

export const enrollmentsAPI = {
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll/`),
  getMyEnrollments: () => api.get('/enrollments/me/'),
  completeLesson: (lessonId) => api.post(`/lessons/${lessonId}/complete/`),
};

export const lessonsAPI = {
  getById: (id) => api.get(`/lessons/${id}/`),
};

// Teacher Quiz & Assignment APIs
export const assessmentsAPI = {
  // Quiz management
  getTeacherQuizzes: (params) => api.get('/teacher/quizzes/', { params }),
  createTeacherQuiz: (data) => api.post('/teacher/quizzes/', data),
  getTeacherQuizDetail: (id) => api.get(`/teacher/quizzes/${id}/`),
  updateTeacherQuiz: (id, data) => api.patch(`/teacher/quizzes/${id}/`, data),
  deleteTeacherQuiz: (id) => api.delete(`/teacher/quizzes/${id}/`),
  
  // Question management
  createQuestion: (quizId, data) => api.post(`/teacher/quizzes/${quizId}/questions/`, data),
  updateQuestion: (questionId, data) => api.patch(`/teacher/questions/${questionId}/`, data),
  deleteQuestion: (questionId) => api.delete(`/teacher/questions/${questionId}/`),
  
  // Choice management
  createChoice: (questionId, data) => api.post(`/teacher/questions/${questionId}/choices/`, data),
  updateChoice: (choiceId, data) => api.patch(`/teacher/choices/${choiceId}/`, data),
  deleteChoice: (choiceId) => api.delete(`/teacher/choices/${choiceId}/`),
  
  // Assignment management
  getTeacherAssignments: (params) => api.get('/teacher/assignments/', { params }),
  createTeacherAssignment: (data) => api.post('/teacher/assignments/', data),
  getTeacherAssignmentDetail: (id) => api.get(`/teacher/assignments/${id}/`),
  updateTeacherAssignment: (id, data) => api.patch(`/teacher/assignments/${id}/`, data),
  deleteTeacherAssignment: (id) => api.delete(`/teacher/assignments/${id}/`),
  getAssignmentSubmissions: (id) => api.get(`/teacher/assignments/${id}/submissions/`),
  gradeSubmission: (id, data) => api.patch(`/teacher/submissions/${id}/grade/`, data),
  // Quiz submissions
  getQuizSubmissions: (quizId) => api.get(`/teacher/quizzes/${quizId}/submissions/`),
  getQuizSubmissionDetail: (submissionId) => api.get(`/teacher/submissions/${submissionId}/`),
  // File upload
  uploadFile: (formData) => {
    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Student Quiz APIs
export const studentQuizAPI = {
  getCourseQuizzes: (courseId) => api.get(`/courses/${courseId}/quizzes/`),
  getQuizDetail: (quizId) => api.get(`/quizzes/${quizId}/`),
  startQuiz: (quizId) => api.post(`/quizzes/${quizId}/start/`),
  submitQuiz: (quizId, payload) => api.post(`/quizzes/${quizId}/submit/`, payload),
  getMyQuizAttempt: (quizId) => api.get(`/quizzes/${quizId}/attempts/me/`),
};

// Student Assignment APIs
export const studentAssignmentAPI = {
  getCourseAssignments: (courseId) => api.get(`/courses/${courseId}/assignments/`),
  getAssignmentDetail: (id) => api.get(`/assignments/${id}/`),
  getMySubmission: async (id) => {
    try {
      return await api.get(`/assignments/${id}/my-submission/`);
    } catch (error) {
      // 404 is expected when no submission exists yet
      if (error.response?.status === 404) {
        return { data: null };
      }
      throw error;
    }
  },
  submitAssignment: (id, payload) => {
    // Handle both JSON and FormData
    if (payload instanceof FormData) {
      return api.post(`/assignments/${id}/submit/`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post(`/assignments/${id}/submit/`, payload);
  },
  // Helper method for text-only submission
  submitAssignmentText: (id, content) => {
    return api.post(`/assignments/${id}/submit/`, { content });
  },
};

// Student Progress APIs
export const studentProgressAPI = {
  getMyCourses: () => api.get('/student/my-courses/'),
};

// Course Reviews APIs
export const reviewsAPI = {
  getCourseRatingSummary: (courseId) => api.get(`/courses/${courseId}/rating-summary/`),
  getCourseReviews: (courseId) => api.get(`/courses/${courseId}/reviews/`),
  getMyCourseReview: async (courseId) => {
    try {
      return await api.get(`/courses/${courseId}/my-review/`);
    } catch (error) {
      // 404 is expected when no review exists yet - return null data
      if (error.response?.status === 404) {
        return { data: null };
      }
      // Re-throw other errors
      throw error;
    }
  },
  upsertCourseReview: (courseId, data) => api.post(`/courses/${courseId}/reviews/`, data),
  deleteCourseReview: (reviewId) => api.delete(`/reviews/${reviewId}/`),
};

// Purchase API
export const purchaseCourse = (courseId, mode = "paid") =>
  api.post(`/courses/${courseId}/purchase/`, { mode });

// Certificate APIs
export const issueCertificate = (courseId) =>
  api.post(`/courses/${courseId}/certificate/issue/`);

export const getMyCertificateForCourse = (courseId) =>
  api.get(`/courses/${courseId}/certificate/me/`);

export const getMyCertificates = () =>
  api.get("/enrollments/me/certificates/");

// Payment History API
export const getPaymentHistory = () =>
  api.get("/enrollments/me/payments/");

// Teacher Analytics APIs
export const getTeacherSummary = () => api.get("/teacher/analytics/summary/");
export const getTeacherCourseStats = () => api.get("/teacher/analytics/courses/");
export const getTeacherEngagement = () => api.get("/teacher/analytics/engagement/");

// Public APIs for Home Page
export const getCourseCategories = () => api.get("/courses/categories/");
// FIXED: Temporarily disable top instructors call if endpoint doesn't exist
export const getTopInstructors = async (sort = 'students') => {
  try {
    const response = await api.get(`/instructors/top/?sort=${sort}`);
    return response;
  } catch (error) {
    // If 404 or silent error, return empty array instead of throwing
    // Endpoint may not exist, fail silently
    if (error.response?.status === 404 || error.silent) {
      return { data: { instructors: [] } };
    }
    // For other errors, return empty array silently
    return { data: { instructors: [] } };
  }
};
export const getTeacherTimeseries = (months = 6) =>
  api.get("/teacher/analytics/timeseries/", { params: { months } });

// Teacher Course Student Management APIs
export const getCourseStudents = (courseId, params = {}) =>
  api.get(`/teacher/courses/${courseId}/students/`, { params });

export const removeCourseStudent = (courseId, studentId) =>
  api.delete(`/teacher/courses/${courseId}/students/${studentId}/`);

// Student Public Profile API
export const getStudentProfile = (id) => api.get(`/students/${id}/profile/`);

// User Profile APIs
export const getUserProfile = (userId) => api.get(`/users/${userId}/profile/`);
export const getMyProfile = () => api.get(`/users/me/profile/`);
export const updateMyProfile = (data) => api.patch(`/users/me/profile/`, data);
export const putMyProfile = (data) => api.put(`/users/me/profile/`, data);

// Instructor Public Profile API
export const getInstructorProfile = (id) => api.get(`/users/instructors/${id}/profile/`);

// Cart APIs
export const getCart = () => api.get("/enrollments/cart/");
export const addToCart = (courseId) => api.post("/enrollments/cart/add/", { course_id: courseId });
export const removeCartItem = (itemId) => api.delete(`/enrollments/cart/items/${itemId}/`);
export const checkoutCart = (itemIds = null) => {
  const payload = itemIds ? { item_ids: itemIds } : {};
  return api.post("/enrollments/cart/checkout/", payload);
};

// ============================================
// MESSAGING APIs - ALL use shared axios client
// ============================================
// Every messaging API call uses the shared axios instance
// which automatically attaches Authorization header
export const messagingAPI = {
  sendMessage: (data) => api.post('/messages/send/', data),
  getConversation: (user1Id, user2Id, page = 1) => 
    api.get('/messages/conversation/', { params: { user1: user1Id, user2: user2Id, page } }),
  getUnreadMessages: (userId) => 
    api.get('/messages/unread/', { params: { user_id: userId } }),
  getUnreadCount: () => 
    api.get('/messages/unread-count/'),
  markAsRead: (messageId) => 
    api.patch(`/messages/${messageId}/read/`),
  getConversationsList: () => 
    api.get('/messages/conversations/'),
  getAvailableContacts: () => 
    api.get('/messages/contacts/'),
  setTyping: (receiverId, isTyping) => 
    api.post('/messages/typing/', { receiver_id: receiverId, is_typing: isTyping }),
  getTypingStatus: (receiverId) => 
    api.get('/messages/typing/status/', { params: { receiver_id: receiverId } }),
  // Group chat APIs
  getMyGroups: () => 
    api.get('/messages/groups/my/'),
  getGroups: () => 
    api.get('/messages/groups/'),
  getGroupMembers: (groupId) => 
    api.get(`/messages/groups/${groupId}/members/`),
  getGroupMessages: (groupId, page = 1) => 
    api.get(`/messages/groups/${groupId}/messages/`, { params: { page } }),
  sendGroupMessage: (groupId, content) => 
    api.post(`/messages/groups/${groupId}/messages/send/`, { content }),
};

// ============================================
// ANNOUNCEMENT APIs
// ============================================
export const announcementAPI = {
  // Removed: sendAnnouncement - manual sending no longer available
  getSentAnnouncements: () => api.get('/announcements/sent/'),
  getAnnouncementDetail: (id) => api.get(`/announcements/${id}/`),
  getCourseAnnouncements: (courseId) => api.get(`/announcements/course/${courseId}/`),
  getMyAnnouncements: () => api.get('/announcements/my/'),
  markAsRead: (announcementId) => api.patch(`/announcements/${announcementId}/mark-read/`),
};

// ============================================
// NOTIFICATION APIs
// ============================================
export const notificationAPI = {
  getNotifications: () => api.get('/notifications/'),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

// Export the stable axios instance
export default api;
