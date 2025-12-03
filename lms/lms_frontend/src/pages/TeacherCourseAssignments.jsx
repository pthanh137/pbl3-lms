import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI, coursesAPI } from '../api/client';

/**
 * TeacherCourseAssignments Page
 * 
 * Displays all assignments for a specific course and allows creating new assignments.
 * Route: /teacher/courses/:courseId/assignments
 */
const TeacherCourseAssignments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for creating assignment
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 10,
    is_published: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'teacher') {
      navigate('/');
      return;
    }

    fetchData();
  }, [courseId, isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course info
      try {
        const courseResponse = await coursesAPI.getById(courseId);
        setCourse(courseResponse.data);
      } catch (err) {
        console.error('Error fetching course:', err);
      }

      // Fetch assignments for this course
      const response = await assessmentsAPI.getTeacherAssignments({ course: courseId });
      let assignmentsData = [];
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data?.results) {
        assignmentsData = response.data.results;
      }
      // Filter by course if needed (backend should already filter, but just in case)
      setAssignments(assignmentsData.filter(a => a.course === parseInt(courseId) || a.course?.id === parseInt(courseId)));
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.detail || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        course: parseInt(courseId),
        title: formData.title,
        description: formData.description || '',
        due_date: formData.due_date || null,
        max_points: parseInt(formData.max_points) || 10,
        is_published: formData.is_published,
      };

      await assessmentsAPI.createTeacherAssignment(payload);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        due_date: '',
        max_points: 10,
        is_published: false,
      });
      setShowCreateForm(false);
      
      // Refresh list
      await fetchData();
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await assessmentsAPI.deleteTeacherAssignment(assignmentId);
      await fetchData();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert(err.response?.data?.detail || 'Failed to delete assignment');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            Assignments for {course?.title || 'Course'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Create Assignment Form - Coursera Style */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Create New Assignment</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  title: '',
                  description: '',
                  due_date: '',
                  max_points: 10,
                  is_published: false,
                });
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                placeholder="Assignment title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                placeholder="Assignment description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Points
                </label>
                <input
                  type="number"
                  value={formData.max_points}
                  onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 10 })}
                  min="1"
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-primary-500 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_published" className="ml-2 text-sm text-slate-700">
                Publish assignment
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {creating ? 'Creating...' : 'Create Assignment'}
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Assignments ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center text-slate-500 shadow-md">
              No assignments yet. Create your first assignment above.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{assignment.title}</h3>
                        {assignment.is_published && (
                          <span className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium border border-accent-200">
                            Published
                          </span>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Due: {formatDate(assignment.due_date)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Max Points: {assignment.max_points}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <button
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}/submissions`)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Submissions
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition shadow-sm hover:shadow-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-sm hover:shadow-md"
                      >
                        Delete
                      </button>
                    </div>
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

export default TeacherCourseAssignments;

