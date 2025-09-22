import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useHistoryBlocker from '../../hooks/useHistoryBlocker';
import { blockBackNavigation, isAuthenticated } from '../../utils/logoutUtils';

const RouteGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Block history navigation when not authenticated
  useHistoryBlocker(!isAuthenticated && !loading);
  
  // Additional bulletproof back button blocking
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      const cleanup = blockBackNavigation();
      return cleanup;
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Only run this check after initial loading is complete
    if (loading) return;

    // Check if current route is protected
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/chatbot',
      '/messaging',
      '/Synapse',
      '/marketplace/item',
      '/marketplace/create',
      '/marketplace/edit',
      '/properties',
      '/requests',
      '/Synapsematches'
    ];

    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    // If it's a protected route and user is not authenticated
    if (isProtectedRoute && !isAuthenticated) {
      console.log('RouteGuard: Redirecting unauthenticated user from protected route:', location.pathname);
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [location.pathname, isAuthenticated, loading, navigate]);

  return children;
};

export default RouteGuard;
