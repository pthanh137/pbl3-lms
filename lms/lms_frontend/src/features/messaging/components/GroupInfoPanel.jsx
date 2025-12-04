import React, { useEffect, useState } from 'react';
import { messagingAPI } from '../../../api/client';

export default function GroupInfoPanel({ groupId, groupName, memberCount }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (groupId) {
      loadMembers();
    } else {
      setMembers([]);
      setLoading(false);
    }
  }, [groupId]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagingAPI.getGroupMembers(groupId);
      setMembers(response.data || []);
    } catch (err) {
      console.error('Failed to load group members:', err);
      setError(err.response?.data?.detail || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const closeProfileModal = () => {
    setSelectedMember(null);
  };

  if (!groupId) {
    return null;
  }

  return (
    <>
      <div className="group-info-panel">
        <div className="p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-900">{groupName || 'Group'}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {memberCount || members.length} {memberCount === 1 || members.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Members</h4>
          
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading members...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4 text-sm">{error}</div>
          ) : members.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-sm">No members found</div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="member-row flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleMemberClick(member)}
                >
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.full_name || member.user.email}
                      className="member-avatar w-9 h-9 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="member-avatar w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {(member.user?.full_name || member.user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="member-name text-sm font-medium text-gray-900 truncate">
                      {member.user?.full_name || member.user?.email || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {member.is_admin ? (
                        <span className="member-role text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="member-role text-xs text-gray-500 capitalize">
                          {member.user?.role || 'student'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeProfileModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Member Profile</h3>
                <button
                  onClick={closeProfileModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center mb-6">
                {selectedMember.user?.avatar_url ? (
                  <img
                    src={selectedMember.user.avatar_url}
                    alt={selectedMember.user.full_name || selectedMember.user.email}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-3xl mx-auto mb-4">
                    {(selectedMember.user?.full_name || selectedMember.user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                
                <h4 className="text-xl font-semibold text-gray-900">
                  {selectedMember.user?.full_name || 'Unknown User'}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{selectedMember.user?.email}</p>
                
                <div className="mt-3">
                  {selectedMember.is_admin ? (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                      {selectedMember.user?.role || 'student'}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{selectedMember.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="text-sm text-gray-900 capitalize">
                      {selectedMember.is_admin ? 'Admin' : (selectedMember.user?.role || 'student')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

