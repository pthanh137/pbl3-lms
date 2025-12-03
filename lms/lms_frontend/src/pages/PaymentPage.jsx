import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { coursesAPI, purchaseCourse } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Get mode from location state (default to 'paid')
  const mode = location.state?.mode || 'paid';
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: `/courses/${courseId}/payment` } });
      return;
    }
    
    if (user?.role !== 'student') {
      navigate(`/courses/${courseId}`);
      return;
    }
    
    fetchCourse();
  }, [courseId, isAuthenticated, user, navigate]);
  
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getById(courseId);
      setCourse(response.data);
    } catch (err) {
      setError('Failed to load course information.');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!course) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Call purchase API
      await purchaseCourse(courseId, mode);
      
      // Redirect back to course detail page with success state
      navigate(`/courses/${courseId}`, { 
        replace: true,
        state: { fromPayment: true, success: true, mode }
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Payment failed. Please try again.';
      setError(errorMsg);
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading payment page...</p>
        </div>
      </div>
    );
  }
  
  if (error && !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const price = mode === 'paid' ? (parseFloat(course?.price || 0)) : 0;
  
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {mode === 'paid' ? 'Complete Payment' : 'Audit Enrollment'}
          </h1>
          <p className="text-slate-600">
            {mode === 'paid' 
              ? 'Review your order and complete the payment to get full access to this course.'
              : 'Confirm your free audit enrollment to access course content.'}
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Course Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Course Summary</h2>
              
              {course?.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{course?.title}</h3>
              {course?.subtitle && (
                <p className="text-slate-600 mb-4">{course.subtitle}</p>
              )}
              
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Lifetime access</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>Certificate of completion {mode === 'paid' ? '(included)' : '(not included)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>All course materials</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {mode === 'paid' ? 'Payment Details' : 'Enrollment Confirmation'}
              </h2>
              
              {/* Price Summary */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Course Price</span>
                  <span className="font-medium">${price.toFixed(2)}</span>
                </div>
                {mode === 'paid' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                      <span>Total</span>
                      <span>${price.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {mode === 'audit' && (
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-emerald-600">
                    <span>Total</span>
                    <span>Free</span>
                  </div>
                )}
              </div>
              
              {/* Payment Form (for paid) */}
              {mode === 'paid' && (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      maxLength="19"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder={user?.full_name || user?.email || 'Your Name'}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : `Pay $${price.toFixed(2)}`}
                  </button>
                  
                  <p className="text-xs text-slate-500 text-center">
                    This is a simulation. No actual payment will be processed.
                  </p>
                </form>
              )}
              
              {/* Audit Confirmation */}
              {mode === 'audit' && (
                <div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-emerald-800">
                      <strong>Free Audit Enrollment</strong>
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      You'll have access to all course content, but won't receive a certificate upon completion.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
                      {error}
                    </div>
                  )}
                  
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Confirm Free Enrollment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

