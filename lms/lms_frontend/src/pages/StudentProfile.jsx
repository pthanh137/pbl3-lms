/**
 * StudentProfile Page
 * 
 * Udemy-style public student profile page.
 * Route: /student/:studentId/profile
 * 
 * Features:
 * - Public access (no authentication required)
 * - Student information with avatar and social links
 * - Statistics cards
 * - About section (if bio exists)
 * - Learning activity (enrolled courses with progress)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentProfile } from '../api/client';

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudentProfile(studentId);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      if (err.response?.status === 404) {
        setError('Student not found');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load student profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Get avatar URL with fallback
  const getAvatarUrl = (profile) => {
    if (profile?.avatar_url) return profile.avatar_url;
    const initial = profile?.full_name?.[0]?.toUpperCase() || '?';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=256`;
  };

  // Placeholder image for courses
  const placeholderImage = 'https://via.placeholder.com/400x225?text=No+Image';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {error || 'Student not found'}
            </h2>
            <p className="text-slate-600 mb-6">
              The student profile you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = profile.stats || {};
  const courses = profile.courses || [];
  const socialLinks = profile.social_links || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={getAvatarUrl(profile)}
                  alt={profile.full_name || 'Student'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name?.[0] || '?')}&background=6366f1&color=fff&size=256`;
                  }}
                />
              </div>

              {/* Info Block */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {profile.full_name || 'Student'}
                </h1>
                
                {/* Country / Language */}
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  {profile.country && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {profile.country}
                    </span>
                  )}
                  {profile.language && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {profile.language.toUpperCase()}
                    </span>
                  )}
                  {stats.member_since && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Member since {formatDate(stats.member_since)}
                    </span>
                  )}
                </div>

                {/* Social Links */}
                {(socialLinks.linkedin || socialLinks.github || socialLinks.facebook) && (
                  <div className="flex items-center gap-3">
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-blue-600 transition"
                        title="LinkedIn"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {socialLinks.github && (
                      <a
                        href={socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-slate-900 transition"
                        title="GitHub"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-blue-600 transition"
                        title="Facebook"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Enrolled Courses</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_enrolled_courses || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Completed Courses</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_completed_courses || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_reviews || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Quiz Attempts</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_quiz_attempts || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Assignments</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_assignments_submitted || 0}</p>
          </div>
        </div>

        {/* About Section */}
        {profile.bio && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">About</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          </div>
        )}

        {/* Courses Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Learning Activity</h2>
          
          {courses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                No courses enrolled yet
              </h3>
              <p className="text-slate-600">
                This student hasn't enrolled in any courses.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-slate-200">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        No thumbnail
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3">
                      {course.title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 h-2 rounded">
                        <div
                          className="bg-blue-600 h-full rounded transition-all"
                          style={{ width: `${Math.min(course.progress_percentage || 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {course.progress_percentage?.toFixed(1) || 0}% complete
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {course.completed_lessons || 0} / {course.total_lessons || 0} lessons
                      </p>
                    </div>

                    {/* Enrolled Date */}
                    <p className="text-xs text-slate-400 mt-3">
                      Enrolled: {formatDate(course.enrolled_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

