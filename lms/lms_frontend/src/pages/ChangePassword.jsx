/**
 * ChangePassword Page
 * 
 * Allows authenticated users to change their password.
 * Route: /account/change-password
 * 
 * Features:
 * - Protected route (requires authentication)
 * - Form validation
 * - Success/error messages
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';

const ChangePassword = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    // Clear general error
    if (error) {
      setError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    // Required fields
    if (!formData.old_password.trim()) {
      newErrors.old_password = 'Current password is required';
    }

    if (!formData.new_password.trim()) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'New password must be at least 8 characters';
    }

    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Check if new password is same as old password
    if (formData.old_password && formData.new_password && 
        formData.old_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      });

      // Success
      setSuccess(true);
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setErrors({});

      // Don't auto-navigate, let user stay on the page to see success message
    } catch (err) {
      console.error('Error changing password:', err);
      
      // Handle backend error messages
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.old_password) {
        setErrors((prev) => ({
          ...prev,
          old_password: Array.isArray(err.response.data.old_password)
            ? err.response.data.old_password[0]
            : err.response.data.old_password,
        }));
      } else if (err.response?.data?.new_password) {
        setErrors((prev) => ({
          ...prev,
          new_password: Array.isArray(err.response.data.new_password)
            ? err.response.data.new_password[0]
            : err.response.data.new_password,
        }));
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to change password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-white py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-10 w-full max-w-lg space-y-8">
        {/* Header - Coursera Style */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Change Password</h2>
          <p className="text-lg text-slate-600">Update your account password</p>
        </div>

        {/* Success Message - Coursera Style */}
        {success && (
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 border-2 border-accent-200 text-accent-800 p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">Password updated successfully!</span>
            </div>
          </div>
        )}

        {/* Error Message - Coursera Style */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password - Coursera Style */}
          <div>
            <label htmlFor="old_password" className="block text-base font-bold text-slate-900 mb-3">
              Current Password
            </label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              autoComplete="current-password"
              className={`w-full px-5 py-3.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base ${
                errors.old_password ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your current password"
            />
            {errors.old_password && (
              <p className="mt-2 text-sm font-semibold text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.old_password}
              </p>
            )}
          </div>

          {/* New Password - Coursera Style */}
          <div>
            <label htmlFor="new_password" className="block text-base font-bold text-slate-900 mb-3">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              autoComplete="new-password"
              className={`w-full px-5 py-3.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base ${
                errors.new_password ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your new password (min. 8 characters)"
            />
            {errors.new_password && (
              <p className="mt-2 text-sm font-semibold text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.new_password}
              </p>
            )}
          </div>

          {/* Confirm New Password - Coursera Style */}
          <div>
            <label htmlFor="confirm_password" className="block text-base font-bold text-slate-900 mb-3">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              className={`w-full px-5 py-3.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-base ${
                errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Confirm your new password"
            />
            {errors.confirm_password && (
              <p className="mt-2 text-sm font-semibold text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirm_password}
              </p>
            )}
          </div>

          {/* Submit Button - Coursera Style */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:hover:transform-none text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Changing Password...
                </span>
              ) : 'Change Password'}
            </button>
          </div>
        </form>

        {/* Back Link - Coursera Style */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-base text-slate-600 hover:text-primary-600 font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

