import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmailService } from './EmailService.jsx';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Shield,
  User,
  Key
} from 'lucide-react';

// Email Notification Types
export const EMAIL_NOTIFICATION_TYPES = {
  OTP_SENT: 'otp_sent',
  OTP_VERIFIED: 'otp_verified',
  EMAIL_VERIFIED: 'email_verified',
  PASSWORD_RESET: 'password_reset',
  WELCOME_EMAIL: 'welcome_email',
  ERROR: 'error',
  SUCCESS: 'success'
};

// Email Notification Component
export const EmailNotification = ({ 
  type, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getNotificationStyles = () => {
    switch (type) {
      case EMAIL_NOTIFICATION_TYPES.OTP_SENT:
        return {
          icon: <Shield className="h-5 w-5" />,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/40',
          text: 'text-blue-300',
          title: 'OTP Sent'
        };
      case EMAIL_NOTIFICATION_TYPES.OTP_VERIFIED:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bg: 'bg-green-500/10',
          border: 'border-green-500/40',
          text: 'text-green-300',
          title: 'OTP Verified'
        };
      case EMAIL_NOTIFICATION_TYPES.EMAIL_VERIFIED:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bg: 'bg-green-500/10',
          border: 'border-green-500/40',
          text: 'text-green-300',
          title: 'Email Verified'
        };
      case EMAIL_NOTIFICATION_TYPES.PASSWORD_RESET:
        return {
          icon: <Key className="h-5 w-5" />,
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/40',
          text: 'text-purple-300',
          title: 'Password Reset'
        };
      case EMAIL_NOTIFICATION_TYPES.WELCOME_EMAIL:
        return {
          icon: <User className="h-5 w-5" />,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          title: 'Welcome Email Sent'
        };
      case EMAIL_NOTIFICATION_TYPES.ERROR:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bg: 'bg-red-500/10',
          border: 'border-red-500/40',
          text: 'text-red-300',
          title: 'Error'
        };
      case EMAIL_NOTIFICATION_TYPES.SUCCESS:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bg: 'bg-green-500/10',
          border: 'border-green-500/40',
          text: 'text-green-300',
          title: 'Success'
        };
      default:
        return {
          icon: <Mail className="h-5 w-5" />,
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/40',
          text: 'text-gray-300',
          title: 'Notification'
        };
    }
  };

  const styles = getNotificationStyles();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`flex items-center gap-3 rounded-lg border p-4 ${styles.bg} ${styles.border} ${styles.text} shadow-lg`}
    >
      <div className="flex-shrink-0">
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{styles.title}</div>
        <div className="text-xs opacity-90 mt-1">{message}</div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="flex-shrink-0 text-current hover:opacity-70 transition-opacity p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

// Email Notification Container
export const EmailNotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <EmailNotification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => onRemove(notification.id)}
            autoClose={notification.autoClose}
            duration={notification.duration}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Email Status Indicator
export const EmailStatusIndicator = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Sending...',
          color: 'text-blue-400'
        };
      case 'sent':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Sent',
          color: 'text-green-400'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Failed',
          color: 'text-red-400'
        };
      default:
        return {
          icon: <Mail className="h-4 w-4" />,
          text: 'Ready',
          color: 'text-gray-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      <span className={`text-sm ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

// Email Action Button
export const EmailActionButton = ({ 
  action, 
  onAction, 
  isLoading, 
  disabled, 
  children, 
  className = '' 
}) => {
  const getButtonStyles = () => {
    switch (action) {
      case 'send':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'verify':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'resend':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'cancel':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <button
      onClick={onAction}
      disabled={isLoading || disabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${getButtonStyles()} ${className}
      `}
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Email Progress Steps
export const EmailProgressSteps = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                transition-colors duration-200
                ${isCompleted || isCurrent 
                  ? 'bg-[#2f64ff] text-white' 
                  : 'bg-white/10 text-white/40'
                }
              `}
            >
              {isCompleted ? '✓' : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`
                  w-8 h-0.5 mx-2 transition-colors duration-200
                  ${stepNumber < currentStep ? 'bg-[#2f64ff]' : 'bg-white/10'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Email Service Hook for Notifications
export const useEmailNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const emailService = useEmailService();

  const addNotification = (type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      autoClose: options.autoClose !== false,
      duration: options.duration || 5000
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Wrapper functions that add notifications
  const sendOTPWithNotification = async (email, purpose = 'login') => {
    const result = await emailService.sendOTP(email, purpose);
    
    if (result.success) {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.OTP_SENT,
        `Verification code sent to ${email}`,
        { duration: 3000 }
      );
    } else {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.ERROR,
        result.error || 'Failed to send verification code',
        { duration: 5000 }
      );
    }
    
    return result;
  };

  const verifyOTPWithNotification = async (email, otp, purpose = 'login') => {
    const result = await emailService.verifyOTP(email, otp, purpose);
    
    if (result.success) {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.OTP_VERIFIED,
        'Verification code verified successfully',
        { duration: 3000 }
      );
    } else {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.ERROR,
        result.error || 'Invalid verification code',
        { duration: 5000 }
      );
    }
    
    return result;
  };

  const sendEmailVerificationWithNotification = async () => {
    const result = await emailService.sendEmailVerification();
    
    if (result.success) {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.EMAIL_VERIFIED,
        'Verification email sent! Please check your inbox.',
        { duration: 5000 }
      );
    } else {
      addNotification(
        EMAIL_NOTIFICATION_TYPES.ERROR,
        result.error || 'Failed to send verification email',
        { duration: 5000 }
      );
    }
    
    return result;
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    sendOTPWithNotification,
    verifyOTPWithNotification,
    sendEmailVerificationWithNotification,
    ...emailService
  };
};

export default EmailNotificationContainer;
