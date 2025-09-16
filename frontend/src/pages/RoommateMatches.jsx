// src/pages/RoommateMatches.jsx
// Synapse — NewRun's Roommate Matching UI
// (V2.5 — bigger ring + uni logo, no fav/unfav on cards, 3-col grid, Clearbit fix)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  MessageCircle, Info, X, MapPin, GraduationCap,
  ShieldCheck, Clock, Filter, Check, AlertTriangle, Languages, PawPrint, Moon
} from "lucide-react";

/* =====================================================================
   Tunables (easy to tweak later)
   ===================================================================== */
const CARD_RING_SIZE = 56;   // px — match score ring on cards
const CARD_UNI_SIZE  = 56;   // px — university logo circle on cards
const DRAWER_RING    = 56;   // px — ring in drawer header
const DRAWER_UNI     = 48;   // px — uni logo in drawer header

/* =====================================================================
   Utilities
   ===================================================================== */
const cn = (...classes) => classes.filter(Boolean).join(" ");
const clamp01 = (n) => Math.max(0, Math.min(100, Number(n) || 0));

const formatLastActive = (iso) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return "recently"; }
};

// HSL ring: red (0) → green (120)
function scoreToHsl(score = 0) {
  const s = clamp01(score);
  const hue = Math.round((s / 100) * 120);
  return { h: hue, s: 85, l: 50 };
}
const hsl = ({ h, s, l, a = 1 }) => `hsla(${h}, ${s}%, ${l}%, ${a})`;
function scoreRingStyle(score = 0) {
  const col = scoreToHsl(score);
  return {
    backgroundImage: `conic-gradient(${hsl(col)} ${clamp01(score) * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
  };
}
function ScoreRing({ value = 0, size = 56 }) {
  const inset = Math.max(4, Math.round(size * 0.07)); // proportional inner circle
  return (
    <div
      aria-label={`Match score ${value}%`}
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, ...scoreRingStyle(value) }}
      title={`Match: ${value}%`}
    >
      <div className="absolute rounded-full" style={{ inset, background: "#10131a" }}/>
      <div className="absolute inset-0 flex items-center justify-center font-semibold text-white/90"
           style={{ fontSize: Math.max(11, Math.round(size * 0.22)) }}>
        {value}%
      </div>
    </div>
  );
}

/* =====================================================================
   Clearbit university logos
   ===================================================================== */
const UNI_DOMAINS = { "Northern Illinois University": "niu.edu" };
const universityLogoUrl = (name = "") => {
  const n = String(name || "").trim();
  if (!n) return "";
  const domain = UNI_DOMAINS[n] || `${n.toLowerCase().replace(/[^a-z0-9]+/g, "")}.edu`; // fixed stray space
  return `https://logo.clearbit.com/${domain}`;
};

// Circle uni logo (no text)
function UniversityLogoCircle({ university, size = 56 }) {
  if (!university) return null;
  const url = universityLogoUrl(university);
  if (!url) return null;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{ width: size, height: size }}
      title={university}
      aria-label={`University: ${university}`}
    >
      <img
        src={url}
        alt=""
        className="h-full w-full object-contain"
        style={{ padding: Math.round(size * 0.12) }} /* lighter padding so logo appears larger */
        onError={(e)=>{ e.currentTarget.style.display="none"; }}
      />
    </div>
  );
}

/* =====================================================================
   Score rows + collapsible
   ===================================================================== */
function Collapsible({ title, defaultOpen=false, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={()=>setOpen(o=>!o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>{title}</span>
        <span className="text-white/60">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t border-white/10 px-4 py-3">{children}</div>}
    </div>
  );
}
function ScoreRow({ part }) {
  const pct = part.max ? Math.max(0, Math.min(100, (part.got / part.max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{part.label}</span>
        <span className={part.got > 0 ? "text-emerald-300" : "text-white/60"}>+{part.got} / {part.max}</span>
      </div>
      {part.note && <div className="mt-0.5 text-xs text-white/60">{part.note}</div>}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hsl(scoreToHsl(pct)) }} />
      </div>
    </div>
  );
}

// Smart display name per PM rules
const displayName = ({ full = "", firstName = "", lastName = "" } = {}) => {
  const split = (s) => String(s).trim().split(/\s+/).filter(Boolean);
  const fParts = split(firstName);
  const lParts = split(lastName);

  if (fParts.length || lParts.length) {
    if (fParts.length >= 2) return `${fParts[0]} ${fParts[1]}`.trim(); // keep two-word first names
    if (fParts.length === 1 && lParts.length >= 2) return `${fParts[0]} ${lParts[lParts.length - 1]}`.trim();
    const f = fParts[0] || "";
    const l = lParts[lParts.length - 1] || "";
    return `${f} ${l}`.trim() || (full || "").trim();
  }
  const tokens = split(full);
  if (tokens.length <= 2) return tokens.join(" ").trim();
  return `${tokens[0]} ${tokens[1]}`.trim();
};

/* =====================================================================
   Overlap helpers + weights + scoring (unchanged)
   ===================================================================== */
const arr = (x) => (Array.isArray(x) ? x : []);
const intersect = (a = [], b = []) => { const s = new Set(b); return a.filter((v) => s.has(v)); };
const closeCleanliness = (a, b) => {
  const an = Number.isFinite(a) ? Number(a) : 3;
  const bn = Number.isFinite(b) ? Number(b) : 3;
  return Math.abs(an - bn) <= 1;
};
function computeOverlap(candidate, mine) {
  const c = candidate?.synapse || {}; const m = mine || {};
  const overlap = {
    primaryLanguage:
      c?.culture?.primaryLanguage && m?.culture?.primaryLanguage &&
      c.culture.primaryLanguage === m.culture.primaryLanguage,
    otherLanguages: intersect(arr(c?.culture?.otherLanguages), arr(m?.culture?.otherLanguages)),
    commute: intersect(arr(c?.logistics?.commuteMode), arr(m?.logistics?.commuteMode)),
    sleep:
      c?.lifestyle?.sleepPattern && m?.lifestyle?.sleepPattern &&
      c.lifestyle.sleepPattern === m.lifestyle.sleepPattern ? "good" : undefined,
    clean: closeCleanliness(c?.lifestyle?.cleanliness, m?.lifestyle?.cleanliness),
    petsOk: !!(c?.pets?.okWithPets && m?.pets?.okWithPets),
  };
  const reasons = [];
  if (overlap.primaryLanguage) reasons.push({ type: "positive", text: "Same daily language" });
  if (overlap.otherLanguages.length) reasons.push({ type: "positive", text: `Both speak ${overlap.otherLanguages.join(", ")}` });
  if (overlap.commute?.length) reasons.push({ type: "positive", text: `Overlap: ${overlap.commute.join(" / ")}` });
  if (overlap.sleep === "good") reasons.push({ type: "positive", text: "Similar sleep hours" });
  if (overlap.clean) reasons.push({ type: "positive", text: "Clean & tidy" });
  if (candidate?.synapse?.pets?.okWithPets && (mine?.pets?.okWithPets ?? true)) reasons.push({ type: "positive", text: "Pets are okay" });
  return { overlap, reasons };
}
const toReasonObj = (r) => (typeof r === "string" ? { type: "positive", text: r } : r);

const WEIGHTS = {
  langPrimarySame: 25,
  langCrossOK:     15,
  comfortBonus:    10,
  country:         10,
  region:          8,
  city:            6,
  commuteMode:     6,
  sleep:           6,
  cleanlinessNear: 8,
  dietSame:        4,
  smokingSame:     3,
  drinkingSame:    3,
  partiesSame:     3,
  petsCompat:      7,
};

function computeScoreBreakdown(candidateSynapse = {}, me = {}) {
  const c = candidateSynapse || {};
  const m = me || {};
  const parts = [];

  const mCult = m.culture || {};
  const mLog  = m.logistics || {};
  const mLife = m.lifestyle || {};
  const mHab  = m.habits || {};
  const mPets = m.pets || {};

  const cCult = c.culture || {};
  const cLog  = c.logistics || {};
  const cLife = c.lifestyle || {};
  const cHab  = c.habits || {};
  const cPets = c.pets || {};

  const mePrimary = (mCult.primaryLanguage || "").trim();
  const meOthers  = arr(mCult.otherLanguages);
  const meComfort = mCult.languageComfort || "either";
  const meCommute = arr(mLog.commuteMode);
  const meClean   = Number.isFinite(mLife.cleanliness) ? Number(mLife.cleanliness) : null;

  if (mePrimary && cCult.primaryLanguage) {
    const ok = cCult.primaryLanguage === mePrimary;
    parts.push({
      key: "langPrimarySame",
      label: "Same primary language",
      got: ok ? WEIGHTS.langPrimarySame : 0,
      max: WEIGHTS.langPrimarySame,
      note: ok ? `Both ${mePrimary}` : cCult.primaryLanguage ? `You: ${mePrimary || "—"} • Them: ${cCult.primaryLanguage}` : "Candidate missing primary language",
    });
  }

  if (mePrimary) {
    const ok = arr(cCult.otherLanguages).includes(mePrimary);
    parts.push({
      key: "langCrossOK_theirOthers",
      label: "Language cross-match (your primary in their others)",
      got: ok ? WEIGHTS.langCrossOK : 0,
      max: WEIGHTS.langCrossOK,
      note: ok ? `They also speak ${mePrimary}` : "",
    });
  }

  if (cCult.primaryLanguage) {
    const ok = meOthers.includes(cCult.primaryLanguage);
    parts.push({
      key: "langCrossOK_myOthers",
      label: "Language cross-match (their primary in your others)",
      got: ok ? WEIGHTS.langCrossOK : 0,
      max: WEIGHTS.langCrossOK,
      note: ok ? `You also speak ${cCult.primaryLanguage}` : "",
    });
  }

  if (meComfort !== "same") {
    parts.push({
      key: "comfortBonus",
      label: "Language comfort bonus",
      got: WEIGHTS.comfortBonus,
      max: WEIGHTS.comfortBonus,
      note: `Comfort: ${meComfort}`,
    });
  }

  const commuteOverlap = intersect(arr(cLog.commuteMode), meCommute);
  parts.push({
    key: "commuteMode",
    label: "Commute mode overlap",
    got: commuteOverlap.length > 0 ? WEIGHTS.commuteMode : 0,
    max: WEIGHTS.commuteMode,
    note: commuteOverlap.length ? commuteOverlap.join(" / ") : "",
  });

  if (mLife.sleepPattern && cLife.sleepPattern) {
    const ok = mLife.sleepPattern === cLife.sleepPattern;
    parts.push({
      key: "sleep",
      label: "Sleep pattern match",
      got: ok ? WEIGHTS.sleep : 0,
      max: WEIGHTS.sleep,
      note: ok ? mLife.sleepPattern : `You: ${mLife.sleepPattern} • Them: ${cLife.sleepPattern}`,
    });
  }

  if (meClean !== null && Number.isFinite(cLife.cleanliness)) {
    const ok = Math.abs(Number(cLife.cleanliness) - meClean) <= 1;
    parts.push({
      key: "cleanlinessNear",
      label: "Cleanliness within ±1",
      got: ok ? WEIGHTS.cleanlinessNear : 0,
      max: WEIGHTS.cleanlinessNear,
      note: `You ${meClean} • Them ${cLife.cleanliness}`,
    });
  }

  ([
    ["dietSame", "Diet", WEIGHTS.dietSame, "diet"],
    ["smokingSame", "Smoking", WEIGHTS.smokingSame, "smoking"],
    ["drinkingSame", "Drinking", WEIGHTS.drinkingSame, "drinking"],
    ["partiesSame", "Partying", WEIGHTS.partiesSame, "partying"],
  ]).forEach(([key, label, max, field]) => {
    if ((mHab?.[field] ?? "") !== "" && (cHab?.[field] ?? "") !== "") {
      const ok = String(mHab[field]) === String(cHab[field]);
      parts.push({
        key, label: `${label} preference`,
        got: ok ? max : 0,
        max,
        note: ok ? String(mHab[field]) : `You: ${mHab[field]} • Them: ${cHab[field]}`
      });
    }
  });

  const petsOk = (cPets.okWithPets ?? true) === (mPets.okWithPets ?? true);
  parts.push({
    key: "petsCompat",
    label: "Pets compatibility",
    got: petsOk ? WEIGHTS.petsCompat : 0,
    max: WEIGHTS.petsCompat,
    note: petsOk ? "Both OK" : "",
  });

  if (mCult?.home?.country) {
    const ok = (cCult?.home?.country || "") === mCult.home.country;
    parts.push({ key: "country", label: "Same country", got: ok ? WEIGHTS.country : 0, max: WEIGHTS.country, note: ok ? mCult.home.country : "" });
  }
  if (mCult?.home?.region) {
    const ok = (cCult?.home?.region || "") === mCult.home.region;
    parts.push({ key: "region", label: "Same region", got: ok ? WEIGHTS.region : 0, max: WEIGHTS.region, note: ok ? mCult.home.region : "" });
  }
  if (mCult?.home?.city) {
    const ok = (cCult?.home?.city || "") === mCult.home.city;
    parts.push({ key: "city", label: "Same city", got: ok ? WEIGHTS.city : 0, max: WEIGHTS.city, note: ok ? mCult.home.city : "" });
  }

  const total = parts.reduce((s, p) => s + p.got, 0);
  return { total, parts };
}

/* =====================================================================
   API Layer — Synapse endpoints (no mocks)
   ===================================================================== */
async function fetchSynapseData(scope, signal) {
  const [pResp, mResp] = await Promise.all([
    axiosInstance.get("/synapse/preferences", { signal }),
    axiosInstance.get("/synapse/matches", { params: { scope }, signal }),
  ]);
  const prefs = pResp?.data?.preferences || {};
  const raw = mResp?.data?.results || mResp?.data?.matches || [];
  return { prefs, raw };
}

async function postSave(userId) {
  try {
    await axiosInstance.post("/synapse/save", { targetUserId: userId });
    return { ok: true };
  } catch (e) { return { ok: false, error: e?.message }; }
}

async function postHide(userId, reason) {
  try {
    await axiosInstance.post("/synapse/hide", { targetUserId: userId, reason });
    return { ok: true };
  } catch (e) { return { ok: false, error: e?.message }; }
}

/* =====================================================================
   Page Component
   ===================================================================== */
export default function RoommateMatches() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [prefs, setPrefs] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("match"); // match | distance | activity
  const [filters, setFilters] = useState({ pets: "any", sleep: "any", scope: "school" });
  const [drawerMatch, setDrawerMatch] = useState(null);
  const [saved, setSaved] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());

  // Load Synapse prefs + matches
  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setLoading(true); setError("");
      try {
        const { prefs, raw } = await fetchSynapseData(filters.scope, c.signal);
        setPrefs(prefs);
        const normalized = raw.map((r) => {
          const id = r.id || r._id || r.userId || String(Math.random());
          const firstName = r.firstName || "";
          const lastName  = r.lastName  || "";
          const name = r.name || [r.firstName, r.lastName].filter(Boolean).join(" ") || "Roommate";
          const syn = r.synapse || {};
          const { reasons: fallbackReasons } = computeOverlap(r, prefs);
          const matchScore = typeof r.score === "number" ? r.score : (r.matchScore ?? 0);
          const rawReasons = (Array.isArray(r.reasons) && r.reasons.length ? r.reasons : fallbackReasons);
          return {
            userId: id,
            firstName,
            lastName,
            name,
            avatarUrl: r.avatar || r.avatarUrl || "",
            university: r.university || syn?.education?.university || "",
            graduation: r.graduation || syn?.education?.graduation || undefined,
            verified: r.verified || { edu: !!r.university },
            lastActive: r.lastActive || r.updatedAt || undefined,
            distanceMi: typeof r.distanceMiles === "number" ? r.distanceMiles : r.distanceMi,
            budget: r.budget,
            keyTraits: r.keyTraits || [],
            languages: syn?.culture?.otherLanguages || r.languages || [],
            petsOk: !!(syn?.pets?.okWithPets),
            sleepStyle: syn?.lifestyle?.sleepPattern,
            matchScore: clamp01(matchScore),
            reasons: rawReasons.map(toReasonObj),
            synapse: syn,
          };
        });
        setMatches(normalized);
      } catch (e) {
        console.error("GET /synapse data error:", e);
        setError("Could not load matches right now.");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => c.abort();
  }, [filters.scope]);

  // Derived list (query + sort)
  const visibleMatches = useMemo(() => {
    let list = matches.filter(m => !hidden.has(m.userId));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.university||"").toLowerCase().includes(q) ||
        (m.keyTraits||[]).some(t => t.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "distance": list = list.slice().sort((a,b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity)); break;
      case "activity": list = list.slice().sort((a,b) => new Date(b.lastActive||0) - new Date(a.lastActive||0)); break;
      default: list = list.slice().sort((a,b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return list;
  }, [matches, hidden, query, sort]);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-[110rem] px-4 pb-24 pt-10">
        <HeaderBar
          count={visibleMatches.length}
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          filters={filters}
          setFilters={setFilters}
        />

        {error ? (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{error}</div>
        ) : null}

        {loading ? (
          <GridSkeleton />
        ) : (
          <MatchGrid
            items={visibleMatches}
            saved={saved}
            onSaveToggle={async (id) => {
              const next = new Set(saved); next.has(id) ? next.delete(id) : next.add(id); setSaved(next);
              const res = await postSave(id); if (!res.ok) console.warn("Save failed:", res.error);
            }}
            onHide={async (id) => {
              setHidden(prev => new Set(prev).add(id));
              const res = await postHide(id, "not a fit"); if (!res.ok) console.warn("Hide failed:", res.error);
            }}
            onOpen={(m) => setDrawerMatch(m)}
          />
        )}
      </main>

      <MatchDrawer
        match={drawerMatch}
        prefs={prefs}
        onClose={() => setDrawerMatch(null)}
        onStartChat={(id) => navigate(`/messages?to=${id}&ctx=roommate`)}
        onSaveToggle={async (id) => {
          const next = new Set(saved); if (next.has(id)) next.delete(id); else next.add(id); setSaved(next);
          const res = await postSave(id); if (!res.ok) console.warn("Save failed:", res.error);
        }}
        isSaved={(id) => saved.has(id)}
      />
    </div>
  );
}

/* =====================================================================
   Header Bar
   ===================================================================== */
function HeaderBar({ count, query, setQuery, sort, setSort, filters, setFilters }) {
  return (
    <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Top Matches <span className="text-white/60">({count})</span></h1>
        <p className="mt-1 text-sm text-white/60">Transparent reasons • Quick actions • Safer connections</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, trait, university..."
              className="w-72 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder-white/40 focus:bg-white/7"
            />
            <div className="pointer-events-none absolute right-3 top-2.5 text-white/40"><Filter size={16} /></div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
            <button onClick={() => setSort("match")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="match" ? "bg-white/10" : "text-white/70")}>Best Match</button>
            <button onClick={() => setSort("distance")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="distance" ? "bg-white/10" : "text-white/70")}>Distance</button>
            <button onClick={() => setSort("activity")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="activity" ? "bg-white/10" : "text-white/70")}>Active</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FilterChip icon={<PawPrint size={14} />} label="Pets" value={filters.pets}
                      options={[{k:"any", n:"Any"},{k:"ok", n:"OK"},{k:"no", n:"No"}]}
                      onChange={(v)=>setFilters(f=>({...f, pets:v}))} />
          <FilterChip icon={<Moon size={14} />} label="Sleep" value={filters.sleep}
                      options={[{k:"any", n:"Any"},{k:"early", n:"Early"},{k:"mid", n:"Mid"},{k:"late", n:"Late"}]}
                      onChange={(v)=>setFilters(f=>({...f, sleep:v}))} />
          <FilterChip icon={<Info size={14} />} label="Scope" value={filters.scope}
                      options={[{k:"school", n:"School"},{k:"country", n:"Country"},{k:"any", n:"Any"}]}
                      onChange={(v)=>setFilters(f=>({...f, scope:v}))} />
        </div>
      </div>
    </section>
  );
}

function FilterChip({ icon, label, value, options, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
      <span className="flex items-center gap-1 text-white/70">{icon}{label}:</span>
      <div className="flex items-center gap-1">
        {options.map(o => (
          <button key={o.k} onClick={()=>onChange(o.k)} className={cn("rounded-md px-2 py-1", value===o.k ? "bg-white/10" : "text-white/70")}>{o.n}</button>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   Grid + Cards
   ===================================================================== */
function MatchGrid({ items, saved, onSaveToggle, onHide, onOpen }) {
  if (!items.length) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <h3 className="text-lg font-semibold">No matches found</h3>
        <p className="mt-2 max-w-xl text-sm text-white/70">Try adjusting your Synapse preferences or expanding the scope.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(item => (
        <MatchCard key={item.userId}
          item={item}
          saved={saved.has(item.userId)}
          onSaveToggle={()=>onSaveToggle(item.userId)}
          onHide={()=>onHide(item.userId)}
          onOpen={()=>onOpen(item)}
        />
      ))}
    </div>
  );
}

function MatchCard({ item, saved, onSaveToggle, onHide, onOpen }) {
  const nameShort = displayName({
    full: item.name,
    firstName: item.firstName,
    lastName: item.lastName,
  });

  const cover =
    item.avatarUrl ||
    // minimal gradient fallback when no image
    "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='480'><defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'><stop stop-color='#1b2230'/><stop offset='1' stop-color='#0b0f16'/></linearGradient></defs><rect fill='url(#g)' width='800' height='480'/></svg>`
      );

  return (
    <div
      role="button"
      onClick={onOpen}
      className="
        group relative overflow-hidden rounded-3xl
        border border-white/10
        bg-white/[0.035]
        shadow-[0_10px_30px_rgba(0,0,0,0.25)]
        transition-all hover:-translate-y-0.5 hover:bg-white/[0.045]
      "
    >
      {/* Cover */}
      <div
        className="relative h-56 w-full overflow-hidden"
        style={{
          backgroundImage: `url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Top badges: uni + ring */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <UniversityLogoCircle university={item.university} size={56} />
          <ScoreRing value={item.matchScore} size={56} />
        </div>

        {/* Subtle top sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)]" />

        {/* Bottom gradient so text stays readable */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.55))]" />
      </div>

      {/* Glass panel (bottom) */}
      <div
        className="
          mx-4 -mt-8 mb-4 rounded-3xl
          border border-white/10 bg-white/[0.06] backdrop-blur-md
          shadow-[0_8px_24px_rgba(0,0,0,0.25)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pb-4 pt-3">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <p
              className="truncate text-[17px] font-semibold leading-5 tracking-tight"
              title={item.name}
            >
              {nameShort}
            </p>
            {item.verified?.edu && (
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/90"
                title=".edu verified"
                aria-label="Verified .edu"
              >
                <ShieldCheck size={12} className="text-white" />
              </span>
            )}
          </div>

          {/* One slim metadata line */}
          <div className="mt-1 flex items-center gap-2 text-[13px] text-white/65">
            {typeof item.budget === "number" ? (
              <span>
                <span className="text-white/75">Budget:</span> ${item.budget}/mo
              </span>
            ) : (
              <span>
                <span className="text-white/75">Budget:</span> —
              </span>
            )}
            {item.lastActive && (
              <>
                <span className="text-white/25">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} />
                  {formatLastActive(item.lastActive)}
                </span>
              </>
            )}
          </div>

          {/* CTA row */}
          <div className="mt-3 flex items-center gap-2">
            <button
              className="
                inline-flex flex-1 items-center justify-center gap-2
                rounded-full border border-white/12 bg-white/[0.05]
                px-4 py-2 text-[13px] font-medium
                transition hover:bg-white/[0.09]
              "
              onClick={onOpen}
            >
              <Info size={16} /> View details
            </button>

            <button
              className="
                inline-flex flex-1 items-center justify-center gap-2
                rounded-full border border-emerald-500/30
                bg-emerald-500/15 px-4 py-2
                text-[13px] font-semibold text-emerald-300
                transition hover:bg-emerald-500/20
              "
              onClick={() =>
                window.location.assign(`/messages?to=${item.userId}&ctx=roommate`)
              }
            >
              <MessageCircle size={16} /> Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({length:8}).map((_,i)=> (
        <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/10"/>
            <div className="flex-1">
              <div className="h-3 w-40 rounded bg-white/10"/>
              <div className="mt-2 h-3 w-24 rounded bg-white/10"/>
            </div>
          </div>
          <div className="mt-4 h-3 w-24 rounded bg-white/10"/>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-white/10"/>
            <div className="h-6 w-16 rounded-full bg-white/10"/>
            <div className="h-6 w-24 rounded-full bg-white/10"/>
          </div>
          <div className="mt-4 h-10 w-full rounded-xl bg-white/10"/>
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   Drawer (RIGHT) — score breakdown + friendly reasons
   ===================================================================== */
function MatchDrawer({ match, prefs, onClose, onStartChat, onSaveToggle, isSaved }) {
  const panelRef = useRef(null);
  const open = !!match;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div aria-hidden={!open} className={cn("fixed inset-0 z-50 transition", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div onClick={onClose} className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside
        ref={panelRef}
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[700px] overflow-y-auto border-l border-white/10 bg-[#0d1017] shadow-2xl transition-transform will-change-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Match details"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1017]/95 px-5 py-4 backdrop-blur">
          <span className="text-sm font-semibold">Match details</span>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10" aria-label="Close"><X size={16}/></button>
        </div>

        {!match ? <DrawerSkeleton /> :
          <DrawerBody profile={match} prefs={prefs} onStartChat={onStartChat} onSaveToggle={onSaveToggle} isSaved={isSaved} />
        }
      </aside>
    </div>
  );
}

function DrawerSkeleton(){
  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-white/10"/>
        <div>
          <div className="h-4 w-40 rounded bg-white/10"/>
          <div className="mt-2 h-3 w-28 rounded bg-white/10"/>
        </div>
      </div>
      <div className="mt-6 h-24 w-full rounded-xl bg-white/10"/>
      <div className="mt-6 space-y-3">
        {Array.from({length:6}).map((_,i)=>(<div key={i} className="h-6 w-full rounded bg-white/10"/>))}
      </div>
    </div>
  );
}

function DrawerBody({ profile, prefs, onStartChat, onSaveToggle, isSaved }) {
  const saved = isSaved(profile.userId);
  const { parts, total } = React.useMemo(
    () => computeScoreBreakdown(profile.synapse, prefs || {}),
    [profile.synapse, prefs]
  );
  const displayScore = clamp01(profile.matchScore ?? total);
  const reasons = (profile.reasons || []).map(toReasonObj);
  const top3 = reasons.filter(r => r.type !== "negative").slice(0, 3);
  const langs = profile.languages || [];
  const traits = (profile.keyTraits || []).slice(0, 6);
  const topParts = [...parts].sort((a,b) => (b.got - a.got) || (b.max - a.max)).slice(0, 4);

  return (
    <div className="px-5 pb-10 pt-4">
      {/* Header row: avatar + name + uni + ring */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white/10">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{profile.name.slice(0,1)}</div>}
            {profile.verified?.edu && (
              <div className="absolute -right-1 -top-1 rounded-full border border-white/10 bg-emerald-500/90 p-0.5">
                <ShieldCheck size={12} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold leading-tight">{profile.name}</h3>
              <UniversityLogoCircle university={profile.university} size={DRAWER_UNI} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
              {typeof profile.distanceMi === "number" && (<><MapPin size={14}/> {profile.distanceMi.toFixed(1)} mi <span className="text-white/30">•</span></>)}
              {profile.lastActive && (<><Clock size={14}/> {formatLastActive(profile.lastActive)}</>)}
            </div>
          </div>
        </div>

        <ScoreRing value={displayScore} size={DRAWER_RING} />
      </div>

      {/* Quick reasons */}
      {top3.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/70">Why this is a strong match</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm">
            {top3.map((r, i) => (
              <li key={i} className="inline-flex items-start gap-2">
                <Check size={16} className="text-emerald-400" />
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* About + languages/traits */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-wide text-white/80">About {profile.name.split(" ")[0]}</h4>
          {typeof profile.budget === "number" && <span className="text-xs text-white/60">${profile.budget}/mo</span>}
        </div>
        <p className="mt-2 text-sm text-white/80">
          {profile.bio || "They haven’t written a bio yet — start a chat to learn what they’re looking for."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {langs.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
              <Languages size={12}/> {langs.join(", ")}
            </span>
          )}
          {traits.map(t => (
            <span key={t} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">{t}</span>
          ))}
        </div>
      </div>

      {/* Detailed score breakdown */}
      <div className="mt-6">
        <Collapsible title="Detailed score breakdown" defaultOpen={false}>
          <div className="space-y-2">
            {topParts.map(p => <ScoreRow key={p.key} part={p} />)}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-white/70">Show all factors</summary>
              <div className="mt-2 space-y-2">
                {parts.filter(p => !topParts.find(t => t.key === p.key)).map(p => <ScoreRow key={p.key} part={p} />)}
              </div>
            </details>
          </div>
        </Collapsible>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex gap-3">
        <button onClick={()=>onStartChat(profile.userId)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10">Start chat</button>
        <button onClick={()=>onSaveToggle(profile.userId)} className={cn("rounded-xl border border-white/10 px-4 py-3 text-sm font-medium", saved?"bg-pink-500/10 text-pink-300":"bg-white/5 hover:bg-white/10")}>{saved?"Saved":"Save match"}</button>
      </div>
    </div>
  );
}
