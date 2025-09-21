// src/components/Sections/FeatureSplit.jsx
import React, { useState, useEffect } from "react";

/* ---------- Enhanced UI atoms ---------- */
function Pill({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span className={`inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {children}
    </span>
  );
}

function Panel({ className = "", children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`nr-panel hover:border-white/12 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Enhanced Glow Icon tile ---------- */
function GlowIcon({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`nr-iconTile hover:scale-105 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="nr-iconTile-inner">{children}</div>
    </div>
  );
}

/* Inline SVGs to match the reference style exactly */
const Svg = {
  Cap: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 11v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Box: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 7.5V16l9 4.5 9-4.5V7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12v8.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Shield: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 4 6v6c0 4.5 3.4 7.3 8 9 4.6-1.7 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

/* ---------- Horizontal auto-scroll (marquee) ---------- */
function AutoScroller({ items, speed = "26s", gap = 12 }) {
  return (
    <div className="nr-marquee" style={{ ["--nr-marquee-dur"]: speed }}>
      <div className="nr-marquee-track" style={{ ["--nr-gap"]: `${gap}px` }}>
        {items.map((t, i) => (
          <span key={`a-${i}`} className="nr-chip">
            {t}
          </span>
        ))}
        {/* duplicate for seamless loop */}
        {items.map((t, i) => (
          <span key={`b-${i}`} className="nr-chip" aria-hidden>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FeatureSplit() {
  const [isVisible, setIsVisible] = useState(false);
  
  const tags = [
    "Furniture","Electronics","Textbooks","Bikes","Dorm essentials",
    "Mini fridge","Sofa","Desk","Notebooks","Lamp","Laptop","Chair"
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    // ⬅️ local dots for this section
    <section className="nr-dots-fade mx-auto max-w-7xl px-4 pt-10 pb-16">
      {/* Enhanced Section heading */}
      <div className={`mb-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Pill delay={200}>WHY NEWRUN MARKETPLACE</Pill>
        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-[44px] bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          The easiest way to trade on campus.
        </h2>
        <p className="mt-4 text-white/60 max-w-2xl mx-auto">
          Join thousands of students buying and selling campus essentials safely and efficiently.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left — enhanced big story card */}
        <Panel className="relative overflow-hidden lg:col-span-7" delay={400}>
          <div className="mb-6">
            <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-sm">
              🚀 Get Ahead
            </span>
          </div>

          <h3 className="max-w-xl text-[30px] font-extrabold leading-tight sm:text-[34px] bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            Trade safely with real classmates
            <br />— no sketchy meetups.
          </h3>

          <p className="mt-4 max-w-xl text-white/80 text-lg leading-relaxed">
            Sign in with your .edu email, send quick offers, and choose pickup, local delivery, or
            shipping. Your details stay private until access is approved.
          </p>

          {/* Enhanced Auto-scrolling chips row */}
          <div className="mt-6 nr-marquee" style={{"--nr-gap":"12px", "--nr-marquee-dur":"25s"}}>
            <div className="nr-marquee-track">
              {tags.map((t,i) => <span key={`a-${i}`} className="nr-chip hover:bg-white/10 transition-colors duration-200">{t}</span>)}
              {tags.map((t,i) => <span key={`b-${i}`} className="nr-chip hover:bg-white/10 transition-colors duration-200">{t}</span>)}
            </div>
          </div>

          {/* Enhanced CTA */}
          <div className="mt-8">
            <a
              href="#market-grid"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,153,0,.22)] hover:shadow-[0_15px_40px_rgba(255,153,0,.3)] hover:scale-105 transition-all duration-200"
            >
              Explore listings
              <svg width="16" height="16" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform duration-200">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </a>
          </div>

          <div className="nr-ramp" aria-hidden />
        </Panel>

        {/* Right — enhanced three feature tiles */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="flex items-start gap-4 p-5 sm:p-6 hover:bg-white/[0.02] transition-all duration-300" delay={600}>
            <GlowIcon delay={700}><Svg.Cap /></GlowIcon>
            <div>
              <p className="text-[12px] font-semibold tracking-wide text-white/60">VERIFIED STUDENTS</p>
              <h4 className="mt-1 text-[18px] font-semibold text-white">Sign in with .edu</h4>
              <p className="mt-2 text-white/75 leading-relaxed">Buyers and sellers know they're dealing with real classmates.</p>
            </div>
          </Panel>

          <Panel className="flex items-start gap-4 p-5 sm:p-6 hover:bg-white/[0.02] transition-all duration-300" delay={800}>
            <GlowIcon delay={900}><Svg.Box /></GlowIcon>
            <div>
              <p className="text-[12px] font-semibold tracking-wide text-white/60">PICKUP OR DELIVERY</p>
              <h4 className="mt-1 text-[18px] font-semibold text-white">Choose what works</h4>
              <p className="mt-2 text-white/75 leading-relaxed">Pickup, local delivery, or shipping — filter listings by what fits your plan.</p>
            </div>
          </Panel>

          <Panel className="flex items-start gap-4 p-5 sm:p-6 hover:bg-white/[0.02] transition-all duration-300" delay={1000}>
            <GlowIcon delay={1100}><Svg.Shield /></GlowIcon>
            <div>
              <p className="text-[12px] font-semibold tracking-wide text-white/60">SAFE CONTACT SHARING</p>
              <h4 className="mt-1 text-[18px] font-semibold text-white">Privacy by default</h4>
              <p className="mt-2 text-white/75 leading-relaxed">When access is approved, share only what's needed — nothing more.</p>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
