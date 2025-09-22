import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Note: History blocking moved to RouteGuard component

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const existingToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (existingToken) {
          setToken(existingToken);
          setIsAuthenticated(true);
          
          // Fetch user data
          try {
            const response = await axiosInstance.get('/get-user');
            if (response.data && response.data.user) {
              setUser(response.data.user);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Token might be invalid, clear it
            logout();
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'token') {
        if (!e.newValue) {
          // Token was removed, logout
          logout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Note: History blocking moved to RouteGuard component

  const login = async (userData, authToken) => {
    try {
      // Store token in localStorage
      localStorage.setItem('accessToken', authToken);
      localStorage.removeItem('token'); // Clean up old token
      localStorage.removeItem('userToken'); // Clean up old token
      
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    try {
      // Clear all tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userToken');
      
      // Reset state immediately
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any cached data
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    setIsAuthenticated,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
