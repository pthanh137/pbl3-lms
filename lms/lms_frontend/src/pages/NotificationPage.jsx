import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useNotificationStore from '../features/notifications/store/notificationStore';

/**
 * NotificationPage Component
 * 
 * Full page for viewing all notifications.
 * Route: /notifications
 */
const NotificationPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead, loading, error } = useNotificationStore();
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
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

    // Load notifications
    loadNotifications();
    
    // Note: Polling is managed by NotificationBell component in Navbar
    // No need to start/stop here to avoid duplicate polling
  }, [isAuthenticated, authLoading, navigate, loadNotifications]);

  // Get unique courses from notifications
  const courses = useMemo(() => {
    const courseMap = new Map();
    notifications.forEach(notif => {
      if (notif.course && !courseMap.has(notif.course.id)) {
        courseMap.set(notif.course.id, notif.course);
      }
    });
    return Array.from(courseMap.values());
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }

    // Filter by course
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(n => n.course?.id === parseInt(selectedCourse));
    }

    return filtered;
  }, [notifications, filter, selectedCourse]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    
    // Navigate to target_url if available, otherwise fallback to course
    if (notification.target_url) {
      navigate(notification.target_url);
    } else if (notification.course?.id) {
      // Fallback navigation based on notification type
      if (notification.notification_type?.includes('quiz')) {
        navigate(`/courses/${notification.course.id}/quizzes`);
      } else if (notification.notification_type?.includes('assignment')) {
        navigate(`/courses/${notification.course.id}/assignments`);
      } else if (notification.notification_type?.includes('lesson') || notification.notification_type?.includes('section')) {
        navigate(`/courses/${notification.course.id}/learn`);
      } else {
        navigate(`/courses/${notification.course.id}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
          <p className="mt-4 text-slate-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
              <p className="text-slate-600">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
              >
                Mark all as read
              </button>
            )}
          </div>
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Course Filter */}
          {courses.length > 0 && (
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No notifications</h3>
            <p className="text-slate-600">
              {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.is_read;
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border-2 shadow-sm p-6 transition-all hover:shadow-md cursor-pointer ${
                    isUnread ? 'border-primary-300 bg-primary-50' : 'border-slate-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Unread Indicator */}
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                      isUnread ? 'bg-primary-500' : 'bg-transparent'
                    }`}></div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${isUnread ? 'text-primary-900' : 'text-slate-900'}`}>
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white ml-2">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-700 mb-3 whitespace-pre-wrap break-words">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {notification.course && (
                          <>
                            <span className="font-medium">{notification.course.title}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatRelativeTime(notification.created_at)}</span>
                        {notification.notification_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
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

export default NotificationPage;

