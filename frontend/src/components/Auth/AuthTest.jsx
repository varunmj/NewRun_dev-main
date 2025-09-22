import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const AuthTest = () => {
  const { isAuthenticated, user, token, loading } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white text-xs p-3 rounded-lg z-50 max-w-xs">
      <h3 className="font-bold text-orange-400 mb-2">🔐 Auth Status</h3>
      <div className="space-y-1">
        <div>
          <span className="text-white/70">Status:</span>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
            isAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        
        {user && (
          <div>
            <span className="text-white/70">User:</span>
            <span className="ml-2 text-white">{user.firstName} {user.lastName}</span>
          </div>
        )}
        
        {user && (
          <div>
            <span className="text-white/70">Email:</span>
            <span className="ml-2 text-white text-xs">{user.email}</span>
          </div>
        )}
        
        <div>
          <span className="text-white/70">Token:</span>
          <span className="ml-2 text-white text-xs">
            {token ? `${token.substring(0, 20)}...` : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
