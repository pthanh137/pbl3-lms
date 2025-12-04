import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnnouncementStore from '../features/announcements/store/announcementStore';

/**
 * TeacherAnnouncementDetail Component
 * 
 * Teacher UI for viewing announcement details with read statistics.
 * Route: /teacher/announcements/:id
 */
const TeacherAnnouncementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { announcementDetail, loadAnnouncementDetail, loading, error } = useAnnouncementStore();

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

    // Redirect if not teacher
    if (user?.role !== 'teacher') {
      navigate('/', { replace: true });
      return;
    }

    // Load announcement detail
    if (id) {
      loadAnnouncementDetail(parseInt(id));
    }
  }, [isAuthenticated, user, authLoading, navigate, id, loadAnnouncementDetail]);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading announcement...</p>
        </div>
      </div>
    );
  }

  if (error || !announcementDetail) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Announcement not found</h3>
            <p className="text-slate-600 mb-6">{error || 'The announcement you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/teacher/announcements/sent')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition"
            >
              Back to Announcements
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = announcementDetail.read_statistics || { read_count: 0, unread_count: 0, total: 0 };
  const readPercentage = stats.total > 0 ? Math.round((stats.read_count / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/announcements/sent')}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Announcements
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Announcement Details</h1>
        </div>

        {/* Announcement Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 mb-6">
          {/* Course Info */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Course</p>
                <p className="text-lg font-semibold text-slate-900">
                  {announcementDetail.course?.title || 'Unknown Course'}
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {announcementDetail.title}
          </h2>

          {/* Created Date */}
          <div className="mb-6">
            <p className="text-sm text-slate-500">
              Sent on {formatDate(announcementDetail.created_at)}
            </p>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
              {announcementDetail.message}
            </p>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Read Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Students */}
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {stats.total}
              </div>
              <div className="text-sm text-slate-600">Total Students</div>
            </div>

            {/* Read Count */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.read_count}
              </div>
              <div className="text-sm text-green-700">Read</div>
            </div>

            {/* Unread Count */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.unread_count}
              </div>
              <div className="text-sm text-orange-700">Unread</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Read Rate</span>
              <span className="text-sm font-semibold text-primary-600">{readPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-primary-500 h-3 rounded-full transition-all"
                style={{ width: `${readPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnnouncementDetail;



