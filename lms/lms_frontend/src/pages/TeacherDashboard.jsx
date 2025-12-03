/**
 * TeacherDashboard Page
 * 
 * Udemy-style instructor dashboard for managing courses and quizzes.
 * Route: /teacher/dashboard
 * 
 * Manual Test Flow:
 * 1) Login as teacher
 * 2) Click "Teacher" in navbar → goes to /teacher/dashboard
 * 3) Dashboard shows stats + list of courses
 * 4) On each course card:
 *    - "View" opens public course detail at /courses/:id
 *    - "Edit Course" opens CourseEditor at /teacher/courses/:id/edit
 *    - "Manage Quizzes" opens TeacherCourseQuizzes at /teacher/courses/:id/quizzes
 * 5) No runtime errors
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesAPI } from '../api/client';
import TeacherCourseCard from '../components/TeacherCourseCard';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // Store all courses for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    // Fetch courses
    fetchCourses();
  }, [isAuthenticated, user, authLoading, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coursesAPI.getTeacherCourses();
      
      // Handle different response formats
      let coursesData = [];
      if (Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data?.results) {
        coursesData = response.data.results;
      } else if (response.data?.data) {
        coursesData = response.data.data;
      }
      
      setCourses(coursesData);
      setAllCourses(coursesData); // Store all courses
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to load courses. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCourses(allCourses);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allCourses.filter((course) => {
      const title = course.title?.toLowerCase() || '';
      const subtitle = course.subtitle?.toLowerCase() || '';
      const description = course.description?.toLowerCase() || '';
      const category = course.category?.toLowerCase() || '';
      
      return (
        title.includes(query) ||
        subtitle.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
    
    setCourses(filtered);
  }, [searchQuery, allCourses]);

  // Calculate stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.is_published).length;
  const draftCourses = totalCourses - publishedCourses;

  // Handlers for course card actions
  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleEditCourse = (courseId) => {
    navigate(`/teacher/courses/${courseId}/edit`);
  };

  const handleManageQuizzes = (courseId) => {
    navigate(`/teacher/courses/${courseId}/quizzes`);
  };

  const handleManageStudents = (courseId) => {
    navigate(`/teacher/courses/${courseId}/students`);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Header Section - Coursera Style */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-base text-slate-600">
                Welcome back, <span className="font-semibold text-primary-600">{user?.full_name || user?.email || 'Teacher'}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/teacher/courses/new')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Course
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-sm font-semibold text-red-600 hover:text-red-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Row - Coursera Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Courses</div>
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-500">{totalCourses}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Published Courses</div>
              <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-accent-500">{publishedCourses}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Draft Courses</div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-700">{draftCourses}</div>
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Courses</h2>
              <p className="text-sm text-slate-500">Manage and organize your course content</p>
            </div>
            {/* Search Bar - Coursera Style */}
            <div className="w-full sm:w-80 bg-white rounded-lg border border-slate-300 px-4 py-2.5 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all shadow-sm">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search your courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-6 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
              Found <span className="font-semibold">{courses.length}</span> {courses.length === 1 ? 'course' : 'courses'} matching "<span className="font-semibold">{searchQuery}</span>"
            </div>
          )}

          {courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 lg:p-16 text-center">
              {searchQuery ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    No courses found
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    No courses match your search "<span className="font-semibold text-slate-900">{searchQuery}</span>"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition shadow-sm hover:shadow-md"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    You haven't created any courses yet
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Start teaching by creating your first course and sharing your knowledge with students
                  </p>
                  <button
                    onClick={() => navigate('/teacher/courses/new')}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Course
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <TeacherCourseCard
                  key={course.id}
                  course={course}
                  onView={() => handleViewCourse(course.id)}
                  onEdit={() => handleEditCourse(course.id)}
                  onManageQuizzes={() => handleManageQuizzes(course.id)}
                  onManageAssignments={() => navigate(`/teacher/courses/${course.id}/assignments`)}
                  onManageStudents={() => handleManageStudents(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
