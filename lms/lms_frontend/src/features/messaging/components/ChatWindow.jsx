import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import useMessagingStore from '../store/messagingStore';
import { useAuth } from '../../../context/AuthContext';
import MessageInput from './MessageInput';
import { formatTime, formatDate } from '../utils/dateFormatter';

// ============================================
// CHAT WINDOW - FIXED FOR MESSAGE DISPLAY
// ============================================
// ALL hooks at top-level - NO exceptions
// Component MUST NOT unmount when new messages arrive
// Message grouping optimized with useMemo
// Auto-scroll only triggers when message count changes
// UI re-renders when messages state updates

const ChatWindow = () => {
  // ============================================
  // ALL HOOKS MUST BE AT THE TOP - NO EXCEPTIONS
  // ============================================
  
  // Store subscriptions - ALL called unconditionally
  const activeUser = useMessagingStore((state) => state.activeUser);
  const activeUserId = activeUser?.id ?? null;
  const messages = useMessagingStore((state) => state.messages);
  const loading = useMessagingStore((state) => state.loading);
  const loadError = useMessagingStore((state) => state.loadError);
  const hasMore = useMessagingStore((state) => state.hasMore);
  const loadOlderMessages = useMessagingStore((state) => state.loadOlderMessages);
  const toastMessage = useMessagingStore((state) => state.toastMessage);
  
  // Typing state - always call hook, condition inside selector
  const typingState = useMessagingStore((state) => {
    if (!activeUserId) return false;
    return state.typingState[activeUserId] || false;
  });
  
  // Auth hook - always called
  const { user } = useAuth();
  
  // Refs - always created
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isLoadingOlder = useRef(false);
  const prevActiveUserIdRef = useRef(activeUserId);
  const prevMessageCountRef = useRef(messages.length);
  
  // ============================================
  // CALLBACKS - useCallback at top level
  // ============================================
  
  // Scroll to bottom callback - stable reference
  const scrollToBottom = useCallback(() => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);
  
  // Handle scroll callback - stable reference
  const handleScroll = useCallback((e) => {
    const container = e.target;
    if (container.scrollTop === 0 && hasMore && !isLoadingOlder.current) {
      isLoadingOlder.current = true;
      loadOlderMessages().finally(() => {
        isLoadingOlder.current = false;
      });
    }
  }, [hasMore, loadOlderMessages]);
  
  // Handle load older messages click - stable reference
  const handleLoadOlder = useCallback(() => {
    if (isLoadingOlder.current) return;
    isLoadingOlder.current = true;
    loadOlderMessages().finally(() => {
      isLoadingOlder.current = false;
    });
  }, [loadOlderMessages]);
  
  // Handle retry - stable reference
  const handleRetry = useCallback(() => {
    if (activeUserId) {
      useMessagingStore.getState().loadMessages(activeUserId, 1, true);
    }
  }, [activeUserId]);
  
  // Helper function for grouping messages - stable reference
  const groupMessagesByDate = useCallback((msgs) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    msgs.forEach((message) => {
      if (!message.sent_at) return;
      
      const messageDate = new Date(message.sent_at).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, []);
  
  // ============================================
  // MEMOIZED VALUES - useMemo at top level
  // ============================================
  
  // Memoize message groups - always computed
  // This ensures UI re-renders when messages change
  const messageGroups = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return groupMessagesByDate(messages);
  }, [messages, groupMessagesByDate]);
  
  // Memoize partner name - always computed
  const partnerName = useMemo(() => {
    if (!activeUser) return 'Unknown User';
    return activeUser.full_name || activeUser.email || 'Unknown User';
  }, [activeUser?.full_name, activeUser?.email]);
  
  // Memoize typing indicator - always computed
  const isTyping = useMemo(() => {
    return typingState || false;
  }, [typingState]);
  
  // ============================================
  // EFFECTS - useEffect at top level
  // ============================================
  
  // Track activeUserId changes to detect conversation switch
  useEffect(() => {
    prevActiveUserIdRef.current = activeUserId;
  }, [activeUserId]);
  
  // Track message count changes for auto-scroll
  useEffect(() => {
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);
  
  // Auto-scroll to bottom when messages change (but not when loading older messages)
  // Only scroll if message count increased (new message) or conversation switched
  useEffect(() => {
    const messageCountIncreased = messages.length > prevMessageCountRef.current;
    const conversationSwitched = prevActiveUserIdRef.current !== activeUserId;
    
    if (!isLoadingOlder.current && messages.length > 0 && (messageCountIncreased || conversationSwitched)) {
      scrollToBottom();
    }
  }, [messages.length, activeUserId, scrollToBottom]);
  
  // Reset loading older flag when activeUserId changes
  useEffect(() => {
    if (prevActiveUserIdRef.current !== activeUserId) {
      isLoadingOlder.current = false;
      prevMessageCountRef.current = 0; // Reset message count ref on conversation switch
    }
  }, [activeUserId]);
  
  // ============================================
  // RENDER LOGIC - All conditionals AFTER hooks
  // ============================================
  
  // Early return for no active user - AFTER all hooks
  if (!activeUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }
  
  // Early return for loading - AFTER all hooks
  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }
  
  // Early return for error - AFTER all hooks
  // Only show error screen if it's a loadError (not authError - that's handled in Messaging.jsx)
  if (loadError && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-2">{loadError}</div>
          <button
            onClick={handleRetry}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Main render - AFTER all hooks and early returns
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toast notification for permission errors */}
      {toastMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-2 mx-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => useMessagingStore.setState({ toastMessage: null })}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {activeUser.avatar_url ? (
              <img
                src={activeUser.avatar_url}
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {partnerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{partnerName}</h3>
            {activeUser.role && (
              <p className="text-xs text-gray-500 capitalize">{activeUser.role}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadOlder}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Load older messages
            </button>
          </div>
        )}
        
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDate(group.date)}
                </div>
              </div>

              {/* Messages in this group */}
              {group.messages.map((message, msgIndex) => {
                if (!message.sender || !message.receiver) return null;
                
                const isOwnMessage = message.sender.id === user?.id;
                const showAvatar = msgIndex === 0 || 
                  group.messages[msgIndex - 1]?.sender?.id !== message.sender.id;

                return (
                  <div
                    key={message.id || `msg-${msgIndex}`}
                    className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && (
                      <div className="flex-shrink-0 mr-2">
                        {showAvatar ? (
                          activeUser.avatar_url ? (
                            <img
                              src={activeUser.avatar_url}
                              alt={partnerName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {partnerName.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content || ''}</p>
                      </div>
                      {message.course_title && (
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          Re: {message.course_title}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {formatTime(message.sent_at)}
                        {isOwnMessage && message.is_read && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>

                    {isOwnMessage && (
                      <div className="flex-shrink-0 ml-2">
                        {showAvatar ? (
                          user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || user.email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600 italic">
                {partnerName} is typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput />
    </div>
  );
};

// Memoize component to prevent re-renders when unrelated store values change
// But allow re-renders when messages change
export default React.memo(ChatWindow, (prevProps, nextProps) => {
  // This is a custom comparison function
  // Return true if props are equal (skip re-render)
  // Return false if props are different (re-render)
  // Since we're using Zustand, we don't need this, but keeping it for safety
  return false; // Always re-render to ensure messages are displayed
});
