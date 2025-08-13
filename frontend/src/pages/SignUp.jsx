import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { validateEmail } from "../utils/helper";

export default function SignUp() {
  const nav = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");                 // NEW
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  function splitName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return ["", ""];
    if (parts.length === 1) return [parts[0], ""];
    return [parts[0], parts.slice(1).join(" ")];
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateEmail(email))      return setError("Please enter a valid email.");
    if (!password || password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (!fullName.trim())           return setError("Please enter your full name.");
    if (!username.trim())           return setError("Please choose a username.");
    if (!agree)                     return setError("Please accept the Terms and Privacy Policy.");

    const [firstName, lastName] = splitName(fullName);
    setError("");

    try {
      const res = await axiosInstance.post("/create-account", {
        firstName,
        lastName,
        username, // NEW
        email,
        password,
      });

      if (res?.data?.error) {
        setError(res.data.message || "Could not create account.");
        return;
      }
      if (res?.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        nav("/chatbot");
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "An unexpected error occurred. Please try again!";
      setError(msg);
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="University email"
              autoComplete="email"
              className={inputClass}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              autoComplete="new-password"
              className={inputClass}
            />

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className={inputClass}
            />

            {/* NEW: Username */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className={inputClass}
            />

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
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2f64ff] text-[14px] font-medium text-white hover:bg-[#2958e3]"
            >
              Sign Up
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
