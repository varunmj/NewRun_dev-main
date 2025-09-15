// src/pages/RoommateMatches.jsx
// Synapse — NewRun's Roommate Matching UI (V1)
// -----------------------------------------------------------------------------
// What you get in this file:
// 1) Top header with sort + filter chips and results count
// 2) Responsive match grid with elegant cards (match ring, key chips, actions)
// 3) Left-slide Drawer (reusing the Solve Threads UX pattern) with a dossier
// 4) Compatibility bars + reason lines + actions (Message / Save / Hide)
// 5) Skeletons, optimistic actions, keyboard a11y, preserved scroll on close
// 6) Clean data interfaces + API stub you can wire to your backend
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  Heart,
  HeartOff,
  MessageCircle,
  Info,
  SlidersHorizontal,
  X,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Clock,
  Filter,
  ArrowUpDown,
  Check,
  AlertTriangle,
  Languages,
  PawPrint,
  Moon,
} from "lucide-react";

/* =====================================================================
   Types (TS-like JSDoc for clarity)
   ===================================================================== */
/** @typedef {{
 *   userId: string,
 *   name: string,
 *   avatarUrl?: string,
 *   university: string,
 *   graduation: string, // e.g., "May 2026"
 *   verified: { edu: boolean, phone?: boolean, id?: boolean },
 *   lastActive: string, // ISO
 *   distanceMi: number,
 *   budget: number,
 *   keyTraits: string[], // e.g., ["Clean", "Quiet after 10pm", "No Smoking"]
 *   languages?: string[],
 *   petsOk?: boolean,
 *   sleepStyle?: "early" | "mid" | "late",
 *   matchScore: number,
 *   dimensionScores: Record<string, number>,
 *   reasons: { dimension: string, type: "positive"|"neutral"|"negative", text: string }[],
 *   hardStops: string[],
 * }} MatchItem
 */

/* =====================================================================
   Utilities
   ===================================================================== */
const cn = (...classes) => classes.filter(Boolean).join(" ");
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

const scoreRingStyle = (score = 0) => ({
  backgroundImage: `conic-gradient(currentColor ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
});

/* =====================================================================
   API Layer — replace mock with real endpoints when ready
   ===================================================================== */
async function fetchMatches(signal) {
  try {
    const res = await axiosInstance.get("/roommates/matches", { signal });
    return res.data?.matches || [];
  } catch (err) {
    console.warn("Using mock matches due to API error:", err?.message);
    return MOCK_MATCHES;
  }
}

async function fetchProfile(userId, signal) {
  try {
    const res = await axiosInstance.get(`/roommates/profile/${userId}`, { signal });
    return res.data;
  } catch (err) {
    console.warn("Using mock profile due to API error:", err?.message);
    return MOCK_PROFILE(userId);
  }
}

async function postSave(userId) {
  try {
    await axiosInstance.post("/roommates/save", { targetUserId: userId });
    return { ok: true };
  } catch (e) { return { ok: false, error: e?.message }; }
}

async function postHide(userId, reason) {
  try {
    await axiosInstance.post("/roommates/hide", { targetUserId: userId, reason });
    return { ok: true };
  } catch (e) { return { ok: false, error: e?.message }; }
}

/* =====================================================================
   Page Component
   ===================================================================== */
export default function RoommateMatches() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(/** @type {MatchItem[]} */([]));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("match"); // match | distance | activity
  const [filters, setFilters] = useState({ pets: "any", sleep: "any" });
  const [drawerUserId, setDrawerUserId] = useState(null);
  const [saved, setSaved] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setLoading(true);
      const data = await fetchMatches(c.signal);
      setMatches(data);
      setLoading(false);
    })();
    return () => c.abort();
  }, []);

  const visibleMatches = useMemo(() => {
    let list = matches.filter(m => !hidden.has(m.userId));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.university.toLowerCase().includes(q) ||
        (m.keyTraits||[]).some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.pets !== "any") {
      const want = filters.pets === "ok";
      list = list.filter(m => (m.petsOk ?? false) === want);
    }
    if (filters.sleep !== "any") {
      list = list.filter(m => (m.sleepStyle||"mid") === filters.sleep);
    }
    switch (sort) {
      case "distance": list = list.slice().sort((a,b) => a.distanceMi - b.distanceMi); break;
      case "activity": list = list.slice().sort((a,b) => new Date(b.lastActive)-new Date(a.lastActive)); break;
      default: list = list.slice().sort((a,b) => b.matchScore - a.matchScore);
    }
    return list;
  }, [matches, hidden, query, filters, sort]);

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

        {loading ? (
          <GridSkeleton />
        ) : (
          <MatchGrid
            items={visibleMatches}
            saved={saved}
            onSaveToggle={(id) => setSaved(prev => {
              const p = new Set(prev); p.has(id) ? p.delete(id) : p.add(id); return p;
            })}
            onHide={async (id) => {
              setHidden(prev => new Set(prev).add(id));
              const res = await postHide(id, "not a fit");
              if (!res.ok) console.warn("Hide failed:", res.error);
            }}
            onOpen={(id) => setDrawerUserId(id)}
          />
        )}
      </main>

      <MatchDrawer
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
        onStartChat={(id) => navigate(`/messages?to=${id}&ctx=roommate`)}
        onSaveToggle={async (id) => {
          const next = new Set(saved);
          if (next.has(id)) next.delete(id); else next.add(id);
          setSaved(next);
          const res = await postSave(id);
          if (!res.ok) console.warn("Save failed:", res.error);
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
            <button
              onClick={() => setSort("match")}
              className={cn("rounded-lg px-2 py-1 text-xs", sort==="match" ? "bg-white/10" : "text-white/70")}
            >
              Best Match
            </button>
            <button
              onClick={() => setSort("distance")}
              className={cn("rounded-lg px-2 py-1 text-xs", sort==="distance" ? "bg:white/10 bg-white/10" : "text-white/70")}
            >
              Distance
            </button>
            <button
              onClick={() => setSort("activity")}
              className={cn("rounded-lg px-2 py-1 text-xs", sort==="activity" ? "bg-white/10" : "text-white/70")}
            >
              Active
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FilterChip
            icon={<PawPrint size={14} />}
            label="Pets"
            value={filters.pets}
            options={[{k:"any", n:"Any"},{k:"ok", n:"OK"},{k:"no", n:"No"}]}
            onChange={(v)=>setFilters(f=>({...f, pets:v}))}
          />
          <FilterChip
            icon={<Moon size={14} />}
            label="Sleep"
            value={filters.sleep}
            options={[{k:"any", n:"Any"},{k:"early", n:"Early"},{k:"mid", n:"Mid"},{k:"late", n:"Late"}]}
            onChange={(v)=>setFilters(f=>({...f, sleep:v}))}
          />
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
          <button
            key={o.k}
            onClick={()=>onChange(o.k)}
            className={cn("rounded-md px-2 py-1", value===o.k ? "bg-white/10" : "text-white/70")}
          >{o.n}</button>
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
        <h3 className="text-lg font-semibold">No strong matches (yet)</h3>
        <p className="mt-2 max-w-xl text-sm text-white/70">Try relaxing one or two preferences, or check back later as more students join. Your preferences are always in your control.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(item => (
        <MatchCard
          key={item.userId}
          item={item}
          saved={saved.has(item.userId)}
          onSaveToggle={()=>onSaveToggle(item.userId)}
          onHide={()=>onHide(item.userId)}
          onOpen={()=>onOpen(item.userId)}
        />
      ))}
    </div>
  );
}

function MatchCard({ item, saved, onSaveToggle, onHide, onOpen }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-transform hover:translate-y-[-2px] hover:bg-white/[0.06]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{item.name.slice(0,1)}</div>
            )}
            {item.verified?.edu && (
              <div className="absolute -right-1 -top-1 rounded-full border border-white/10 bg-emerald-500/90 p-0.5"><ShieldCheck size={12} /></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold leading-tight">{item.name}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">{item.university}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
              <GraduationCap size={14} /> {item.graduation}
              <span className="mx-1">•</span>
              <Clock size={14} /> {formatLastActive(item.lastActive)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSaveToggle} className={cn("rounded-lg border border-white/10 px-2 py-1 text-xs", saved && "bg-pink-500/10 text-pink-300")}>{saved ? <Heart size={14}/> : <Heart size={14} />}</button>
          <button onClick={onHide} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70"><HeartOff size={14}/></button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <div className="flex items-center gap-1"><MapPin size={14}/> {item.distanceMi.toFixed(1)} mi</div>
          <span className="text-white/30">•</span>
          <div>${item.budget}/mo</div>
        </div>
        <div
          aria-label={`Match score ${item.matchScore}%`}
          className="relative h-10 w-10 shrink-0 rounded-full text-emerald-400"
          style={scoreRingStyle(item.matchScore)}
        >
          <div className="absolute inset-[3px] rounded-full bg-[#10131a]"/>
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/90">{item.matchScore}%</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(item.keyTraits||[]).slice(0,5).map(t => (
          <span key={t} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">{t}</span>
        ))}
        {item.languages?.length ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70"><Languages size={12}/> {item.languages.join(", ")}</span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={onOpen} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10">
          <Info size={16}/> View details
        </button>
        <button onClick={onOpen} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10">
          <MessageCircle size={16}/> Message
        </button>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
   Drawer (Left Slide) — keyboard accessible
   ===================================================================== */
function MatchDrawer({ userId, onClose, onStartChat, onSaveToggle, isSaved }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const c = new AbortController();
    (async () => {
      setLoading(true);
      const p = await fetchProfile(userId, c.signal);
      setProfile(p);
      setLoading(false);
    })();
    return () => c.abort();
  }, [userId]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = !!userId;

  return (
    <div aria-hidden={!open} className={cn(
      "fixed inset-0 z-50 transition",
      open ? "pointer-events-auto" : "pointer-events-none"
    )}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={cn(
          "absolute left-0 top-0 h-full w-full max-w-[700px] overflow-y-auto border-r border-white/10 bg-[#0d1017] shadow-2xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Match details"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1017]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Match details</span>
            {profile?.hardStops?.length ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-red-500/10 px-2 py-1 text-[11px] text-red-300"><AlertTriangle size={12}/> {profile.hardStops.length} blocker{profile.hardStops.length>1?'s':''}</span>
            ) : null}
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10" aria-label="Close"><X size={16}/></button>
        </div>

        {loading || !profile ? (
          <DrawerSkeleton />
        ) : (
          <DrawerBody profile={profile} onStartChat={onStartChat} onSaveToggle={onSaveToggle} isSaved={isSaved} />
        )}
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

function DrawerBody({ profile, onStartChat, onSaveToggle, isSaved }) {
  const saved = isSaved(profile.userId);
  return (
    <div className="px-5 pb-10 pt-4">
      {/* Summary */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white/10">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{profile.name.slice(0,1)}</div>
            )}
            {profile.verified?.edu && (
              <div className="absolute -right-1 -top-1 rounded-full border border-white/10 bg-emerald-500/90 p-0.5"><ShieldCheck size={12} /></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold leading-tight">{profile.name}</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">{profile.university}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
              <MapPin size={14}/> {profile.distanceMi.toFixed(1)} mi <span className="text-white/30">•</span>
              <Clock size={14}/> {formatLastActive(profile.lastActive)} <span className="text-white/30">•</span>
              <span>${profile.budget}/mo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>onSaveToggle(profile.userId)} className={cn("rounded-xl border border-white/10 px-3 py-2 text-sm", saved?"bg-pink-500/10 text-pink-300":"bg-white/5 hover:bg-white/10")}>{saved?"Saved":"Save"}</button>
          <button onClick={()=>onStartChat(profile.userId)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Message</button>
        </div>
      </div>

      {/* Match score + reasons */}
      <div className="mt-6 grid grid-cols-[auto,1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="relative h-16 w-16 shrink-0 rounded-full text-emerald-400" style={scoreRingStyle(profile.matchScore)}>
          <div className="absolute inset-[4px] rounded-full bg-[#10131a]"/>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/90">{profile.matchScore}%</div>
        </div>
        <div>
          <p className="text-sm text-white/70">Top reasons you match</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm">
            {profile.reasons.filter(r=>r.type!=='negative').slice(0,3).map((r,i)=> (
              <li key={i} className="inline-flex items-start gap-2"><Check size={16} className="text-emerald-400"/> <span>{r.text}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Compatibility blocks */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Compatibility by dimension</h4>
        <div className="space-y-3">
          {Object.entries(profile.dimensionScores).map(([k,v]) => (
            <DimensionBar key={k} label={labelMap[k]||k} value={v} />
          ))}
        </div>
      </div>

      {/* Reasons list with negatives surfaced */}
      {profile.reasons?.length ? (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Why this fit</h4>
          <ul className="space-y-2">
            {profile.reasons.map((r,i)=> (
              <li key={i} className={cn("rounded-xl border px-3 py-2 text-sm", r.type==='negative'?"border-red-500/30 bg-red-500/5":"border-white/10 bg-white/3 bg-white/[0.03]")}>{r.text}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* About + traits */}
      <div className="mt-6">
        <h4 className="mb-2 text-sm font-semibold tracking-wide text-white/80">About {profile.name.split(" ")[0]}</h4>
        <p className="text-sm text-white/80">{profile.bio || "No bio provided yet."}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(profile.keyTraits||[]).map(t => (
            <span key={t} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">{t}</span>
          ))}
          {profile.languages?.length ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70"><Languages size={12}/> {profile.languages.join(", ")}</span>
          ) : null}
        </div>
      </div>

      {/* Safety */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        <p className="mb-2 font-medium text-white/80">Safety & trust</p>
        <ul className="space-y-1 text-white/70">
          <li>• .edu verification {profile.verified?.edu ? "enabled" : "pending"}</li>
          <li>• Profile completeness: {profile.profileCompleteness ?? 70}%</li>
          <li>• Reports: {profile.reports ?? 0}</li>
        </ul>
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={()=>onStartChat(profile.userId)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10">Start chat</button>
        <button onClick={()=>onSaveToggle(profile.userId)} className={cn("rounded-xl border border-white/10 px-4 py-3 text-sm font-medium", saved?"bg-pink-500/10 text-pink-300":"bg-white/5 hover:bg-white/10")}>{saved?"Saved":"Save match"}</button>
      </div>
    </div>
  );
}

const labelMap = {
  budget: "Budget",
  distance: "Distance / Commute",
  lifestyle: "Lifestyle (sleep, noise, cleanliness)",
  utilities: "Utilities / Chores",
  guests: "Guests / Visits",
  pets: "Pets",
  languages: "Languages",
  schedule: "Schedule alignment",
};

function DimensionBar({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/60" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

/* =====================================================================
   Mock Data — safe to delete once API is wired
   ===================================================================== */
const NOW = new Date();
const ago = (m) => new Date(NOW.getTime() - m*60000).toISOString();

const MOCK_MATCHES = [
  {
    userId: "u_42",
    name: "Anita Kumar",
    university: "NIU",
    graduation: "May 2026",
    verified: { edu: true, phone: true },
    lastActive: ago(33),
    distanceMi: 0.6,
    budget: 800,
    keyTraits: ["Clean", "Quiet nights", "Early riser", "No smoking"],
    languages: ["English", "Tamil"],
    petsOk: true,
    sleepStyle: "early",
    matchScore: 86,
    dimensionScores: { budget:95, distance:80, lifestyle:90, utilities:70, guests:85, pets:100, languages:90, schedule:75 },
    reasons: [
      { dimension: "budget", type: "positive", text: "Both $700–900; they’re $800." },
      { dimension: "lifestyle", type: "positive", text: "Both clean & low noise after 10pm." },
      { dimension: "schedule", type: "neutral", text: "You’re early; they’re mid-morning—some overlap." },
      { dimension: "distance", type: "positive", text: "≤0.6 mi to campus; you asked ≤1.0 mi." }
    ],
    hardStops: [],
  },
  {
    userId: "u_77",
    name: "Miguel Santos",
    university: "NIU",
    graduation: "Dec 2025",
    verified: { edu: true },
    lastActive: ago(180),
    distanceMi: 1.2,
    budget: 750,
    keyTraits: ["Gym mornings", "Meal prep", "No pets", "Weekend hikes"],
    languages: ["English", "Spanish"],
    petsOk: false,
    sleepStyle: "mid",
    matchScore: 79,
    dimensionScores: { budget:90, distance:70, lifestyle:82, utilities:65, guests:80, pets:70, languages:85, schedule:78 },
    reasons: [
      { dimension: "budget", type: "positive", text: "Your budget overlaps perfectly." },
      { dimension: "pets", type: "positive", text: "Neither prefers pets in the unit." },
      { dimension: "distance", type: "neutral", text: "Slightly above your ideal distance." },
    ],
    hardStops: [],
  },
  {
    userId: "u_11",
    name: "Grace Lee",
    university: "NIU",
    graduation: "May 2027",
    verified: { edu: false },
    lastActive: ago(5),
    distanceMi: 0.3,
    budget: 900,
    keyTraits: ["Very clean", "Likes quiet study", "Occasional guests"],
    languages: ["English", "Korean"],
    petsOk: true,
    sleepStyle: "late",
    matchScore: 72,
    dimensionScores: { budget:80, distance:92, lifestyle:70, utilities:60, guests:65, pets:100, languages:75, schedule:60 },
    reasons: [
      { dimension: "distance", type: "positive", text: "Super close to campus (0.3 mi)." },
      { dimension: "lifestyle", type: "neutral", text: "Prefers late nights; you indicated quiet after 11pm." },
    ],
    hardStops: [],
  }
];

function MOCK_PROFILE(userId){
  const base = MOCK_MATCHES.find(x=>x.userId===userId) || MOCK_MATCHES[0];
  return {
    ...base,
    bio: "Computer Science sophomore who cooks twice a week, hits the gym most mornings, and values a calm home after 10pm. Looking for a roommate who keeps shared spaces tidy and communicates clearly about chores and bills.",
    profileCompleteness: 86,
    reports: 0,
  };
}
