import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { hasDraft } from "../../utils/onboardingProgress";

export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const showResume = hasDraft();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl bg-[#16181c]/85 px-4 py-2.5 backdrop-blur">
        {/* brand */}
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="text-xl font-extrabold">
            <span className="bg-gradient-to-r from-[#22d3ee] to-[#60a5fa] bg-clip-text text-transparent">New</span>
            <span className="text-white">Run</span>
          </span>
        </Link>

        {/* center links */}
        <nav className="hidden gap-8 md:flex">
          <Link to="/onboarding" className={`text-sm text-white/80 hover:text-white ${loc.pathname.startsWith("/onboarding") ? "text-white" : ""}`}>
            Products
          </Link>
          <Link to="/chatbot" className={`text-sm text-white/80 hover:text-white ${loc.pathname.startsWith("/chatbot") ? "text-white" : ""}`}>
            Chat with Us
          </Link>
          <Link to="/blogs" className={`text-sm text-white/80 hover:text-white ${loc.pathname.startsWith("/blogs") ? "text-white" : ""}`}>
            Blogs
          </Link>
          <Link to="/community" className={`text-sm text-white/80 hover:text-white ${loc.pathname.startsWith("/community") ? "text-white" : ""}`}>
            Community
          </Link>
          <Link to="/marketplace" className={`text-sm text-white/80 hover:text-white ${loc.pathname.startsWith("/marketplace") ? "text-white" : ""}`}>
            Marketplace
          </Link>
        </nav>

        {/* right side */}
        <div className="flex items-center gap-3">
          {showResume && (
            <button
              onClick={() => nav("/onboarding", { state: { from: "navbar_resume" } })}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
              title="Pick up where you left off"
            >
              Resume setup
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/90">
            NR
          </div>
        </div>
      </div>
    </header>
  );
}
