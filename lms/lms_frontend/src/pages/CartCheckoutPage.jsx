import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkoutCart } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Get cart items from location state
  const itemsFromState = location.state?.cartItems || [];
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: '/cart/checkout' } });
      return;
    }
    
    if (user?.role !== 'student') {
      navigate('/');
      return;
    }
    
    if (itemsFromState.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Calculate subtotal
    const total = itemsFromState.reduce((sum, item) => sum + parseFloat(item.price_at_add || 0), 0);
    setCartItems(itemsFromState);
    setSubtotal(total);
    setLoading(false);
  }, [isAuthenticated, user, navigate, itemsFromState]);
  
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Get selected item IDs
      const selectedItemIds = cartItems.map(item => item.id);
      
      // Call checkout API with selected item IDs
      const response = await checkoutCart(selectedItemIds);
      
      // Get the first enrolled course ID to redirect
      const enrolledCourses = response.data.enrolled_courses || [];
      const firstCourseId = enrolledCourses.length > 0 ? enrolledCourses[0] : null;
      
      if (firstCourseId) {
        // Redirect to the first course that was enrolled
        navigate(`/courses/${firstCourseId}`, { 
          replace: true,
          state: { fromPayment: true, success: true, enrolledCourses }
        });
      } else {
        // If no courses were enrolled (all were skipped), go to my-learning
        navigate('/my-learning', { replace: true });
      }
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
          <p className="mt-4 text-slate-600">Loading checkout page...</p>
        </div>
      </div>
    );
  }
  
  if (error && cartItems.length === 0) {
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
              onClick={() => navigate('/cart')}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-slate-600">
            Review your order and complete the payment to get full access to these courses.
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Course Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">
                    {item.course_thumbnail && (
                      <img
                        src={item.course_thumbnail}
                        alt={item.course_title}
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/96x64?text=No+Image';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.course_title}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        ${parseFloat(item.price_at_add || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2 text-sm text-slate-600">
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
                  <span>Certificate of completion (included)</span>
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Details</h2>
              
              {/* Price Summary */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>${Number(subtotal).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Payment Form */}
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
                  {processing ? 'Processing...' : `Pay $${Number(subtotal).toFixed(2)}`}
                </button>
                
                <p className="text-xs text-slate-500 text-center">
                  This is a simulation. No actual payment will be processed.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckoutPage;

