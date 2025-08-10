import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#121316]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-sky-400">New</span>Run
          </span>
        </Link>

        <nav className="hidden gap-7 md:flex">
          <Link to="/chatbot" className="text-sm text-[var(--text-mid)] hover:text-white">
            Chat with Us
          </Link>
          <Link to="/blogs" className="text-sm text-[var(--text-mid)] hover:text-white">
            Blogs
          </Link>
          <Link to="/community" className="text-sm text-[var(--text-mid)] hover:text-white">
            Community
          </Link>
          <Link to="/marketplace" className="text-sm text-[var(--text-mid)] hover:text-white">
            Marketplace
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* 👇 This is the button we use everywhere */}
          <button
            onClick={() => navigate("/chatbot", { state: { mode: "onboarding" } })}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Chat with Us
          </button>

          <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-white/10 font-semibold md:flex">
            NR
          </div>
        </div>
      </div>
    </div>
  );
}
