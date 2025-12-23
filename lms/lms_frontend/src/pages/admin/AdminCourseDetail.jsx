import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../api/client';

const AdminCourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCourseDetail(id);
      setCourse(response.data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.detail || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <span className="text-sm font-medium text-red-800">{error || 'Course not found'}</span>
          </div>
          <button
            onClick={() => navigate('/admin/courses')}
            className="mt-4 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Header */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Course Details
              </h1>
              <p className="text-base text-slate-600">
                View detailed information about this course
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Courses
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              {course.thumbnail_url && (
                <div className="mb-6">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h2>
              {course.subtitle && (
                <p className="text-lg text-slate-600 mb-4">{course.subtitle}</p>
              )}
              <div className="prose max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{course.description || 'No description available.'}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Course Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600">Teacher</div>
                    <div className="text-base font-semibold text-slate-900">{course.teacher_name || course.teacher_email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Price</div>
                    <div className="text-base font-semibold text-slate-900">${course.price || '0'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Level</div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                      {course.level}
                    </span>
                  </div>
                  {course.category && (
                    <div>
                      <div className="text-sm text-slate-600">Category</div>
                      <div className="text-base font-semibold text-slate-900">{course.category}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-slate-600">Status</div>
                    {course.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Draft
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Created</div>
                    <div className="text-base text-slate-900">
                      {course.created_at ? new Date(course.created_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600">Total Students</div>
                    <div className="text-2xl font-bold text-slate-900">{course.total_students || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">${course.total_revenue?.toLocaleString() || '0'}</div>
                  </div>
                  {course.average_rating && (
                    <div>
                      <div className="text-sm text-slate-600">Average Rating</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {course.average_rating} / 5.0
                      </div>
                      <div className="text-xs text-slate-500">({course.reviews_count || 0} reviews)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseDetail;

