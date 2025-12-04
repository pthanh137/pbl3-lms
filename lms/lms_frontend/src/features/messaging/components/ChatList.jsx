import { useEffect } from 'react';
import useMessagingStore from '../store/messagingStore';
import { formatRelativeTime } from '../utils/dateFormatter';

const ChatList = () => {
  const { conversations, activeUser, setActiveUser, setCurrentConversation, loading, error } = useMessagingStore();

  useEffect(() => {
    const loadData = async () => {
      await useMessagingStore.getState().loadConversations();
    };
    loadData();
  }, []); // Only run once on mount

  const getConversationName = (conversation) => {
    return conversation.name || 'Unknown';
  };

  const getConversationAvatar = (conversation) => {
    return conversation.avatar;
  };

  const getLastMessagePreview = (conversation) => {
    return conversation.last_message_preview || 'No messages yet';
  };

  const getLastMessageTime = (conversation) => {
    if (conversation.last_message_time) {
      return formatRelativeTime(conversation.last_message_time);
    }
    return '';
  };

  const handleSelectConversation = (conversation) => {
    console.log('handleSelectConversation called with:', conversation);
    const store = useMessagingStore.getState();
    
    // Set current conversation (full object)
    setCurrentConversation(conversation);
    
    // Clear other selections
    store.setActiveGroup(null);
    
    // Also set activeUser/activeGroup for backward compatibility
    if (conversation.type === 'direct') {
      setActiveUser({
        id: conversation.id,
        full_name: conversation.name,
        avatar_url: conversation.avatar,
        role: 'user',
      });
    } else if (conversation.type === 'group') {
      setActiveUser(null);
      store.setActiveGroup({
        id: conversation.id,
        name: conversation.name,
        course_thumbnail: conversation.avatar,
      });
    }
  };

  const isSelected = (conversation) => {
    const currentConversation = useMessagingStore.getState().currentConversation;
    if (currentConversation) {
      return currentConversation.id === conversation.id && currentConversation.type === conversation.type;
    }
    // Fallback to old logic for backward compatibility
    if (conversation.type === 'direct') {
      return activeUser?.id === conversation.id;
    } else if (conversation.type === 'group') {
      const activeGroup = useMessagingStore.getState().activeGroup;
      return activeGroup?.id === conversation.id;
    }
    return false;
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={() => useMessagingStore.getState().loadConversations()}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-center p-4">
          <p className="text-lg mb-2">No conversations yet</p>
          <p className="text-sm">Start a conversation with a teacher or student</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => {
          const selected = isSelected(conversation);
          const unreadCount = conversation.unread_count || 0;

          return (
            <button
              key={`${conversation.type}-${conversation.id}`}
              onClick={() => handleSelectConversation(conversation)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 relative">
                  {getConversationAvatar(conversation) ? (
                    <img
                      src={getConversationAvatar(conversation)}
                      alt={getConversationName(conversation)}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold ${
                      getConversationAvatar(conversation) ? 'hidden' : ''
                    }`}
                  >
                    {getConversationName(conversation).charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${selected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {getConversationName(conversation)}
                    </p>
                    {getLastMessageTime(conversation) && (
                      <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {getLastMessageTime(conversation)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {getLastMessagePreview(conversation)}
                    </p>
                    {unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400 capitalize">
                      {conversation.type === 'group' ? 'Group' : 'Direct'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
