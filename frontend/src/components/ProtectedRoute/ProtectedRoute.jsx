import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import axiosInstance from '../../utils/axiosInstance';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, setUser, setIsAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const validationTimeoutRef = useRef(null);
  const lastValidationRef = useRef(0);

  // Debug bypass for onboarding route
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const debugMode = (typeof window !== 'undefined') && (localStorage.getItem('debug_mode') === 'true');
  const forceOnboarding = (typeof window !== 'undefined') && (new URLSearchParams(location.search).get('force') === 'true');
  const shouldBypassAuth = isOnboardingRoute && (debugMode || forceOnboarding);

  // Debounced authentication validation
  const validateAuthentication = async () => {
    const now = Date.now();
    const timeSinceLastValidation = now - lastValidationRef.current;
    
    // Don't validate if we validated recently (within 5 seconds)
    if (timeSinceLastValidation < 5000) {
      return isAuthenticated;
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
    
    if (!token) {
      console.log('ProtectedRoute: No token found');
      return false;
    }

    try {
      setIsValidating(true);
      lastValidationRef.current = now;
      
      const response = await axiosInstance.get('/get-user');
      
      if (response.data && response.data.user) {
        console.log('ProtectedRoute: Token is valid');
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('ProtectedRoute: Invalid response');
        return false;
      }
    } catch (error) {
      console.log('ProtectedRoute: Token validation failed:', error.response?.status);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userToken');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsValidating(false);
      setValidationComplete(true);
    }
  };

  // Validate authentication on mount with debouncing (skip if debug bypass)
  useEffect(() => {
    if (shouldBypassAuth) {
      setValidationComplete(true);
      return;
    }
    if (!loading && !validationComplete) {
      // Clear any existing timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      // Debounce the validation
      validationTimeoutRef.current = setTimeout(async () => {
        await validateAuthentication();
      }, 100);
    } else if (isAuthenticated) {
      setValidationComplete(true);
    }

    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [loading, validationComplete, isAuthenticated]);

  // Show loading spinner while checking authentication
  if (!shouldBypassAuth && (loading || isValidating || !validationComplete)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 text-sm">
            {isValidating ? 'Validating authentication...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }
  
  // If not authenticated after validation, redirect to login (unless bypassing)
  if (!shouldBypassAuth && !isAuthenticated) {
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    // Force redirect to login with replace
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace={true} // Use replace to prevent back button issues
      />
    );
  }
  
  return children;
};

export default ProtectedRoute;
