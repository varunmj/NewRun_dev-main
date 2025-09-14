// src/pages/RoommateMatches.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  Heart, HeartOff, Languages, MapPin, Route, Moon, Sparkles, Utensils,
  PawPrint, Filter, ChevronRight, X, Info
} from "lucide-react";

/* ================================
   Small style atoms / utilities
   ================================ */

function Panel({ className = "", children, style }) {
  return <div className={`nr-panel ${className}`} style={style}>{children}</div>;
}

function Chip({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
        active
          ? "border-transparent bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_18px_rgba(255,153,0,.25)]"
          : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.12] hover:border-white/90",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/65">
    {children}
  </span>
);

/* Hue from score (0→red, 50→amber, 100→green) */
function hueForScore(score = 0) {
  // clamp 0..100 then map to 0..130 (red to spring green)
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  return Math.round((130 * s) / 100);
}

/* ================================
   Score Ring (with text)
   ================================ */
function ScoreRing({ score = 0, size = 56, thick = 6 }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const hue = hueForScore(pct);
  const bg = `conic-gradient(hsl(${hue} 90% 55%) ${pct * 3.6}deg, rgba(255,255,255,.09) 0)`;
  return (
    <div
      className="grid place-items-center rounded-full relative"
      style={{
        width: size, height: size, background: bg,
        boxShadow: `0 0 0 1px rgba(255,255,255,.08), 0 12px 28px rgba(0,0,0,.45), 0 0 24px hsl(${hue} 90% 50% / .25)`
      }}
      aria-label={`Compatibility ${pct}%`}
      title={`Compatibility ${pct}%`}
    >
      <div
        className="grid place-items-center rounded-full bg-[#0f1115] text-white font-bold"
        style={{ width: size - thick*2, height: size - thick*2 }}
      >
        <span className="text-[13px]">{pct}%</span>
      </div>
    </div>
  );
}

/* ================================
   University Logo (scaled)
   ================================ */
// --- University logo (fixed sizing + fallback) ---
const UNI_DOMAINS = {
  "Northern Illinois University": "niu.edu",
  // add more canonical names here as you go
};

function universityLogoUrl(name = "") {
  const n = String(name || "").trim();
  if (!n) return "";
  const domain = UNI_DOMAINS[n] || `${n.toLowerCase().replace(/[^a-z0-9]+/g, "")}.edu`;
  return `https://logo.clearbit.com/${domain}`;
}

function initialsFrom(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const picks = parts.length >= 2 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] || ""];
  return picks.join("").toUpperCase();
}

function UniversityMark({ name, size = 56 }) {
  const url = universityLogoUrl(name);
  const init = initialsFrom(name);

  return (
    <div
      className="relative rounded-full overflow-hidden ring-1 ring-white/15 bg-white/5 shrink-0"
      style={{ width: size, height: size, minWidth: size }}
      title={name || "University"}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-contain p-1.5"
          onError={(e) => {
            // hide broken image; show lettermark fallback beneath
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      {/* lettermark fallback sits underneath / or shows when image hidden */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="rounded-full grid place-items-center"
          style={{
            width: size, height: size,
            background: "linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
          }}
        >
          <span className="text-[12px] font-bold text-white/80">{init}</span>
        </div>
      </div>
    </div>
  );
}

/* ================================
   Badges (tiny)
   ================================ */
const Badge = ({ Icon, children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2 py-[3px] text-[11px] text-white/80">
    <Icon className="h-3.5 w-3.5" /> {children}
  </span>
);

/* ==========================================
   A single match card (revamped & consistent)
   ========================================== */
function MatchCard({ m, shortlisted, onToggleShortlist, onOpen }) {
  const score = m.score ?? 0;
  const hue = hueForScore(score);

  // limit chips to 2 for calmness
  const chips = [];
  if (m.overlap?.primaryLanguage) chips.push(<Badge Icon={Languages} key="lang">Same daily language</Badge>);
  if (m.overlap?.sleep === "good") chips.push(<Badge Icon={Moon} key="sleep">Sleep match</Badge>);
  if (m.overlap?.clean) chips.push(<Badge Icon={Sparkles} key="clean">Clean & tidy</Badge>);
  if (m.overlap?.commute?.length > 0) chips.push(<Badge Icon={Route} key="commute">{m.overlap.commute.join(" / ")}</Badge>);
  if (m.overlap?.diet) chips.push(<Badge Icon={Utensils} key="diet">{m.overlap.diet}</Badge>);
  if (m.overlap?.petsOk) chips.push(<Badge Icon={PawPrint} key="pets">Pets OK</Badge>);
  const primaryChips = chips.slice(0, 2);
  const extraCount = Math.max(0, chips.length - primaryChips.length);

  const showCity = !!m.homeCity;
  const showDist = typeof m.distanceMiles === "number" && !Number.isNaN(m.distanceMiles);

  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-[#0f1115]/80 ring-1 ring-white/8 transition-transform"
      style={{
        minHeight: 280,
        boxShadow: `0 0 0 1px rgba(255,255,255,.04),
                    0 14px 36px rgba(0,0,0,.55),
                    0 0 50px hsl(${hue} 90% 55% / .08)` // soft colored aura
      }}
    >
      {/* HEADER */}
      <div className="p-5 md:p-6 flex items-start gap-4">
        {/* Avatar */}
        <img
          src={m.avatar || "/avatar-fallback.png"}
          alt=""
          className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
        />

        <div className="min-w-0 grow">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-white text-[18px] md:text-[20px] truncate">
              {m.name}
            </div>
            {/* University mark same scale as score ring */}
            <UniversityMark name={m.university} size={56} />
          </div>

          {(showCity || showDist) && (
            <div className="mt-1 flex items-center gap-2 text-[12px] text-white/60">
              {showCity && (
                <>
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{m.homeCity}</span>
                </>
              )}
              {showCity && showDist && <span>•</span>}
              {showDist && <span>{m.distanceMiles.toFixed(1)} mi</span>}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <ScoreRing score={score} size={64} thick={7} />
        </div>
      </div>

      {/* CHIPS */}
      <div className="px-5 md:px-6 pb-2 flex flex-wrap gap-2">
        {primaryChips}
        {extraCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-[6px] text-[12px] text-white/75">
            +{extraCount} more
          </span>
        )}
      </div>

      {/* REASONS (clamped for uniform height) */}
      {m.reasons?.length ? (
        <div
          className="px-5 md:px-6 pb-3 text-[13px] text-white/70"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
          title={m.reasons.join(" • ")}
        >
          {m.reasons.join(" • ")}
        </div>
      ) : null}

      {/* ACTIONS */}
      <div className="px-5 md:px-6 pb-5 flex items-center justify-between">
        <button
          onClick={() => onToggleShortlist(m.id)}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
            shortlisted
              ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
              : "border-white/12 bg-white/[0.06] text-white/80 hover:bg-white/[0.12]",
          ].join(" ")}
          title={shortlisted ? "Remove from shortlist" : "Shortlist"}
        >
          {shortlisted ? (
            <Heart className="h-4 w-4 fill-amber-300 text-amber-300" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          {shortlisted ? "Shortlisted" : "Shortlist"}
        </button>

        <button
          onClick={() => onOpen(m)}
          className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-3.5 py-2 text-[13px] font-semibold shadow-[0_6px_18px_rgba(255,255,255,.08)] hover:shadow-[0_10px_24px_rgba(255,255,255,.12)]"
        >
          View details <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ==============
   Drawer (same)
   ============== */
function Drawer({ open, onClose, match }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-[#0b0d12] ring-1 ring-white/10 p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold">Match details</div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 p-1 text-white/75 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* header */}
        <div className="flex items-center gap-3 mb-3">
          <img src={match?.avatar || "/avatar-fallback.png"} alt="" className="h-12 w-12 rounded-full ring-1 ring-white/10" />
          <div className="min-w-0 grow">
            <div className="text-white font-semibold truncate">{match?.name}</div>
            {(match?.homeCity || typeof match?.distanceMiles === "number") && (
              <div className="text-[12px] text-white/60 flex items-center gap-2">
                {match?.homeCity && (<><MapPin className="h-3.5 w-3.5" /><span className="truncate">{match.homeCity}</span></>)}
                {match?.homeCity && typeof match?.distanceMiles === "number" && <span>•</span>}
                {typeof match?.distanceMiles === "number" && <span>{match.distanceMiles.toFixed(1)} mi</span>}
              </div>
            )}
          </div>
          <div className="ml-auto"><ScoreRing score={match?.score ?? 0} size={60} /></div>
        </div>

        {/* overlap grid */}
        <Panel className="p-4">
          <div className="text-[13px] font-semibold mb-2">Compatibility highlights</div>
          <div className="flex flex-wrap gap-2">
            {match?.overlap?.primaryLanguage && <Badge Icon={Languages}>Same daily language</Badge>}
            {match?.overlap?.otherLanguages?.length > 0 && (
              <Badge Icon={Languages}>Other: {(match.overlap.otherLanguages || []).join(", ")}</Badge>
            )}
            {match?.overlap?.commute?.length > 0 && <Badge Icon={Route}>{match.overlap.commute.join(" / ")}</Badge>}
            {match?.overlap?.sleep && <Badge Icon={Moon}>{match.overlap.sleep === "good" ? "Sleep match" : "Different hours"}</Badge>}
            {match?.overlap?.clean && <Badge Icon={Sparkles}>Clean & tidy</Badge>}
            {match?.overlap?.diet && <Badge Icon={Utensils}>{match.overlap.diet}</Badge>}
            {match?.overlap?.petsOk && <Badge Icon={PawPrint}>Pets OK</Badge>}
          </div>

          {match?.reasons?.length ? (
            <ul className="mt-3 list-disc pl-5 text-[13px] text-white/75">
              {match.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

/* ==========
   The page
   ========== */
export default function RoommateMatches() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [shortlist, setShortlist] = useState(() =>
    new Set(JSON.parse(localStorage.getItem("nr.shortlist") || "[]"))
  );
  const [drawer, setDrawer] = useState({ open: false, match: null });

  // filters/sort
  const [filters, setFilters] = useState({
    sameLanguage: false,
    petsOk: false,
    dealbreakersClear: true,
    sort: "score", // 'score' | 'distance'
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/synapse/matches");
        const list = Array.isArray(r?.data?.results)
          ? r.data.results.map(reshapeFromAPI)
          : makeMockMatches();
        setMatches(list);
      } catch (e) {
        console.warn("GET /synapse/matches failed — using mock", e?.message);
        setMatches(makeMockMatches());
        setError("No matches yet. Adjust your preferences or check back soon.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...matches];
    if (filters.sameLanguage) arr = arr.filter(m => m.overlap?.primaryLanguage);
    if (filters.petsOk)       arr = arr.filter(m => m.overlap?.petsOk);
    if (filters.dealbreakersClear) arr = arr.filter(m => !m.flags?.hasDealbreakerConflict);
    if (filters.sort === "distance") arr.sort((a,b) => (a.distanceMiles ?? 9e9) - (b.distanceMiles ?? 9e9));
    else arr.sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
    return arr;
  }, [matches, filters]);

  const toggleShortlist = (id) => {
    const next = new Set(shortlist);
    if (next.has(id)) next.delete(id); else next.add(id);
    setShortlist(next);
    localStorage.setItem("nr.shortlist", JSON.stringify([...next]));
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar />

      {/* header */}
      <section className="nr-hero-bg" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="mx-auto max-w-6xl text-center text-[40px] md:text-[54px] font-black tracking-tight leading-[1.05]">
            Your roommate <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">matches</span>
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-[11px]">
            <Pill>Powered by Synapse</Pill>
            <Pill>Private • You control what’s shared</Pill>
          </div>
          {!loading && (
            <div className="mt-2 text-center text-[11px] text-white/60">
              {filtered.length} match{filtered.length === 1 ? "" : "es"} shown
            </div>
          )}
        </div>
      </section>

      {/* body */}
      <section className="mx-auto max-w-[96rem] px-3 sm:px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 mt-4">
          {/* Filters panel */}
          <aside className="hidden lg:block">
            <Panel className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <div className="text-[14px] font-semibold">Filters</div>
              </div>
              <div className="flex flex-col gap-2">
                <Chip active={filters.sameLanguage} onClick={() => setFilters(f => ({ ...f, sameLanguage: !f.sameLanguage }))}>
                  <Languages className="h-4 w-4" /> Same daily language
                </Chip>
                <Chip active={filters.petsOk} onClick={() => setFilters(f => ({ ...f, petsOk: !f.petsOk }))}>
                  <PawPrint className="h-4 w-4" /> Pets OK
                </Chip>
                <Chip active={filters.dealbreakersClear} onClick={() => setFilters(f => ({ ...f, dealbreakersClear: !f.dealbreakersClear }))}>
                  No deal-breaker conflicts
                </Chip>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[12px] font-semibold text-white/70">Sort by</div>
                <div className="flex flex-wrap gap-2">
                  <Chip active={filters.sort === "score"} onClick={() => setFilters(f => ({ ...f, sort: "score" }))}>Best match</Chip>
                  <Chip active={filters.sort === "distance"} onClick={() => setFilters(f => ({ ...f, sort: "distance" }))}>Nearest</Chip>
                </div>
              </div>
            </Panel>

            <Panel className="p-4 mt-4">
              <div className="text-[13px] font-semibold mb-2">Shortlist</div>
              {[...shortlist].length === 0 ? (
                <div className="text-[12px] text-white/60">Use “Shortlist” on a card to pin favorites here.</div>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {filtered.filter(m => shortlist.has(m.id)).map(m => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{m.name}</span>
                      <button
                        onClick={() => toggleShortlist(m.id)}
                        className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/65 hover:bg-white/10"
                        title="Remove"
                      >
                        <HeartOff className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </aside>

          {/* Results */}
          <div>
            {error ? (
              <div className="mb-3 text-[12px] text-amber-300 inline-flex items-center gap-2">
                <Info className="h-4 w-4" /> {error}
              </div>
            ) : null}

            <Panel className="p-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-3xl bg-white/[0.04] h-[280px] animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-white/70">
                  No matches with the current filters.{" "}
                  <a href="/roommate" className="underline">Adjust Synapse preferences</a>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  style={{ gridAutoRows: "minmax(280px, auto)" }}
                >
                  {filtered.map((m) => (
                    <MatchCard
                      key={m.id}
                      m={m}
                      shortlisted={shortlist.has(m.id)}
                      onToggleShortlist={toggleShortlist}
                      onOpen={(mm) => setDrawer({ open: true, match: mm })}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </section>

      <Drawer
        open={drawer.open}
        match={drawer.match}
        onClose={() => setDrawer({ open: false, match: null })}
      />
    </div>
  );
}

/* ==========================
   Helpers & mock (fallback)
   ========================== */

// shape rows from /synapse/matches
function reshapeFromAPI(r = {}) {
  return {
    id: r.id || r._id || String(Math.random()),
    name: r.name || "Student",
    avatar: r.avatar || "",
    university: r.university || "",
    homeCity: r.synapse?.culture?.home?.city || "",

    // Optional distance (hide if missing)
    distanceMiles: typeof r.distanceMiles === "number" ? r.distanceMiles : undefined,

    score: Number(r.score || 0),

    overlap: {
      primaryLanguage: Boolean(
        r.synapse?.culture?.primaryLanguage &&
        r.synapse?.culture?.primaryLanguage === r.synapse?.culture?.primaryLanguage // existence check
      ),
      otherLanguages: r.synapse?.culture?.otherLanguages || [],
      commute: r.synapse?.logistics?.commuteMode || [],
      petsOk: r.synapse?.pets?.okWithPets ?? false,
      sleep: r.synapse?.lifestyle?.sleepPattern ? "good" : undefined, // placeholder highlight
      clean: typeof r.synapse?.lifestyle?.cleanliness === "number" ? true : false,
      diet: r.synapse?.habits?.diet || "",
    },

    reasons: buildReasons(r),
    flags: { hasDealbreakerConflict: false },
  };
}

function buildReasons(r) {
  const reasons = [];
  if (r.synapse?.culture?.primaryLanguage) reasons.push("Same daily language");
  const comm = r.synapse?.logistics?.commuteMode || [];
  if (comm.length) reasons.push(`Overlap: ${comm.join(" / ")}`);
  if (r.synapse?.lifestyle?.sleepPattern) reasons.push("Similar sleep hours");
  if (typeof r.synapse?.lifestyle?.cleanliness === "number") reasons.push("Clean & tidy");
  if (r.synapse?.habits?.diet) reasons.push(r.synapse.habits.diet === "veg" ? "Veg-friendly" : r.synapse.habits.diet);
  return reasons;
}

/* Mock only if API fails (kept tiny) */
function makeMockMatches() {
  return [
    {
      id: "u_1",
      name: "Aarav K.",
      avatar: "/avatars/aarav.jpg",
      university: "Northern Illinois University",
      homeCity: "DeKalb",
      distanceMiles: 0.6,
      score: 92,
      overlap: {
        primaryLanguage: true,
        otherLanguages: ["en", "hi"],
        commute: ["walk", "bus"],
        petsOk: true,
        sleep: "good",
        clean: true,
        diet: "Veg-friendly"
      },
      reasons: ["Same daily language", "Both walk/bus to campus", "Cleanliness expectations match"]
    }
  ];
}
