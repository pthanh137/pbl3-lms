import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';

/**
 * StudentDashboard Page
 * 
 * Design: Modern dashboard with stats and course cards
 * - Hero section with welcome message
 * - Stats cards showing enrollment metrics
 * - Course cards with progress bars
 * - Empty state with call-to-action
 */
const StudentDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchEnrollments();
  }, [isAuthenticated, navigate]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enrollmentsAPI.getMyEnrollments();
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results) {
        data = response.data.results;
      } else if (response.data?.data) {
        data = response.data.data;
      }
      setEnrollments(data);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      let errorMessage = 'Failed to load enrollments. Please try again.';
      if (err.response) {
        errorMessage = err.response.data?.detail || 
                      err.response.data?.message || 
                      `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  const totalEnrolled = enrollments.length;
  const avgProgress = totalEnrolled > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / totalEnrolled)
    : 0;
  const completedCourses = enrollments.filter(e => (e.progress_percent || 0) >= 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">My Courses</h1>
        <p className="text-xl text-slate-600">
          Welcome back, {user?.full_name || user?.email || 'Student'}!
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="text-3xl font-bold text-slate-900 mb-1">{totalEnrolled}</div>
          <div className="text-sm text-slate-600">Enrolled Courses</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-bold text-slate-900 mb-1">{avgProgress}%</div>
          <div className="text-sm text-slate-600">Average Progress</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-bold text-slate-900 mb-1">{completedCourses}</div>
          <div className="text-sm text-slate-600">Completed Courses</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          {error}
          <button
            onClick={fetchEnrollments}
            className="ml-4 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {enrollments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">
            You haven't enrolled in any courses yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start your learning journey by exploring our course catalog
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-3"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              onClick={() => navigate(`/courses/${enrollment.course?.id || enrollment.course_id}`)}
              className="card hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              {enrollment.course?.thumbnail_url && (
                <div className="relative h-40 w-full overflow-hidden bg-slate-200">
                  <img
                    src={enrollment.course.thumbnail_url}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold text-lg text-slate-900 mb-3 line-clamp-2 group-hover:text-sky-600 transition-colors">
                  {enrollment.course?.title || 'Untitled Course'}
                </h3>
                
                <ProgressBar progress={enrollment.progress_percent || 0} className="mb-4" />
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {enrollment.course?.level && (
                      <span className="badge bg-sky-100 text-sky-700 capitalize">
                        {enrollment.course.level}
                      </span>
                    )}
                    {enrollment.enrollment_type && (
                      <span
                        className={
                          enrollment.enrollment_type === 'paid'
                            ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-medium'
                            : 'inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs'
                        }
                      >
                        {enrollment.enrollment_type === 'paid' ? 'Paid' : 'Audit'}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    {enrollment.created_at 
                      ? new Date(enrollment.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
