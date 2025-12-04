import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import useMessagingStore from '../store/messagingStore';
import { useAuth } from '../../../context/AuthContext';
import GroupMessageInput from './GroupMessageInput';
import GroupInfoPanel from './GroupInfoPanel';
import { formatTime, formatDate } from '../utils/dateFormatter';
import { messagingAPI } from '../../../api/client';

const GroupChatWindow = () => {
  // ============================================
  // ALL HOOKS MUST BE AT THE TOP - NO EXCEPTIONS
  // ============================================
  
  const activeGroup = useMessagingStore((state) => state.activeGroup);
  const activeGroupId = activeGroup?.id ?? null;
  const messages = useMessagingStore((state) => state.groupMessages);
  const loading = useMessagingStore((state) => state.groupLoading);
  const loadError = useMessagingStore((state) => state.loadError);
  const hasMore = useMessagingStore((state) => state.groupHasMore);
  const loadOlderGroupMessages = useMessagingStore((state) => state.loadOlderGroupMessages);
  
  const { user } = useAuth();
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isLoadingOlder = useRef(false);
  const prevActiveGroupIdRef = useRef(activeGroupId);
  const prevMessageCountRef = useRef(messages.length);
  
  // ============================================
  // CALLBACKS
  // ============================================
  
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);
  
  const handleScroll = useCallback((e) => {
    const container = e.target;
    if (container.scrollTop === 0 && hasMore && !isLoadingOlder.current) {
      isLoadingOlder.current = true;
      loadOlderGroupMessages().finally(() => {
        isLoadingOlder.current = false;
      });
    }
  }, [hasMore, loadOlderGroupMessages]);
  
  const handleLoadOlder = useCallback(() => {
    if (isLoadingOlder.current) return;
    isLoadingOlder.current = true;
    loadOlderGroupMessages().finally(() => {
      isLoadingOlder.current = false;
    });
  }, [loadOlderGroupMessages]);
  
  const handleRetry = useCallback(() => {
    if (activeGroupId) {
      useMessagingStore.getState().loadGroupMessages(activeGroupId, 1, true);
    }
  }, [activeGroupId]);
  
  const groupMessagesByDate = useCallback((msgs) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    msgs.forEach((message) => {
      if (!message.created_at) return;
      
      const messageDate = new Date(message.created_at).toDateString();
      
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
  // MEMOIZED VALUES
  // ============================================
  
  const messageGroups = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return groupMessagesByDate(messages);
  }, [messages, groupMessagesByDate]);
  
  const groupName = useMemo(() => {
    if (!activeGroup) return 'Unknown Group';
    return activeGroup.name || 'Unknown Group';
  }, [activeGroup?.name]);
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Group selection is handled by GroupsList directly via store
  
  useEffect(() => {
    prevActiveGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);
  
  useEffect(() => {
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const messageCountIncreased = messages.length > prevMessageCountRef.current;
    const conversationSwitched = prevActiveGroupIdRef.current !== activeGroupId;
    
    if (!isLoadingOlder.current && messages.length > 0 && (messageCountIncreased || conversationSwitched)) {
      scrollToBottom();
    }
  }, [messages.length, activeGroupId, scrollToBottom]);
  
  useEffect(() => {
    if (prevActiveGroupIdRef.current !== activeGroupId) {
      isLoadingOlder.current = false;
      prevMessageCountRef.current = 0;
    }
  }, [activeGroupId]);
  
  // Poll for new messages
  useEffect(() => {
    if (!activeGroupId) return;
    
    const interval = setInterval(() => {
      useMessagingStore.getState().loadGroupMessages(activeGroupId, 1, false);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeGroupId]);
  
  // ============================================
  // RENDER LOGIC
  // ============================================
  
  if (!activeGroup) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <p className="text-gray-500 text-lg">Select a group to start messaging</p>
        </div>
      </div>
    );
  }
  
  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }
  
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
  
  return (
    <div className="flex h-full bg-white">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full">
        {/* Header */}
        <div className="p-4 border-b bg-white shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              {activeGroup.course_thumbnail ? (
                <img
                  src={activeGroup.course_thumbnail}
                  alt={groupName}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold ${activeGroup.course_thumbnail ? 'hidden' : ''}`}
              >
                {groupName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{groupName}</h3>
              <p className="text-xs text-gray-500">
                {activeGroup.members_count || activeGroup.member_count || 0} members
              </p>
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
                if (!message.sender) return null;
                
                const isOwnMessage = message.sender.id === user?.id;
                const showAvatar = msgIndex === 0 || 
                  group.messages[msgIndex - 1]?.sender?.id !== message.sender.id;
                const senderName = message.sender.full_name || message.sender.email || 'Unknown';

                return (
                  <div
                    key={message.id || `msg-${msgIndex}`}
                    className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && (
                      <div className="flex-shrink-0 mr-2">
                        {showAvatar ? (
                          message.sender.avatar_url ? (
                            <img
                              src={message.sender.avatar_url}
                              alt={senderName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Show sender name above message for group chat */}
                      {!isOwnMessage && showAvatar && (
                        <p className="text-xs text-gray-600 mb-1 px-1 font-medium">
                          {senderName}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content || ''}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {formatTime(message.created_at)}
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
        
        <div ref={messagesEndRef} data-messages-end />
        </div>

        {/* Input */}
        <GroupMessageInput />
      </div>

      {/* Group Info Panel */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        <GroupInfoPanel 
          groupId={activeGroupId} 
          groupName={groupName}
          memberCount={activeGroup.members_count || activeGroup.member_count || 0}
        />
      </div>
    </div>
  );
};

export default React.memo(GroupChatWindow);

