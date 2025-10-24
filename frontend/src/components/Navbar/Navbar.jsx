import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import UserDropdown from "./UserDropdown.jsx";
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
  MdNotificationsNone,
  MdClose,
  MdMessage,
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


/* ---------- Message icon ---------- */
function MessageIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      const count = response.data?.count || 0;
      console.log('📊 Unread count loaded:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    loadUnreadCount();
    
    // Set up polling for unread count (reduced frequency since we have Socket.io)
    const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Socket.io for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    // Import socket service
    const setupSocket = async () => {
      try {
        const socketService = (await import('../../services/socketService')).default;
        
        // Connect to socket service
        socketService.connect();

        // Listen for new messages to update count
        const handleNewMessage = (data) => {
          console.log('📨 New message received, updating unread count:', data);
          // Increment count immediately for better UX
          setUnreadCount(prev => prev + 1);
          // Also fetch from server to ensure accuracy
          loadUnreadCount();
        };

        // Listen for message read events
        const handleMessageRead = (data) => {
          console.log('👁️ Message read, updating unread count:', data);
          // Decrement count immediately for better UX
          setUnreadCount(prev => Math.max(0, prev - 1));
          // Also fetch from server to ensure accuracy
          loadUnreadCount();
        };

        // Listen for conversation updates
        const handleConversationUpdate = () => {
          console.log('💬 Conversation updated, refreshing unread count');
          loadUnreadCount();
        };

        // Listen for message read events (when user opens a message)
        const handleMessageMarkedRead = (data) => {
          console.log('👁️ Message marked as read, updating unread count:', data);
          // Decrement count immediately for better UX
          setUnreadCount(prev => Math.max(0, prev - 1));
          // Also fetch from server to ensure accuracy
          loadUnreadCount();
        };

        // Register listeners
        socketService.on('newMessage', handleNewMessage);
        socketService.on('messageRead', handleMessageRead);
        socketService.on('conversationUpdate', handleConversationUpdate);
        socketService.on('mark_message_read', handleMessageMarkedRead);

        return () => {
          socketService.off('newMessage', handleNewMessage);
          socketService.off('messageRead', handleMessageRead);
          socketService.off('conversationUpdate', handleConversationUpdate);
          socketService.off('mark_message_read', handleMessageMarkedRead);
        };
      } catch (error) {
        console.error('Error setting up socket for message count:', error);
      }
    };

    setupSocket();
    
    // Set up periodic refresh for message count (every 30 seconds)
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        console.log('🔄 Periodic refresh of unread count');
        loadUnreadCount();
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated]);

  console.log('MessageIcon rendering - isAuthenticated:', isAuthenticated, 'unreadCount:', unreadCount);

  return (
    <Link
      to="/messaging"
      className="relative grid h-9 w-9 place-items-center rounded-full bg-white/5 backdrop-blur-md text-white/85 ring-1 ring-white/20 hover:bg-white/10 hover:ring-white/30 transition-all duration-200 group"
      aria-label="Messages"
    >
      <MdMessage className={`text-xl transition-all duration-200 ${
        unreadCount > 0 
          ? 'text-blue-400 group-hover:text-blue-300 animate-pulse' 
          : 'group-hover:text-white'
      }`} />
      
      {/* Enhanced notification bubble with red/white design */}
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 border-2 border-white shadow-lg">
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </span>
      )}
      
      {/* Pulse effect for new messages */}
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-400 animate-ping opacity-75"></span>
      )}
    </Link>
  );
}

/* ---------- Notification bell ---------- */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [items, setItems] = useState([]);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const { isAuthenticated } = useAuth(); // ADD AUTH CHECK

  const loadPending = async () => {
    // SKIP if not authenticated
    if (!isAuthenticated) return;
    
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
    // SKIP if not authenticated
    if (!isAuthenticated) return;
    
    let s;
    (async () => {
      await loadPending();
      try {
        const { io } = await import("socket.io-client");
        const url = (
          import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
          import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
          import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
          (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')
        );
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
  }, [isAuthenticated]);

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
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/5 backdrop-blur-md text-white/85 ring-1 ring-white/20 hover:bg-white/10 hover:ring-white/30 transition-all duration-200"
        aria-label="Notifications"
      >
        <MdNotificationsNone className="text-xl" />
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-semibold text-white shadow-lg">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 z-50 w-[360px] max-h-[70vh] overflow-auto rounded-2xl border border-white/20 bg-[#0b0c0f]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/10"
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
  const loc = useLocation();
  const { logout, isAuthenticated } = useAuth(); // ADD isAuthenticated

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
    <header className="sticky top-0 z-[100] w-full">
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

        {/* right side - Conditional rendering based on auth status */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Show for authenticated users */}
              <MessageIcon />
              <NotificationBell />
              <UserDropdown />
            </>
          ) : (
            <>
              {/* Show for unauthenticated users */}
              <Link
                to="/login"
                className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
