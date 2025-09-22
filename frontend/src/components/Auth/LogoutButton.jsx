import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { MdLogout, MdPerson } from 'react-icons/md';
import { forceLogout } from '../../utils/logoutUtils';

const LogoutButton = ({ className = "" }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // First try the AuthContext logout
      const result = await logout();
      console.log('AuthContext logout result:', result);
    } catch (error) {
      console.error('AuthContext logout error:', error);
    }
    
    // BULLETPROOF: Always force logout regardless of AuthContext result
    setTimeout(() => {
      forceLogout();
    }, 100);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* User Info Display */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
          <MdPerson className="text-white/70 text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
          </p>
          <p className="text-xs text-white/60 truncate">
            {user?.email || 'user@example.com'}
          </p>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Logout"
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <MdLogout className="text-sm" />
          )}
          <span className="text-xs font-medium hidden sm:inline">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default LogoutButton;
