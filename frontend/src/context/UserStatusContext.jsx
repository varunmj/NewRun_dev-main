import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const UserStatusContext = createContext();

export const useUserStatus = () => {
  const context = useContext(UserStatusContext);
  if (!context) {
    throw new Error('useUserStatus must be used within a UserStatusProvider');
  }
  return context;
};

export const UserStatusProvider = ({ children }) => {
  const { user } = useAuth();
  const [userStatus, setUserStatus] = useState('online');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [manualStatus, setManualStatus] = useState(false); // Track if user manually set status

  // Auto-away logic
  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const awayThreshold = 15 * 60 * 1000; // 15 minutes

      // If user is online and inactive for threshold, set to away (only if not manually set)
      if (userStatus === 'online' && timeSinceActivity > awayThreshold && !manualStatus) {
        setUserStatus('away');
      }
    };

    const interval = setInterval(checkActivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userStatus, lastActivity, manualStatus]);

  // Update activity on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
    // If user was auto-away (not manually set), return to online
    if (userStatus === 'away' && !manualStatus) {
      setUserStatus('online');
    }
  };

  // Manual status setter
  const setUserStatusManual = (status) => {
    setUserStatus(status);
    setManualStatus(true);
    
    // Emit status change via Socket.io for real-time updates
    if (user?._id) {
      console.log('🔄 UserStatusContext - Emitting status change:', { userId: user._id, status });
      socketService.updateUserStatus(user._id, status);
    }
  };

  // Reset manual status when going to online
  const setUserStatusAuto = (status) => {
    setUserStatus(status);
    if (status === 'online') {
      setManualStatus(false);
    }
  };

  // Listen for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [userStatus]);

  // Listen for real-time status updates from other users
  useEffect(() => {
    if (!user?._id) return;

    const handleUserStatusUpdate = (data) => {
      console.log('👤 UserStatusContext - Received status update:', data);
      // This will be handled by the MessagingPage component
      // We don't need to update local state here as it's for other users
    };

    // Listen for status updates from Socket.io
    socketService.on('userStatusUpdate', handleUserStatusUpdate);

    return () => {
      socketService.off('userStatusUpdate', handleUserStatusUpdate);
    };
  }, [user?._id]);

  const value = {
    userStatus,
    setUserStatus: setUserStatusManual, // Use manual setter by default
    setUserStatusAuto,
    lastActivity,
    updateActivity,
    manualStatus
  };

  return (
    <UserStatusContext.Provider value={value}>
      {children}
    </UserStatusContext.Provider>
  );
};
