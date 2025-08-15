import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

/* ----------------------- Particle background (repel) ---------------------- */
function ParticleField({
  count = 120,
  maxSpeed = 0.35,
  repelRadius = 120,
  repelStrength = 0.9,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const dpiRef = useRef(1);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const particlesRef = useRef([]);

  const setSize = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { innerWidth: w, innerHeight: h, devicePixelRatio: dpr = 1 } = window;
    dpiRef.current = Math.min(2, dpr);
    c.width = Math.floor(w * dpiRef.current);
    c.height = Math.floor(h * dpiRef.current);
    c.style.width = w + "px";
    c.style.height = h + "px";
  };

  const init = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height } = c;
    const rng = (min, max) => min + Math.random() * (max - min);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: rng(0, width),
      y: rng(0, height),
      vx: rng(-maxSpeed, maxSpeed),
      vy: rng(-maxSpeed, maxSpeed),
      size: rng(1.2, 2.8) * dpiRef.current,
      hue: 200 + Math.floor(Math.random() * 80), // blue-cyan band
    }));
  };

  const tick = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const { width, height } = c;

    ctx.clearRect(0, 0, width, height);

    // soft vignette (very subtle so video is visible)
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      0,
      width * 0.5,
      height * 0.35,
      Math.max(width, height) * 0.8
    );
    grad.addColorStop(0, "rgba(46, 64, 200, 0.08)");
    grad.addColorStop(1, "rgba(11, 12, 15, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const m = mouse.current;

    for (const p of particlesRef.current) {
      if (m.active) {
        const dx = p.x - m.x * dpiRef.current;
        const dy = p.y - m.y * dpiRef.current;
        const dist = Math.hypot(dx, dy);
        if (dist < repelRadius * dpiRef.current && dist > 0.01) {
          const f =
            (repelRadius * dpiRef.current - dist) /
            (repelRadius * dpiRef.current);
          p.vx += (dx / dist) * f * repelStrength * 0.2;
          p.vy += (dy / dist) * f * repelStrength * 0.2;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, 0.55)`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    setSize();
    init();
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      setSize();
      init();
    };
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, maxSpeed, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

/* --------------------------- “Soon” launch pill --------------------------- */
function LaunchPill({ when = "Feb 2025" }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
      <span className="inline-flex items-center rounded-full bg-[#2f64ff] px-2 py-0.5 text-xs font-semibold text-white">
        Soon
      </span>
      <span className="tracking-wide">
        Launch in <span className="text-white/90">{when}</span>
      </span>
    </div>
  );
}

/* ------------------------------ Waitlist page ----------------------------- */
export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const input =
    "h-11 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 " +
    "text-[14px] text-white placeholder:text-white/45 outline-none " +
    "focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Please enter a valid email.");
      return;
    }
    if (!university.trim()) {
      setErr("Please add your university.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/waitlist", { email, university });
      setSubmitted(true);
    } catch (e) {
      setErr(
        e?.response?.data?.message || "Could not join the waitlist. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* --- Background video layer (behind everything) --- */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <video
          src="https://framerusercontent.com/assets/aMPvRVYHFQxBoB0v2qyJln83jI.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.75) saturate(110%)" }}
        />
        {/* gentle vignette for contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_65%)]" />
      </div>

      {/* interactive particles (subtle, above video) */}
      <ParticleField />

      {/* content */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/30 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h1
              className="
                brand-script text-5xl leading-none
                bg-gradient-to-r from-blue-600 to-teal-500
                bg-clip-text text-transparent
              "
            >
              NewRun
            </h1>
            <LaunchPill when="Feb 2025" />
          </div>

          <p className="mb-6 text-[15px] leading-6 text-white/80">
            Be first to try NewRun — housing, essentials, and community
            hand-picked for your campus. Join the waitlist and we’ll notify you
            the moment we open your university.
          </p>

          {submitted ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200">
              You’re on the list! We’ll email you as soon as we go live. 🎉
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                className={input}
                type="email"
                placeholder="University email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <input
                className={input}
                type="text"
                placeholder="University (e.g., Northeastern)"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />

              {err && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2f64ff] text-[15px] font-medium text-white hover:bg-[#2958e3] disabled:opacity-60"
              >
                {loading ? "Joining…" : "Join the waitlist"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-white/60">
            By joining you agree to our{" "}
            <Link to="/terms" className="text-sky-400 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-sky-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </main>
    </div>
  );
}
