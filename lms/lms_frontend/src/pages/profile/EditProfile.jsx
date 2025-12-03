/**
 * EditProfile Page
 * 
 * Udemy-style profile editing page.
 * Route: /profile/:userId/edit
 * 
 * Features:
 * - Edit avatar, name, headline, bio, country, social links
 * - Avatar upload with preview
 * - Form validation
 * - Save changes via PATCH API
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../../api/client';
import AvatarUploader from '../../components/profile/AvatarUploader';
import CountrySelect from '../../components/profile/CountrySelect';

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    avatar_url: '',
    full_name: '',
    headline: '',
    bio: '',
    country: '',
    social_links: {
      facebook: '',
      linkedin: '',
      github: '',
      website: '',
    },
  });

  // Check if user is editing their own profile
  useEffect(() => {
    if (currentUser && currentUser.id !== parseInt(userId)) {
      navigate(`/profile/${userId}`);
    }
  }, [currentUser, userId, navigate]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyProfile();
      const profile = response.data;
      
      setFormData({
        avatar_url: profile.avatar_url || '',
        full_name: profile.full_name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        country: profile.country || '',
        social_links: profile.social_links || {
          facebook: '',
          linkedin: '',
          github: '',
          website: '',
        },
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to load profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const validateUrl = (url) => {
    if (!url || url.trim() === '') return true; // Empty is valid
    try {
      // Check if it's a valid URL format
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
      } else {
        // Try with https:// prefix
        new URL(`https://${url}`);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.full_name || formData.full_name.trim() === '') {
      setError('Full name is required');
      return;
    }

    // Validate social links
    const socialLinks = formData.social_links;
    const invalidLinks = [];
    
    if (socialLinks.facebook && !validateUrl(socialLinks.facebook)) {
      invalidLinks.push('Facebook');
    }
    if (socialLinks.linkedin && !validateUrl(socialLinks.linkedin)) {
      invalidLinks.push('LinkedIn');
    }
    if (socialLinks.github && !validateUrl(socialLinks.github)) {
      invalidLinks.push('GitHub');
    }
    if (socialLinks.website && !validateUrl(socialLinks.website)) {
      invalidLinks.push('Website');
    }

    if (invalidLinks.length > 0) {
      setError(`Invalid URL format for: ${invalidLinks.join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      await updateMyProfile(formData);
      
      // Redirect to public profile page
      navigate(`/profile/${userId}`);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header - Coursera Style */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Edit Profile</h1>
          <p className="text-lg text-slate-600">Update your profile information</p>
        </div>

        {/* Error Message - Coursera Style */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Form - Coursera Style */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-10">
          {/* Avatar Upload - Coursera Style */}
          <div className="mb-10 pb-10 border-b-2 border-slate-200">
            <label className="block text-base font-bold text-slate-900 mb-4">
              Profile Photo
            </label>
            <AvatarUploader
              currentAvatarUrl={formData.avatar_url}
              onAvatarChange={(url) => handleInputChange('avatar_url', url)}
              size={150}
            />
          </div>

          {/* Full Name - Coursera Style */}
          <div className="mb-8">
            <label htmlFor="full_name" className="block text-base font-bold text-slate-900 mb-3">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
              className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
              placeholder="Enter your full name"
            />
          </div>

          {/* Headline - Coursera Style */}
          <div className="mb-8">
            <label htmlFor="headline" className="block text-base font-bold text-slate-900 mb-3">
              Headline
            </label>
            <input
              type="text"
              id="headline"
              value={formData.headline}
              onChange={(e) => handleInputChange('headline', e.target.value)}
              className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
              placeholder="e.g., Software Engineer, Teacher, Student"
            />
            <p className="mt-2 text-sm text-slate-500">
              A short description that appears below your name
            </p>
          </div>

          {/* Bio - Coursera Style */}
          <div className="mb-8">
            <label htmlFor="bio" className="block text-base font-bold text-slate-900 mb-3">
              About Me
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={6}
              className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none text-base"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Country - Coursera Style */}
          <div className="mb-8">
            <label htmlFor="country" className="block text-base font-bold text-slate-900 mb-3">
              Country
            </label>
            <CountrySelect
              value={formData.country}
              onChange={(value) => handleInputChange('country', value)}
            />
          </div>

          {/* Social Links - Coursera Style */}
          <div className="mb-10">
            <label className="block text-base font-bold text-slate-900 mb-6">
              Social Links
            </label>
            <div className="space-y-6">
              <div>
                <label htmlFor="facebook" className="block text-sm font-semibold text-slate-700 mb-2">
                  Facebook
                </label>
                <input
                  type="text"
                  id="facebook"
                  value={formData.social_links.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
                  placeholder="facebook.com/yourprofile"
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-semibold text-slate-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="text"
                  id="linkedin"
                  value={formData.social_links.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label htmlFor="github" className="block text-sm font-semibold text-slate-700 mb-2">
                  GitHub
                </label>
                <input
                  type="text"
                  id="github"
                  value={formData.social_links.github}
                  onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                  className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
                  placeholder="github.com/yourusername"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-slate-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  value={formData.social_links.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  className="w-full px-5 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base"
                  placeholder="yourwebsite.com"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Enter full URLs or just the domain name (e.g., facebook.com/yourprofile)
            </p>
          </div>

          {/* Action Buttons - Coursera Style */}
          <div className="flex gap-4 pt-8 border-t-2 border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:hover:transform-none"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${userId}`)}
              className="px-8 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-base transition-all border-2 border-slate-300 hover:border-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

