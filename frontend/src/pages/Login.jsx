import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

// --- tiny helper for consistent input styling ---
const inputClass =
  "h-11 w-full rounded-md border border-white/12 bg-white/[0.03] " +
  "px-3 text-[14px] text-white outline-none " +
  "placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

// --- Left hero like IG (mock phone + floating cards) ---
function LeftHero() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <div className="relative w-[360px] h-[640px] rounded-[42px] border border-white/10 bg-white/[0.03] shadow-2xl overflow-hidden">
        {/* phone notch-ish bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="mt-3 h-5 w-36 rounded-full bg-black/40 backdrop-blur" />
        </div>

        {/* "screen" gradient */}
        <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(80%_80%_at_50%_0%,#2a3bff22,transparent_60%),linear-gradient(180deg,#0f131d_0%,#0b0c0f_100%)]" />

        {/* center card (mock photo) */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[420px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[linear-gradient(180deg,#1c2433,#0f1117)] ring-1 ring-white/10"
          animate={{ y: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          {/* pretend bottom UI bar */}
          <div className="absolute bottom-4 left-1/2 h-8 w-40 -translate-x-1/2 rounded-full border border-white/15 bg-white/[0.04]" />
          {/* pretend like icon */}
          <div className="absolute bottom-5 right-5 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/70">
            ♥
          </div>
        </motion.div>

        {/* left portrait card */}
        <motion.div
          className="absolute -left-10 bottom-10 h-64 w-40 rotate-[-10deg] rounded-2xl bg-[linear-gradient(180deg,#513726,#1b1110)] ring-1 ring-white/10"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.2 }}
        />

        {/* right portrait card */}
        <motion.div
          className="absolute -right-10 top-16 h-64 w-40 rotate-[12deg] rounded-2xl bg-[linear-gradient(180deg,#2c1d4f,#12101b)] ring-1 ring-white/10"
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.4 }}
        />

        {/* reaction bubbles */}
        <motion.div
          className="absolute left-8 top-10 grid h-12 w-20 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-lg"
          animate={{ y: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          🔥 💜
        </motion.div>
        <motion.div
          className="absolute right-8 top-48 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06]"
          animate={{ y: [2, -2, 2] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          ⭐
        </motion.div>
        <motion.div
          className="absolute left-10 bottom-28 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06]"
          animate={{ y: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        >
          💬
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
    <main className="min-h-screen bg-[#0b0c0f]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-2">
        {/* LEFT: IG-like media collage */}
        <LeftHero />

        {/* RIGHT: login card */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-xl">
            {/* wordmark */}
            <div className="mb-6 text-center">
              <h1
                className="
                  brand-script text-5xl leading-none
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

              {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[13px] text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="mb-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.03] text-[14px] font-medium text-white hover:bg-white/[0.06]"
            >
              <span className="text-[#ea4335]">●</span> Continue with Google
            </button>

            {/* links */}
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <Link to="/forgot" className="text-sky-400 hover:underline">
                Forgot password?
              </Link>
              <Link to="/signup" className="text-sky-400 hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
