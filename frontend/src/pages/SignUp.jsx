import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext.jsx";
import { validateEmail } from "../utils/helper";
import { Eye, EyeOff, XCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { BorderBeam } from "../components/ui/border-beam";

export default function SignUp() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const TERMS_VERSION = "2025-10-01";

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameSuggestionNonce, setUsernameSuggestionNonce] = useState(0);
  
  // Field-specific validation states
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    fullName: "",
    username: "",
    password: ""
  });

  // Field validation states for success indicators
  const [fieldStates, setFieldStates] = useState({
    email: false,
    fullName: false,
    username: false,
    password: false
  });

  // Live username availability UI state
  const [usernameAvailability, setUsernameAvailability] = useState({ status: 'idle', available: null });
  const usernameDebounceRef = useRef(null);
  // Live email availability
  const [emailAvailability, setEmailAvailability] = useState({ status: 'idle', available: null });
  const emailDebounceRef = useRef(null);

  // NEW: track if a field was interacted with
  const [touched, setTouched] = useState({
    email: false,
    fullName: false,
    username: false,
    password: false,
  });      // NEW


  // Check if field is valid (for success indicators)
  const isFieldValid = (fieldName, value) => {
    switch (fieldName) {
      case "email":
        return value.trim() && (validateEmail(value) || /^\+?[\d\s\-\(\)]+$/.test(value));
      case "fullName":
        return value.trim().length > 0;
      case "username":
        return value.trim().length >= 3;
      case "password":
        return value.trim().length >= 8;
      default:
        return false;
    }
  };

  // NEW: return a string message or "" for a field
  const validateFieldMessage = (fieldName, value) => {
    switch (fieldName) {
      case "email":
        if (!value.trim()) return "This field is required.";
        if (!validateEmail(value) && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return "Enter a valid email address.";
        }
        return "";
      case "password":
        if (!value.trim()) return "This field is required.";
        if (value.length < 8) return "Create a password at least 8 characters long.";
        return "";
      case "fullName":
        if (!value.trim()) return "This field is required.";
        return "";
      case "username":
        if (!value.trim()) return "This field is required.";
        if (value.length < 3) return "Username must be at least 3 characters.";
        return "";
      default:
        return "";
    }
  };

  // Update field states when values change
  const updateFieldState = (fieldName, value) => {
    const isValid = isFieldValid(fieldName, value);
    setFieldStates(prev => ({ ...prev, [fieldName]: isValid }));
  };

  // NEW: generic onChange handler
  const handleChange = (fieldName, value) => {
    // update value
    if (fieldName === "email") setEmail(value);
    if (fieldName === "password") setPassword(value);
    if (fieldName === "fullName") setFullName(value);
    if (fieldName === "username") setUsername(value);

    // update green-check state
    updateFieldState(fieldName, value);

    // live-validate immediately (show errors as soon as they appear)
    const msg = validateFieldMessage(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: msg }));

    if (fieldName === 'username') {
      // while typing: debounce live availability check
      const trimmed = value.trim().toLowerCase();
      if (trimmed.length >= 3 && !validateFieldMessage('username', trimmed)) {
        setUsernameAvailability({ status: 'typing', available: null });
        checkUsernameAvailability(trimmed);
      } else {
        // too short or invalid -> reset
        setUsernameAvailability({ status: 'idle', available: null });
        if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
      }
    }

    if (fieldName === 'email') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed) {
        setEmailAvailability({ status: 'typing', available: null });
        checkEmailAvailability(trimmed);
      } else {
        setEmailAvailability({ status: 'idle', available: null });
        if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      }
    }
  };

  // NEW: onBlur handler -> mark touched and compute error message
  const handleBlur = (fieldName, value) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const msg = validateFieldMessage(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: msg }));

    // Trigger availability check on blur for username
    if (fieldName === 'username' && value && value.trim().length >= 3 && !msg) {
      checkUsernameAvailability(value.trim());
    }
  };

  // Debounced availability check
  const checkUsernameAvailability = (name) => {
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        setUsernameAvailability({ status: 'checking', available: null });
        const res = await axiosInstance.get(`/check-username`, { params: { username: name } });
        setUsernameAvailability({ status: 'done', available: Boolean(res?.data?.available) });
      } catch (e) {
        setUsernameAvailability({ status: 'error', available: null });
      }
    }, 400);
  };

  const checkEmailAvailability = (addr) => {
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    emailDebounceRef.current = setTimeout(async () => {
      try {
        setEmailAvailability({ status: 'checking', available: null });
        const res = await axiosInstance.get(`/check-email`, { params: { email: addr } });
        setEmailAvailability({ status: 'done', available: Boolean(res?.data?.available) });
      } catch (e) {
        setEmailAvailability({ status: 'error', available: null });
      }
    }, 400);
  };

  // cleanup on unmount for debounce timer
  useEffect(() => {
    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
  }, []);

  const clearField = (fieldName) => {
    switch (fieldName) {
      case "email":
        setEmail("");
        break;
      case "fullName":
        setFullName("");
        break;
      case "username":
        setUsername("");
        break;
      case "password":
        setPassword("");
        break;
    }
    setFieldErrors(prev => ({ ...prev, [fieldName]: "" }));
    setFieldStates(prev => ({ ...prev, [fieldName]: false }));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Clear previous errors
    setError("");
    setFieldErrors({
      email: "",
      fullName: "",
      username: "",
      password: ""
    });

    // Validate all fields
    let hasErrors = false;
    const newFieldErrors = {
      email: "",
      fullName: "",
      username: "",
      password: ""
    };

    // Email validation
    if (!email.trim()) {
      newFieldErrors.email = "This field is required.";
      hasErrors = true;
    } else if (!validateEmail(email) && !/^\+?[\d\s\-\(\)]+$/.test(email)) {
      newFieldErrors.email = "Please enter a valid email or phone number.";
      hasErrors = true;
    }

    // Full name validation
    if (!fullName.trim()) {
      newFieldErrors.fullName = "This field is required.";
      hasErrors = true;
    }

    // Username validation
    if (!username.trim()) {
      newFieldErrors.username = "This field is required.";
      hasErrors = true;
    } else if (username.length < 3) {
      newFieldErrors.username = "Username must be at least 3 characters.";
      hasErrors = true;
    }

    // Password validation
    if (!password.trim()) {
      newFieldErrors.password = "This field is required.";
      hasErrors = true;
    } else if (password.length < 8) {
      newFieldErrors.password = "Create a password at least 8 characters long.";
      hasErrors = true;
    }

    // Terms validation
    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

            // If there are field errors, show them and return
            if (hasErrors) {
              setFieldErrors(newFieldErrors);
              setTouched({ email: true, fullName: true, username: true, password: true }); // optional UX polish
              return;
            }


    setError("");
    setIsLoading(true);

    try {
      // Split full name into first and last name for backend
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const res = await axiosInstance.post("/create-account", {
        firstName: firstName,
        lastName: lastName,
        username: username.trim(),
        email: email.trim(),
        password,
        termsConsent: {
          accepted: true,
          version: TERMS_VERSION,
          acceptedAt: new Date().toISOString()
        }
      });

      if (res?.data?.error) {
        setError(res.data.message || "Could not create account.");
        return;
      }
      
      if (res?.data?.accessToken) {
        // Record local consent receipt
        try {
          localStorage.setItem(
            'nr_terms_consent',
            JSON.stringify({ accepted: true, version: TERMS_VERSION, acceptedAt: new Date().toISOString() })
          );
        } catch {}

        // Use AuthContext login method
        const loginResult = await login(res.data.user, res.data.accessToken);
        
        if (loginResult.success) {
          // Check if user has completed onboarding
          const onboardingData = localStorage.getItem('nr_unified_onboarding');
          if (onboardingData) {
            const parsed = JSON.parse(onboardingData);
            if (parsed.completed) {
              // User has completed onboarding, go to dashboard
              nav("/dashboard");
            } else {
              // User has partial onboarding data, continue from where they left off
              nav("/onboarding");
            }
          } else {
            // New user, start onboarding
            nav("/onboarding");
          }
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

  // size tokens so all fields look consistent
  const INPUT_HEIGHT = "h-12";
  const RADIUS = "rounded-lg";
  const ICON_SIZE = "w-6 h-6";               // 24px
  const RIGHT_PAD = "pr-20";                 // one icon - extra safe padding
  const RIGHT_PAD_WITH_SHOW = "pr-[128px]";  // icon + Show pill - extra safe padding

  // one place for input class so typograpy stays uniform
  const inputClass =
    `${INPUT_HEIGHT} w-full ${RADIUS} border border-white/12 bg-black ` +
    "px-3 text-[14px] text-white outline-none placeholder:text-white/55 " +
    "autofill:bg-black autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_black] " +
    "[-webkit-text-fill-color:white] [-webkit-box-shadow:0_0_0px_1000px_black_inset]";

  // Helper function to compose classes with proper precedence
  const cx = (...classes) => classes.filter(Boolean).join(' ');

  // Centralized error checking
  const fieldHasError = (name, value) =>
    Boolean(fieldErrors[name] || (touched[name] && !isFieldValid(name, value)));

  // Force red border with inline style (highest precedence)
  const errorBorderStyle = (hasError) =>
    hasError
      ? { borderColor: '#ef4444', borderWidth: 2 } // red-500, 2px (Instagram-like)
      : undefined;

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto flex max-w-6xl items-start justify-center px-4 py-10">
        <div className="w-full flex flex-col items-center">
        {/* center card */}
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-transparent p-6 relative overflow-hidden">
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
            
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={() => {
              const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')).replace(/\/+$/, '');
              window.location.href = `${apiUrl}/api/auth/google`;
            }}
            className="mb-4 inline-flex h-10 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* OR */}
          <div className="mb-4 flex items-center gap-3 text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[12px]">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Mobile Number or Email */}
            <div>
              <div className="relative">
              <input
              type="text"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder="Mobile Number or Email"
                autoComplete="email"
                aria-invalid={fieldHasError("email", email)}
                aria-describedby="email-error"
                className={cx(
                  inputClass,
                  RIGHT_PAD, // room for icon
                  fieldHasError("email", email) &&
                    "ring-1 ring-red-500/40 focus:ring-red-500/50 focus:border-red-600",
                  !fieldHasError("email", email) && touched.email && "border-gray-400"
                )}
                style={errorBorderStyle(fieldHasError("email", email))}
              />
              {/* right controls */}
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {emailAvailability.status === 'checking' && (
                  <div className="grid place-items-center w-7 h-7">
                    <svg className="w-4 h-4 animate-spin text-sky-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  </div>
                )}
                {emailAvailability.status === 'done' && emailAvailability.available === true && !fieldHasError("email", email) && (
                  <div className="grid place-items-center w-7 h-7">
                    <CheckCircle2 className={`${ICON_SIZE} text-emerald-500`} strokeWidth={2} />
                  </div>
                )}
                {emailAvailability.status === 'done' && emailAvailability.available === false && !fieldHasError("email", email) && (
                  <div className="grid place-items-center w-7 h-7">
                    <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                  </div>
                )}

                {fieldHasError("email", email) && (
                  <button
                    type="button"
                    onClick={() => clearField("email")}
                    className="pointer-events-auto grid place-items-center w-7 h-7"
                    aria-label="Clear email"
                  >
                    <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                  </button>
                )}
              </div>
              </div>

              {fieldHasError("email", email) && (
                <div id="email-error" className="mt-1 text-sm text-red-500 font-medium">
                  {fieldErrors.email || "Enter a valid email address."}
                </div>
              )}
              {!fieldHasError("email", email) && email && (
                <div className="mt-1 text-xs">
                  {emailAvailability.status === 'checking' && (
                    <span className="text-sky-400">Checking email…</span>
                  )}
                  {emailAvailability.status === 'done' && emailAvailability.available === true && (
                    <span className="text-emerald-400">Email looks good.</span>
                  )}
                  {emailAvailability.status === 'done' && emailAvailability.available === false && (
                    <span className="text-red-400">An account with this email already exists.</span>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                aria-invalid={fieldHasError("password", password)}
                aria-describedby="password-error"
                className={cx(
                  inputClass,
                  RIGHT_PAD_WITH_SHOW, // extra room for icon + Show
                  fieldHasError("password", password) &&
                    "ring-1 ring-red-500/40 focus:ring-red-500/50 focus:border-red-600",
                  !fieldHasError("password", password) && touched.password && "border-gray-400"
                )}
                style={errorBorderStyle(fieldHasError("password", password))}
              />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {fieldHasError("password", password) ? (
                    <div className="grid place-items-center w-7 h-7">
                      <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                    </div>
                  ) : fieldStates.password ? (
                    <div className="grid place-items-center w-8 h-8">
                      <CheckCircle2 className={`${ICON_SIZE} text-emerald-500`} strokeWidth={2} />
                    </div>
                  ) : null}

                  {/* IG-like Show pill */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pointer-events-auto inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-md border border-white/25 bg-white/10 text-white/90 hover:bg-white/15 hover:border-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {fieldHasError("password", password) && (
                <div id="password-error" className="mt-1 text-sm text-red-500 font-medium">
                  {fieldErrors.password || "Create a password at least 8 characters long."}
                </div>
              )}
            </div>

            {/* Full Name */}
            <div>
              <div className="relative">
                <input
                type="text"
                value={fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                placeholder="Full Name"
                autoComplete="name"
                aria-invalid={fieldHasError("fullName", fullName)}
                aria-describedby="fullName-error"
                className={cx(
                  inputClass,
                  RIGHT_PAD, // room for icon
                  fieldHasError("fullName", fullName) &&
                    "ring-1 ring-red-500/40 focus:ring-red-500/50 focus:border-red-600",
                  !fieldHasError("fullName", fullName) && touched.fullName && "border-gray-400"
                )}
                style={errorBorderStyle(fieldHasError("fullName", fullName))}
              />
                {/* right controls */}
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {fieldHasError("fullName", fullName) ? (
                    <button
                      type="button"
                      onClick={() => clearField("fullName")}
                      className="pointer-events-auto grid place-items-center w-7 h-7"
                      aria-label="Clear full name"
                    >
                      <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                    </button>
                  ) : fieldStates.fullName ? (
                    <div className="grid place-items-center w-7 h-7">
                      <CheckCircle2 className={`${ICON_SIZE} text-emerald-500`} strokeWidth={2} />
                    </div>
                  ) : null}
                </div>
              </div>

              {fieldHasError("fullName", fullName) && (
                <div id="fullName-error" className="mt-1 text-sm text-red-500 font-medium">
                  {fieldErrors.fullName || "This field is required."}
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <div className="relative">
                <input
                type="text"
                value={username}
                onChange={(e) => handleChange("username", e.target.value)}
                onBlur={(e) => handleBlur("username", e.target.value)}
                placeholder="Username"
                autoComplete="username"
                aria-invalid={fieldHasError("username", username)}
                aria-describedby="username-error"
                className={cx(
                  inputClass,
                  RIGHT_PAD, // room for icon
                  fieldHasError("username", username) &&
                    "ring-1 ring-red-500/40 focus:ring-red-500/50 focus:border-red-600",
                  !fieldHasError("username", username) && touched.username && "border-gray-400"
                )}
                style={errorBorderStyle(fieldHasError("username", username))}
              />
                {/* right controls */}
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {usernameAvailability.status === 'checking' && (
                    <div className="grid place-items-center w-7 h-7">
                      <svg className="w-4 h-4 animate-spin text-sky-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  )}

                  {usernameAvailability.status === 'done' && usernameAvailability.available === true && (
                    <div className="grid place-items-center w-7 h-7">
                      <CheckCircle2 className={`${ICON_SIZE} text-emerald-500`} strokeWidth={2} />
                    </div>
                  )}

                  {usernameAvailability.status === 'done' && usernameAvailability.available === false && (
                    <div className="grid place-items-center w-7 h-7">
                      <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                    </div>
                  )}

                  {fieldHasError("username", username) ? (
                    <button
                      type="button"
                      onClick={() => clearField("username")}
                      className="pointer-events-auto grid place-items-center w-7 h-7"
                      aria-label="Clear username"
                    >
                      <XCircle className={`${ICON_SIZE} text-red-500`} strokeWidth={2} />
                    </button>
                  ) : null}

                  {username && username.length >= 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameSuggestionNonce((n) => n + 1);
                        checkUsernameAvailability(username);
                      }}
                      className="pointer-events-auto grid place-items-center w-7 h-7"
                      aria-label="Refresh username suggestions"
                      title="Refresh suggestions"
                    >
                      <RotateCcw className={`${ICON_SIZE} text-sky-400`} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {fieldHasError("username", username) && (
                <div id="username-error" className="mt-1 text-sm text-red-500 font-medium">
                  {fieldErrors.username || "Username must be at least 3 characters."}
                </div>
              )}

              {/* Availability helper text */}
              {username && username.length >= 3 && !fieldHasError("username", username) && (
                <div className="mt-1 text-xs">
                  {usernameAvailability.status === 'checking' && (
                    <span className="text-sky-400">Checking availability…</span>
                  )}
                  {usernameAvailability.status === 'done' && usernameAvailability.available === true && (
                    <span className="text-emerald-400">Great news — username is available.</span>
                  )}
                  {usernameAvailability.status === 'done' && usernameAvailability.available === false && (
                    <span className="text-red-400">That username is taken. Try a suggestion below.</span>
                  )}
                </div>
              )}
              
              {/* Username Suggestions (Instagram-style) */}
              {username && username.length >= 3 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-400">Suggestions:</div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setUsername(`${username.toLowerCase()}.${Math.floor(Math.random() * 100)}`)}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {username.toLowerCase()}.{Math.floor(Math.random() * 100 + usernameSuggestionNonce % 100)}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUsername(`${username.toLowerCase()}_${Math.floor(Math.random() * 100)}`)}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {username.toLowerCase()}_{Math.floor(Math.random() * 100 + (usernameSuggestionNonce % 100))}
                    </button>
                  </div>
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
              disabled={isLoading || !agree}
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

          <BorderBeam 
            size={300}
            duration={4}
            colorFrom="#2F64FF"
            colorTo="#00D4FF"
            borderWidth={2.5}
          />
        </div>
        {/* secondary card below main card */}
        <div className="w-full max-w-sm mt-4 rounded-2xl border border-white/10 bg-transparent p-4 text-center">
          <p className="text-white/80 text-[14px]">
            Have an account? <Link to="/login" className="text-sky-400 hover:underline">Log in</Link>
          </p>
        </div>
        </div>
      </div>
    </main>
  );
}
