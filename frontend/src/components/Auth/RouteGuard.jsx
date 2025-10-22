import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useHistoryBlocker from '../../hooks/useHistoryBlocker';
import { blockBackNavigation } from '../../utils/logoutUtils';
import axiosInstance from '../../utils/axiosInstance';

const RouteGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, setUser, setIsAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef(null);
  const lastValidationRef = useRef(0);

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
      console.log('RouteGuard: No token found');
      return false;
    }

    try {
      setIsValidating(true);
      lastValidationRef.current = now;
      
      const response = await axiosInstance.get('/get-user');
      
      if (response.data && response.data.user) {
        console.log('RouteGuard: Token is valid');
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('RouteGuard: Invalid response');
        return false;
      }
    } catch (error) {
      console.log('RouteGuard: Token validation failed:', error.response?.status);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userToken');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Block history navigation when not authenticated, but never on public legal/help pages
  const publicAlwaysAccessible = [
    '/',
    '/login',
    '/signup',
    '/help',
    '/terms',
    '/privacy',
    '/cookies',
    '/cookies/settings'
  ];
  const shouldBlockHistory = !isAuthenticated && !loading && !publicAlwaysAccessible.some(p => location.pathname.startsWith(p));
  useHistoryBlocker(shouldBlockHistory);
  
  // Additional bulletproof back button blocking
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Never block back navigation on public legal/help pages
      const publicAlwaysAccessible = [
        '/',
        '/login',
        '/signup',
        '/help', 
        '/terms', 
        '/privacy', 
        '/cookies', 
        '/cookies/settings'
      ];
      if (publicAlwaysAccessible.some(p => location.pathname.startsWith(p))) return;

      const cleanup = blockBackNavigation();
      return cleanup;
    }
  }, [isAuthenticated, loading, location.pathname]);

  // Enhanced route protection with smart validation
  useEffect(() => {
    const checkRouteAccess = async () => {
      // Only run this check after initial loading is complete
      if (loading || isValidating) return;

      // Check if current route is protected
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/messaging',
        '/Synapse',
        '/marketplace/item',
        '/marketplace/create',
        '/marketplace/edit',
        '/properties',
        '/requests',
        '/Synapsematches',
        '/onboarding'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        location.pathname.startsWith(route)
      );

      // If it's a protected route, validate authentication
      if (isProtectedRoute) {
        console.log('RouteGuard: Checking authentication for protected route:', location.pathname);
        
        // Clear any existing timeout
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        // Debounce the validation to prevent multiple calls
        validationTimeoutRef.current = setTimeout(async () => {
          const isValid = await validateAuthentication();
          
          if (!isValid) {
            console.log('RouteGuard: Authentication failed, redirecting to login');
            navigate('/login', { 
              state: { from: location.pathname },
              replace: true 
            });
          }
        }, 100); // Small delay to debounce
      }
    };

    checkRouteAccess();

    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [location.pathname, loading, isValidating, isAuthenticated, navigate, setUser, setIsAuthenticated]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 text-sm">Validating authentication...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RouteGuard;
