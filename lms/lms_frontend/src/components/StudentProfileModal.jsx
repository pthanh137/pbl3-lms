import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * StudentProfileModal Component
 * 
 * Displays student profile in a modal dialog.
 * Uses student object passed via props (no API calls).
 */
const StudentProfileModal = ({ student, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleViewFullProfile = () => {
    if (student?.id) {
      navigate(`/student/${student.id}`);
      onClose();
    }
  };

  if (!isOpen || !student) return null;

  const avatarUrl = student.avatar;
  const fullName = student.full_name || 'Unknown Student';
  const email = student.email || 'N/A';
  const enrolledCount = student.enrolled_count || 0;
  const completedCount = student.completed_count || 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Student Profile</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avatar and Name */}
          <div className="text-center mb-6">
            <img
              src={student?.avatar || "/default-avatar.png"}
              alt={student?.full_name || "Student"}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gray-200"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            
            <h4 className="text-xl font-semibold text-gray-900">
              {fullName}
            </h4>
            <p className="text-sm text-gray-500 mt-1">{email}</p>
            
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                student
              </span>
            </div>
          </div>

          {/* Statistics */}
          {(enrolledCount > 0 || completedCount > 0) && (
            <div className="border-t pt-4 mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{enrolledCount}</div>
                  <div className="text-xs text-gray-500 mt-1">Courses Enrolled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
                  <div className="text-xs text-gray-500 mt-1">Courses Completed</div>
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="border-t pt-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm text-gray-900">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm text-gray-900 capitalize">student</span>
              </div>
            </div>
          </div>

          {/* View Full Profile Button */}
          <div className="border-t pt-4">
            <button
              onClick={handleViewFullProfile}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
