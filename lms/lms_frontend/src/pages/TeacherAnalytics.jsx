/**
 * TeacherAnalytics Page
 * 
 * Udemy-style instructor analytics dashboard showing summary stats and per-course performance.
 * Route: /teacher/analytics
 * 
 * Features:
 * - Summary cards: Total courses, enrollments, students, average rating, reviews
 * - Per-course analytics table with detailed stats
 * - Teacher-only access with role check
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTeacherSummary, getTeacherCourseStats, getTeacherTimeseries, getTeacherEngagement } from '../api/client';
import RatingStars from '../components/RatingStars';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [engagement, setEngagement] = useState(null);
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

    // Fetch analytics data
    fetchAnalytics();
  }, [isAuthenticated, user, authLoading, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch summary, course stats, timeseries, and engagement in parallel
      const [summaryResponse, courseStatsResponse, timeseriesResponse, engagementResponse] = await Promise.all([
        getTeacherSummary(),
        getTeacherCourseStats(),
        getTeacherTimeseries(6),
        getTeacherEngagement(),
      ]);
      
      setSummary(summaryResponse.data);
      setCourseStats(courseStatsResponse.data || []);
      setTimeseriesData(timeseriesResponse.data || []);
      setEngagement(engagementResponse.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to load analytics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
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

  // Placeholder image for courses without thumbnails
  const placeholderImage = 'https://via.placeholder.com/200x120?text=No+Image';

  // Format month for display
  const formatMonth = (monthString) => {
    if (!monthString) return '';
    try {
      const [year, month] = monthString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return monthString;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {formatter ? formatter(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart components
  const RevenueChart = ({ data }) => {
    const chartData = data.map(item => ({
      month: formatMonth(item.month),
      revenue: parseFloat(item.revenue || 0),
    }));

    // Calculate max revenue for better Y-axis scaling
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);
    const yAxisDomain = [0, Math.ceil(maxRevenue * 1.1)];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="#cbd5e1"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="#cbd5e1"
            tickFormatter={(value) => `$${value}`}
            domain={yAxisDomain}
            width={60}
          />
          <Tooltip 
            content={<CustomTooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />}
            cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
            iconSize={12}
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#revenueGradient)" 
            name="Revenue"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const EnrollmentsChart = ({ data }) => {
    const chartData = data.map(item => ({
      month: formatMonth(item.month),
      paid: item.paid_enrollments || 0,
      audit: item.audit_enrollments || 0,
    }));

    // Calculate max enrollments for better Y-axis scaling
    const maxEnrollments = Math.max(
      ...chartData.map(d => d.paid + d.audit),
      10
    );
    const yAxisDomain = [0, Math.ceil(maxEnrollments * 1.1)];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
        >
          <defs>
            <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="auditGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="#cbd5e1"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="#cbd5e1"
            domain={yAxisDomain}
            width={50}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
            iconSize={12}
          />
          <Area 
            type="monotone" 
            dataKey="paid" 
            stackId="1"
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#paidGradient)" 
            name="Paid"
            animationDuration={800}
          />
          <Area 
            type="monotone" 
            dataKey="audit" 
            stackId="1"
            stroke="#64748b" 
            strokeWidth={2}
            fill="url(#auditGradient)" 
            name="Audit"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-xl text-slate-600">
            Performance insights for your courses
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

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total Students */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Total Students</p>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.total_students || 0}</p>
            </div>

            {/* Paid Enrollments */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Paid Enrollments</p>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{summary.total_paid_enrollments || 0}</p>
            </div>

            {/* Audit Enrollments */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Audit Enrollments</p>
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-600">{summary.total_audit_enrollments || 0}</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-sky-600">
                ${parseFloat(summary.total_revenue || 0).toFixed(2)}
              </p>
            </div>

            {/* Certificates Issued */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Certificates Issued</p>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.total_certificates_issued || 0}</p>
            </div>
          </div>
        )}

        {/* Engagement Cards */}
        {engagement && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Lessons Completed */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Lessons Completed</p>
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-primary-600">{engagement.lessons_completed || 0}</p>
            </div>

            {/* Average Completion Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Average Completion Rate</p>
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-accent-600">{engagement.completion_rate || 0}%</p>
            </div>

            {/* Quiz Attempts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Quiz Attempts</p>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-600">{engagement.quiz_attempts || 0}</p>
            </div>

            {/* Assignments Submitted */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Assignments Submitted</p>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-600">{engagement.assignments_submitted || 0}</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {timeseriesData.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Revenue over time</h3>
                  <p className="text-sm text-slate-500 mt-1">Monthly revenue breakdown</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="h-80">
                <RevenueChart data={timeseriesData} />
              </div>
            </div>

            {/* Enrollments Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Enrollments (paid vs audit)</h3>
                  <p className="text-sm text-slate-500 mt-1">Monthly enrollment trends</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="h-80">
                <EnrollmentsChart data={timeseriesData} />
              </div>
            </div>
          </div>
        )}

        {/* Course Performance Section */}
        <div className="mt-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Course Performance Table */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Course Performance
              </h2>

              {courseStats.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                No courses found
              </h3>
              <p className="text-slate-600">
                Create your first course to see analytics here
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Students</th>
                      <th className="px-4 py-3 text-left">Enrollments</th>
                      <th className="px-4 py-3 text-left">Paid</th>
                      <th className="px-4 py-3 text-left">Audit</th>
                      <th className="px-4 py-3 text-left">Revenue</th>
                      <th className="px-4 py-3 text-left">Certificates</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map((c) => (
                      <tr key={c.course_id} className="border-t hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={c.course_thumbnail || placeholderImage}
                              alt={c.course_title}
                              className="w-14 h-10 object-cover rounded"
                              onError={(e) => {
                                e.target.src = placeholderImage;
                              }}
                            />
                            <span className="font-medium text-slate-900 line-clamp-2">
                              {c.course_title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {c.unique_students_count || 0}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {c.enrollments_count || 0}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">
                          {c.paid_enrollments || 0}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.audit_enrollments || 0}
                        </td>
                        <td className="px-4 py-3 text-sky-600 font-medium">
                          ${parseFloat(c.revenue || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {c.certificates_issued || 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <RatingStars value={c.average_rating || 0} size="sm" />
                            <span className="text-slate-700">
                              {(c.average_rating || 0).toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'published' ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-medium">
                              Draft
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </div>

            {/* Top Course Card */}
            {courseStats.length > 0 && (() => {
              const topCourse = courseStats.reduce((max, course) => 
                (parseFloat(course.revenue || 0) > parseFloat(max.revenue || 0)) ? course : max
              , courseStats[0]);
              
              return (
                <div className="lg:w-80 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Top Course
                  </h2>
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <img
                        src={topCourse.course_thumbnail || placeholderImage}
                        alt={topCourse.course_title}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {topCourse.course_title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {topCourse.unique_students_count || 0} students · ${parseFloat(topCourse.revenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;

