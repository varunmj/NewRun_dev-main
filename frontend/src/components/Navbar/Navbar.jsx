import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const NAV = [
  { to: "/welcome", label: "Chat with Us" },
  { to: "/blogs", label: "Blogs" },
  { to: "/community", label: "Community" },
  { to: "/marketplace", label: "Marketplace" },
];

function cx(...a) { return a.filter(Boolean).join(" "); }

export default function Navbar() {
  const [showBar, setShowBar] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // auth signal (swap to your context if you have one)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, [token]);
  const initials = useMemo(() => {
    if (!user) return "NR";
    const a = [user.firstName, user.lastName].filter(Boolean).map(s => s[0]?.toUpperCase());
    return (a[0] || "U") + (a[1] || "");
  }, [user]);

  // scroll behaviour
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setShowBar(y < last || y < 10);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close menus on route change
  useEffect(() => { setMobile(false); setMenuOpen(false); }, [location.pathname]);

  // brand
  const Brand = (
    <Link to="/home" className="flex items-center gap-2">
      <span className="text-2xl font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">New</span>
        <span className="text-white">Run</span>
      </span>
    </Link>
  );

  return (
    <>
      <header className={cx(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300",
        showBar ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="mx-auto mt-2 w-[min(100%-16px,1200px)]">
          {/* glass card */}
          <div className={cx(
            "relative rounded-2xl px-4 py-2 md:px-6",
            "backdrop-blur-md bg-white/[0.035] ring-1 ring-white/10",
            "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.55)]",
            scrolled ? "translate-y-0" : ""
          )}>
            <nav className="flex h-14 items-center justify-between">
              {Brand}

              {/* segmented nav (desktop) */}
              <div className="relative hidden items-center md:flex">
                <div className="relative flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/10">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cx(
                          "relative group rounded-lg px-3 py-1.5 text-sm font-medium",
                          "text-white/70 hover:text-white transition-colors"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <span className="relative z-10">
                          {item.label}
                          {isActive && (
                            <motion.span
                              layoutId="nav-pill"
                              className="absolute inset-[-6px] -z-10 rounded-lg bg-white/[0.06] ring-1 ring-white/10"
                              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
                            />
                          )}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* right cluster */}
              <div className="flex items-center gap-2">
                {!token ? (
                  <>
                    <button onClick={() => navigate("/login")} className="btn-ghost hidden md:inline-flex">Log in</button>
                    <button onClick={() => navigate("/signup")} className="btn-metal hidden md:inline-flex">Sign up</button>
                  </>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(v => !v)}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white
                                 ring-1 ring-white/15 bg-white/10 hover:bg-white/15 transition"
                      aria-haspopup="menu"
                    >
                      {/* gradient ring */}
                      <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(at_50%_50%,#67e8f9_0deg,#38bdf8_120deg,#a78bfa_240deg,#67e8f9_360deg)] opacity-[0.25]" />
                      <span className="relative">{initials}</span>
                    </button>

                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0F1115] p-1 shadow-xl"
                        >
                          <button onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5">Dashboard</button>
                          <button onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5">Profile</button>
                          <button onClick={() => { localStorage.removeItem("token"); setMenuOpen(false); navigate("/login"); }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-white/5">Log out</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* mobile burger */}
                <button
                  onClick={() => setMobile(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/90 ring-1 ring-white/15 transition hover:bg-white/5 md:hidden"
                  aria-label="Open menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* mobile sheet */}
      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-[60] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-white/10 bg-[#0F1115] p-4"
            >
              <div className="flex items-center justify-between">
                {Brand}
                <button onClick={() => setMobile(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/90 ring-1 ring-white/15 transition hover:bg-white/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <ul className="mt-6 space-y-1">
                {NAV.map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      onClick={() => setMobile(false)}
                      className={({ isActive }) =>
                        cx(
                          "block rounded-xl px-3 py-3 text-base font-medium",
                          isActive ? "bg-white/5 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      {i.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-white/10 pt-6">
                {!token ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setMobile(false); navigate("/login"); }} className="btn-ghost w-full">Log in</button>
                    <button onClick={() => { setMobile(false); navigate("/signup"); }} className="btn-metal w-full">Sign up</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => { setMobile(false); navigate("/dashboard"); }} className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-white/90 hover:bg-white/10">Dashboard</button>
                    <button onClick={() => { setMobile(false); navigate("/profile"); }} className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-white/90 hover:bg-white/10">Profile</button>
                    <button onClick={() => { localStorage.removeItem("token"); setMobile(false); navigate("/login"); }} className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-rose-300 hover:bg-white/10">Log out</button>
                  </div>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* spacer */}
      <div className="h-16" />
    </>
  );
}
