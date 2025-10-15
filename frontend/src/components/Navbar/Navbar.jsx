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
  MdAttachMoney,
  MdSchool,
  MdDirectionsBus,
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
  const [user, setUser] = useState(null);
  const ref = useRef(null);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/get-user');
        setUser(response.data?.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUser();
  }, []);

  const initials = useMemo(() => {
    if (!user) return "NR";
    return initialsOf(user) || "NR";
  }, [user]);

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
          {/* User info header */}
          {user && (
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <div className="text-sm font-semibold text-white">{nameOf(user)}</div>
              <div className="text-xs text-white/60">{user.email}</div>
            </div>
          )}
          
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
  const [verificationNotifications, setVerificationNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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

  const loadVerificationNotifications = async () => {
    try {
      const r = await axiosInstance.get("/api/user/verification-status");
      const notifications = r?.data?.notifications || [];
      setVerificationNotifications(notifications);
    } catch {
      setVerificationNotifications([]);
    }
  };

  useEffect(() => {
    let s;
    (async () => {
      await Promise.all([loadPending(), loadVerificationNotifications()]);
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

  // Calculate total count whenever counts change
  useEffect(() => {
    setTotalCount(pendingCount + verificationNotifications.length);
  }, [pendingCount, verificationNotifications.length]);

  const handleVerificationAction = (notification) => {
    switch (notification.id) {
      case 'email_verification':
        window.location.href = '/verify-email';
        break;
      case 'phone_verification':
        window.location.href = '/add-phone';
        break;
      default:
        console.log('Unknown verification notification:', notification);
    }
  };

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
        className="relative grid h-10 w-10 place-items-center rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
        aria-label="Notifications"
      >
        <MdNotificationsNone className="text-xl" />
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1.5 text-[10px] font-bold text-white shadow-lg animate-pulse border-2 border-white/20">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 z-50 w-[320px] max-h-[60vh] overflow-hidden rounded-2xl backdrop-blur-2xl border border-white/10 shadow-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >

          {items.length === 0 && verificationNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-sm text-white/60">No notifications</div>
            </div>
          ) : (
            <div className="py-2">
              {items.map((it, index) => {
                const requester = it.requesterId || {};
                return (
                  <div key={it._id}>
                    <div className="px-4 py-3 hover:bg-white/5 transition-colors duration-200">
                      <div className="flex gap-3">
                        {/* Black box with blue letters avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold border border-white/10"
                             style={{
                               background: '#000000', // Black background
                               color: '#2563eb' // NewRun blue text
                             }}>
                          {initialsOf(requester)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white truncate">
                              {nameOf(requester)}
                            </span>
                            {it.createdAt && (
                              <span className="text-xs text-white/50">
                                {timeAgo(it.createdAt)}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-white/70 mb-3">
                            wants to view your contact info
                            {it.propertyId?.title && (
                              <span className="block text-white/60">
                                for {it.propertyId.title}
                              </span>
                            )}
                          </div>

                          {it._err && (
                            <div className="mb-3 p-2 rounded-lg text-xs text-red-300"
                                 style={{
                                   background: 'rgba(239, 68, 68, 0.1)',
                                   border: '1px solid rgba(239, 68, 68, 0.2)'
                                 }}>
                              {it._err}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(it._id)}
                              disabled={it._busy}
                              className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 transition-all duration-200"
                              style={{
                                background: '#2563eb' // NewRun blue
                              }}
                            >
                              {it._busy ? (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Working…
                                </div>
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={() => handleDeny(it._id)}
                              disabled={it._busy}
                              className="flex-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/30 disabled:opacity-60 transition-all duration-200"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Horizontal fading separator */}
                    {index < items.length - 1 && (
                      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    )}
                  </div>
                );
              })}

              {/* Verification Notifications */}
              {verificationNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="px-4 py-3 hover:bg-white/5 transition-colors duration-200">
                    <div className="flex gap-3">
                      {/* Verification icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg border border-white/10"
                           style={{
                             background: notification.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                             color: notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
                           }}>
                        {notification.avatar}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white truncate">
                            {notification.title}
                          </span>
                        </div>

                        <div className="text-xs text-white/70 mb-3">
                          {notification.message}
                        </div>

                        {/* Action button */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerificationAction(notification)}
                            className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-200"
                            style={{
                              background: notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
                            }}
                          >
                            {notification.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Horizontal fading separator */}
                  {index < verificationNotifications.length - 1 && (
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
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
  const [showResume, setShowResume] = useState(false);
  const { logout } = useAuth();

  // Check onboarding completion status from backend
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await axiosInstance.get('/onboarding-data');
        const isCompleted = response.data?.onboardingData?.completed || false;
        setShowResume(!isCompleted);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Fallback to local storage check
        setShowResume(hasDraft());
      }
    };
    
    checkOnboardingStatus();
  }, []);

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
