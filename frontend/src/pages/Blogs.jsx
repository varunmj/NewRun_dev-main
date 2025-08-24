// src/pages/Blogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "../styles/newrun-hero.css";

// demo avatars (swap to your real data when wired)
import avatar1 from "../assets/Images/avatars/avatar1.jpg";
import avatar2 from "../assets/Images/avatars/avatar2.jpg";
import avatar3 from "../assets/Images/avatars/avatar3.jpg";

/* ---------- tiny atoms to match Marketplace ---------- */
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
const Arrow = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

/* ---------- categories + seed posts (replace with API later) ---------- */
const CATEGORIES = [
  "All",
  "Campus Life",
  "Finances",
  "Career",
  "Visas",
  "Housing",
  "Well Being",
  "Culture",
  "Communication",
  "City Life",
];

const SEED_POSTS = [
  {
    id: "p1",
    title: "The International Student’s Playbook for Week 1",
    excerpt:
      "From banking and transit cards to campus hacks — a concise, battle-tested checklist for your first seven days.",
    tag: "Campus Life",
    readTime: "7 min",
    author: { name: "Aryaveer Jain", avatar: avatar1 },
    image: null,
    createdAt: "2025-07-02T10:00:00Z",
    popularity: 98,
  },
  {
    id: "p2",
    title: "Housing: What to check before signing a lease",
    excerpt:
      "Walkthrough of key clauses, inspection tips, and how to negotiate move-in dates without losing the deal.",
    tag: "Housing",
    readTime: "6 min",
    author: { name: "Henrik Hansen", avatar: avatar2 },
    image: null,
    createdAt: "2025-07-28T20:00:00Z",
    popularity: 86,
  },
  {
    id: "p3",
    title: "F-1, OPT, and CPT explained like you’re 5",
    excerpt:
      "Simple mental models for visa acronyms, timelines, and what’s allowed at each stage.",
    tag: "Visas",
    readTime: "8 min",
    author: { name: "Yue Chen", avatar: avatar3 },
    image: null,
    createdAt: "2025-08-05T14:00:00Z",
    popularity: 92,
  },
  {
    id: "p4",
    title: "Budgeting 101: stretch your stipend without pain",
    excerpt:
      "A 30-minute setup that saves hundreds: categories, caps, and automation for busy semesters.",
    tag: "Finances",
    readTime: "5 min",
    author: { name: "Aryaveer Jain", avatar: avatar1 },
    image: null,
    createdAt: "2025-08-08T09:00:00Z",
    popularity: 75,
  },
  {
    id: "p5",
    title: "Networking for introverts: one email a week",
    excerpt:
      "A low-stress cadence and message template that turns cold reach-outs into warm chats.",
    tag: "Career",
    readTime: "6 min",
    author: { name: "Henrik Hansen", avatar: avatar2 },
    image: null,
    createdAt: "2025-08-10T11:30:00Z",
    popularity: 80,
  },
  {
    id: "p6",
    title: "Cheap furniture finds near campus",
    excerpt:
      "How to kit a studio for <$300 using campus groups, thrift rotations, and delivery hacks.",
    tag: "City Life",
    readTime: "4 min",
    author: { name: "Yue Chen", avatar: avatar3 },
    image: null,
    createdAt: "2025-08-12T16:00:00Z",
    popularity: 77,
  },
];

const TRENDING_TAGS = [
  "#Housing",
  "#Dorm essentials",
  "#Buy/sell textbooks",
  "#Part-time jobs",
  "#Phone plans",
  "#Banking",
  "#F-1 visa",
  "#I-20",
];

/* ---------- card (with poster-style artwork) ---------- */
function BlogCard({ post }) {
  const artClassFor = (tag) => {
    switch (tag) {
      case "Finances":
        return "nr-art-emerald";
      case "Housing":
        return "nr-art-amber";
      case "Visas":
        return "nr-art-sky";
      case "Career":
        return "nr-art-violet";
      case "City Life":
      case "Culture":
        return "nr-art-rose";
      case "Communication":
        return "nr-art-cyan";
      default:
        return "nr-art-amber";
    }
  };

  return (
    <Panel className="p-0 overflow-hidden group">
      {/* Artwork / image */}
      <div className="relative h-40 sm:h-44 w-full bg-gradient-to-br from-white/5 to-white/0">
        {post.image ? (
          <img src={post.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`nr-card-art ${artClassFor(post.tag)}`} />
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <div className="mb-2">
          <span className="nr-chip text-xs">{post.tag}</span>
        </div>

        <a href={`/blogs/${post.id}`} className="block">
          <h3 className="text-[18px] font-semibold leading-snug hover:underline">{post.title}</h3>
        </a>

        <p className="mt-2 line-clamp-3 text-sm text-white/75">{post.excerpt}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.author?.avatar}
              alt={post.author?.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
            />
            <div className="text-xs text-white/70">
              <div className="font-medium text-white/85">{post.author?.name}</div>
              <div>{post.readTime}</div>
            </div>
          </div>

          <a
            href={`/blogs/${post.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/85 hover:bg-white/10"
          >
            Read <Arrow className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- page ---------- */
export default function Blogs() {
  const [userInfo, setUserInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [visible, setVisible] = useState(6); // “Load more”
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/get-user");
        if (res?.data?.user) setUserInfo(res.data.user);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    })();
  }, [navigate]);

  /* filter + sort */
  const filtered = useMemo(() => {
    let list = SEED_POSTS.slice();

    if (category && category !== "All") {
      list = list.filter((p) => p.tag === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q)
      );
    }
    if (sort === "Newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "Popular") {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
    return list;
  }, [category, search, sort]);

  const visiblePosts = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

  const submitSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} />

      {/* ---------- HERO with dotted background ---------- */}
      <div className="nr-hero-bg">
        <section className="mx-auto max-w-7xl px-4 pt-14 pb-10">
          {/* small pills */}
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Student Q&A
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Verified .edu accounts
            </span>
          </div>

          {/* headline */}
          <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight md:text-6xl">
            You’ve got questions?{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Your campus
            </span>
            <br className="hidden md:block" />
            {" "}has answers.
          </h1>

          {/* search bar */}
          <form
            onSubmit={submitSearch}
            className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/[0.04] p-2"
          >
            <div className="flex items-center gap-2 rounded-xl bg-[#0f1115]/80 px-3 py-3 ring-1 ring-white/10">
              <span className="text-white/40">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Try: "I-20", "cheap desk", "sublet near campus"'
                className="w-full bg-transparent text-sm text-white/85 outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTAs */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#blog-grid"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,153,0,.25)] hover:brightness-110"
            >
              Read guides <span aria-hidden>→</span>
            </a>
            <a
              href="#filters"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              Browse categories
            </a>
          </div>

          {/* trending tags */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {TRENDING_TAGS.map((t) => (
              <span key={t} className="nr-chip text-sm">{t}</span>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- Filter bar ---------- */}
      <section id="filters" className="mx-auto max-w-7xl px-4 pt-8">
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={
                      active
                        ? "nr-chip bg-white text-black border-white/90"
                        : "nr-chip hover:bg-white/10 hover:border-white/20"
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-sm outline-none"
              >
                <option>Newest</option>
                <option>Popular</option>
              </select>
            </div>
          </div>
        </Panel>
      </section>

      {/* ---------- Grid ---------- */}
      <section id="blog-grid" className="mx-auto max-w-7xl px-4 pt-6 pb-14">
        {visiblePosts.length === 0 ? (
          <Panel className="py-12 text-center">
            <h3 className="text-lg font-semibold">No posts found</h3>
            <p className="mt-1 text-white/70">Try a different category or broaden your search.</p>
          </Panel>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePosts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>

            {canLoadMore && (
              <div className="mt-8 grid place-items-center">
                <button
                  onClick={() => setVisible((v) => v + 6)}
                  className="rounded-xl bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <Panel className="p-0 overflow-hidden">
          <div className="p-5 sm:p-6">
            <p className="text-sm text-white/70">NEWSLETTER</p>
            <h5 className="mt-1 text-xl font-semibold">Get the weekly campus brief</h5>
            <p className="mt-1 text-white/70">
              Visa alerts, housing deals, and career openings — straight to your inbox.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-amber-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
              >
                Subscribe
              </button>
            </form>
          </div>
          <div className="relative h-16">
            <div className="nr-ramp absolute inset-0 right-[-8%] bottom-[-40%]" />
          </div>
        </Panel>
      </section>

      <Footer />
    </div>
  );
}
