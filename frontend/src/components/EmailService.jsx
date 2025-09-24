import React, { createContext, useContext, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

// Email Service Context
const EmailServiceContext = createContext();

export const useEmailService = () => {
  const context = useContext(EmailServiceContext);
  if (!context) {
    throw new Error('useEmailService must be used within an EmailServiceProvider');
  }
  return context;
};

// Email Service Provider
export const EmailServiceProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Send OTP
  const sendOTP = async (email, purpose = 'login') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/send-otp', {
        email,
        purpose
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to send OTP');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to send OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp, purpose = 'login') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/verify-otp', {
        email,
        otp,
        purpose
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Invalid OTP');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Invalid OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Send Email Verification
  const sendEmailVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/send-email-verification');

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to send verification email');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to send verification email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Email with Token
  const verifyEmail = async (token) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/verify-email', { token });

      if (response.data.error) {
        throw new Error(response.data.message || 'Invalid verification token');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Invalid verification token';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/forgot-password', { email });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to send password reset email');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to send password reset email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email, otp, newPassword) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/reset-password', {
        email,
        otp,
        newPassword
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to reset password');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Send Welcome Email
  const sendWelcomeEmail = async (userEmail, userName) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/send-welcome-email', {
        userEmail,
        userName
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to send welcome email');
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to send welcome email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Error
  const clearError = () => {
    setError('');
  };

  const value = {
    // State
    isLoading,
    error,
    
    // Actions
    sendOTP,
    verifyOTP,
    sendEmailVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendWelcomeEmail,
    clearError
  };

  return (
    <EmailServiceContext.Provider value={value}>
      {children}
    </EmailServiceContext.Provider>
  );
};

// Email Service Hook for easy access
export const useEmailActions = () => {
  const {
    sendOTP,
    verifyOTP,
    sendEmailVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendWelcomeEmail,
    isLoading,
    error,
    clearError
  } = useEmailService();

  return {
    sendOTP,
    verifyOTP,
    sendEmailVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendWelcomeEmail,
    isLoading,
    error,
    clearError
  };
};

// Email Status Component
export const EmailStatus = ({ type = 'info', message, onClose }) => {
  const getStatusStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/40 bg-green-500/10 text-green-300';
      case 'error':
        return 'border-red-500/40 bg-red-500/10 text-red-300';
      case 'warning':
        return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300';
      default:
        return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
    }
  };

  const getStatusIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] ${getStatusStyles()}`}>
      <span className="text-sm">{getStatusIcon()}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// OTP Input Component
export const OTPInput = ({ value, onChange, length = 6, disabled = false }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));

  const handleChange = (index, inputValue) => {
    if (inputValue.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = inputValue;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (inputValue && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 text-center text-lg font-bold rounded-md border border-white/12 bg-white/[0.03] text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={1}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

// Email Action Button Component
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
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Email Progress Steps Component
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

export default EmailServiceProvider;
