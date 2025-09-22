import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext.jsx";
import { validateEmail } from "../utils/helper";
import { validatePassword, validatePasswordMatch } from "../utils/passwordValidator";
import PasswordStrengthIndicator from "../components/Auth/PasswordStrengthIndicator";
import { Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");                 // NEW
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");   // NEW
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);      // NEW
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // NEW

  // Removed splitName function - now using separate firstName and lastName fields

  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!validateEmail(email))      return setError("Please enter a valid email.");
    if (!firstName.trim())          return setError("Please enter your first name.");
    if (!lastName.trim())           return setError("Please enter your last name.");
    if (!username.trim())           return setError("Please choose a username.");
    if (!agree)                     return setError("Please accept the Terms and Privacy Policy.");

    // Comprehensive password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return setError(`Password requirements not met: ${passwordValidation.errors[0]}`);
    }

    // Confirm password validation
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.isValid) {
      return setError(passwordMatchValidation.error);
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await axiosInstance.post("/create-account", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(), // NEW
        email: email.trim(),
        password,
      });

      if (res?.data?.error) {
        setError(res.data.message || "Could not create account.");
        return;
      }
      
      if (res?.data?.accessToken) {
        // Use AuthContext login method
        const loginResult = await login(res.data.user, res.data.accessToken);
        
        if (loginResult.success) {
          // Redirect to onboarding or dashboard
          nav("/onboarding");
        } else {
          setError(loginResult.error || "Account created but login failed. Please try logging in.");
        }
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      console.error('Signup error:', err);
      const msg = err?.response?.data?.message || "An unexpected error occurred. Please try again!";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // one place for input class so typograpy stays uniform
  const inputClass =
    "h-11 w-full rounded-md border border-white/12 bg-white/[0.03] " +
    "px-3 text-[14px] text-white outline-none " +
    "placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

  return (
    <main className="min-h-screen bg-[#0b0c0f]">
      <div className="mx-auto flex max-w-6xl items-start justify-center px-4 py-10">
        {/* center card */}
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-xl">
          {/* wordmark */}
          <div className="mb-6 text-center">
            <h1
              className="
                brand-script text-5xl leading-none
                bg-gradient-to-r from-blue-600 to-teal-500
                bg-clip-text text-transparent
                drop-shadow-[0_1px_0_rgba(255,255,255,0.06)]
              "
              // from-teal-400 via-fuchsia-400 to-indigo-400
            >
              NewRun
            </h1>
            <p className="mt-3 text-[12px] leading-5 text-white/70">
              Sign up to access housing, essentials, and community curated by your
              university.
            </p>
            
            {/* Password Requirements */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">Password Requirements:</h3>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• At least one number</li>
                <li>• At least one special character (!@#$%^&*)</li>
                <li>• No common passwords or patterns</li>
              </ul>
            </div>
          </div>

          {/* social */}
          <button
            type="button"
            className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3]"
          >
            <span className="text-[#ea4335]">●</span> Continue with Google
          </button>

          {/* OR */}
          <div className="mb-4 flex items-center gap-3 text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[12px]">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="University email"
              autoComplete="email"
              className={inputClass}
            />

            {/* First Name */}
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
              className={inputClass}
            />

            {/* Last Name */}
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
              className={inputClass}
            />

            {/* Username */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className={inputClass}
            />

            {/* Password Field with Strength Indicator */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {confirmPassword && (
                <div className="mt-1">
                  {password === confirmPassword ? (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* legal copy (uniform text size) */}
            <p className="mt-3 text-[12px] leading-5 text-white/70">
              People who use NewRun may have their basic details used to personalize
              recommendations.{" "}
              <Link to="/help" className="text-sky-400 hover:underline">Learn more</Link>
            </p>

            <p className="mt-3 text-[12px] leading-5 text-white/70">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-sky-400 hover:underline">Terms</Link>,{" "}
              <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>{" "}
              and{" "}
              <Link to="/cookies" className="text-sky-400 hover:underline">Cookies Policy</Link>.
            </p>

            {/* compact consent checkbox */}
            <label className="mx-auto mt-1 flex w-fit items-center gap-2 text-[12px] text-white/80">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded-sm border border-white/40 bg-transparent accent-sky-500  focus:ring-sky-500/40"
                // if your Tailwind doesn't have accent-* utilities, add this too:
                style={{ accentColor: '#38bdf8' }}
              />
              <span>I agree to the terms.</span>
            </label>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[13px] text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* secondary card */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-[14px] text-white/80">
            Have an account?{" "}
            <Link to="/login" className="text-sky-400 hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
