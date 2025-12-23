import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminRevenue = () => {
  const navigate = useNavigate();
  const [revenue, setRevenue] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart colors matching LMS theme
  const CHART_COLORS = {
    primary: '#0056D2',
    accent: '#0ea5e9',
    green: '#10b981',
    yellow: '#f59e0b',
    slate: '#64748b',
  };
  
  const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.slate];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [revenueRes, analyticsRes] = await Promise.all([
        adminAPI.getRevenue(),
        adminAPI.getRevenueAnalytics(),
      ]);
      setRevenue(revenueRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err.response?.data?.detail || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading revenue data...</p>
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
                Revenue Statistics
              </h1>
              <p className="text-base text-slate-600">
                View revenue and payment statistics
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        )}

        {revenue && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-600">Total Revenue</div>
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-500">
                  ${revenue.total_revenue?.toLocaleString() || '0'}
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-600">Total Payments</div>
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary-500">{revenue.total_payments || 0}</div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-600">Courses Sold</div>
                  <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-accent-500">{revenue.total_courses_sold || 0}</div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-600">Paid Students</div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-700">{revenue.total_students_paid || 0}</div>
              </div>
            </div>

            {/* Revenue by Course */}
            {revenue.revenue_by_course && revenue.revenue_by_course.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Top Courses by Revenue</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payments</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {revenue.revenue_by_course.map((item, index) => (
                          <tr key={item.course_id || index} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.course_title || 'Unknown Course'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ${item.revenue?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.payment_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            {analytics && (
              <>
                {/* Revenue by Time - Line Chart */}
                {analytics.revenue_by_time && analytics.revenue_by_time.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Revenue Over Time (Last 30 Days)</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.revenue_by_time}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#64748b"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            stroke="#64748b"
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={CHART_COLORS.primary} 
                            strokeWidth={2}
                            dot={{ fill: CHART_COLORS.primary, r: 4 }}
                            name="Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Revenue by Course - Bar Chart */}
                {analytics.revenue_by_course && analytics.revenue_by_course.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Revenue by Course</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.revenue_by_course}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="course_title" 
                            stroke="#64748b"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#64748b"
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="revenue" 
                            fill={CHART_COLORS.green}
                            name="Revenue"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Payment Ratio - Pie Chart */}
                {analytics.payment_ratio && analytics.payment_ratio.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Payment Ratio</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.payment_ratio}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.payment_ratio.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [value, name]}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 flex justify-center gap-6">
                        {analytics.payment_ratio.map((item, index) => (
                          <div key={index} className="text-center">
                            <div className="text-2xl font-bold" style={{ color: PIE_COLORS[index] }}>
                              {item.value}
                            </div>
                            <div className="text-sm text-slate-600">{item.name}</div>
                            <div className="text-xs text-slate-500">({item.percentage}%)</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Recent Payments */}
            {revenue.recent_payments && revenue.recent_payments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Payments</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {revenue.recent_payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{payment.reference_code}</td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {payment.user_name || payment.user_email}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">{payment.course_title || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ${payment.amount?.toLocaleString() || '0'} {payment.currency || 'USD'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {payment.created_at ? new Date(payment.created_at).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;

