import React from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative mt-24 text-white" role="contentinfo">
      {/* subtle crimson/teal glow band behind the footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-28 h-64 w-full"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, rgba(47,100,255,0.20) 0%, rgba(0,0,0,0) 70%), radial-gradient(60% 80% at 50% 0%, rgba(0,212,255,0.12) 0%, rgba(0,0,0,0) 80%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6">
        {/* Newsletter panel */}
        <div className="rounded-2xl border border-white/10 bg-transparent p-6 backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-[#2F64FF] to-[#00D4FF] bg-clip-text text-transparent">Join our newsletter</h3>
              <p className="mt-1 text-white/70">
                Get exclusive content and become a part of the NewRun community.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Link columns */}
        <div className="mt-14 grid gap-10 md:grid-cols-4">
          {/* Brand blurb */}
          <div>
            <h2
              className="brand-script text-5xl leading-none bg-gradient-to-r from-[#2F64FF] to-[#00D4FF] bg-clip-text text-transparent"
            >
              NewRun
            </h2>
            <p className="mt-3 max-w-sm text-white/70">
              Housing, essentials, and community — curated by your university.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Product
            </h4>
            <ul className="mt-4 space-y-3 text-white/85">
              <li><Link to="/marketplace" className="hover:text-white">Marketplace</Link></li>
              <li><Link to="/properties" className="hover:text-white">Housing</Link></li>
              <li><Link to="/messaging" className="hover:text-white">Messaging</Link></li>
              <li><Link to="/Synapse" className="hover:text-white">Roommate Match</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Company
            </h4>
            <ul className="mt-4 space-y-3 text-white/85">
              <li><Link to="/blogs" className="hover:text-white">Blog</Link></li>
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/signin" className="hover:text-white">Sign in</Link></li>
              <li><Link to="/signup" className="hover:text-white">Sign up</Link></li>
            </ul>
          </div>

          {/* Legal / Resources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Legal
            </h4>
            <ul className="mt-4 space-y-3 text-white/85">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-white">Cookies Policy</Link></li>
              <li><Link to="/cookies/settings" className="hover:text-white">Cookie Settings</Link></li>
              <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 py-6 text-sm text-white/60 md:flex-row">
          <div>© {new Date().getFullYear()} NewRun. All rights reserved.</div>

          <div className="flex items-center gap-3">
            {/* Social icons – inline SVGs to avoid extra deps */}
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
              target="_blank" rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/80 group-hover:fill-white">
                <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.3.4.6.3 1 .6 1.5 1 .4.4.8.9 1 1.5.2.4.3 1.1.4 2.3.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.3a3.9 3.9 0 0 1-1 1.5 3.9 3.9 0 0 1-1.5 1c-.4.2-1.1.3-2.3.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.3-.4a3.9 3.9 0 0 1-1.5-1 3.9 3.9 0 0 1-1-1.5c-.2-.4-.3-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.3.3-.6.6-1 1-1.5.4-.4.9-.8 1.5-1 .4-.2 1.1-.3 2.3-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-1.9.3-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.1.3-.2.9-.2 1.9-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.3 1.9.2.5.5.9.8 1.2.3.2.9.4 1.9.5 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 1.9-.5.5-.2.9-.5 1.2-.8.2-.3.4-.9.5-1.9.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.5-1.9a3 3 0 0 0-.8-1.2c-.3-.3-.9-.5-1.9-.6-1.2 0-1.6-.1-4.7-.1Zm0 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.2-2.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
              </svg>
            </a>

            <a
              href="https://x.com"
              aria-label="Twitter / X"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
              target="_blank" rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/80 group-hover:fill-white">
                <path d="M18.2 2H21l-6.3 7.2L22 22h-5.9l-4.6-6-5.3 6H2.4l6.8-7.6L2 2.1h6l4.2 5.6L18.2 2Zm-1 17.5h1.6L8.9 4.3H7.2l10 15.2Z" />
              </svg>
            </a>

            <a
              href="https://linkedin.com"
              aria-label="LinkedIn"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
              target="_blank" rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/80 group-hover:fill-white">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v15H0V8zm7.5 0h4.8v2.1h.1c.7-1.2 2.5-2.5 5-2.5 5.3 0 6.3 3.5 6.3 8.1V23H18V16c0-1.7 0-3.9-2.4-3.9-2.4 0-2.7 1.8-2.7 3.8V23H7.5V8z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [status, setStatus] = React.useState("idle"); // idle | loading | success | error
  const [value, setValue] = React.useState("");
  const [hp, setHp] = React.useState(""); // honeypot

  async function onSubmit(e) {
    e.preventDefault();
    if (hp) return; // bot
    try {
      setStatus("loading");
      await axiosInstance.post('/newsletter', { email: value, source: 'footer' });
      setStatus("success");
      setValue("");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 md:flex-row md:items-center" aria-live="polite">
      <input type="text" value={hp} onChange={(e)=>setHp(e.target.value)} className="hidden" tabIndex={-1} aria-hidden="true" />
      <input
        type="email"
        required
        placeholder="Email address"
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#00D4FF]"
        aria-label="Email address"
      />
      <button
        type="submit"
        className="whitespace-nowrap rounded-xl bg-gradient-to-r from-[#2F64FF] to-[#00D4FF] px-5 py-3 font-semibold text-white shadow-[0_0_18px_rgba(47,100,255,0.35)] transition hover:scale-[1.02] active:scale-[0.99]"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'success' && (
        <span className="text-sm text-emerald-400">Thanks! You’re on the list.</span>
      )}
      {status === 'error' && (
        <span className="text-sm text-red-400">Something went wrong. Please try again.</span>
      )}
    </form>
  );
}
