// src/pages/RoommateMatches.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  Heart, HeartOff, Languages, MapPin, Route, Moon, Sparkles, Utensils,
  PawPrint, Filter, ChevronRight, X, ShieldAlert
} from "lucide-react";

/* ------------------------ tiny atoms ------------------------ */
function Panel({ className = "", children }) {
  return <div className={`nr-panel ${className}`}>{children}</div>;
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

/* --------------------- color/score helpers ------------------ */
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * t;
function heatColor(pct) {
  // 0→red, 50→amber, 100→emerald
  const p = clamp(pct) / 100;
  const r = Math.round(lerp(244, 16, Math.min(1, p * 2)));    // red → green
  const g = Math.round(lerp(63, 185, Math.min(1, p)));         // red → green
  const b = Math.round(lerp(94, 129, Math.min(1, p)));         // red → teal-ish
  return `rgb(${r}, ${g}, ${b})`;
}

/* ------------------------ score ring (SVG) ------------------ */
function ScoreRing({ score = 0, size = 64 }) {
  const pct = clamp(Math.round(Number(score) || 0));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const color = heatColor(pct);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      title={`Compatibility ${pct}%`}
      aria-label={`Compatibility ${pct}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms ease, stroke 300ms ease" }}
          filter="url(#glow)"
        />
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.65" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-[12px] font-extrabold text-white">{pct}%</div>
      </div>
    </div>
  );
}

/* ------------------------ badges ---------------------------- */
const Badge = ({ Icon, children }) => (
  <span className="sheen inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-[5px] text-[11px] text-white/85">
    <Icon className="h-3.5 w-3.5" /> {children}
  </span>
);

/* ------------------------ data helpers ---------------------- */
const intersect = (a = [], b = []) => a.filter((x) => b.includes(x));
const dietLabel = (k) =>
  k === "veg" ? "Vegetarian" : k === "vegan" ? "Vegan" : k === "nonveg" ? "Non-veg" : null;

function computeFallbackScore(overlap, hasDealbreakerConflict) {
  let s = 0;
  if (overlap.primaryLanguage) s += 30;
  if (overlap.otherLanguages?.length) s += 10;
  if (overlap.commute?.length) s += 15;
  if (overlap.sleep === "good") s += 10;
  if (overlap.clean) s += 15;
  if (overlap.diet) s += 10;
  if (overlap.petsOk) s += 10;
  if (hasDealbreakerConflict) s -= 40;
  return clamp(s);
}

function toUiMatch(apiRow = {}, me = {}) {
  const syn   = apiRow.synapse || {};
  const c     = syn.culture   || {};
  const l     = syn.logistics || {};
  const life  = syn.lifestyle || {};
  const h     = syn.habits    || {};
  const pets  = syn.pets      || {};

  const mc    = me.culture      || {};
  const ml    = me.lifestyle    || {};
  const mh    = me.habits       || {};
  const mlog  = me.logistics    || {};
  const mdb   = me.dealbreakers || [];

  const overlap = {
    primaryLanguage: !!(c.primaryLanguage && c.primaryLanguage === mc.primaryLanguage),
    otherLanguages: intersect(c.otherLanguages || [], mc.otherLanguages || []),
    commute: intersect(l.commuteMode || [], mlog.commuteMode || []),
    petsOk: !(mdb.includes("no_pets") && !!pets.hasPets),
    sleep:
      ml.sleepPattern && life.sleepPattern
        ? ml.sleepPattern === life.sleepPattern
          ? "good"
          : "neutral"
        : undefined,
    clean:
      Number.isFinite(ml.cleanliness) && Number.isFinite(life.cleanliness)
        ? Math.abs(life.cleanliness - ml.cleanliness) <= 1
        : false,
    diet: h.diet && mh.diet && h.diet === mh.diet ? dietLabel(h.diet) : null,
  };

  const reasons = [];
  if (overlap.primaryLanguage) reasons.push("Same daily language");
  if (overlap.otherLanguages?.length) reasons.push(`Both speak ${overlap.otherLanguages.join(", ")}`);
  if (overlap.commute?.length) reasons.push(`Commute overlap: ${overlap.commute.join(" / ")}`);
  if (overlap.sleep === "good") reasons.push("Similar sleep hours");
  if (overlap.clean) reasons.push("Cleanliness expectations match");
  if (overlap.diet) reasons.push(`${overlap.diet} diet`);
  if (overlap.petsOk) reasons.push("Pets are okay");

  const hasDealbreakerConflict =
    (mdb.includes("no_smoking_indoors") && h.smoking && h.smoking !== "no") ||
    (mdb.includes("no_late_night_parties") && h.partying === "frequent") ||
    (mdb.includes("no_heavy_drinking") && h.drinking === "frequent") ||
    (mdb.includes("no_pets") && !!pets.hasPets);

  const score = Math.round(
    apiRow.score ?? apiRow.matchScore ?? computeFallbackScore(overlap, hasDealbreakerConflict)
  );

  return {
    id: apiRow.id || apiRow._id,
    name:
      apiRow.name ||
      `${(apiRow.firstName || "").trim()} ${(apiRow.lastName || "").trim()}`.trim() ||
      "Unnamed",
    avatar: apiRow.avatar || "",
    university: apiRow.university || "",
    homeCity: c?.home?.city || c?.home?.region || c?.home?.country || "",
    distanceMiles: apiRow.distanceMiles,
    score,
    overlap,
    reasons,
    flags: { hasDealbreakerConflict },
    synapse: syn,
  };
}

/* ------------------------ card -------------------------------- */
function MatchCard({ m, shortlisted, onToggleShortlist, onOpen }) {
  const ribbon = m.score >= 90 ? "Top match" : null;
  const scoreColor = heatColor(m.score);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl ring-1 ring-white/8 bg-[#0f1115]/70 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(0,0,0,.5)]"
    >
      {/* sheen */}
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute -inset-40 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)] animate-sheen" />
      </span>

      {/* ribbon */}
      {ribbon ? (
        <div className="absolute right-4 top-3 z-10">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-2.5 py-1 text-[10px] font-bold text-amber-200 tracking-wide">
            {ribbon}
          </span>
        </div>
      ) : null}

      {/* header */}
      <div className="p-4 flex items-start gap-3">
        <img
          src={m.avatar || "/avatar-fallback.png"}
          alt=""
          className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
          style={{ boxShadow: `0 0 0 2px ${scoreColor}20` }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white truncate">{m.name}</div>
            <Pill>{m.university || "Student"}</Pill>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-white/60">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">
              {m.homeCity || "Near campus"} • {m.distanceMiles ?? "—"} mi
            </span>
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <ScoreRing score={m.score} size={58} />
        </div>
      </div>

      {/* badges */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {m.overlap?.primaryLanguage && <Badge Icon={Languages}>Same daily language</Badge>}
        {m.overlap?.commute?.length > 0 && <Badge Icon={Route}>{m.overlap.commute.join(" / ")}</Badge>}
        {m.overlap?.sleep === "good" && <Badge Icon={Moon}>Sleep match</Badge>}
        {m.overlap?.clean && <Badge Icon={Sparkles}>Clean & tidy</Badge>}
        {m.overlap?.diet && <Badge Icon={Utensils}>{m.overlap.diet}</Badge>}
        {m.overlap?.petsOk && <Badge Icon={PawPrint}>Pets OK</Badge>}
        {m.flags?.hasDealbreakerConflict && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-[5px] text-[11px] text-rose-200">
            <ShieldAlert className="h-3.5 w-3.5" /> Deal-breaker conflict
          </span>
        )}
      </div>

      {/* reasons */}
      {m.reasons?.length ? (
        <div className="px-4 pb-3 text-[12px] text-white/70">
          {m.reasons.slice(0, 2).join(" • ")}
          {m.reasons.length > 2 ? " …" : ""}
        </div>
      ) : null}

      {/* actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button
          onClick={() => onToggleShortlist(m.id)}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
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
          className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-3 py-1.5 text-[13px] font-semibold"
        >
          View details <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------ drawer ---------------------------- */
function Drawer({ open, onClose, match }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-[#0b0d12] ring-1 ring-white/10 p-4 overflow-auto">
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
          <img
            src={match?.avatar || "/avatar-fallback.png"}
            alt=""
            className="h-12 w-12 rounded-full ring-1 ring-white/10"
          />
          <div className="min-w-0">
            <div className="text-white font-semibold">{match?.name}</div>
            <div className="text-[12px] text-white/60 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {match?.homeCity || "Near campus"} • {match?.distanceMiles ?? "—"} mi
            </div>
          </div>
          <div className="ml-auto">
            <ScoreRing score={match?.score ?? 0} />
          </div>
        </div>

        {/* overlap grid */}
        <Panel className="p-4">
          <div className="text-[13px] font-semibold mb-2">Compatibility highlights</div>
          <div className="flex flex-wrap gap-2">
            {match?.overlap?.primaryLanguage && <Badge Icon={Languages}>Same daily language</Badge>}
            {match?.overlap?.otherLanguages?.length > 0 && (
              <Badge Icon={Languages}>
                Other: {(match.overlap.otherLanguages || []).join(", ")}
              </Badge>
            )}
            {match?.overlap?.commute?.length > 0 && (
              <Badge Icon={Route}>{match.overlap.commute.join(" / ")}</Badge>
            )}
            {match?.overlap?.sleep && (
              <Badge Icon={Moon}>
                {match.overlap.sleep === "good" ? "Sleep match" : "Different hours"}
              </Badge>
            )}
            {match?.overlap?.clean && <Badge Icon={Sparkles}>Clean & tidy</Badge>}
            {match?.overlap?.diet && <Badge Icon={Utensils}>{match.overlap.diet}</Badge>}
            {match?.overlap?.petsOk && <Badge Icon={PawPrint}>Pets OK</Badge>}
            {match?.flags?.hasDealbreakerConflict && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-[5px] text-[11px] text-rose-200">
                <ShieldAlert className="h-3.5 w-3.5" /> Deal-breaker conflict
              </span>
            )}
          </div>

          {match?.reasons?.length ? (
            <ul className="mt-3 list-disc pl-5 text-[13px] text-white/75">
              {match.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------ page ------------------------------ */
export default function RoommateMatches() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [shortlist, setShortlist] = useState(
    () => new Set(JSON.parse(localStorage.getItem("nr.shortlist") || "[]"))
  );
  const [drawer, setDrawer] = useState({ open: false, match: null });

  const [filters, setFilters] = useState({
    sameLanguage: false,
    petsOk: false,
    dealbreakersClear: true,
    sort: "score", // 'score' | 'distance'
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const meRes = await axiosInstance.get("/synapse/preferences");
        const me = meRes?.data?.preferences || {};

        const mRes = await axiosInstance.get("/synapse/matches", {
          params: { page: 0, limit: 24 },
        });

        const raw =
          Array.isArray(mRes?.data) ? mRes.data :
          mRes?.data?.results ||
          mRes?.data?.matches ||
          [];

        const mapped = raw.map((row) => toUiMatch(row, me));
        setMatches(mapped);
      } catch (e) {
        console.warn("GET /synapse/matches error:", e);
        setError(e?.response?.data?.message || "Failed to load matches.");
        setMatches([]); // no mocks
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...matches];
    if (filters.sameLanguage) arr = arr.filter((m) => m.overlap?.primaryLanguage);
    if (filters.petsOk) arr = arr.filter((m) => m.overlap?.petsOk);
    if (filters.dealbreakersClear) arr = arr.filter((m) => !m.flags?.hasDealbreakerConflict);
    if (filters.sort === "distance")
      arr.sort((a, b) => (a.distanceMiles ?? 9e9) - (b.distanceMiles ?? 9e9));
    else arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return arr;
  }, [matches, filters]);

  const toggleShortlist = (id) => {
    const next = new Set(shortlist);
    if (next.has(id)) next.delete(id);
    else next.add(id);
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

          {/* Quick stats */}
          <div className="mt-3 text-center text-[12px] text-white/65">
            {loading ? "Finding best matches…" : `${filtered.length} match${filtered.length === 1 ? "" : "es"} shown`}
          </div>
        </div>
      </section>

      {/* body */}
      <section className="mx-auto max-w-[96rem] px-3 sm:px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 mt-4">
          {/* filters panel */}
          <aside className="hidden lg:block">
            <Panel className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <div className="text-[14px] font-semibold">Filters</div>
              </div>
              <div className="flex flex-col gap-2">
                <Chip
                  active={filters.sameLanguage}
                  onClick={() => setFilters((f) => ({ ...f, sameLanguage: !f.sameLanguage }))}
                >
                  <Languages className="h-4 w-4" /> Same daily language
                </Chip>
                <Chip
                  active={filters.petsOk}
                  onClick={() => setFilters((f) => ({ ...f, petsOk: !f.petsOk }))}
                >
                  <PawPrint className="h-4 w-4" /> Pets OK
                </Chip>
                <Chip
                  active={filters.dealbreakersClear}
                  onClick={() =>
                    setFilters((f) => ({ ...f, dealbreakersClear: !f.dealbreakersClear }))
                  }
                >
                  No deal-breaker conflicts
                </Chip>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[12px] font-semibold text-white/70">Sort by</div>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={filters.sort === "score"}
                    onClick={() => setFilters((f) => ({ ...f, sort: "score" }))}
                  >
                    Best match
                  </Chip>
                  <Chip
                    active={filters.sort === "distance"}
                    onClick={() => setFilters((f) => ({ ...f, sort: "distance" }))}
                  >
                    Nearest
                  </Chip>
                </div>
              </div>
            </Panel>

            <Panel className="p-4 mt-4">
              <div className="text-[13px] font-semibold mb-2">Shortlist</div>
              {[...shortlist].length === 0 ? (
                <div className="text-[12px] text-white/60">
                  Use “Shortlist” on a card to pin favorites here.
                </div>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {filtered
                    .filter((m) => shortlist.has(m.id))
                    .map((m) => (
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

          {/* results */}
          <div>
            {error ? (
              <div className="mb-3 text-[12px] text-amber-300">{error}</div>
            ) : null}

            <Panel className="p-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.04] h-56 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-white/70">
                  No matches yet.
                  <div className="mt-2 text-[12px]">
                    Tip: relax a filter or{" "}
                    <a className="underline" href="/roommate">
                      tune your Synapse
                    </a>
                    .
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      {/* local CSS for tiny animations */}
      <style>{`
        @keyframes sheen {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(60%); }
        }
        .animate-sheen { animation: sheen 2.4s linear infinite; }
        .sheen { position: relative; overflow: hidden; }
        .sheen:before {
          content: ""; position: absolute; inset: -100% 0 auto 0; height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
          transform: translateX(-120%);
          transition: transform .6s ease;
          pointer-events: none;
        }
        .sheen:hover:before { transform: translateX(120%); }
      `}</style>
    </div>
  );
}
