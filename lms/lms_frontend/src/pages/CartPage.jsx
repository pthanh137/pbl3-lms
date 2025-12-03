import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart, removeCartItem, checkoutCart } from '../api/client';

const CartPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set()); // Track selected item IDs

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: '/cart' } });
      return;
    }

    if (user?.role !== 'student') {
      navigate('/');
      return;
    }

    fetchCart();
  }, [isAuthenticated, user, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCart();
      const cartItems = response.data.items || [];
      setItems(cartItems);
      setSubtotal(response.data.subtotal || 0);
      setCount(response.data.count || 0);
      // Select all items by default
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.detail || 'Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // Calculate subtotal for selected items
  const selectedSubtotal = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + parseFloat(item.price_at_add || 0), 0);

  const selectedCount = selectedItems.size;

  const handleRemoveItem = async (itemId) => {
    try {
      await removeCartItem(itemId);
      // Remove item from local state
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      
      // Remove from selected items
      const newSelected = new Set(selectedItems);
      newSelected.delete(itemId);
      setSelectedItems(newSelected);
      
      // Recalculate subtotal
      const newSubtotal = updatedItems.reduce((sum, item) => sum + parseFloat(item.price_at_add || 0), 0);
      setSubtotal(newSubtotal);
      setCount(updatedItems.length);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to remove item. Please try again.';
      alert(errorMsg);
    }
  };

  const handleCheckout = () => {
    const selectedCartItems = items.filter(item => selectedItems.has(item.id));
    
    if (selectedCartItems.length === 0) {
      alert('Please select at least one course to checkout.');
      return;
    }

    // Navigate to checkout page with selected cart items only
    navigate('/cart/checkout', { 
      state: { 
        cartItems: selectedCartItems,
        subtotal: selectedSubtotal 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section - Coursera Style */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
          <p className="text-lg text-slate-600">Review your selected courses and proceed to checkout</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800 mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          {/* Left: Cart Items List */}
          <div>
            {items.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-16 text-center shadow-lg">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Your cart is empty
                </h2>
                <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                  Start adding courses to your cart to continue learning.
                </p>
                <button
                  onClick={() => navigate('/browse')}
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div>
                {/* Select All Checkbox - Coursera Style */}
                <div className="mb-6 flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-primary-500 border-slate-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <label className="text-base font-semibold text-slate-900 cursor-pointer">
                    Select all ({selectedCount} of {items.length})
                  </label>
                </div>

                {/* Cart Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex gap-4 bg-white border-2 rounded-xl p-5 shadow-md transition-all duration-200 hover:shadow-lg ${
                        selectedItems.has(item.id) 
                          ? 'border-primary-500 bg-primary-50/30' 
                          : 'border-slate-200 hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-5 h-5 text-primary-500 border-slate-300 rounded focus:ring-primary-500 focus:ring-2 mt-1 cursor-pointer flex-shrink-0"
                      />
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-100 to-secondary-100">
                        {item.course_thumbnail ? (
                          <img
                            src={item.course_thumbnail}
                            alt={item.course_title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/160x96?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 line-clamp-2 text-base mb-2">
                            {item.course_title}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-primary-600">
                              ${parseFloat(item.price_at_add || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="self-start flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary Card - Coursera Style */}
          <div>
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xl font-bold text-slate-900">Summary</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {selectedCount} course{selectedCount !== 1 ? 's' : ''} selected
                </p>
                {selectedCount !== count && (
                  <p className="text-xs text-slate-500">
                    ({count} total in cart)
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-medium text-slate-600">Total:</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ${Number(selectedSubtotal).toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  All prices in USD
                </p>
              </div>

              <button
                disabled={selectedCount === 0 || loadingCheckout}
                onClick={handleCheckout}
                className="w-full mt-6 rounded-lg bg-accent-500 text-white py-3.5 font-bold text-base hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:hover:transform-none flex items-center justify-center gap-2"
              >
                {loadingCheckout ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Checkout ({selectedCount})
                  </>
                )}
              </button>

              {items.length > 0 && (
                <button
                  onClick={() => navigate('/browse')}
                  className="w-full mt-3 rounded-lg border-2 border-primary-500 text-primary-600 py-3 font-semibold hover:bg-primary-50 transition-all"
                >
                  Continue Shopping
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

