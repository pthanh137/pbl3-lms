import { create } from 'zustand';
import { announcementAPI } from '../../../api/client';

// ============================================
// ANNOUNCEMENT STORE - ZUSTAND
// ============================================
// Manages announcement state for both teachers and students
// Supports pagination, optimistic UI updates

const useAnnouncementStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  announcements: [], // Always initialize as array
  sentAnnouncements: [], // Teacher's sent announcements
  myAnnouncements: [], // Student's received announcements
  announcementDetail: null, // Current announcement detail
  courseAnnouncements: {}, // { courseId: [announcements] }
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
  
  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Load announcements for a specific course
   * @param {number} courseId - Course ID
   */
  loadAnnouncements: async (courseId) => {
    if (!courseId) {
      set({ error: 'Course ID is required' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const response = await announcementAPI.getCourseAnnouncements(courseId);
      const announcements = response.data || [];
      
      set((state) => ({
        courseAnnouncements: {
          ...state.courseAnnouncements,
          [courseId]: announcements,
        },
        loading: false,
        error: null,
      }));
      
      return announcements;
    } catch (error) {
      console.error('Failed to load announcements:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to load announcements';
      
      set({ 
        loading: false, 
        error: errorMessage,
      });
      
      throw error;
    }
  },
  
  /**
   * Load teacher's sent announcements
   */
  loadSentAnnouncements: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await announcementAPI.getSentAnnouncements();
      
      // Handle different response formats
      let announcements = [];
      if (Array.isArray(response.data)) {
        announcements = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        announcements = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        announcements = response.data.data;
      }
      
      set({ 
        sentAnnouncements: Array.isArray(announcements) ? announcements : [],
        loading: false,
        error: null,
      });
      
      return announcements;
    } catch (error) {
      console.error('Failed to load sent announcements:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to load sent announcements';
      
      set({ 
        loading: false, 
        error: errorMessage,
      });
      
      throw error;
    }
  },
  
  /**
   * Load my announcements (all for student, sent for teacher)
   */
  loadMyAnnouncements: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await announcementAPI.getMyAnnouncements();
      
      // Handle different response formats
      let announcements = [];
      if (Array.isArray(response.data)) {
        announcements = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        announcements = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        announcements = response.data.data;
      } else if (response.data) {
        // If response.data exists but is not an array, try to extract it
        console.warn('Unexpected response format:', response.data);
        announcements = [];
      }
      
      set({ 
        myAnnouncements: Array.isArray(announcements) ? announcements : [],
        announcements: Array.isArray(announcements) ? announcements : [], // Keep for backward compatibility
        loading: false,
        error: null,
        hasMore: false, // Assuming no pagination for now
      });
      
      return announcements;
    } catch (error) {
      console.error('Failed to load my announcements:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to load announcements';
      
      set({ 
        loading: false, 
        error: errorMessage,
      });
      
      throw error;
    }
  },
  
  /**
   * Load announcement detail
   * @param {number} id - Announcement ID
   */
  loadAnnouncementDetail: async (id) => {
    if (!id) {
      set({ error: 'Announcement ID is required' });
      return;
    }
    
    set({ loading: true, error: null, announcementDetail: null });
    
    try {
      const response = await announcementAPI.getAnnouncementDetail(id);
      const detail = response.data;
      
      set({ 
        announcementDetail: detail,
        loading: false,
        error: null,
      });
      
      return detail;
    } catch (error) {
      console.error('Failed to load announcement detail:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to load announcement';
      
      set({ 
        loading: false, 
        error: errorMessage,
        announcementDetail: null,
      });
      
      throw error;
    }
  },
  
  // Removed: sendAnnouncement - manual announcement sending no longer available
  
  /**
   * Mark an announcement as read (student only)
   * @param {number} announcementId - Announcement ID
   */
  markAsRead: async (announcementId) => {
    try {
      const response = await announcementAPI.markAsRead(announcementId);
      
      // Update local state
      set((state) => {
        // Update in my announcements list
        const updatedMyAnnouncements = state.myAnnouncements.map(ann => {
          if (ann.id === announcementId) {
            return { ...ann, is_read: true };
          }
          return ann;
        });
        
        // Update in announcements list (backward compatibility)
        const updatedAnnouncements = state.announcements.map(ann => {
          if (ann.id === announcementId) {
            return { ...ann, is_read: true };
          }
          return ann;
        });
        
        // Update announcement detail if it's the current one
        let updatedDetail = state.announcementDetail;
        if (updatedDetail && updatedDetail.id === announcementId) {
          updatedDetail = { ...updatedDetail, is_read: true };
        }
        
        // Update in course announcements
        const updatedCourseAnnouncements = {};
        Object.keys(state.courseAnnouncements).forEach(courseId => {
          updatedCourseAnnouncements[courseId] = state.courseAnnouncements[courseId].map(ann => {
            if (ann.id === announcementId) {
              return { ...ann, is_read: true };
            }
            return ann;
          });
        });
        
        return {
          myAnnouncements: updatedMyAnnouncements,
          announcements: updatedAnnouncements,
          announcementDetail: updatedDetail,
          courseAnnouncements: updatedCourseAnnouncements,
        };
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      // Don't set error state for read status failures
      throw error;
    }
  },
  
  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
  
  /**
   * Reset store
   */
  reset: () => {
    set({
      announcements: [],
      sentAnnouncements: [],
      myAnnouncements: [],
      announcementDetail: null,
      courseAnnouncements: {},
      loading: false,
      error: null,
      page: 1,
      hasMore: true,
    });
  },
}));

export default useAnnouncementStore;
