import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Phone, X, CheckCircle } from 'lucide-react';

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/verification-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (notificationId) => {
    setDismissed(prev => new Set([...prev, notificationId]));
  };

  const handleAction = (notification) => {
    switch (notification.id) {
      case 'email_verification':
        window.location.href = '/verify-email';
        break;
      case 'phone_verification':
        window.location.href = '/add-phone';
        break;
      default:
        console.log('Unknown notification action:', notification);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Mail className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Filter out dismissed notifications
  const activeNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {activeNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 ${getTypeStyles(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => handleAction(notification)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {notification.action}
                </button>
                
                {notification.dismissible && (
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardNotification;
