import { create } from 'zustand';
import { notificationAPI } from '../../../api/client';

// ============================================
// NOTIFICATION STORE - ZUSTAND
// ============================================
// Manages notification state for both teachers and students
// Auto-syncs unread count

const useNotificationStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Load all notifications for current user
   */
  loadNotifications: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await notificationAPI.getNotifications();
      
      // Handle different response formats
      let notifications = [];
      if (Array.isArray(response.data)) {
        notifications = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        notifications = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        notifications = response.data.data;
      }
      
      // Calculate unread count
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications: Array.isArray(notifications) ? notifications : [],
        unreadCount,
        loading: false,
        error: null,
      });
      
      return notifications;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to load notifications';
      
      set({ 
        loading: false, 
        error: errorMessage,
      });
      
      throw error;
    }
  },
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   */
  markRead: async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state instantly
      set((state) => {
        const updatedNotifications = state.notifications.map(notif => {
          if (notif.id === notificationId) {
            return { ...notif, is_read: true };
          }
          return notif;
        });
        
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      });
      
      // Also sync unread count from server to ensure accuracy
      setTimeout(() => {
        get().syncUnreadCount();
      }, 100);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   */
  markAllRead: async () => {
    try {
      await notificationAPI.markAllRead();
      
      // Update local state instantly
      set((state) => ({
        notifications: state.notifications.map(notif => ({ ...notif, is_read: true })),
        unreadCount: 0,
      }));
      
      // Also sync unread count from server to ensure accuracy
      setTimeout(() => {
        get().syncUnreadCount();
      }, 100);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },
  
  /**
   * Sync unread count from server
   */
  syncUnreadCount: async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const unreadCount = response.data?.unread_count || 0;
      
      set({ unreadCount });
      
      return unreadCount;
    } catch (error) {
      console.error('Failed to sync unread count:', error);
      // Don't throw, just log
      return 0;
    }
  },
  
  /**
   * Start polling notifications every 5 seconds
   */
  startPolling: () => {
    const { pollingInterval } = get();
    
    // Clear existing interval if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(() => {
      const { loadNotifications, syncUnreadCount } = get();
      loadNotifications().catch(err => console.error('Polling error:', err));
      syncUnreadCount().catch(err => console.error('Polling error:', err));
    }, 5000); // 5 seconds
    
    set({ pollingInterval: interval });
    return interval;
  },
  
  /**
   * Stop polling notifications
   */
  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
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
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      pollingInterval: null,
    });
  },
}));

export default useNotificationStore;

