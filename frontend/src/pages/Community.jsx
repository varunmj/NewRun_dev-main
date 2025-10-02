// src/pages/Community.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "../styles/newrun-hero.css";
import CommunityService from "../services/CommunityService";
import { timeAgo } from "../utils/timeUtils";
import { getUniversityBranding, getContrastTextColor } from "../utils/universityBranding";

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
  
  // Ask Question Modal State
  const [showAskModal, setShowAskModal] = useState(false);
  const [askForm, setAskForm] = useState({
    title: '',
    body: '',
    tags: '',
    school: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/get-user");
        if (r?.data?.user) {
          setUserInfo(r.data.user);
          // Get university branding from backend (cached)
          if (r.data.user.university) {
            const branding = await getUniversityBranding(r.data.user.university, axiosInstance);
            setUniversityBranding(branding);
          }
        }
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
  const [latest, setLatest] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('my'); // 'my' or 'all'
  const [universityBranding, setUniversityBranding] = useState(null);

  const scrollToAsk = () => askRef.current?.scrollIntoView({ behavior: "smooth" });

  const onSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    setSearching(true);
    try {
      const params = {};
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      if (!q) {
        const items = await CommunityService.list(params);
        setLatest(Array.isArray(items) ? items : []);
        setShowAll(false);
        setActiveFilter('');
        return;
      }
      params.q = q;
      const items = await CommunityService.list(params);
      console.log('Search results for:', q, items);
      setLatest(Array.isArray(items) ? items : []);
      setShowAll(true); // Show all results when searching
      setActiveFilter(q);
    } catch (error) {
      console.error('Search error:', error);
      setLatest([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearch('');
    setActiveFilter('');
    setSearching(true);
    try {
      const params = {};
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      const items = await CommunityService.list(params);
      setLatest(Array.isArray(items) ? items : []);
      setShowAll(false);
    } catch (error) {
      console.error('Error clearing search:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    // Reload when university filter changes
    loadThreads();
  }, [universityFilter]);

  const loadThreads = async () => {
    setSearching(true);
    try {
      const params = {};
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      const items = await CommunityService.list(params);
      setLatest(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error loading threads:', error);
      setLatest([]);
    } finally {
      setSearching(false);
    }
  };

  const openAskModal = () => {
    setShowAskModal(true);
    setAskForm({
      title: '',
      body: '',
      tags: '',
      school: userInfo?.university || ''
    });
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!askForm.title.trim() || askForm.title.trim().length < 6) {
      alert('Title must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const tagsArray = askForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const newThread = await CommunityService.addThread({
        title: askForm.title.trim(),
        body: askForm.body.trim(),
        tags: tagsArray,
        school: askForm.school.trim() || userInfo?.university || 'Unknown',
        author: userInfo?.username || '@anonymous'
      });
      setShowAskModal(false);
      // Refresh the list
      const items = await CommunityService.list();
      setLatest(Array.isArray(items) ? items : []);
      // Navigate to the new thread
      if (newThread?._id || newThread?.id) {
        navigate(`/community/thread/${newThread._id || newThread.id}`);
      }
    } catch (error) {
      console.error('Error posting question:', error);
      alert('Failed to post question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagClick = async (tag) => {
    setSearch(tag);
    setSearching(true);
    setActiveFilter(tag);
    try {
      const params = { q: tag };
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      const items = await CommunityService.list(params);
      console.log('Tag filter results for:', tag, items);
      setLatest(Array.isArray(items) ? items : []);
      setShowAll(true);
      // Scroll to results
      setTimeout(() => {
        const resultsSection = document.querySelector('.grid.gap-5');
        if (resultsSection) {
          const offset = resultsSection.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Tag filter error:', error);
      setLatest([]);
    } finally {
      setSearching(false);
    }
  };

  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    try {
      const res = await axiosInstance.post('/newsletter', { email: newsEmail, source: 'community' });
      if (res.data.success) {
        setNewsStatus('success');
        setNewsEmail('');
        setTimeout(() => setNewsStatus(''), 3000);
      }
    } catch (err) {
      setNewsStatus('error');
      setTimeout(() => setNewsStatus(''), 3000);
    }
  };

  const loadMoreThreads = async () => {
    setLoadingMore(true);
    try {
      const items = await CommunityService.list({ limit: 100 });
      setLatest(Array.isArray(items) ? items : []);
      setShowAll(true);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} />

      {/* ---------------- Hero ---------------- */}
      <section className="nr-hero-bg">
        <div className="mx-auto max-w-6xl px-4 pt-16 md:pt-20 pb-10">
          {/* University Filter Toggle */}
          {userInfo?.university && universityBranding && (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] p-1 backdrop-blur-sm">
                <button
                  onClick={() => setUniversityFilter('my')}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
                    universityFilter === 'my'
                      ? 'shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={universityFilter === 'my' ? {
                    backgroundColor: universityBranding.primary,
                    color: universityBranding.textColor || getContrastTextColor(universityBranding.primary)
                  } : {}}
                >
                  {universityBranding.logoUrl && (
                    <img 
                      src={universityBranding.logoUrl} 
                      alt={universityBranding.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/30 shadow-md -ml-1"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  {universityBranding.name}
                </button>
                <button
                  onClick={() => setUniversityFilter('all')}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    universityFilter === 'all'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  All Universities
                </button>
              </div>
            </div>
          )}

          {/* tiny badges */}
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Student Q&A
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Verified .edu accounts
            </span>
            {universityFilter === 'my' && userInfo?.university && universityBranding && (
              <span 
                className="rounded-full border px-2.5 py-1 font-semibold text-xs"
                style={{
                  borderColor: `${universityBranding.primary}50`,
                  backgroundColor: `${universityBranding.primary}20`,
                  color: universityBranding.primary
                }}
              >
                Filtered: {universityBranding.name}
              </span>
            )}
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
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-white/50 hover:text-white/80 text-lg leading-none"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searching}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
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
                  <span key={`t1-${i}`} className="nr-chip cursor-pointer hover:bg-white/15" onClick={() => handleTagClick(t)}>#{t}</span>
                ))}
                {trending.map((t, i) => (
                  <span key={`t2-${i}`} className="nr-chip cursor-pointer hover:bg-white/15" aria-hidden onClick={() => handleTagClick(t)}>#{t}</span>
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
                  onClick={openAskModal}
                  value="Type your question… (AI can help you draft a clear post)"
                  className="w-full bg-transparent text-sm text-white/70 outline-none cursor-pointer"
                />
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85">
                  Draft with AI
                </span>
                <button 
                  onClick={openAskModal}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110"
                >
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
            <h3 className="text-2xl font-bold tracking-tight">
              {activeFilter ? (
                <>
                  Search results for <span className="text-amber-400">"{activeFilter}"</span>
                </>
              ) : (
                'Latest questions'
              )}
            </h3>
            <p className="text-white/60">
              {activeFilter ? (
                <>
                  {latest.length} {latest.length === 1 ? 'result' : 'results'} found
                  <button 
                    onClick={clearSearch}
                    className="ml-2 text-amber-400 hover:text-amber-300 underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                'Fresh threads from your campus and nearby schools.'
              )}
            </p>
          </div>
          {!showAll && !activeFilter && latest.length >= 6 && (
            <button
              onClick={loadMoreThreads}
              disabled={loadingMore}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'View all'}
            </button>
          )}
        </div>

        {searching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-amber-400"></div>
              <p className="mt-3 text-white/60">Searching...</p>
            </div>
          </div>
        ) : latest.length === 0 ? (
          <div className="nr-panel text-center py-12">
            <p className="text-white/60">
              {activeFilter ? (
                <>
                  No questions found matching <span className="text-amber-400">"{activeFilter}"</span>
                  <br />
                  <button 
                    onClick={clearSearch}
                    className="mt-3 text-amber-400 hover:text-amber-300 underline"
                  >
                    Clear search and show all questions
                  </button>
                </>
              ) : (
                'No questions yet. Be the first to ask!'
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((q) => (
            <a key={q._id || q.id} href={`/community/thread/${q._id || q.id}`} className="nr-panel hover:bg-white/[0.08] transition block">
              <div className="mb-2 flex items-center gap-2 text-[12px]">
                <span className={`rounded-full px-2 py-0.5 ${q.solved ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/75"}`}>
                  {q.solved ? "Solved" : "Open"}
                </span>
                <span className="text-white/50">·</span>
                <span className="text-white/70">{q.school}</span>
              </div>
              <h4 className="text-[17px] font-semibold leading-snug">{q.title}</h4>
              <p className="mt-1 text-sm text-white/60">
                Asked by {q.authorName || q.author}
                <span className="mx-1.5">·</span>
                {timeAgo(q.createdAt || q.updatedAt)}
              </p>

              <div className="mt-4 flex items-center justify-between text-[12px] text-white/60">
                <span>▲ {q.votes} votes</span>
                <span>💬 {q.answers?.length || 0} answers</span>
              </div>
            </a>
          ))}
          </div>
        )}
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
                <a 
                  href="/marketplace?category=furniture&maxPrice=300"
                  className="block"
                >
                  Furnish a room under $300 → opens Marketplace: Furniture
                </a>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <a 
                  href="/marketplace?category=dorm-essentials"
                  className="block"
                >
                  Move-in day toolkit → links to Dorm essentials
                </a>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <a 
                  href="/marketplace/sell"
                  className="block"
                >
                  Sell everything in 48h → prefilled sell flow
                </a>
              </li>
              <li 
                onClick={() => {
                  setSearch('visa I-20');
                  handleTagClick('visa');
                }}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 cursor-pointer"
              >
                Visa docs checklist (I-20 / F-1) → community thread template
              </li>
            </ul>
          </Panel>

          <Panel className="flex flex-col justify-center gap-3 lg:col-span-5">
            <h3 className="text-xl font-semibold">Get the weekly campus digest</h3>
            <p className="text-white/70">
              5 solved threads + 3 hot listings — straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="Email address"
                required
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400"
              />
              <button 
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
              >
                {newsStatus === 'success' ? '✓ Subscribed' : 'Subscribe'}
              </button>
            </form>
            {newsStatus === 'error' && (
              <p className="text-xs text-red-400">Failed to subscribe. Please try again.</p>
            )}
          </Panel>
        </div>
      </section>

      <Footer />

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="nr-panel max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold">Ask the Community</h2>
              <button 
                onClick={() => setShowAskModal(false)}
                className="text-white/60 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Question Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={askForm.title}
                  onChange={(e) => setAskForm({ ...askForm, title: e.target.value })}
                  placeholder="e.g., How do I apply for an I-20 at NIU?"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-white/50">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Details (optional)
                </label>
                <textarea
                  value={askForm.body}
                  onChange={(e) => setAskForm({ ...askForm, body: e.target.value })}
                  placeholder="Add more context, what you've tried, specific requirements, etc."
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={askForm.tags}
                  onChange={(e) => setAskForm({ ...askForm, tags: e.target.value })}
                  placeholder="visa, I-20, housing (comma-separated)"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-white/50">Separate tags with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={askForm.school}
                  onChange={(e) => setAskForm({ ...askForm, school: e.target.value })}
                  placeholder="e.g., NIU, UIC"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
