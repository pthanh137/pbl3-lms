/**
 * TeacherStudents Page
 * 
 * Udemy-style student management page for teachers to view and manage students enrolled in a course.
 * Route: /teacher/courses/:courseId/students
 * 
 * Features:
 * - View all students with progress information
 * - Search by name or email
 * - Filter by status (all, in_progress, completed)
 * - Remove students from course
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseStudents, removeCourseStudent } from '../api/client';

const TeacherStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [error, setError] = useState(null);
  
  const debounceTimerRef = useRef(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (search.trim()) {
        params.q = search.trim();
      }
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await getCourseStudents(courseId, params);
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to load students. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auth check - only run once
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect if not teacher
    if (user.role !== 'teacher') {
      navigate('/', { replace: true });
      return;
    }

    // Initial load
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, navigate, courseId]);

  // Debounced search and filter - separate effect
  useEffect(() => {
    // Only search if auth is ready
    if (authLoading || !isAuthenticated || !user || user.role !== 'teacher') {
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce search - wait 500ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      loadStudents();
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const handleRemoveStudent = async () => {
    if (!deletingId) return;

    try {
      await removeCourseStudent(courseId, deletingId);
      setDeletingId(null);
      // Reload students list
      await loadStudents();
    } catch (err) {
      console.error('Error removing student:', err);
      alert(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to remove student. Please try again.'
      );
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Placeholder avatar
  const getAvatarUrl = (student) => {
    if (student.avatar_url) return student.avatar_url;
    // Generate a simple placeholder based on name
    const initial = student.full_name?.[0]?.toUpperCase() || student.email?.[0]?.toUpperCase() || '?';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=128`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course
          </button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Manage Students</h1>
          <p className="text-xl text-slate-600">
            View & manage students enrolled in this course.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-sm underline hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar - Coursera Style */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-md">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              />
            </div>

            {/* Filter Buttons - Coursera Style */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filter === 'in_progress'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filter === 'completed'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        {students.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              No students found
            </h3>
            <p className="text-slate-600">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No students enrolled in this course yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Enrollment</th>
                    <th className="px-4 py-3 text-left">Progress</th>
                    <th className="px-4 py-3 text-left">Lessons</th>
                    <th className="px-4 py-3 text-left">Last Accessed</th>
                    <th className="px-4 py-3 text-left">Activity</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.student_id} className="border-t hover:bg-slate-50 transition">
                      {/* Student Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(student)}
                            alt={student.full_name || student.email}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name?.[0] || '?')}&background=6366f1&color=fff&size=128`;
                            }}
                          />
                          <div>
                            <button
                              onClick={() => navigate(`/profile/${student.student_id}`)}
                              className="font-medium text-slate-900 hover:text-primary-500 transition cursor-pointer text-left"
                            >
                              {student.full_name || 'No name'}
                            </button>
                            <div className="text-slate-500 text-xs">
                              {student.email}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">
                              Enrolled {formatDate(student.enrolled_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Enrollment Type */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(() => {
                            const enrollmentType = student.enrollment_type;
                            const isPaid = enrollmentType === 'paid';
                            return (
                              <>
                                <span
                                  className={
                                    isPaid
                                      ? 'inline-flex items-center px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium'
                                      : 'inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs'
                                  }
                                >
                                  {isPaid ? 'Paid' : enrollmentType === 'audit' ? 'Audit' : 'Audit'}
                                </span>
                                {isPaid && student.price_paid && parseFloat(student.price_paid) > 0 && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    ${parseFloat(student.price_paid).toFixed(2)}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Progress - Coursera Style */}
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <div className="w-full bg-slate-200 h-2 rounded">
                            <div
                              className="bg-primary-500 h-full rounded transition-all"
                              style={{ width: `${Math.min(student.progress_percentage || 0, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs mt-1 text-primary-500 font-medium">
                            {student.progress_percentage?.toFixed(1) || 0}%
                          </p>
                        </div>
                      </td>

                      {/* Lessons */}
                      <td className="px-4 py-3 text-slate-700">
                        {student.completed_lessons || 0} / {student.total_lessons || 0}
                      </td>

                      {/* Last Accessed */}
                      <td className="px-4 py-3">
                        {student.last_accessed_lesson_title ? (
                          <div>
                            <div className="text-slate-900 font-medium text-xs">
                              {student.last_accessed_lesson_title}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {formatDate(student.last_accessed_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>Completed Quizzes: {student.quiz_attempts_count || 0}</div>
                          <div>Assignments: {student.assignments_submitted_count || 0}</div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition shadow-sm hover:shadow-md"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeletingId(student.student_id)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Student Information
                </h3>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Student Profile Section */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-slate-200">
                <img
                  src={getAvatarUrl(viewingStudent)}
                  alt={viewingStudent.full_name || viewingStudent.email}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingStudent.full_name?.[0] || '?')}&background=6366f1&color=fff&size=128`;
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-900 mb-1">
                    {viewingStudent.full_name || 'No name'}
                  </h4>
                  <p className="text-slate-600 mb-2">{viewingStudent.email}</p>
                  <p className="text-sm text-slate-500">
                    Student ID: {viewingStudent.student_id}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Info */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Enrollment Information
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Enrolled Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(viewingStudent.enrolled_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Enrollment Type</p>
                      <div className="flex items-center gap-2">
                        {viewingStudent.enrollment_type && (
                          <span
                            className={
                              viewingStudent.enrollment_type === 'paid'
                                ? 'inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-sm font-medium'
                                : 'inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm'
                            }
                          >
                            {viewingStudent.enrollment_type === 'paid' ? 'Paid' : 'Audit'}
                          </span>
                        )}
                        {viewingStudent.enrollment_type === 'paid' && viewingStudent.price_paid > 0 && (
                          <span className="text-sm font-medium text-slate-900">
                            ${parseFloat(viewingStudent.price_paid || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Progress</p>
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 h-3 rounded">
                          <div
                            className="bg-primary-500 h-full rounded transition-all"
                            style={{ width: `${Math.min(viewingStudent.progress_percentage || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-primary-500">
                          {viewingStudent.progress_percentage?.toFixed(1) || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson Progress */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Lesson Progress
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Completed Lessons</p>
                      <p className="text-sm font-medium text-slate-900">
                        {viewingStudent.completed_lessons || 0} / {viewingStudent.total_lessons || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Lessons</p>
                      <p className="text-sm font-medium text-slate-900">
                        {viewingStudent.total_lessons || 0}
                      </p>
                    </div>
                    {viewingStudent.last_accessed_lesson_title && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Last Accessed Lesson</p>
                        <p className="text-sm font-medium text-slate-900">
                          {viewingStudent.last_accessed_lesson_title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(viewingStudent.last_accessed_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Activity
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Completed Quizzes</p>
                      <p className="text-sm font-medium text-slate-900">
                        {viewingStudent.quiz_attempts_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Assignment Submissions</p>
                      <p className="text-sm font-medium text-slate-900">
                        {viewingStudent.assignments_submitted_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info - Only show if there's data */}
                {(viewingStudent.avatar_url || viewingStudent.last_accessed_lesson_id) && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                      Additional Information
                    </h5>
                    <div className="space-y-3">
                      {viewingStudent.avatar_url && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Avatar URL</p>
                          <p className="text-sm font-medium text-slate-900 break-all">
                            {viewingStudent.avatar_url}
                          </p>
                        </div>
                      )}
                      {viewingStudent.last_accessed_lesson_id && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Last Accessed Lesson ID</p>
                          <p className="text-sm font-medium text-slate-900">
                            {viewingStudent.last_accessed_lesson_id}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => {
                    navigate(`/profile/${viewingStudent.student_id}`);
                    setViewingStudent(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-primary-500 hover:bg-primary-600 text-white transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Full Profile
                </button>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Remove Student?
            </h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to remove this student from the course? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveStudent}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;

