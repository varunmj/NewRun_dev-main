import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import axiosInstance from "../utils/axiosInstance";
import { validateEmail } from "../utils/helper";

export default function SignUp() {
  const nav = useNavigate();
  const location = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState(location.state?.email || "");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [agree, setAgree]         = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [showPwd2, setShowPwd2]   = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    // basic client validation
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!lastName.trim())  return setError("Please enter your last name.");
    if (!validateEmail(email)) return setError("Please enter a valid email.");
    if (!password) return setError("Please enter a password.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don’t match.");
    if (!agree) return setError("Please accept the Terms and Privacy Policy.");

    setError("");

    try {
      const res = await axiosInstance.post("/create-account", {
        firstName,
        lastName,
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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0b0c0f]">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-16">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            {/* Showcase (desktop only) */}
            <section className="hidden lg:flex h-[560px] items-center justify-center">
              <div className="relative">
                {/* overlapping “cards” to keep it lively but minimal */}
                <div className="absolute -left-12 -top-10 h-72 w-52 rotate-[-8deg] rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/15 to-emerald-500/15 backdrop-blur"></div>
                <div className="absolute -right-10 top-16 h-72 w-52 rotate-[7deg] rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-indigo-500/15 backdrop-blur"></div>
                <div className="relative h-80 w-56 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] shadow-2xl ring-1 ring-black/50" />
              </div>
            </section>

            {/* Form */}
            <section className="flex w-full flex-col items-center">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-xl">
                <h1 className="mb-1 text-center text-[22px] font-semibold text-white">
                  Welcome to NewRun
                </h1>
                <p className="mb-6 text-center text-sm text-white/60">
                  Create your account to get started
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* first + last (side-by-side on md+) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FloatInput
                      id="firstName"
                      label="First name"
                      value={firstName}
                      onChange={setFirstName}
                      autoComplete="given-name"
                    />
                    <FloatInput
                      id="lastName"
                      label="Last name"
                      value={lastName}
                      onChange={setLastName}
                      autoComplete="family-name"
                    />
                  </div>

                  <FloatInput
                    id="email"
                    type="email"
                    label="Email address"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />

                  <FloatInput
                    id="password"
                    type={showPwd ? "text" : "password"}
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    trailing={
                      <EyeButton onClick={() => setShowPwd((v) => !v)} isOn={showPwd} />
                    }
                    hint="8+ characters"
                  />

                  <FloatInput
                    id="confirm"
                    type={showPwd2 ? "text" : "password"}
                    label="Confirm password"
                    value={confirm}
                    onChange={setConfirm}
                    autoComplete="new-password"
                    trailing={
                      <EyeButton onClick={() => setShowPwd2((v) => !v)} isOn={showPwd2} />
                    }
                  />

                  {/* Terms */}
                  <label className="mt-1 flex select-none items-start gap-3 text-[13px] text-white/80">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-[3px] h-[18px] w-[18px] cursor-pointer appearance-none rounded border border-white/30 bg-transparent ring-0 transition-all checked:bg-sky-500 checked:outline-none checked:ring-0 focus:outline-none focus:ring-0"
                      aria-label="Accept terms"
                    />
                    <span className="leading-5">
                      I agree to the{" "}
                      <Link to="/terms" className="text-sky-400 hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-sky-400 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {error && (
                    <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#2f64ff] text-[15px] font-medium text-white transition hover:bg-[#2958e3] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!firstName || !lastName || !email || !password || !confirm}
                  >
                    Sign Up
                  </button>
                </form>

                {/* OR divider */}
                <div className="my-5 flex items-center gap-3 text-white/40">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Simple social buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.07]"
                  >
                    <span className="text-[#ea4335]">●</span> Continue with Google
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.07]"
                  >
                    <span className="text-white">◆</span> Continue with GitHub
                  </button>
                </div>

                <p className="mt-6 text-center text-sm text-white/70">
                  Already have an account?{" "}
                  <Link to="/login" className="text-sky-400 hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/** ---------- small helpers (pure tailwind; no extra deps) ---------- */

function FloatInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  trailing,
  hint,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder=" "
        className="
          peer h-11 w-full rounded-md border border-white/10 bg-white/[0.03]
          px-3 pr-10 pt-4 text-[14px] text-white outline-none
          placeholder-transparent
          focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10
        "
      />
      <label
        htmlFor={id}
        className="
          pointer-events-none absolute left-3 top-2 text-[11px] text-white/60
          transition-all
          peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[13px]
          peer-focus:top-2 peer-focus:text-[11px]
        "
      >
        {label}
      </label>
      {hint && (
        <span className="pointer-events-none absolute right-10 top-[11px] text-[11px] text-white/40">
          {hint}
        </span>
      )}
      {trailing && (
        <div className="absolute right-2 top-1.5">{trailing}</div>
      )}
    </div>
  );
}

function EyeButton({ onClick, isOn }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOn ? "Hide password" : "Show password"}
      className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
    >
      {/* simple inline SVG eye */}
      {isOn ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )}
    </button>
  );
}
