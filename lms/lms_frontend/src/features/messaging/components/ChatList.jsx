import { useEffect } from 'react';
import useMessagingStore from '../store/messagingStore';
import { formatRelativeTime } from '../utils/dateFormatter';

const ChatList = () => {
  const { conversations, activeUser, setActiveUser, loading, error } = useMessagingStore();

  useEffect(() => {
    const loadData = async () => {
      await useMessagingStore.getState().loadConversations();
    };
    loadData();
  }, []); // Only run once on mount

  const getPartnerName = (conversation) => {
    const user = conversation.conversation_user || {};
    return user.full_name || user.email || 'Unknown User';
  };

  const getPartnerAvatar = (conversation) => {
    const user = conversation.conversation_user || {};
    return user.avatar_url;
  };

  const getPartnerRole = (conversation) => {
    const user = conversation.conversation_user || {};
    return user.role;
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.last_message) return 'No messages yet';
    const content = conversation.last_message.content || '';
    return content.length > 50
      ? content.substring(0, 50) + '...'
      : content;
  };

  const getLastMessageTime = (conversation) => {
    if (conversation.last_message_time) {
      return formatRelativeTime(conversation.last_message_time);
    }
    if (conversation.last_message?.sent_at) {
      return formatRelativeTime(conversation.last_message.sent_at);
    }
    return '';
  };

  const handleSelectConversation = (conversation) => {
    const user = conversation.conversation_user;
    if (user) {
      setActiveUser(user);
    }
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
          const user = conversation.conversation_user || {};
          const isSelected = activeUser?.id === user.id;
          const unreadCount = conversation.unread_count_for_current_user || 0;
          const isOnline = conversation.is_online || false;

          return (
            <button
              key={user.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 relative">
                  {getPartnerAvatar(conversation) ? (
                    <img
                      src={getPartnerAvatar(conversation)}
                      alt={getPartnerName(conversation)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {getPartnerName(conversation).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {getPartnerName(conversation)}
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
                  {getPartnerRole(conversation) && (
                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {getPartnerRole(conversation)}
                    </p>
                  )}
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
