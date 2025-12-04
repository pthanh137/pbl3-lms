import React, { useState, useRef, useEffect, useCallback } from 'react';
import useMessagingStore from '../store/messagingStore';

const GroupMessageInput = () => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  
  const activeGroupId = useMessagingStore((state) => state.activeGroup?.id);
  const activeGroup = useMessagingStore((state) => state.activeGroup);
  const sendGroupMessage = useMessagingStore((state) => state.sendGroupMessage);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!content.trim() || isSending || !activeGroup) {
      return;
    }

    setIsSending(true);
    const messageContent = content.trim();

    try {
      await sendGroupMessage(messageContent);
      // Clear input ONLY after successful send
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Auto-scroll to bottom after sending
      setTimeout(() => {
        const messagesEnd = document.querySelector('[data-messages-end]');
        if (messagesEnd) {
          messagesEnd.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending group message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeGroupId || !activeGroup) {
    return null;
  }

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 overflow-y-auto"
            disabled={isSending}
          />
        </div>
        <button
          type="submit"
          disabled={!content.trim() || isSending}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Send'
          )}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
};

export default React.memo(GroupMessageInput);


