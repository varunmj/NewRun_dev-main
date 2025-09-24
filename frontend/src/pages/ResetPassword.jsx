import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { validatePassword, validatePasswordMatch } from '../utils/passwordValidator';
import PasswordStrengthIndicator from '../components/Auth/PasswordStrengthIndicator';
import axiosInstance from '../utils/axiosInstance';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [tokenId, setTokenId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = searchParams.get('tokenId');
    if (token) {
      setTokenId(token);
      validateToken(token);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
      setIsValidating(false);
    }
  }, [searchParams]);

  const validateToken = async (token) => {
    try {
      const response = await axiosInstance.post('/validate-reset-token', {
        tokenId: token
      });

      if (response.data.error) {
        setError(response.data.message);
      } else {
        setUserInfo(response.data.user);
      }
    } catch (err) {
      setError('Invalid or expired reset link. Please request a new password reset.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(`Password requirements not met: ${passwordValidation.errors[0]}`);
      return;
    }

    // Confirm password validation
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.isValid) {
      setError(passwordMatchValidation.error);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/reset-password', {
        tokenId: tokenId,
        newPassword: password
      });

      if (response.data.error) {
        setError(response.data.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);
  const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmPasswordValid = passwordMatchValidation.isValid && confirmPassword.length > 0;

  if (isValidating) {
    return (
      <main className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/60">Validating reset link...</p>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-xl text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-white/60 mb-6">
              Your password has been successfully reset. You will be redirected to the login page.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
            {userInfo && (
              <p className="text-white/60 text-sm">
                Hello {userInfo.firstName}, please enter your new password below.
              </p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-11 w-full rounded-md border border-white/12 bg-white/[0.03] px-3 text-[14px] text-white outline-none placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <PasswordStrengthIndicator password={password} showDetails={true} />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-11 w-full rounded-md border border-white/12 bg-white/[0.03] px-3 text-[14px] text-white outline-none placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-2 text-xs">
                  <div className={`flex items-center gap-1 ${isConfirmPasswordValid ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-1 h-1 rounded-full ${isConfirmPasswordValid ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isConfirmPasswordValid ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !isPasswordValid || !isConfirmPasswordValid}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Reset Password
                </>
              )}
            </motion.button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
