import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import MagicBento from "../components/MagicBento";
import { BorderBeam } from "../components/ui/border-beam";

// --- tiny helper for consistent input styling ---
const inputClass =
  "h-11 w-full rounded-md border border-white/12 bg-white/[0.03] " +
  "px-3 text-[14px] text-white outline-none transition-all duration-200 " +
  "placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 " +
  "hover:border-white/20 hover:bg-white/[0.05] " +
  // Autofill normalization for dark theme
  "autofill:bg-black autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_#000] " +
  "[-webkit-text-fill-color:white] [-webkit-box-shadow:0_0_0px_1000px_#000_inset]";

// --- Left hero with animated brand story ---
function LeftHero() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <div className="w-full max-w-lg space-y-8">
        {/* Main Brand Message */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="brand-script text-5xl leading-none
                  
                  bg-clip-text text-transparent text-4xl font-bold text-white mb-4">
            Your College Journey
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 font-bold">
              Starts Here
            </span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            The all-in-one platform for student housing, academics, and campus life
          </p>
        </motion.div>

        {/* Animated Journey Steps with Magic Bento Effects */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="magic-bento-card flex items-center gap-4 p-4 rounded-xl bg-transparent border border-white/10 hover:bg-transparent transition-all duration-300"
            style={{
              '--glow-x': '50%',
              '--glow-y': '50%',
              '--glow-intensity': '0',
              '--glow-radius': '200px'
            }}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Find Your Perfect Home</h3>
              <p className="text-white/60 text-sm">Verified student housing near your campus</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="magic-bento-card flex items-center gap-4 p-4 rounded-xl bg-transparent border border-white/10 hover:bg-transparent transition-all duration-300"
            style={{
              '--glow-x': '50%',
              '--glow-y': '50%',
              '--glow-intensity': '0',
              '--glow-radius': '200px'
            }}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Connect & Collaborate</h3>
              <p className="text-white/60 text-sm">Join study groups and build your network</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="magic-bento-card flex items-center gap-4 p-4 rounded-xl bg-transparent border border-white/10 hover:bg-transparent transition-all duration-300"
            style={{
              '--glow-x': '50%',
              '--glow-y': '50%',
              '--glow-intensity': '0',
              '--glow-radius': '200px'
            }}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-2 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">AI-Powered Insights</h3>
              <p className="text-white/60 text-sm">Smart recommendations for your academic journey</p>
            </div>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="pt-6 border-t border-white/10"
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>AI-Powered</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-white/80 text-sm mb-4">
            Be among the first to experience the future of student life
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // If token already present (e.g., set by OAuth), bounce to dashboard
  React.useEffect(() => {
    try {
      const t = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (t) {
        nav('/dashboard', { replace: true });
      }
    } catch {}
  }, [nav]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axiosInstance.post("/login", {
        identifier: identifier.trim(),
        password,
        rememberMe,
      });
      
      if (res?.data?.error) {
        setError(res.data.message || "Invalid credentials.");
        return;
      }
      
      if (res?.data?.accessToken) {
        // Use AuthContext login method
        const loginResult = await login(res.data.user, res.data.accessToken);
        
        if (loginResult.success) {
          // Check if user has completed onboarding
          const onboardingData = localStorage.getItem('nr_unified_onboarding');
          if (onboardingData) {
            const parsed = JSON.parse(onboardingData);
            if (parsed.completed) {
              // User has completed onboarding, go to intended page or dashboard
              const from = new URLSearchParams(window.location.search).get('from') || '/dashboard';
              nav(from);
            } else {
              // User has partial onboarding data, continue onboarding
              nav("/dashboard");
            }
          } else {
            // New user, start onboarding
            nav("/onboarding");
          }
        } else {
          setError(loginResult.error || "Login failed. Please try again.");
        }
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err?.response?.data?.message || "Unable to log in. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>
        {`
          .magic-bento-card {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 200px;
            --glow-color: 47, 100, 255;
            position: relative;
            overflow: hidden;
          }
          
          .magic-bento-card::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            background: radial-gradient(100px circle at var(--glow-x) var(--glow-y),
                rgba(var(--glow-color), calc(var(--glow-intensity) * 1)) 0%,
                rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 20%,
                rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 40%,
                transparent 70%);
            border-radius: inherit;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: subtract;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 1;
            opacity: 0;
          }
          
          .magic-bento-card:hover::after {
            opacity: 1;
          }
          
          .magic-bento-card:hover {
            box-shadow: 0 0 20px rgba(47, 100, 255, 0.6), 0 0 40px rgba(47, 100, 255, 0.4), 0 0 60px rgba(47, 100, 255, 0.2);
          }
          
        `}
      </style>
      <main className="min-h-screen bg-black">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 sm:gap-8 lg:gap-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:grid-cols-2 relative">
        {/* LEFT: Brand story with Magic Bento effects */}
        <LeftHero />

        {/* Gradient Separator Line */}
        <div className="hidden md:block absolute left-1/2 top-1/2 bottom-1/2 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent transform -translate-x-1/2 -translate-y-1/2 h-3/4"></div>

        {/* RIGHT: login card */}
        <div className="w-full">
          <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-transparent p-4 sm:p-6 overflow-hidden">
            {/* wordmark */}
            <div className="mb-6 text-center">
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

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or username"
                autoComplete="username"
                className={inputClass}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className={inputClass + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>


              {/* Remember Me checkbox */}
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/[0.03] text-blue-500 focus:ring-blue-500 focus:ring-2"
                  />
                  Remember me
                </label>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[13px] text-red-300 transition-all duration-200"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            {/* OR divider */}
            <div className="my-4 flex items-center gap-3 text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[12px]">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Social (optional) */}
            <button
              type="button"
              onClick={() => {
                const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')).replace(/\/+$/, '');
                window.location.href = `${apiUrl}/api/auth/google`;
              }}
              className="mb-2 inline-flex h-10 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* links */}
            <div className="mt-2 flex items-center justify-center text-[13px]">
              <Link to="/forgot" className="text-white hover:underline">
                Forgotten your password?
              </Link>
            </div>
            <BorderBeam 
              size={300}
              duration={4}
              colorFrom="#2F64FF"
              colorTo="#00D4FF"
              borderWidth={2.5}
            />
          </div>

          {/* Signup Box - directly below login form */}
          <div className="w-full max-w-sm mx-auto mt-4">
            <div className="rounded-2xl border border-white/10 bg-transparent p-4 text-center">
              <p className="text-white/70 text-sm">
                Don't have an account? <Link to="/signup" className="text-sky-400 hover:underline font-medium">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
