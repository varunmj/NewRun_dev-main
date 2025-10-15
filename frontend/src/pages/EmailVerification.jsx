import React, { useEffect, useRef, useState } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Toast from '../components/ToastMessage/Toast';

/* ----------------------- Particle background (repel) ---------------------- */
function ParticleField({
  count = 120,
  maxSpeed = 0.35,
  repelRadius = 120,
  repelStrength = 0.9,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const dpiRef = useRef(1);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const particlesRef = useRef([]);

  const setSize = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { innerWidth: w, innerHeight: h, devicePixelRatio: dpr = 1 } = window;
    dpiRef.current = Math.min(2, dpr);
    c.width = Math.floor(w * dpiRef.current);
    c.height = Math.floor(h * dpiRef.current);
    c.style.width = w + "px";
    c.style.height = h + "px";
  };

  const init = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height } = c;
    const rng = (min, max) => min + Math.random() * (max - min);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: rng(0, width),
      y: rng(0, height),
      vx: rng(-maxSpeed, maxSpeed),
      vy: rng(-maxSpeed, maxSpeed),
      size: rng(1.2, 2.8) * dpiRef.current,
      hue: 200 + Math.floor(Math.random() * 80), // blue-cyan band
    }));
  };

  const tick = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const { width, height } = c;

    ctx.clearRect(0, 0, width, height);

    // soft vignette (very subtle so video is visible)
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      0,
      width * 0.5,
      height * 0.35,
      Math.max(width, height) * 0.8
    );
    grad.addColorStop(0, "rgba(46, 64, 200, 0.08)");
    grad.addColorStop(1, "rgba(11, 12, 15, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const m = mouse.current;

    for (const p of particlesRef.current) {
      if (m.active) {
        const dx = p.x - m.x * dpiRef.current;
        const dy = p.y - m.y * dpiRef.current;
        const dist = Math.hypot(dx, dy);
        if (dist < repelRadius * dpiRef.current && dist > 0.01) {
          const f =
            (repelRadius * dpiRef.current - dist) /
            (repelRadius * dpiRef.current);
          p.vx += (dx / dist) * f * repelStrength * 0.2;
          p.vy += (dy / dist) * f * repelStrength * 0.2;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, 0.55)`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    setSize();
    init();
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      setSize();
      init();
    };
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, maxSpeed, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

const EmailVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('send'); // 'send' | 'verify' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axiosInstance.post('/send-email-verification');
      setStep('verify');
      // Start 1-minute countdown timer
      startCooldown(60); // 1 minute = 60 seconds
      
      // Show toast notification
      setToastMessage('Verification code sent to your email address.');
      setToastType('success');
      setShowToast(true);
      
      // Focus on first OTP input after switching to verify step
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send verification email.';
      setError(errorMessage);
      
      // If server returns remaining seconds, honor it
      const retryAfter = err?.response?.data?.retryAfterSecs;
      if (err?.response?.status === 429 && retryAfter) {
        startCooldown(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await axiosInstance.post('/send-email-verification');
      // Start new 1-minute countdown timer
      startCooldown(60);
      
      // Show toast notification
      setToastMessage('Verification code resent to your email address.');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to resend verification email.';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (otp.join('').length !== 6) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await axiosInstance.post('/verify-email-code', { code: otp.join('') });
      setMessage('Account verification completed. Your NewRun account is now activated.');
      setStep('success');
      
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Invalid or expired code.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits are entered
    const updatedOtp = [...newOtp];
    if (updatedOtp.every(digit => digit !== '') && updatedOtp.join('').length === 6) {
      // Small delay to let user see the complete code
      setTimeout(() => {
        handleVerifyCode({ preventDefault: () => {} });
      }, 500);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasteData.split('');
    setOtp(newOtp);
    
    if (pasteData.length === 6) {
      // Distribute to inputs and focus last
      pasteData.split('').forEach((char, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i].value = char;
        }
      });
      inputRefs.current[5]?.focus();
      
      // Auto-verify when all 6 digits are pasted
      setTimeout(() => {
        handleVerifyCode({ preventDefault: () => {} });
      }, 500);
    }
  };

  const resendDisabled = cooldown > 0 || loading;

  const inputClass = "h-11 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[14px] text-white placeholder:text-white/45 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* --- Background video layer (behind everything) --- */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <video
          src="https://framerusercontent.com/assets/aMPvRVYHFQxBoB0v2qyJln83jI.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.75) saturate(110%)" }}
        />
        {/* gentle vignette for contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_65%)]" />
      </div>

      {/* interactive particles (subtle, above video) */}
      <ParticleField />

      {/* content */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-black/40 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Centered NewRun Logo */}
          <div className="mb-8 text-center">
            <h1
              className="
                brand-script text-6xl leading-none
                bg-gradient-to-r from-blue-600 to-teal-500
                bg-clip-text text-transparent
              "
            >
              NewRun
            </h1>
          </div>

          {step === 'send' && (
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Account Verification Required</h2>
                <p className="text-white/70 text-sm">
                  Verify your email address to activate your NewRun account and access all platform features.
                </p>
              </div>

              <button
                onClick={handleSendCode}
                disabled={loading}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-[15px] font-semibold text-white shadow-[0_8px_32px_rgba(47,100,255,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(47,100,255,0.6)] hover:from-blue-500 hover:via-blue-400 hover:to-cyan-300 disabled:opacity-60 disabled:hover:scale-100"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-black to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                
                {loading ? (
                  <div className="relative flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Sending code...
                    </span>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-3">
                    <Mail className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Send Verification Code
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h2>
                    <p className="text-white/70 text-sm">
                      We've sent a 6-digit code to your email. Enter it below.
                    </p>
                  </div>


              <div>
                <label htmlFor="otp-input" className="sr-only">Verification Code</label>
                <div className="flex justify-center space-x-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-12 text-center text-2xl font-bold border border-white/20 bg-white/[0.05] text-white rounded-lg shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 hover:border-white/30 hover:bg-white/[0.08]"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-[15px] font-semibold text-white shadow-[0_8px_32px_rgba(47,100,255,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(47,100,255,0.6)] hover:from-blue-500 hover:via-blue-400 hover:to-cyan-300 disabled:opacity-60 disabled:hover:scale-100"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-black to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                
                {loading ? (
                  <div className="relative flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Verifying...
                    </span>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Verify Email
                    </span>
                  </div>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0 || resendLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Mail className="w-4 h-4" />
                  {resendLoading ? 'Resent code!' : 'Resend Code'}
                </button>
                
                {cooldown > 0 && (
                  <>
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                    <div className="flex items-center text-white/60">
                      <span className="text-lg font-mono font-semibold">
                        {formatTime(cooldown)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Account Activated</h2>
              <p className="text-white/70 text-sm">Your NewRun account is now active. Redirecting to your dashboard...</p>
            </div>
          )}

          {message && step !== 'success' && (
            <div className="mt-6 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-blue-200">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
              {error}
            </div>
          )}

          {/* Verification message box - moved to bottom */}
          {step === 'verify' && (
            <div className="mt-6 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-blue-200 text-center">
              <p className="text-sm">
                A 6-digit verification code has been sent to your registered email address.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="inline h-4 w-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </main>
      
      {/* Toast Notification */}
      <Toast 
        isShown={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default EmailVerification;