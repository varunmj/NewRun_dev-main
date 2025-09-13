// src/pages/RoommateMatches.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  Heart, HeartOff, Languages, MapPin, Route, Moon, Sparkles, Utensils,
  PawPrint, Filter, ChevronRight, X
} from "lucide-react";

/* --- tiny atoms to match Roommate.jsx look --- */
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

/* --- score ring --------------------------------------------------------- */
function ScoreRing({ score = 0, size = 60 }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const c = `conic-gradient(#f59e0b ${pct * 3.6}deg, rgba(255,255,255,.08) 0)`;
  return (
    <div
      className="grid place-items-center rounded-full"
      style={{ width: size, height: size, background: c }}
      aria-label={`Compatibility ${pct}%`}
      title={`Compatibility ${pct}%`}
    >
      <div className="grid place-items-center rounded-full bg-[#0f1115] text-white font-bold"
           style={{ width: size - 10, height: size - 10 }}>
        <span className="text-[13px]">{pct}%</span>
      </div>
    </div>
  );
}

/* --- mini badges line --------------------------------------------------- */
const Badge = ({ Icon, children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2 py-[3px] text-[11px] text-white/80">
    <Icon className="h-3.5 w-3.5" /> {children}
  </span>
);

/* --- a single match card ----------------------------------------------- */
function MatchCard({ m, shortlisted, onToggleShortlist, onOpen }) {
  return (
    <div className="relative rounded-2xl ring-1 ring-white/8 overflow-hidden bg-[#0f1115]/70">
      {/* header */}
      <div className="p-4 flex items-start gap-3">
        <img
          src={m.avatar || "/avatar-fallback.png"}
          alt=""
          className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
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
          <ScoreRing score={m.score} size={56} />
        </div>
      </div>

      {/* badges */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {m.overlap?.primaryLanguage && (
          <Badge Icon={Languages}>Same daily language</Badge>
        )}
        {m.overlap?.commute?.length > 0 && (
          <Badge Icon={Route}>{m.overlap.commute.join(" / ")}</Badge>
        )}
        {m.overlap?.sleep === "good" && <Badge Icon={Moon}>Sleep match</Badge>}
        {m.overlap?.clean && <Badge Icon={Sparkles}>Clean & tidy</Badge>}
        {m.overlap?.diet && <Badge Icon={Utensils}>{m.overlap.diet}</Badge>}
        {m.overlap?.petsOk && <Badge Icon={PawPrint}>Pets OK</Badge>}
      </div>

      {/* reasons */}
      {m.reasons?.length ? (
        <div className="px-4 pb-3 text-[12px] text-white/65">
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
              : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.12]",
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

/* --- detail drawer ------------------------------------------------------ */
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
          <img src={match?.avatar || "/avatar-fallback.png"} alt="" className="h-12 w-12 rounded-full ring-1 ring-white/10" />
          <div className="min-w-0">
            <div className="text-white font-semibold">{match?.name}</div>
            <div className="text-[12px] text-white/60 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {match?.homeCity || "Near campus"} • {match?.distanceMiles ?? "—"} mi
            </div>
          </div>
          <div className="ml-auto"><ScoreRing score={match?.score ?? 0} /></div>
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

/* --- page --------------------------------------------------------------- */
export default function RoommateMatches() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [shortlist, setShortlist] = useState(() =>
    new Set(JSON.parse(localStorage.getItem("nr.shortlist") || "[]"))
  );
  const [drawer, setDrawer] = useState({ open: false, match: null });

  // simple filters/sort
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
        // expected: { matches: [...] }
        const list = Array.isArray(r?.data?.matches) ? r.data.matches : makeMockMatches();
        setMatches(list);
      } catch (e) {
        console.warn("GET /synapse/matches failed — using mock", e?.message);
        setMatches(makeMockMatches());
        setError("Showing demo matches until the API is ready.");
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
        </div>
      </section>

      {/* body */}
      <section className="mx-auto max-w-[96rem] px-3 sm:px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 mt-4">
          {/* filters panel */}
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
                  No matches with the current filters.
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
    </div>
  );
}

/* --- mock data until /synapse/matches exists --------------------------- */
function makeMockMatches() {
  return [
    {
      id: "u_1",
      name: "Aarav K.",
      avatar: "/avatars/aarav.jpg",
      university: "NIU",
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
    },
    {
      id: "u_2",
      name: "Sanya R.",
      avatar: "/avatars/sanya.jpg",
      university: "NIU",
      homeCity: "Sycamore",
      distanceMiles: 2.1,
      score: 84,
      overlap: { primaryLanguage: false, commute: ["bus"], sleep: "good", petsOk: true },
      reasons: ["Similar sleep hours", "Pets are okay"]
    },
    {
      id: "u_3",
      name: "Miguel A.",
      distanceMiles: 1.4,
      score: 77,
      overlap: { primaryLanguage: false, otherLanguages: ["en"], commute: ["bike"], clean: true },
      reasons: ["Tidy shared spaces", "Speaks English too"]
    },
    {
      id: "u_4",
      name: "Zara T.",
      distanceMiles: 0.9,
      score: 73,
      overlap: { primaryLanguage: true, petsOk: false, sleep: "neutral" },
      reasons: ["Same daily language"]
    },
    {
      id: "u_5",
      name: "Kai L.",
      distanceMiles: 3.6,
      score: 69,
      overlap: { primaryLanguage: false, otherLanguages: ["en"], commute: ["car"] },
      reasons: ["Drives to campus"]
    },
    {
      id: "u_6",
      name: "Noah B.",
      distanceMiles: 0.4,
      score: 88,
      overlap: { primaryLanguage: false, otherLanguages: ["en"], clean: true, sleep: "good" },
      reasons: ["Clean & tidy", "Similar quiet hours"]
    }
  ];
}
