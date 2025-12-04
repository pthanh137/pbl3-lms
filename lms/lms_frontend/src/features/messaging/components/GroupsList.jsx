import { useEffect, useState } from 'react';
import { messagingAPI } from '../../../api/client';
import useMessagingStore from '../store/messagingStore';

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeGroup = useMessagingStore((state) => state.activeGroup);
  const setActiveGroup = useMessagingStore((state) => state.setActiveGroup);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try new endpoint first, fallback to old one
      const response = await messagingAPI.getGroups().catch(() => messagingAPI.getMyGroups());
      setGroups(response.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err.response?.data?.detail || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
  };

  const getGroupInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'G';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={loadGroups}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="text-gray-400 text-4xl mb-2">👥</div>
          <p className="text-gray-500">No groups yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Groups are created automatically when you enroll in courses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Groups</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {groups.map((group) => {
          const isSelected = activeGroup?.id === group.id;

          return (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar - course thumbnail or circle with first letter */}
                <div className="flex-shrink-0">
                  {group.course_thumbnail ? (
                    <img
                      src={group.course_thumbnail}
                      alt={group.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        // Fallback to initial if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold text-lg ${group.course_thumbnail ? 'hidden' : ''}`}
                  >
                    {getGroupInitial(group.name)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Title - course title */}
                  <h3 className="font-semibold text-gray-900 truncate">
                    {group.name}
                  </h3>
                  
                  {/* Sub - member count */}
                  <p className="text-sm text-gray-500 mt-1">
                    {group.members_count || group.member_count || 0} members
                  </p>
                  
                  {/* Last message preview */}
                  {group.last_message_preview && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {group.last_message_preview}
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

export default GroupsList;

