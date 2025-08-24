// src/pages/Community.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "../styles/newrun-hero.css";

/* ------------------------------------------------------------------ */
/* Tiny UI atoms that match your Marketplace look                      */
/* ------------------------------------------------------------------ */
function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70">
      {children}
    </span>
  );
}
function Panel({ className = "", children }) {
  return <div className={`nr-panel ${className}`}>{children}</div>;
}
function GlowIcon({ children }) {
  return (
    <div className="nr-iconTile">
      <div className="nr-iconTile-inner">{children}</div>
    </div>
  );
}

/* Inline SVGs (no external deps) */
const Svg = {
  Cap: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 11v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Clock: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Shield: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 4 6v6c0 4.5 3.4 7.3 8 9 4.6-1.7 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function Community() {
  const [userInfo, setUserInfo] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const askRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/get-user");
        if (r?.data?.user) setUserInfo(r.data.user);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    })();
  }, [navigate]);

  /* Mock data (swap to API later) */
  const trending = [
    "F-1 visa", "I-20", "Affordable housing", "Dorm essentials",
    "Buy/sell textbooks", "Part-time jobs", "Phone plans", "Banking"
  ];
  const latest = [
    {
      title: "I just got accepted! How do I apply for an I-20?",
      author: "@aryarox", school: "NIU", answers: 6, votes: 18, solved: true,
    },
    {
      title: "How does my tourist visa affect F-1?",
      author: "@hesen", school: "UIC", answers: 4, votes: 12, solved: false,
    },
    {
      title: "Tips for finding affordable housing near campus?",
      author: "@yuechen", school: "NIU", answers: 7, votes: 25, solved: true,
    },
    {
      title: "Best places to buy used desks?",
      author: "@sam", school: "NIU", answers: 3, votes: 8, solved: false,
    },
    {
      title: "Selling everything after graduation — advice?",
      author: "@nora", school: "UIC", answers: 5, votes: 15, solved: true,
    },
    {
      title: "How to ship stuff cheaply within the US?",
      author: "@anil", school: "NIU", answers: 2, votes: 6, solved: false,
    },
  ];

  const scrollToAsk = () => askRef.current?.scrollIntoView({ behavior: "smooth" });

  const onSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    // placeholder: route to /community?q=... if you add a route
    // navigate(`/community?q=${encodeURIComponent(search.trim())}`);
    window.alert(`Search coming soon: "${search.trim()}"`);
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} />

      {/* ---------------- Hero ---------------- */}
      <section className="nr-hero-bg">
        <div className="mx-auto max-w-6xl px-4 pt-16 md:pt-20 pb-10">
          {/* tiny badges */}
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Student Q&A
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Verified .edu accounts
            </span>
          </div>

          <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight md:text-6xl">
            You’ve got questions?{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Your campus has answers.
            </span>
          </h1>

          {/* search */}
          <form onSubmit={onSearch} className="mx-auto mt-8 w-full max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5/50 p-3 backdrop-blur-md">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101215] px-3 py-2.5">
                <span className="text-white/50">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Try: "I-20", "cheap desk", "sublet near campus"'
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* CTA row */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={scrollToAsk}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,153,0,.25)] hover:bg-orange-400"
            >
              Ask a question <Svg.ArrowRight />
            </button>
            <a
              href="#guides"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              Browse guides
            </a>
          </div>

          {/* trending chips (marquee) */}
          <div className="mx-auto mt-7 max-w-3xl">
            <div className="nr-marquee" style={{ "--nr-gap": "10px", "--nr-marquee-dur": "26s" }}>
              <div className="nr-marquee-track">
                {trending.map((t, i) => (
                  <span key={`t1-${i}`} className="nr-chip">#{t}</span>
                ))}
                {trending.map((t, i) => (
                  <span key={`t2-${i}`} className="nr-chip" aria-hidden>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Split: Ask panel + feature tiles ---------------- */}
      <section ref={askRef} className="mx-auto max-w-7xl px-4 pt-6 pb-12">
        <div className="mb-6 text-center">
          <Pill>WHY NEWRUN COMMUNITY</Pill>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-[40px]">
            The fastest way to get real answers from classmates.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left: Ask panel */}
          <Panel className="relative overflow-hidden lg:col-span-7">
            <div className="mb-4">
              <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] text-white/70">
                Get help fast
              </span>
            </div>

            <h3 className="max-w-xl text-[28px] font-extrabold leading-tight sm:text-[32px]">
              Ask the community — and get a trustworthy answer.
            </h3>

            <p className="mt-3 max-w-xl text-white/80">
              Post your question with tags (e.g. <em>#visa</em>, <em>#housing</em>, <em>#dorm</em>). 
              Verified students respond quickly, and the accepted answer is pinned on top.
            </p>

            {/* ask bar */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#0f1115]/80 px-3 py-3 ring-1 ring-white/10">
                <span className="text-white/40">＋</span>
                <input
                  readOnly
                  value="Type your question… (AI can help you draft a clear post)"
                  className="w-full bg-transparent text-sm text-white/70 outline-none"
                />
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85">
                  Draft with AI
                </span>
                <button className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110">
                  Ask
                </button>
              </div>
            </div>

            {/* soft corner glow */}
            <div className="nr-ramp" aria-hidden />
          </Panel>

          {/* Right: three tiles */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Panel className="flex items-start gap-4 p-5 sm:p-6">
              <GlowIcon><Svg.Cap /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">VERIFIED STUDENTS</p>
                <h4 className="mt-1 text-[18px] font-semibold">Sign in with .edu</h4>
                <p className="mt-1 text-white/75">
                  Buyers and sellers know they’re dealing with real classmates.
                </p>
              </div>
            </Panel>

            <Panel className="flex items-start gap-4 p-5 sm:p-6">
              <GlowIcon><Svg.Clock /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">FAST ANSWERS</p>
                <h4 className="mt-1 text-[18px] font-semibold">Most questions solved in a day</h4>
                <p className="mt-1 text-white/75">
                  Accepted answers float to the top so you can act quickly.
                </p>
              </div>
            </Panel>

            <Panel className="flex items-start gap-4 p-5 sm:p-6">
              <GlowIcon><Svg.Shield /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">SAFE & PRIVATE</p>
                <h4 className="mt-1 text-[18px] font-semibold">Share only what’s needed</h4>
                <p className="mt-1 text-white/75">
                  Post anonymously if you prefer; moderators keep things clean.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* ---------------- Latest questions ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Latest questions</h3>
            <p className="text-white/60">Fresh threads from your campus and nearby schools.</p>
          </div>
          <a
            href="#"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
          >
            View all
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((q, i) => (
            <article key={i} className="nr-panel hover:bg-white/[0.08] transition">
              <div className="mb-2 flex items-center gap-2 text-[12px]">
                <span className={`rounded-full px-2 py-0.5 ${q.solved ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/75"}`}>
                  {q.solved ? "Solved" : "Open"}
                </span>
                <span className="text-white/50">·</span>
                <span className="text-white/70">{q.school}</span>
              </div>
              <h4 className="text-[17px] font-semibold leading-snug">{q.title}</h4>
              <p className="mt-1 text-sm text-white/60">Asked by {q.author}</p>

              <div className="mt-4 flex items-center justify-between text-[12px] text-white/60">
                <span>▲ {q.votes} votes</span>
                <span>💬 {q.answers} answers</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- Guides / Newsletter ---------------- */}
      <section id="guides" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-7">
            <div className="mb-3">
              <Pill>PLAYBOOKS</Pill>
            </div>
            <h3 className="text-xl font-semibold">Quick guides to save time & money</h3>
            <ul className="mt-3 grid gap-2 text-white/80 sm:grid-cols-2">
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                Furnish a room under $300 → opens Marketplace: Furniture
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                Move-in day toolkit → links to Dorm essentials
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                Sell everything in 48h → prefilled sell flow
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                Visa docs checklist (I-20 / F-1) → community thread template
              </li>
            </ul>
          </Panel>

          <Panel className="flex flex-col justify-center gap-3 lg:col-span-5">
            <h3 className="text-xl font-semibold">Get the weekly campus digest</h3>
            <p className="text-white/70">
              5 solved threads + 3 hot listings — straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400"
              />
              <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
                Subscribe
              </button>
            </div>
          </Panel>
        </div>
      </section>

      <Footer />
    </div>
  );
}
