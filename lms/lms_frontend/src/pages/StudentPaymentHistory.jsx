import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentHistory } from '../api/client';

const StudentPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPaymentHistory();
      setPayments(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString();
  };

  const formatCurrency = (amount, currency) => {
    const value = Number(amount || 0);
    return `${currency} ${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header - Coursera Style */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Payment history
          </h1>
          <p className="text-lg text-slate-600">View all your course purchase transactions</p>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && payments.length === 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-16 text-center shadow-lg">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Payment Records</h2>
            <p className="text-lg text-slate-600 mb-8">You have no payment records yet.</p>
            <button
              onClick={() => navigate('/browse')}
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Browse Courses
            </button>
          </div>
        )}

        {!loading && !error && payments.length > 0 && (
          <div className="space-y-4">
            {payments.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-slate-200 rounded-2xl shadow-md p-6 flex gap-6 hover:shadow-xl hover:border-primary-200 transition-all"
              >
                <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0">
                  {item.course_thumbnail ? (
                    <img
                      src={item.course_thumbnail}
                      alt={item.course_title || 'Course thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-3">
                      {item.course_title || 'Course unavailable'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(item.amount, item.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'succeeded' 
                            ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                            : item.status === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                        <span className="px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full text-xs font-semibold border border-secondary-200">
                          {item.source}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="font-medium">Ref: {item.reference_code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {item.course_id && (
                    <button
                      onClick={() => navigate(`/courses/${item.course_id}`)}
                      className="self-start mt-4 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      Go to course
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPaymentHistory;

