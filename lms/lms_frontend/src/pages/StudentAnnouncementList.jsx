import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnnouncementStore from '../features/announcements/store/announcementStore';

/**
 * StudentAnnouncementList Component
 * 
 * Student UI for viewing all announcements from enrolled courses.
 * Route: /student/announcements
 * 
 * Similar to Coursera "Course Updates" page
 */
const StudentAnnouncementList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { myAnnouncements, loadMyAnnouncements, loading, error } = useAnnouncementStore();
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect if not student
    if (user?.role !== 'student') {
      navigate('/', { replace: true });
      return;
    }

    // Load announcements
    loadMyAnnouncements();
  }, [isAuthenticated, user, authLoading, navigate, loadMyAnnouncements]);

  // Get unique courses from announcements
  const courses = useMemo(() => {
    const courseMap = new Map();
    myAnnouncements.forEach(ann => {
      if (ann.course && !courseMap.has(ann.course.id)) {
        courseMap.set(ann.course.id, ann.course);
      }
    });
    return Array.from(courseMap.values());
  }, [myAnnouncements]);

  // Filter announcements by course
  const filteredAnnouncements = useMemo(() => {
    if (selectedCourse === 'all') {
      return myAnnouncements;
    }
    return myAnnouncements.filter(ann => ann.course?.id === parseInt(selectedCourse));
  }, [myAnnouncements, selectedCourse]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Course Updates</h1>
          <p className="text-slate-600">Stay updated with announcements from your enrolled courses</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Course Filter */}
        {courses.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCourse('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCourse === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Courses ({myAnnouncements.length})
              </button>
              {courses.map(course => {
                const count = myAnnouncements.filter(ann => ann.course?.id === course.id).length;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id.toString())}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedCourse === course.id.toString()
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {course.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No announcements yet</h3>
            <p className="text-slate-600">You'll see announcements from your enrolled courses here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const isUnread = announcement.is_read === false;
              
              return (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-xl border-2 shadow-sm p-6 transition-all hover:shadow-md cursor-pointer ${
                    isUnread ? 'border-primary-300 bg-primary-50' : 'border-slate-200'
                  }`}
                  onClick={() => navigate(`/student/announcements/${announcement.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${isUnread ? 'text-primary-900' : 'text-slate-900'}`}>
                          {announcement.title}
                        </h3>
                        {isUnread && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="font-medium">{announcement.course?.title || 'Course'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(announcement.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Preview */}
                  <div className="mb-4">
                    <p className="text-slate-700 line-clamp-2">
                      {announcement.message_preview || announcement.message || ''}
                    </p>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                      {formatDate(announcement.created_at)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/announcements/${announcement.id}`);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncementList;

