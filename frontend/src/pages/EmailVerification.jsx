import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { motion } from "framer-motion";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const token = searchParams.get('token');

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!token) {
      setError("No verification token provided.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/verify-email", {
        token: token
      });

      if (response.data.error) {
        setError(response.data.message || "Invalid or expired verification link.");
        return;
      }

      setIsVerified(true);
      setMessage("Your email has been successfully verified!");
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err?.response?.data?.message || "Failed to verify email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await axiosInstance.post("/send-email-verification");

      if (response.data.error) {
        setError(response.data.message || "Failed to resend verification email.");
        return;
      }

      setMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      console.error('Resend verification error:', err);
      setError(err?.response?.data?.message || "Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-xl">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
              {isVerified ? (
                <CheckCircle className="h-8 w-8 text-green-400" />
              ) : (
                <Mail className="h-8 w-8 text-blue-400" />
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isVerified ? "Email Verified!" : "Verify Your Email"}
              </h2>
              <p className="text-white/60 text-sm">
                {isVerified 
                  ? "Your email address has been successfully verified. You can now access all features."
                  : "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
                }
              </p>
            </div>

            {/* Status Messages */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-[13px] text-green-300"
              >
                <CheckCircle className="h-4 w-4" />
                {message}
              </motion.div>
            )}

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

            {/* Actions */}
            <div className="space-y-3">
              {isVerified ? (
                <button
                  onClick={handleContinue}
                  className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] flex items-center justify-center gap-2"
                >
                  Continue to Dashboard
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              ) : (
                <>
                  {token && (
                    <button
                      onClick={handleVerifyEmail}
                      disabled={isLoading}
                      className="w-full h-11 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Email
                          <CheckCircle className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full h-11 rounded-md border border-white/12 bg-white/[0.03] text-[14px] font-medium text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Resend Verification Email
                        <RefreshCw className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sky-400 hover:underline text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

