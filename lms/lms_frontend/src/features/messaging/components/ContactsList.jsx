import { useEffect, useState } from 'react';
import { messagingAPI } from '../../../api/client';
import useMessagingStore from '../store/messagingStore';

const ContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setActiveUser, conversations } = useMessagingStore();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagingAPI.getAvailableContacts();
      setContacts(response.data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError(err.response?.data?.detail || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact) => {
    // Set active user to open/create conversation
    setActiveUser(contact);
  };

  const getContactName = (contact) => {
    return contact.full_name || contact.email || 'Unknown User';
  };

  const isInConversation = (contactId) => {
    return conversations.some(
      conv => conv.conversation_user?.id === contactId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={loadContacts}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-center p-4">
          <p>No contacts available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">New Conversation</h2>
        <p className="text-sm text-gray-500 mt-1">Select a contact to start messaging</p>
      </div>
      <div className="divide-y divide-gray-200">
        {contacts.map((contact) => {
          const inConversation = isInConversation(contact.id);
          return (
            <button
              key={contact.id}
              onClick={() => handleSelectContact(contact)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={getContactName(contact)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {getContactName(contact).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {getContactName(contact)}
                    </p>
                    {inConversation && (
                      <span className="text-xs text-blue-500 flex-shrink-0 ml-2">In conversation</span>
                    )}
                  </div>
                  {contact.role && (
                    <p className="text-xs text-gray-500 capitalize mt-1">{contact.role}</p>
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

export default ContactsList;
