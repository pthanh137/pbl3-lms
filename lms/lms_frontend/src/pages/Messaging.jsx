import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatList from '../features/messaging/components/ChatList';
import ChatWindow from '../features/messaging/components/ChatWindow';
import ContactsList from '../features/messaging/components/ContactsList';
import useMessagingStore from '../features/messaging/store/messagingStore';

// ============================================
// MESSAGING PAGE - COMPLETELY REWRITTEN
// ============================================
// Loads messages only when activeUser changes
// Does NOT trigger hook-order issues
// Does NOT rerender entire component on every poll
// Gracefully handles "no active conversation"
// Shows loading states correctly
// Does NOT cause any remount loops

const Messaging = () => {
  // ============================================
  // ALL HOOKS AT TOP LEVEL
  // ============================================
  const { user, isAuthenticated, accessToken, loading: authLoading } = useAuth();
  const { 
    startPolling, 
    stopPolling, 
    loadConversations,
    authError,
    loadError,
  } = useMessagingStore();
  const [showContacts, setShowContacts] = useState(false);
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);
  const prevAuthStateRef = useRef({ isAuthenticated, accessToken });

  // ============================================
  // STABLE CALLBACKS
  // ============================================
  const handleRetry = useCallback(() => {
    useMessagingStore.setState({ authError: null, loadError: null });
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadConversations();
    }
  }, [loadConversations]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Effect: Start/stop polling based on authentication
  // Only runs once on mount or when auth state changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check token in localStorage (most reliable source)
    const token = localStorage.getItem('accessToken');
    
    // Check if auth state changed
    const authStateChanged = 
      prevAuthStateRef.current.isAuthenticated !== isAuthenticated ||
      prevAuthStateRef.current.accessToken !== accessToken;
    
    // Update ref
    prevAuthStateRef.current = { isAuthenticated, accessToken };
    
    // NEVER start polling if user is not authenticated
    if (!token && (!isAuthenticated || !accessToken)) {
      stopPolling(); // Ensure polling is stopped
      hasInitializedRef.current = false;
      return;
    }

    // Only initialize once or when auth state changes
    if (!hasInitializedRef.current || authStateChanged) {
      hasInitializedRef.current = true;
      
      // Load conversations on mount
      loadConversations();

      // Start polling for new messages
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      // Only stop polling on unmount, not on every auth change
      // This prevents stopping/starting loops
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, authLoading]); // Depend on authLoading too

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Clear stale authError if we have token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && authError) {
      // If we have token but authError is set, clear it
      // This handles cases where authError was set from a previous failed request
      useMessagingStore.setState({ authError: null });
      // Retry loading conversations
      loadConversations();
    }
  }, [authError, loadConversations]);

  // ============================================
  // RENDER LOGIC
  // ============================================
  
  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication status
  const hasValidAuth = isAuthenticated && accessToken && accessToken.trim() !== '';
  const hasTokenInStorage = !!localStorage.getItem('accessToken');
  
  // CRITICAL FIX: If we have token in storage, TRUST it and show UI
  // Don't block user if token exists, even if context hasn't updated yet
  // The axios interceptor will use the token from localStorage
  if (!hasTokenInStorage && !hasValidAuth) {
    // Only show auth error if we're 100% sure there's no token anywhere
    // AND authError is set (indicating a real authentication failure)
    if (authError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">User not authenticated</h2>
            <p className="text-gray-600 mb-6">
              Please log in to access messages.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // If no token and no authError, show loading briefly
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Main UI - component stays mounted, only content changes
  // If we reach here, we have token in storage OR valid auth
  // Trust the token and show the messaging UI
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show loadError as a toast/inline message, not full screen */}
        {loadError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800">{loadError}</p>
            </div>
            <button
              onClick={() => {
                useMessagingStore.setState({ loadError: null });
                loadConversations();
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="flex h-full">
            {/* Left Sidebar - Conversations/Contacts */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="flex border-b">
                <button
                  onClick={() => setShowContacts(false)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    !showContacts
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setShowContacts(true)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    showContacts
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Contacts
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {showContacts ? <ContactsList /> : <ChatList />}
              </div>
            </div>

            {/* Right Side - Chat Window */}
            {/* ChatWindow stays mounted - only content changes */}
            <div className="flex-1 flex flex-col">
              <ChatWindow />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messaging;
