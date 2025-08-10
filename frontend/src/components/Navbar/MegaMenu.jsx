import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// simple outside-click hook
function useDismiss(ref, onClose) {
  useEffect(() => {
    const h = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [ref, onClose]);
}

export default function MegaMenu({ label = "Products", items = [] }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useDismiss(box, () => setOpen(false));

  // small “hover intent” so it doesn’t flicker
  let hoverTimer = null;
  const openSoon = () => (hoverTimer = setTimeout(() => setOpen(true), 60));
  const closeSoon = () => (hoverTimer = setTimeout(() => setOpen(false), 120));

  return (
    <div
      ref={box}
      className="relative"
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <svg
          className="transition group-aria-expanded:rotate-180"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* light scrim to catch clicks */}
            <motion.div
              className="fixed inset-0 z-[-1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute left-0 top-full z-50 mt-2 w-[720px] max-w-[min(92vw,720px)]
                         rounded-2xl border border-white/10 bg-[#0F1115]/95 backdrop-blur-md
                         shadow-2xl ring-1 ring-black/5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                {items.map((it) => (
                  <Link
                    key={it.title}
                    to={it.to || "#"}
                    className="group flex gap-3 rounded-xl p-3 transition hover:bg-white/5"
                    onClick={() => setOpen(false)}
                  >
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                                    bg-white/5 ring-1 ring-white/10">
                      {typeof it.icon === "function" ? <it.icon size={18} /> : it.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{it.title}</div>
                      <div className="text-sm text-white/60">{it.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
