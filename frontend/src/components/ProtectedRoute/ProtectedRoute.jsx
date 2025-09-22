import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, token } = useAuth();
  
  // Additional check: verify token exists in localStorage
  const hasValidToken = () => {
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return !!storedToken;
  };
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Double-check authentication status
  const isReallyAuthenticated = isAuthenticated && hasValidToken();
  
  // If not authenticated, redirect to login and save the current location
  if (!isReallyAuthenticated) {
    // NUCLEAR CLEANUP: Clear everything
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
