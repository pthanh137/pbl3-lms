import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Listen for token refresh events from axios interceptor
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const newToken = event.detail?.access;
      if (newToken) {
        setAccessToken(newToken);
        // Optionally refresh user data
        authAPI.me()
          .then(response => {
            const userData = response.data;
            setUser(userData);
            // Store user in localStorage for Zustand store access
            localStorage.setItem('user', JSON.stringify(userData));
          })
          .catch(error => {
            console.error('Failed to refresh user data after token refresh:', error);
          });
      }
    };

    // Listen for logout events from axios interceptor
    const handleLogout = () => {
      localStorage.removeItem('user'); // Clear user from localStorage
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('authLogout', handleLogout);
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('authLogout', handleLogout);
    };
  }, []);

  const loadUserFromStorage = async () => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      try {
        const response = await authAPI.me();
        const userData = response.data;
        setUser(userData);
        
        // Store user in localStorage for Zustand store access
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Always use the latest token from localStorage
        // This ensures we have the most up-to-date token even after refresh
        const latestToken = localStorage.getItem('accessToken');
        setAccessToken(latestToken || storedToken);
      } catch (error) {
        // Only clear if it's a 401 (unauthorized)
        // Other errors might be temporary network issues
        if (error.response?.status === 401) {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setAccessToken(null);
          setRefreshToken(null);
        } else {
          // For other errors, keep the token but don't set user
          // This allows retry without losing authentication
          setAccessToken(storedToken);
        }
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setAccessToken(access);
      setRefreshToken(refresh);
      
      // Fetch user info
      const userResponse = await authAPI.me();
      const userData = userResponse.data;
      setUser(userData);
      
      // Store user in localStorage for Zustand store access
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (payload) => {
    try {
      const response = await authAPI.register(payload);
      const { tokens } = response.data;
      
      let userData = null;
      if (tokens) {
        // Auto-login after registration
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        setAccessToken(tokens.access);
        setRefreshToken(tokens.refresh);
        
        // Fetch user info
        const userResponse = await authAPI.me();
        userData = userResponse.data;
        setUser(userData);
        
        // Store user in localStorage for Zustand store access
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      return { success: true, data: response.data, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // Clear user from localStorage
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

