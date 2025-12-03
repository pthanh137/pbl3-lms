/**
 * InstructorProfile Page
 * 
 * Udemy-style public instructor profile page.
 * Route: /instructor/:instructorId/profile
 * 
 * Features:
 * - Public access (no authentication required)
 * - Instructor information with avatar, headline, bio, country
 * - Social links display
 * - Statistics cards (students, reviews, courses, rating)
 * - Courses taught grid
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInstructorProfile } from '../../api/client';
import SocialLinks from '../../components/profile/SocialLinks';

const InstructorProfile = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = currentUser && currentUser.id === parseInt(instructorId);

  useEffect(() => {
    fetchProfile();
  }, [instructorId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInstructorProfile(instructorId);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching instructor profile:', err);
      if (err.response?.status === 404) {
        setError('Instructor not found');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load instructor profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = (name) => {
    const initial = name?.[0]?.toUpperCase() || 'I';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=128`;
  };

  const getCountryName = (code) => {
    const countries = {
      'US': 'United States', 'VN': 'Vietnam', 'GB': 'United Kingdom', 'CA': 'Canada',
      'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain',
      'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
      'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland',
      'PT': 'Portugal', 'GR': 'Greece', 'IE': 'Ireland', 'CZ': 'Czech Republic',
      'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria', 'HR': 'Croatia',
      'SK': 'Slovakia', 'SI': 'Slovenia', 'LT': 'Lithuania', 'LV': 'Latvia',
      'EE': 'Estonia', 'JP': 'Japan', 'CN': 'China', 'KR': 'South Korea',
      'IN': 'India', 'SG': 'Singapore', 'MY': 'Malaysia', 'TH': 'Thailand',
      'ID': 'Indonesia', 'PH': 'Philippines', 'TW': 'Taiwan', 'HK': 'Hong Kong',
      'NZ': 'New Zealand', 'ZA': 'South Africa', 'BR': 'Brazil', 'MX': 'Mexico',
      'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru',
      'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya', 'IL': 'Israel',
      'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'TR': 'Turkey',
      'RU': 'Russia', 'UA': 'Ukraine', 'BY': 'Belarus', 'KZ': 'Kazakhstan',
    };
    return countries[code] || code;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
        {/* Header Skeleton */}
        <div className="bg-white border-b-2 border-slate-200 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-40 h-40 rounded-full bg-slate-200 animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-96 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6"></div>
          <div className="bg-white p-10 border-2 border-slate-200 rounded-2xl space-y-3">
            <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-10 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Instructor Not Found</h2>
          <p className="text-lg text-slate-600 mb-8">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const avatarUrl = profile.avatar_url || getDefaultAvatar(profile.full_name);
  const stats = profile.stats || {};
  const courses = profile.courses || [];
  const socialLinks = profile.social_links || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Header Section - Coursera Style */}
      <div className="bg-white border-b-2 border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <img
                src={avatarUrl}
                alt={profile.full_name || 'Instructor'}
                className="w-40 h-40 rounded-full object-cover shadow-xl border-4 border-primary-200"
                onError={(e) => {
                  e.target.src = getDefaultAvatar(profile.full_name);
                }}
              />
              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Instructor Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
                {profile.full_name || 'Instructor'}
              </h1>
              
              {profile.headline && (
                <p className="text-xl text-slate-600 mb-6 font-medium">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 mb-6">
                {profile.country && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{getCountryName(profile.country)}</span>
                  </div>
                )}

                {stats.member_since && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Member since {formatDate(stats.member_since)}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="mb-6">
                <SocialLinks socialLinks={socialLinks} size="md" />
              </div>

              {/* Edit Button (if own profile) */}
              {isOwnProfile && (
                <button
                  onClick={() => navigate(`/profile/${instructorId}/edit`)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Coursera Style */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Average Rating */}
          <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Average Rating</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
            </p>
          </div>

          {/* Total Students */}
          <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Students</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {stats.total_students?.toLocaleString() || 0}
            </p>
          </div>

          {/* Total Reviews */}
          <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Reviews</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {stats.total_reviews?.toLocaleString() || 0}
            </p>
          </div>

          {/* Total Courses */}
          <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Courses</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {stats.total_courses || 0}
            </p>
          </div>
        </div>
      </div>

      {/* About Section - Coursera Style */}
      {profile.bio && (
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <div className="bg-white rounded-2xl p-10 border-2 border-slate-200 shadow-lg">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">About me</h2>
            <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        </div>
      )}

      {/* Courses Taught Section - Coursera Style */}
      <div className="max-w-6xl mx-auto px-6 mt-12 mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Courses taught</h2>

        {courses.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-16 text-center shadow-lg">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No courses yet
            </h3>
            <p className="text-lg text-slate-600">
              This instructor hasn't published any courses yet.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="bg-white border-2 border-slate-200 rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer group"
                onClick={() => navigate(`/courses/${course.course_id}`)}
              >
                {/* Course Thumbnail */}
                <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-gradient-to-br from-primary-500 to-secondary-500"
                    style={{ display: course.thumbnail_url ? 'none' : 'flex' }}
                  >
                    {course.title?.[0]?.toUpperCase() || 'C'}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 line-clamp-2 mb-3 min-h-[3rem] text-base group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-600 font-medium">
                      {course.total_students?.toLocaleString() || 0} students
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                      <svg className="w-4 h-4 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-slate-900">
                        {course.rating ? course.rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-slate-500">
                        ({course.total_reviews || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorProfile;

