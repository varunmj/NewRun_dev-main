import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import { hasDraft } from "../../utils/onboardingProgress";

import {
  MdHomeWork,
  MdPeople,
  MdShoppingBag,
  MdChecklistRtl,
  MdDiversity3,
  MdAutoAwesome,
  MdPerson,
  MdSettings,
  MdLogout,
} from "react-icons/md";

/* ---------- Small Avatar + Dropdown ---------- */
function ProfileMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Compute initials from localStorage (fallback to NR)
  const initials = React.useMemo(() => {
    const fn = (localStorage.getItem("firstName") || "").trim();
    const ln = (localStorage.getItem("lastName") || "").trim();
    const name = [fn, ln].filter(Boolean).join(" ");
    if (!name) return "NR";
    return name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "NR";
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0f1115] p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            <MdPerson className="text-white/60" /> Profile
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            <MdSettings className="text-white/60" /> Settings
          </Link>

          <div className="my-1 h-px bg-white/10" />

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            <MdLogout /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------- Main Navbar ----------------- */
export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const showResume = hasDraft();

  const productItems = [
    {
      title: "Housing",
      desc: "Verified listings near campus.",
      to: "/all-properties",
      icon: MdHomeWork,
    },
    {
      title: "Roommate matcher",
      desc: "2-minute quiz for a great fit.",
      to: "/roommate",
      icon: MdPeople,
    },
    {
      title: "Essentials pack",
      desc: "Day-1 kit: buy or rent.",
      to: "/marketplace",
      icon: MdShoppingBag,
    },
    {
      title: "Arrival checklist",
      desc: "7-day plan + airport transit.",
      to: "/chatbot",
      icon: MdChecklistRtl,
    },
    {
      title: "Community",
      desc: "Clubs, events, and groups.",
      to: "/community",
      icon: MdDiversity3,
    },
    {
      title: "Build my plan",
      desc: "Let AI craft everything for me.",
      to: "/onboarding",
      icon: MdAutoAwesome,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl bg-[#16181c]/85 px-4 py-2.5 backdrop-blur">
        {/* brand */}
        <Link to="/" className="inline-flex items-center">
          <span
            className="
              brand-script text-3xl leading-none
              bg-gradient-to-r from-blue-600 to-teal-500
              bg-clip-text text-transparent
              drop-shadow-[0_1px_0_rgba(255,255,255,0.06)]
            "
          >
            NewRun
          </span>
        </Link>

        {/* center links */}
        <nav className="hidden items-center gap-8 md:flex">
          <MegaMenu label="Products" items={productItems} />

          <Link
            to="/chatbot"
            className={`text-sm text-white/80 hover:text-white ${
              loc.pathname.startsWith("/chatbot") ? "text-white" : ""
            }`}
          >
            Chat with Us
          </Link>
          <Link
            to="/blogs"
            className={`text-sm text-white/80 hover:text-white ${
              loc.pathname.startsWith("/blogs") ? "text-white" : ""
            }`}
          >
            Blogs
          </Link>
          <Link
            to="/community"
            className={`text-sm text-white/80 hover:text-white ${
              loc.pathname.startsWith("/community") ? "text-white" : ""
            }`}
          >
            Community
          </Link>
          <Link
            to="/marketplace"
            className={`text-sm text-white/80 hover:text-white ${
              loc.pathname.startsWith("/marketplace") ? "text-white" : ""
            }`}
          >
            Marketplace
          </Link>
        </nav>

        {/* right side */}
        <div className="flex items-center gap-3">
          {showResume && (
            <button
              onClick={() =>
                nav("/onboarding", { state: { from: "navbar_resume" } })
              }
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
              title="Pick up where you left off"
            >
              Resume setup
            </button>
          )}

          <ProfileMenu
            onLogout={() => {
              localStorage.removeItem("token");
              nav("/login");
            }}
          />
        </div>
      </div>
    </header>
  );
}
