import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    pendingTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [teachersRes, studentsRes, coursesRes, revenueRes] = await Promise.all([
        adminAPI.getTeachers(),
        adminAPI.getStudents(),
        adminAPI.getCourses(),
        adminAPI.getRevenue(),
      ]);
      
      const teachers = teachersRes.data?.results || teachersRes.data || [];
      const students = studentsRes.data?.results || studentsRes.data || [];
      const courses = coursesRes.data?.results || coursesRes.data || [];
      const revenue = revenueRes.data || {};
      
      setStats({
        totalTeachers: teachers.length,
        pendingTeachers: teachers.filter(t => !t.is_approved).length,
        totalStudents: students.length,
        totalCourses: courses.length,
        totalRevenue: revenue.total_revenue || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.detail || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-base text-slate-600">
                Welcome back, <span className="font-semibold text-primary-600">{user?.full_name || user?.email || 'Admin'}</span>
              </p>
            </div>
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/teachers')}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Teachers</div>
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-500">{stats.totalTeachers}</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/teachers')}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Pending Approval</div>
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-500">{stats.pendingTeachers}</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/students')}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Students</div>
              <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-accent-500">{stats.totalStudents}</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/courses')}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Courses</div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-700">{stats.totalCourses}</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/revenue')}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Revenue</div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-500">${stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/teachers')}
              className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">Manage Teachers</h3>
              </div>
              <p className="text-sm text-slate-600">View and approve teachers</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/students')}
              className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">View Students</h3>
              </div>
              <p className="text-sm text-slate-600">Browse all students</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/courses')}
              className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">View Courses</h3>
              </div>
              <p className="text-sm text-slate-600">Browse all courses</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/revenue')}
              className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">View Revenue</h3>
              </div>
              <p className="text-sm text-slate-600">Revenue statistics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

