import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";

// --- Input styling helper ---
const inputClass =
  "h-11 w-full rounded-md border border-white/12 bg-white/[0.03] " +
  "px-3 text-[14px] text-white outline-none " +
  "placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

// --- Step 1: Email Input ---
function EmailStep({ email, setEmail, onNext, isLoading, error }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
          <Mail className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
        <p className="text-white/60 text-sm">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        <button
          onClick={onNext}
          disabled={!email.trim() || isLoading}
          className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending code...
            </>
          ) : (
            <>
              Send Verification Code
              <Shield className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-sky-400 hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}

// --- Step 2: OTP Verification ---
function OTPStep({ email, otp, setOtp, onNext, onResend, isLoading, error, resendLoading }) {
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otpInputs];
    newOtp[index] = value;
    setOtpInputs(newOtp);
    setOtp(newOtp.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
          <Shield className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-white/60 text-sm">
          We've sent a 6-digit code to <span className="text-blue-400 font-medium">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">
            Enter Verification Code
          </label>
          <div className="flex gap-3 justify-center">
            {otpInputs.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold rounded-md border border-white/12 bg-white/[0.03] text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none"
                maxLength={1}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        <button
          onClick={onNext}
          disabled={otp.length !== 6 || isLoading}
          className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Verifying...
            </>
          ) : (
            <>
              Verify Code
              <CheckCircle className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={onResend}
            disabled={resendLoading}
            className="text-sky-400 hover:underline text-sm disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-sky-400 hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}

// --- Step 3: New Password ---
function NewPasswordStep({ password, setPassword, confirmPassword, setConfirmPassword, onSubmit, isLoading, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = confirmPassword === password && confirmPassword.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
          <Shield className="h-8 w-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
        <p className="text-white/60 text-sm">
          Choose a strong password for your account
        </p>
      </div>

      <div className="space-y-4">
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
              className={inputClass + " pr-10"}
              disabled={isLoading}
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
            <div className="mt-2 text-xs">
              <div className={`flex items-center gap-1 ${isPasswordValid ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-1 h-1 rounded-full ${isPasswordValid ? 'bg-green-400' : 'bg-red-400'}`} />
                At least 8 characters
              </div>
            </div>
          )}
        </div>

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
              className={inputClass + " pr-10"}
              disabled={isLoading}
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
                Passwords match
              </div>
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        <button
          onClick={onSubmit}
          disabled={!isPasswordValid || !isConfirmPasswordValid || isLoading}
          className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating password...
            </>
          ) : (
            <>
              Update Password
              <CheckCircle className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-sky-400 hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}

// --- Success Step ---
function SuccessStep({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
        <CheckCircle className="h-8 w-8 text-green-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
        <p className="text-white/60 text-sm">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] flex items-center justify-center gap-2"
      >
        Continue to Login
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </button>
    </motion.div>
  );
}

// --- Main Component ---
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/forgot-password", {
        email: email.trim()
      });

      if (response.data.error) {
        setError(response.data.message || "Failed to send verification code.");
        return;
      }

      setStep(2);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err?.response?.data?.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/verify-otp", {
        email: email.trim(),
        otp: otp,
        purpose: "password_reset"
      });

      if (response.data.error) {
        setError(response.data.message || "Invalid verification code.");
        return;
      }

      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err?.response?.data?.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/forgot-password", {
        email: email.trim()
      });

      if (response.data.error) {
        setError(response.data.message || "Failed to resend verification code.");
        return;
      }

      // Reset OTP inputs
      setOtp("");
      setOtpInputs(['', '', '', '', '', '']);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err?.response?.data?.message || "Failed to resend verification code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/reset-password", {
        email: email.trim(),
        otp: otp,
        newPassword: password
      });

      if (response.data.error) {
        setError(response.data.message || "Failed to reset password.");
        return;
      }

      setStep(4);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err?.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Complete and redirect
  const handleComplete = () => {
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-xl">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-[#2f64ff] text-white'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        step > stepNum ? 'bg-[#2f64ff]' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-white/60">
              {step === 1 && "Enter Email"}
              {step === 2 && "Verify Code"}
              {step === 3 && "New Password"}
              {step === 4 && "Complete"}
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <EmailStep
                email={email}
                setEmail={setEmail}
                onNext={handleSendOTP}
                isLoading={isLoading}
                error={error}
              />
            )}
            {step === 2 && (
              <OTPStep
                email={email}
                otp={otp}
                setOtp={setOtp}
                onNext={handleVerifyOTP}
                onResend={handleResendOTP}
                isLoading={isLoading}
                error={error}
                resendLoading={resendLoading}
              />
            )}
            {step === 3 && (
              <NewPasswordStep
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                onSubmit={handleResetPassword}
                isLoading={isLoading}
                error={error}
              />
            )}
            {step === 4 && (
              <SuccessStep onComplete={handleComplete} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
