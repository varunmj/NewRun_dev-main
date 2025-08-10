import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  // If no token, redirect to signup and save the current location
  return token ? (
    children
  ) : (
    <Navigate to="/signup" state={{ from: location.pathname }} />
  );
};

export default ProtectedRoute;
