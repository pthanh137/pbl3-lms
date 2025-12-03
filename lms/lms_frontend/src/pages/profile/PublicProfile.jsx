/**
 * PublicProfile Page
 * 
 * Udemy-style public user profile page.
 * Route: /profile/:userId
 * 
 * Features:
 * - Public access (no authentication required)
 * - User information with avatar, headline, bio, country
 * - Social links display
 * - Edit button if viewing own profile
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../api/client';
import SocialLinks from '../../components/profile/SocialLinks';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserProfile(userId);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If current user is a teacher viewing their own profile, redirect to instructor profile
    if (currentUser?.role === 'teacher' && isOwnProfile) {
      navigate(`/instructor/${userId}/profile`, { replace: true });
      return;
    }
    
    // Otherwise, fetch and display user profile
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUser?.role, isOwnProfile]);

  const getDefaultAvatar = (name) => {
    const initial = name?.[0]?.toUpperCase() || 'U';
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
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
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
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Profile Not Found</h2>
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
  const socialLinks = profile.social_links || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header Section - Coursera Style */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-10 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <img
                src={avatarUrl}
                alt={profile.full_name || 'User'}
                className="w-40 h-40 rounded-full object-cover border-4 border-primary-200 shadow-lg"
                onError={(e) => {
                  e.target.src = getDefaultAvatar(profile.full_name);
                }}
              />
              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
                {profile.full_name || 'No name'}
              </h1>
              
              {profile.headline && (
                <p className="text-xl text-slate-600 mb-6 font-medium">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                {profile.country && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{getCountryName(profile.country)}</span>
                  </div>
                )}

                {profile.date_joined && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Joined {formatDate(profile.date_joined)}</span>
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
                  onClick={() => navigate(`/profile/${userId}/edit`)}
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

        {/* About Section - Coursera Style */}
        {profile.bio && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">About Me</h2>
            <div className="prose max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;

