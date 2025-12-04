import { create } from 'zustand';
import { messagingAPI } from '../../../api/client';

// ============================================
// MESSAGING STORE - COMPLETELY REWRITTEN
// ============================================
// NEVER caches token - always reads dynamically
// Polling: Main every 4s, Typing every 6-8s
// Clean start/stop logic
// No unnecessary rerenders

const useMessagingStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  conversations: [],
  messages: [],
  activeUser: null, // Currently selected conversation partner
  activeGroup: null, // Currently selected group
  groupMessages: [], // Messages for active group
  groupPage: 1,
  groupHasMore: true,
  unreadCount: 0,
  typingState: {}, // { userId: boolean }
  page: 1,
  hasMore: true,
  loading: false,
  groupLoading: false,
  authError: null, // Specifically for 401 unauthenticated errors
  loadError: null, // For generic API errors (non-401)
  pollingInterval: null,
  typingInterval: null,
  toastMessage: null, // For showing toast notifications

  // ============================================
  // HELPER: Check authentication dynamically
  // ============================================
  // NEVER cache token - always read from localStorage
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    return !!(token && typeof token === 'string' && token.trim() !== '');
  },

  // ============================================
  // ACTIONS
  // ============================================

  setActiveUser: (user) => {
    // Clear errors when selecting a new conversation
    set({ 
      activeUser: user, 
      messages: [], 
      page: 1, 
      hasMore: true,
      loadError: null, // Clear load error on new conversation
      authError: null, // Clear auth error on new conversation
      toastMessage: null, // Clear toast on new conversation
    });
    if (user) {
      // Load messages and mark as read when opening conversation
      get().loadMessages(user.id, 1, true); // Replace messages on new conversation
    }
  },

  loadConversations: async () => {
    // Check authentication BEFORE making request
    // Read token dynamically - never cache
    if (!get().isAuthenticated()) {
      set({ authError: 'User not authenticated', loading: false });
      return;
    }

    // Don't set loading to true during polling to avoid UI flicker
    const currentState = get();
    const isPolling = currentState.pollingInterval !== null;
    if (!isPolling && !currentState.loading) {
      set({ loading: true });
    }
    
    try {
      const response = await messagingAPI.getConversationsList();
      const conversations = response.data || [];
      
      // Calculate total unread count
      const totalUnread = conversations.reduce(
        (sum, conv) => sum + (conv.unread_count_for_current_user || 0), 
        0
      );
      
      set({ 
        conversations, 
        unreadCount: totalUnread,
        loading: false,
        authError: null, // Clear auth error on success
        loadError: null, // Clear load error on success
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Distinguish between auth errors (401) and other errors
      if (error.response?.status === 401) {
        set((state) => ({ 
          authError: 'User not authenticated',
          loading: false,
          // NEVER reset conversations - keep existing data
        }));
      } else if (error.response?.status === 500) {
        // 500 errors are backend issues - don't show as critical error
        // Keep existing conversations and just log the error
        set((state) => ({ 
          loading: false,
          // Don't set loadError for 500 - it's a backend issue, not user's fault
          // NEVER reset conversations - keep existing data
        }));
        console.warn('Backend error loading conversations (500). Keeping existing conversations.');
      } else {
        // Generic error - don't set authError
        set((state) => ({ 
          loadError: error.response?.data?.detail || 'Failed to load conversations',
          loading: false,
          // NEVER reset conversations - keep existing data
        }));
      }
    }
  },

  loadMessages: async (partnerId, pageNum = 1, replace = false) => {
    // Check authentication BEFORE making request
    // Read token dynamically - never cache
    if (!get().isAuthenticated()) {
      set({ authError: 'User not authenticated' });
      return;
    }

    // Get user ID dynamically from AuthContext or localStorage
    // Try to get from localStorage first (most reliable)
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Try to get from AuthContext via window event
      // This is a fallback - normally user should be in localStorage
      set({ authError: 'User not authenticated' });
      return;
    }
    
    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      set({ authError: 'User not authenticated' });
      return;
    }
    
    if (!user?.id) {
      set({ authError: 'User not authenticated' });
      return;
    }

    const { activeUser } = get();
    
    // Only load if activeUser matches (unless replacing)
    if (!replace && activeUser?.id !== partnerId) {
      return;
    }

    // Don't show loading if we're just polling for new messages
    const isPolling = get().pollingInterval !== null;
    if (pageNum === 1 && !replace && isPolling) {
      // Silent update for polling
    } else {
      set({ loading: true, loadError: null, authError: null });
    }
    
    try {
      const response = await messagingAPI.getConversation(user.id, partnerId, pageNum);
      const data = response.data;
      
      // Handle paginated response (DRF pagination returns results, next, previous, count)
      const newMessages = Array.isArray(data) ? data : (data.results || []);
      const hasMore = data.next ? true : false;
      
      // Update messages based on mode FIRST
      // Then mark as read and update state again
      const currentState = get();
      let updatedMessages;
      
      if (replace) {
        // Replace all messages (initial load or conversation switch)
        updatedMessages = newMessages;
      } else if (pageNum > 1) {
        // Prepend older messages (loading history)
        const existingIds = new Set(currentState.messages.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        updatedMessages = [...uniqueNew, ...currentState.messages];
      } else {
        // Polling: merge new messages, avoiding duplicates
        const existingIds = new Set(currentState.messages.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        updatedMessages = [...currentState.messages, ...uniqueNew];
      }
      
      // Set messages first (so UI updates immediately)
      set({
        messages: updatedMessages,
        page: pageNum,
        hasMore,
        loading: false,
        authError: null, // Clear auth error on success
        loadError: null, // Clear load error on success
      });
      
      // Mark messages as read when:
      // 1. Loading first page (pageNum === 1) - both initial load (replace) and polling
      // 2. NOT when loading older messages (pageNum > 1)
      if (pageNum === 1) {
        // Find unread messages from the UPDATED messages list
        const unreadMessages = updatedMessages.filter(
          m => !m.is_read && m.receiver?.id === user.id
        );
        
        // Mark as read in background (don't await to avoid blocking)
        if (unreadMessages.length > 0) {
          console.log(`Marking ${unreadMessages.length} messages as read for user ${user.id}`);
          
          // Mark all unread messages as read
          const markPromises = unreadMessages.map(msg => 
            messagingAPI.markAsRead(msg.id).then(() => {
              console.log(`Message ${msg.id} marked as read`);
              return msg.id;
            }).catch((err) => {
              console.error(`Failed to mark message ${msg.id} as read:`, err);
              return null;
            })
          );
          
          // Wait for all mark-as-read requests to complete
          Promise.all(markPromises).then((markedIds) => {
            const successfulIds = markedIds.filter(id => id !== null);
            console.log(`Successfully marked ${successfulIds.length} messages as read`);
            
            // Update local state to reflect read status
            set((state) => ({
              messages: state.messages.map(msg => {
                if (successfulIds.includes(msg.id)) {
                  return { ...msg, is_read: true };
                }
                return msg;
              })
            }));
            
            // Refresh conversations list to update unread count
            // Use a delay to ensure backend has processed all mark-as-read requests
            setTimeout(() => {
              get().loadConversations();
            }, 500);
          });
        }
      }
      
      // Refresh conversations list to update unread counts
      // This is handled by the mark-as-read logic above
      // But also refresh if we're not marking as read (e.g., loading history)
      if (pageNum > 1) {
        // When loading older messages, don't refresh conversations
        // (unread count shouldn't change when loading history)
      } else if (!isPolling || replace) {
        // On manual load or initial load, refresh conversations after a delay
        // This ensures unread counts are updated
        setTimeout(() => {
          get().loadConversations();
        }, 500);
      } else if (isPolling) {
        // During polling, refresh conversations occasionally
        const shouldRefresh = Math.random() < 0.2; // 20% chance
        if (shouldRefresh) {
          setTimeout(() => get().loadConversations(), 500);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      
      // Distinguish between auth errors (401) and other errors
      if (error.response?.status === 401) {
        set((state) => ({ 
          authError: 'User not authenticated',
          loading: false,
          // NEVER reset messages - keep existing data
        }));
      } else {
        // Generic error - don't set authError
        set((state) => ({ 
          loadError: error.response?.data?.detail || 'Failed to load messages',
          loading: false,
          // NEVER reset messages - keep existing data
        }));
      }
    }
  },

  loadOlderMessages: async () => {
    const { activeUser, page, hasMore } = get();
    if (!activeUser || !hasMore) return;
    
    const nextPage = page + 1;
    await get().loadMessages(activeUser.id, nextPage, false); // Append older messages
  },

  sendMessage: async (content, courseId = null) => {
    const { activeUser } = get();
    if (!activeUser) {
      const errorMsg = 'No conversation selected';
      set({ loadError: errorMsg });
      console.error('sendMessage error:', errorMsg);
      return;
    }

    // Check authentication BEFORE making request
    // Read token dynamically - never cache
    const token = localStorage.getItem('accessToken');
    if (!token || typeof token !== 'string' || token.trim() === '') {
      const errorMsg = 'User not authenticated - no token found';
      set({ authError: errorMsg });
      console.error('sendMessage error:', errorMsg);
      console.error('Token check:', { token, exists: !!token });
      return;
    }

    // Get user ID dynamically from localStorage
    // User should be stored in localStorage by AuthContext after login
    const storedUser = localStorage.getItem('user');
    let user = null;
    
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
        if (!user?.id) {
          console.warn('User in localStorage but missing id:', user);
          user = null; // Reset to null if invalid
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        user = null;
      }
    }
    
    // If user is not in localStorage, we can still send the message
    // The backend will get sender from JWT token
    // But we need user object for optimistic UI - create a placeholder
    if (!user) {
      console.warn('User not in localStorage. Message will still be sent (backend uses token), but optimistic UI may be limited.');
      // Create a minimal placeholder - will be replaced by real message from backend
      user = { 
        id: 'current-user', 
        email: 'You', 
        full_name: 'You',
        avatar_url: null 
      };
    }

    // Prepare message data
    const messageData = {
      receiver_id: activeUser.id,
      content: content.trim(),
    };
    
    if (courseId) {
      messageData.course_id_write = courseId;
    }

    // Debug log
    console.log('Sending message to', activeUser.id, 'Content:', content.trim());
    console.log('Message data:', messageData);

    // Optimistic update - create temporary message
    // If user.id is not available, we'll still create optimistic message
    // and replace it with real message from backend
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender: user?.id ? user : { id: 'current-user', email: 'You', full_name: 'You' },
      receiver: activeUser,
      content: content.trim(),
      sent_at: new Date().toISOString(),
      is_read: false,
      course_id: courseId,
      course_title: null,
    };

    // Immediately push optimistic message to state
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      // Send message to backend
      // The backend will get sender from JWT token, so we don't need to send sender_id
      const response = await messagingAPI.sendMessage(messageData);
      const newMessage = response.data;
      
      console.log('Message sent successfully:', newMessage);
      
      // Update user in localStorage if we got user data from backend
      if (newMessage.sender && !user?.id) {
        try {
          localStorage.setItem('user', JSON.stringify(newMessage.sender));
        } catch (e) {
          console.warn('Failed to store user in localStorage:', e);
        }
      }
      
      // Replace optimistic message with real one from backend
      set((state) => {
        const updatedMessages = state.messages.map(msg => {
          if (msg.id === optimisticMessage.id) {
            // Replace with real message from backend
            return newMessage;
          }
          return msg;
        });
        
        return {
          messages: updatedMessages,
          authError: null, // Clear auth error on success
          loadError: null, // Clear load error on success
          toastMessage: null, // Clear toast on success
        };
      });
      
      // Refresh conversations list (don't await to avoid blocking)
      // Use a longer delay to avoid race conditions with backend processing
      // If it fails, it's not critical - user can manually refresh
      setTimeout(() => {
        get().loadConversations().catch((error) => {
          // Silently fail - don't show error to user after successful message send
          // The conversation will be updated on next poll or manual refresh
          console.warn('Failed to refresh conversations after sending message (non-critical):', error);
        });
      }, 500); // Increased delay to give backend time to process
      
      // Stop typing indicator
      get().postTypingStatus(activeUser.id, false);
      
      return newMessage; // Return success
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Remove optimistic message on error
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== optimisticMessage.id),
      }));
      
      // Handle different error types
      if (error.response?.status === 401) {
        set({ authError: 'User not authenticated' });
      } else if (error.response?.status === 403) {
        // Permission denied - show toast with helpful message
        const errorDetail = error.response?.data?.detail || '';
        let errorMsg = 'You cannot message this user';
        
        // Provide more specific error message based on backend response
        if (errorDetail.includes('enrolled')) {
          errorMsg = 'You can only message teachers of courses you are enrolled in. Please enroll in a course first.';
        } else if (errorDetail.includes('teacher')) {
          errorMsg = 'You can only message the teacher of this course.';
        } else {
          errorMsg = errorDetail || 'You cannot message this user';
        }
        
        set({ 
          loadError: errorMsg,
          toastMessage: errorMsg, // Show toast for 403
        });
        // Clear toast after 8 seconds (longer for important messages)
        setTimeout(() => {
          set({ toastMessage: null });
        }, 8000);
      } else {
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to send message';
        set({ loadError: errorMsg });
      }
      
      throw error; // Re-throw to let component handle it
    }
  },

  markRead: async (messageId) => {
    // Check authentication BEFORE making request
    if (!get().isAuthenticated()) {
      return; // Silently fail
    }

    try {
      await messagingAPI.markAsRead(messageId);
      // Update local state
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ),
      }));
    } catch (error) {
      // Silently fail for markRead - don't set errors
      console.error('Failed to mark message as read:', error);
    }
  },

  checkTypingStatus: async (receiverId) => {
    // Check authentication BEFORE making request
    // Read token dynamically - never cache
    if (!get().isAuthenticated()) {
      return; // Silently fail for typing status
    }

    try {
      const response = await messagingAPI.getTypingStatus(receiverId);
      const isTyping = response.data?.is_typing || false;
      
      // Only update state if typing state actually changed
      // This prevents unnecessary rerenders
      set((state) => {
        const currentTyping = state.typingState[receiverId] || false;
        if (currentTyping === isTyping) {
          return state; // No change, don't update
        }
        
        return {
          typingState: {
            ...state.typingState,
            [receiverId]: isTyping
          }
        };
      });
    } catch (error) {
      // Silently fail for typing status - don't set errors
      console.error('Failed to check typing status:', error);
    }
  },

  postTypingStatus: async (receiverId, isTyping) => {
    // Update local state immediately for better UX
    set((state) => ({
      typingState: {
        ...state.typingState,
        [receiverId]: isTyping
      }
    }));
    
    // Check authentication BEFORE sending to server
    // Read token dynamically - never cache
    if (!get().isAuthenticated()) {
      return; // Silently fail if not authenticated
    }
    
    // Send to server in background (don't await to avoid blocking)
    messagingAPI.setTyping(receiverId, isTyping).catch((error) => {
      // Silently fail for typing indicator - don't set errors
      // But log 403 errors for debugging
      if (error.response?.status === 403) {
        console.warn('Typing indicator 403 (permission denied):', error.response?.data?.detail);
        // Don't show error to user - typing indicator is not critical
      } else {
        console.error('Failed to set typing indicator:', error);
      }
    });
  },

  // ============================================
  // POLLING - COMPLETELY REWRITTEN
  // ============================================
  // MAIN POLLING: Every 4 seconds
  //   - loadConversations()
  //   - loadMessages() ONLY if active conversation
  // TYPING POLLING: Every 6-8 seconds (randomized)
  //   - Only fetch typing status for active user
  //   - MUST NOT trigger full rerender loops
  startPolling: () => {
    const { pollingInterval, typingInterval } = get();
    
    // Clear existing intervals
    if (pollingInterval) clearInterval(pollingInterval);
    if (typingInterval) clearInterval(typingInterval);

    // CRITICAL: Check authentication before starting
    if (!get().isAuthenticated()) {
      console.warn('Cannot start polling: user not authenticated');
      return;
    }

    // MAIN POLLING INTERVAL (every 4 seconds)
    const pollInterval = setInterval(() => {
      // CRITICAL: Check authentication on EVERY poll
      // Read token dynamically - never cache
      if (!get().isAuthenticated()) {
        // Stop polling immediately if not authenticated
        get().stopPolling();
        return;
      }

      const { activeUser, loadConversations, loadMessages } = get();
      
      // Always load conversations (updates unread counts)
      loadConversations();
      
      // ONLY poll for messages if there's an active conversation
      if (activeUser) {
        // Poll for new messages (silent update, no replace, no loading state)
        loadMessages(activeUser.id, 1, false);
      }
    }, 4000); // Poll every 4 seconds

    // TYPING POLLING INTERVAL (every 6-8 seconds, randomized)
    // Randomize between 6000-8000ms to prevent synchronized requests
    const typingIntervalMs = 6000 + Math.random() * 2000;
    const typingPollInterval = setInterval(() => {
      // CRITICAL: Check authentication on EVERY poll
      // Read token dynamically - never cache
      if (!get().isAuthenticated()) {
        // Stop polling immediately if not authenticated
        get().stopPolling();
        return;
      }

      const { activeUser, checkTypingStatus } = get();
      // ONLY poll for typing if there's an active conversation
      if (activeUser) {
        checkTypingStatus(activeUser.id);
      }
    }, typingIntervalMs); // Poll typing every 6-8 seconds (randomized)

    set({ 
      pollingInterval: pollInterval,
      typingInterval: typingPollInterval
    });
  },

  stopPolling: () => {
    const { pollingInterval, typingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    if (typingInterval) {
      clearInterval(typingInterval);
    }
    set({ pollingInterval: null, typingInterval: null });
  },

  refreshUnreadCount: async () => {
    // Check authentication BEFORE making request
    // Read token dynamically - never cache
    if (!get().isAuthenticated()) {
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    
    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      return;
    }
    
    if (!user?.id) return;

    try {
      const response = await messagingAPI.getUnreadMessages(user.id);
      set({ unreadCount: response.data?.count || 0 });
    } catch (error) {
      // Silently fail for unread count - don't set errors
      console.error('Failed to refresh unread count:', error);
    }
  },

  // ============================================
  // GROUP CHAT ACTIONS
  // ============================================

  setActiveGroup: (group) => {
    set({ 
      activeGroup: group, 
      activeUser: null, // Clear activeUser when selecting group
      groupMessages: [], 
      groupPage: 1, 
      groupHasMore: true,
      loadError: null,
      authError: null,
      toastMessage: null,
    });
    if (group) {
      get().loadGroupMessages(group.id, 1, true);
    }
  },

  loadGroupMessages: async (groupId, pageNum = 1, replace = false) => {
    if (!get().isAuthenticated()) {
      set({ authError: 'User not authenticated' });
      return;
    }

    const { activeGroup } = get();
    
    if (!replace && activeGroup?.id !== groupId) {
      return;
    }

    const isPolling = get().pollingInterval !== null;
    if (pageNum === 1 && !replace && isPolling) {
      // Silent update for polling
    } else {
      set({ groupLoading: true, loadError: null, authError: null });
    }
    
    try {
      const response = await messagingAPI.getGroupMessages(groupId, pageNum);
      const data = response.data;
      
      const newMessages = Array.isArray(data) ? data : (data.results || []);
      const hasMore = data.next ? true : false;
      
      const currentState = get();
      let updatedMessages;
      
      if (replace) {
        updatedMessages = newMessages;
      } else if (pageNum > 1) {
        const existingIds = new Set(currentState.groupMessages.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        updatedMessages = [...uniqueNew, ...currentState.groupMessages];
      } else {
        const existingIds = new Set(currentState.groupMessages.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        updatedMessages = [...currentState.groupMessages, ...uniqueNew];
      }
      
      set({
        groupMessages: updatedMessages,
        groupPage: pageNum,
        groupHasMore: hasMore,
        groupLoading: false,
        authError: null,
        loadError: null,
      });
    } catch (error) {
      console.error('Failed to load group messages:', error);
      if (error.response?.status === 401) {
        set({ 
          authError: 'User not authenticated',
          groupLoading: false,
        });
      } else {
        set({ 
          loadError: error.response?.data?.detail || 'Failed to load group messages',
          groupLoading: false,
        });
      }
    }
  },

  loadOlderGroupMessages: async () => {
    const { activeGroup, groupPage, groupHasMore, groupLoading } = get();
    
    if (!activeGroup || !groupHasMore || groupLoading) {
      return;
    }
    
    const nextPage = groupPage + 1;
    await get().loadGroupMessages(activeGroup.id, nextPage, false);
  },

  sendGroupMessage: async (content) => {
    const { activeGroup } = get();
    
    if (!activeGroup || !content.trim()) {
      throw new Error('No active group or empty message');
    }

    if (!get().isAuthenticated()) {
      set({ authError: 'User not authenticated' });
      throw new Error('User not authenticated');
    }

    try {
      const response = await messagingAPI.sendGroupMessage(activeGroup.id, content.trim());
      const newMessage = response.data;
      
      // Add message to groupMessages
      set((state) => ({
        groupMessages: [...state.groupMessages, newMessage],
      }));
      
      return newMessage;
    } catch (error) {
      console.error('Failed to send group message:', error);
      if (error.response?.status === 401) {
        set({ authError: 'User not authenticated' });
      } else {
        const errorMsg = error.response?.data?.detail || 'Failed to send message';
        set({ toastMessage: errorMsg });
      }
      throw error;
    }
  },
}));

export default useMessagingStore;
