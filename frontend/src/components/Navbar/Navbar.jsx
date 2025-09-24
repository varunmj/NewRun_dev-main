import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import { hasDraft } from "../../utils/onboardingProgress";
import axiosInstance from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext.jsx";
import { forceLogout } from "../../utils/logoutUtils";

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
  MdNotificationsNone,
  MdClose,
} from "react-icons/md";

/* ---------- helpers ---------- */
const timeAgo = (iso) => {
  try {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  } catch {
    return "";
  }
};
const nameOf = (user) => {
  const n = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return n || user?.email || "Someone";
};
const initialsOf = (user) => {
  const n = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  if (!n) return (user?.email || "?").slice(0, 1).toUpperCase();
  return n
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
};

/* ---------- Avatar menu ---------- */
function ProfileMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = useMemo(() => {
    const fn = (localStorage.getItem("firstName") || "").trim();
    const ln = (localStorage.getItem("lastName") || "").trim();
    const name = [fn, ln].filter(Boolean).join(" ");
    if (!name) return "NR";
    return (
      name
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "NR"
    );
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
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
          className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b0c0f] p-1.5 shadow-xl ring-1 ring-black/5"
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
          <Link
            to="/Dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            <MdSettings className="text-white/60" /> Dashboard
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

/* ---------- Notification bell ---------- */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [items, setItems] = useState([]);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const loadPending = async () => {
    try {
      const r = await axiosInstance.get("/contact-access/inbox?status=pending");
      const arr = r?.data?.items || [];
      setItems(arr);
      setPendingCount(arr.length);
    } catch {
      setItems([]);
      setPendingCount(0);
    }
  };

  useEffect(() => {
    let s;
    (async () => {
      await loadPending();
      try {
        const { io } = await import("socket.io-client");
        const url =
          (import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8000");
        s = io(url, { transports: ["websocket"], withCredentials: true });

        try {
          const me = await axiosInstance.get("/get-user");
          const id = me?.data?.user?._id;
          if (id) s.emit("registerUser", id);
        } catch {}

        s.on("contact_request:new", loadPending);
        s.on("contact_request:updated", loadPending);
      } catch {}
    })();

    const onDocClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const approve = async (requestId) => {
    await axiosInstance.post("/contact-access/approve", { requestId });
  };
  const deny = async (requestId) => {
    await axiosInstance.post("/contact-access/deny", { requestId });
  };

  const handleApprove = async (id) => {
    setItems((arr) => arr.map((it) => (it._id === id ? { ...it, _busy: true, _err: "" } : it)));
    try {
      await approve(id);
      setItems((arr) => arr.filter((it) => it._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
    } catch (e) {
      const code = e?.response?.status;
      const msg =
        code === 401
          ? "Session expired. Please sign in."
          : code === 404
          ? "Request not found."
          : "Approve failed. Try again.";
      setItems((arr) => arr.map((it) => (it._id === id ? { ...it, _busy: false, _err: msg } : it)));
    }
  };

  const handleDeny = async (id) => {
    setItems((arr) => arr.map((it) => (it._id === id ? { ...it, _busy: true, _err: "" } : it)));
    try {
      await deny(id);
      setItems((arr) => arr.filter((it) => it._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
    } catch (e) {
      const code = e?.response?.status;
      const msg =
        code === 401
          ? "Session expired. Please sign in."
          : code === 404
          ? "Request not found."
          : "Deny failed. Try again.";
      setItems((arr) => arr.map((it) => (it._id === id ? { ...it, _busy: false, _err: msg } : it)));
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/85 ring-1 ring-white/10 hover:bg-white/15"
        aria-label="Notifications"
      >
        <MdNotificationsNone className="text-xl" />
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 z-50 w-[360px] max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-[#0b0c0f] shadow-2xl ring-1 ring-black/40"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b0c0f] px-3 py-2">
            <div className="text-sm font-semibold text-white">Requests</div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/60 hover:bg-white/10">
              <MdClose />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/60">You’re all caught up ✨</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {items.map((it) => {
                const requester = it.requesterId || {};
                return (
                  <li key={it._id} className="flex gap-3 px-3 py-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white/90">
                      {initialsOf(requester)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {nameOf(requester)}
                        </span>
                        {it.createdAt && <span className="text-xs text-white/45">{timeAgo(it.createdAt)}</span>}
                      </div>

                      {/* ⬇️ Wrap to next line and show full property title */}
                      <div className="text-sm text-white/75 whitespace-normal break-words leading-5">
                        <span className="block">wants to view your contact info</span>
                        {it.propertyId?.title && (
                          <span className="block">
                            for <span className="font-medium">{it.propertyId.title}</span>.
                          </span>
                        )}
                      </div>

                      {it._err && <div className="mt-1 text-xs text-rose-400">{it._err}</div>}

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleApprove(it._id)}
                          disabled={it._busy}
                          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          {it._busy ? "Working…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDeny(it._id)}
                          disabled={it._busy}
                          className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Main Navbar ---------- */
export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const showResume = hasDraft();
  const { logout } = useAuth();

  const productItems = [
    { title: "Solve Threads", desc: "AI-powered campus life solutions.", to: "/solve-threads", icon: MdAutoAwesome, featured: true },
    { title: "Housing", desc: "Verified listings near campus.", to: "/all-properties", icon: MdHomeWork },
    { title: "Roommate matcher", desc: "2-minute quiz for a great fit.", to: "/Synapse", icon: MdPeople },
    { title: "Essentials pack", desc: "Day-1 kit: buy or rent.", to: "/marketplace", icon: MdShoppingBag },
    { title: "Arrival checklist", desc: "7-day plan + airport transit.", to: "/dashboard", icon: MdChecklistRtl },
    { title: "Community", desc: "Clubs, events, and groups.", to: "/community", icon: MdDiversity3 },
    { title: "Build my plan", desc: "Let AI craft everything for me.", to: "/onboarding", icon: MdAutoAwesome },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl bg-[#0b0c0f]/90 px-4 py-2.5 backdrop-blur border border-white/5">
        {/* brand */}
        <Link to="/" className="inline-flex items-center">
          <span className="brand-script text-3xl leading-none bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.06)]">
            NewRun
          </span>
        </Link>

        {/* center links */}
        <nav className="hidden items-center gap-8 md:flex">
          <MegaMenu label="Products" items={productItems} />
          <Link
            to="/solve-threads"
            className={`text-sm font-semibold ${loc.pathname.startsWith("/solve-threads") ? "text-orange-400" : "text-orange-400/80 hover:text-orange-400"}`}
          >
            Solve Threads
          </Link>
          <Link
            to="/community"
            className={`text-sm ${loc.pathname.startsWith("/community") ? "text-white" : "text-white/80 hover:text-white"}`}
          >
            Get Help
          </Link>
          <Link
            to="/blogs"
            className={`text-sm ${loc.pathname.startsWith("/blogs") ? "text-white" : "text-white/80 hover:text-white"}`}
          >
            Blogs
          </Link>
          <Link
            to="/community"
            className={`text-sm ${loc.pathname.startsWith("/community") ? "text-white" : "text-white/80 hover:text-white"}`}
          >
            Community
          </Link>
          <Link
            to="/marketplace"
            className={`text-sm ${loc.pathname.startsWith("/marketplace") ? "text-white" : "text-white/80 hover:text-white"}`}
          >
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

          <NotificationBell />

          <ProfileMenu
            onLogout={async () => {
              // BULLETPROOF LOGOUT
              try {
                await logout();
              } catch (error) {
                console.error('AuthContext logout error:', error);
              }
              
              // Always force logout regardless of AuthContext result
              setTimeout(() => {
                forceLogout();
              }, 100);
            }}
          />
        </div>
      </div>
    </header>
  );
}
