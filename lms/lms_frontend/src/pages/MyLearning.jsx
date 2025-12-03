import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentProgressAPI } from '../api/client';
import MyLearningCourseCard from '../components/MyLearningCourseCard';

const MyLearning = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      navigate('/');
      return;
    }

    fetchMyCourses();
  }, [isAuthenticated, user, authLoading, navigate]);

  // Refresh data when page becomes visible (user returns from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.role === 'student') {
        fetchMyCourses();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && user?.role === 'student') {
        fetchMyCourses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredCourses(courses);
    } else if (activeFilter === 'in_progress') {
      // In progress: progress > 0% and < 100%
      setFilteredCourses(
        courses.filter(
          (c) =>
            c.status === 'in_progress' &&
            c.progress_percentage > 0 &&
            c.progress_percentage < 100
        )
      );
    } else if (activeFilter === 'completed') {
      // Completed: progress >= 100%
      setFilteredCourses(
        courses.filter((c) => c.status === 'completed' && c.progress_percentage >= 100)
      );
    } else {
      setFilteredCourses(courses.filter((c) => c.status === activeFilter));
    }
  }, [activeFilter, courses]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await studentProgressAPI.getMyCourses();
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results) {
        data = response.data.results;
      } else if (response.data?.data) {
        data = response.data.data;
      }
      setCourses(data);
      setFilteredCourses(data);
      // Debug: log course statuses
      console.log('Courses loaded:', data.map(c => ({ 
        title: c.course_title, 
        status: c.status,
        progress: c.progress_percentage 
      })));
    } catch (err) {
      console.error('Error fetching my courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header Section - Coursera Style */}
        <header className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl opacity-50"></div>
          <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              My learning
            </h1>
            <p className="text-lg text-slate-600">
              Continue your courses and track your progress.
            </p>
          </div>
        </header>

        {/* Filter tabs - Coursera Style */}
        <div className="flex gap-3 flex-wrap">
          {[
            { key: 'all', label: 'All', count: courses.length },
            {
              key: 'in_progress',
              label: 'In progress',
              count: courses.filter(
                (c) =>
                  c.status === 'in_progress' &&
                  c.progress_percentage > 0 &&
                  c.progress_percentage < 100
              ).length,
            },
            {
              key: 'completed',
              label: 'Completed',
              count: courses.filter(
                (c) => c.status === 'completed' && c.progress_percentage >= 100
              ).length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeFilter === key
                  ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-primary-200'
              }`}
            >
              {label} {count > 0 && <span className="ml-1">({count})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-slate-600">Loading your courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No courses found
            </h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              {activeFilter === 'all'
                ? 'Enroll in a course to start your learning journey.'
                : `No ${activeFilter === 'in_progress' ? 'in progress' : 'completed'} courses found.`}
            </p>
            {activeFilter !== 'all' ? (
              <button
                onClick={() => setActiveFilter('all')}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
              >
                View all courses
              </button>
            ) : (
              <button
                onClick={() => navigate('/browse')}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
              >
                Browse Courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-stretch">
            {filteredCourses.map((course) => (
              <MyLearningCourseCard key={course.course_id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;

