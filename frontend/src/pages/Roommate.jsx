// src/pages/Roommate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import {
  Languages,
  MapPin,
  CalendarClock,
  Route,
  Moon,
  Sparkles,
  Utensils,
  PartyPopper,
  PawPrint,
  OctagonX,
  CheckCircle2,
} from "lucide-react";

/* =============================== */
/* Laptop-first layout constants   */
/* =============================== */
const PANES_TOP = 220;            // where the 3-pane overlay starts (from viewport top)
const PANES_VPAD = 16;            // breathing room at the bottom
const GRID_GAP = "1.5rem";        // horizontal gap between columns

// Collapsing hero: expanded vs. collapsed heights
const HERO_EXPANDED = 240;        // px  (welcome size)
const HERO_COLLAPSED = 84;        // px  (context bar)

/* =============================== */
/* Small helpers / atoms           */
/* =============================== */
function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 ${className}`}>
      {children}
    </span>
  );
}
function Panel({ className = "", children }) {
  return <div className={`nr-panel ${className}`}>{children}</div>;
}
const Em = ({ children }) => (
  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
    {children}
  </span>
);

function Chip({ active, children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
        "text-[13px] font-semibold transition duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:translate-y-[1px]",
        active
          ? "border-transparent bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_18px_rgba(255,153,0,.25)] hover:brightness-110"
          : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.12] hover:border-white/90",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {active && <span className="text-black/80">✓</span>}
      {children}
    </button>
  );
}
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2",
        "text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus:bg-white/[0.07]",
        className,
      ].join(" ")}
    />
  );
}
const Divider = () => (
  <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
);

/* =============================== */
/* Searchable Select (no libs)     */
/* NULL-SAFE everywhere            */
/* =============================== */
function SearchSelect({
  label,
  placeholder = "Type to filter…",
  value,
  onChange,
  options = [],
  format,
  right,
  left,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const formatSafe = (o) =>
    (typeof format === "function" ? format(o) : (o?.label ?? "")) || "";
  const leftSafe = (o) => (typeof left === "function" && o ? left(o) : null);
  const rightSafe = (o) => (typeof right === "function" && o ? right(o) : null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = (q
    ? options.filter((o) => formatSafe(o).toLowerCase().includes(q.toLowerCase()))
    : options
  ).slice(0, 200);

  return (
    <div ref={ref} className="relative">
      {label ? <div className="mb-1 text-[12px] font-semibold text-white/60">{label}</div> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full rounded-xl border px-3 py-2 text-left text-sm",
          "border-white/12 bg-white/[0.05] text-white/85 hover:bg-white/[0.08]",
          disabled ? "opacity-40 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            {leftSafe(value)}
            <span className="truncate">{value ? formatSafe(value) : "Select..."}</span>
          </div>
          <span className="text-white/40">▾</span>
        </div>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/12 bg-[#0f1115] shadow-xl">
          <div className="p-2 border-b border-white/10">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
          </div>
          <div className="max-h-64 overflow-auto stealth-scroll">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/60">No results</div>
            ) : (
              filtered.map((opt) => {
                const active = value && (value.value === opt.value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => { onChange(opt); setOpen(false); setQ(""); }}
                    className={[
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm border-b border-white/5",
                      "hover:bg-white/[0.06]",
                      active ? "bg-white/[0.08]" : "",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {leftSafe(opt)}
                      <span className="truncate">{formatSafe(opt)}</span>
                    </span>
                    <span className="text-white/60">{rightSafe(opt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================== */
/* Country → State → City helpers  */
/* =============================== */
const cache = new Map();
async function getJSON(key, url, init) {
  if (cache.has(key)) return cache.get(key);
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  cache.set(key, data);
  return data;
}
const flagEmoji = (iso2) =>
  iso2
    ? iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : "🏳️";

async function loadCountries() {
  const data = await getJSON(
    "countries",
    "https://restcountries.com/v3.1/all?fields=name,cca2,idd"
  );
  return data
    .map((c) => {
      const code = c?.cca2 || "";
      const dial = (c?.idd?.root || "") + ((c?.idd?.suffixes && c.idd.suffixes[0]) || "");
      return {
        value: c?.name?.common || code,
        label: c?.name?.common || code,
        iso2: code,
        flag: flagEmoji(code),
        dial: dial || "",
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
async function loadStates(countryName) {
  const data = await getJSON(
    `states:${countryName}`,
    "https://countriesnow.space/api/v0.1/countries/states",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    }
  );
  const states = data?.data?.states || [];
  return states.map((s) => ({ value: s.name, label: s.name }));
}
async function loadCities(countryName, stateName) {
  const data = await getJSON(
    `cities:${countryName}:${stateName}`,
    "https://countriesnow.space/api/v0.1/countries/state/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName, state: stateName }),
    }
  );
  const cities = data?.data || [];
  return cities.map((c) => ({ value: c, label: c }));
}

const ICONS = {
  language: Languages,
  home: MapPin,
  moveBudget: CalendarClock,
  commute: Route,
  sleep: Moon,
  clean: Sparkles,
  diet: Utensils,
  habits: PartyPopper,
  pets: PawPrint,
  dealbreakers: OctagonX,
  finish: CheckCircle2,
};

function Icon({ kind, className = "h-5 w-5" }) {
  const Cmp = ICONS[kind];
  return Cmp ? <Cmp className={className + " text-white/80"} strokeWidth={1.8} /> : null;
}


/* =============================== */
/* Step meta (headlines)           */
/* =============================== */
// const STEP_META = [
//   { icon: "🗣️", pre: "Which", highlight: "language", post: "do you use most day-to-day?", sub: "Choose one. Add others if you’re comfortable." },
//   { icon: "🗺️", pre: "Where do you call", highlight: "home", post: "?", sub: "Pick your country, then state/region. City is optional." },
//   { icon: "📅💸", pre: "When are you moving and what’s your", highlight: "monthly budget", post: "?", sub: "Used only to filter obvious mismatches." },
//   { icon: "📍🚶", pre: "How far from campus is okay, and how will you", highlight: "commute", post: "?", sub: "Pick a distance and one or more modes." },
//   { icon: "🌙🔇", pre: "What’s your", highlight: "sleep style", post: "and quiet hours?", sub: "We show compatibility bands, not exact times." },
//   { icon: "🧽",   pre: "How", highlight: "tidy", post: "do you like shared spaces?", sub: "Rate 1–5 for expectations." },
//   { icon: "🍽️",  pre: "Tell us your", highlight: "diet", post: "and cooking rhythm.", sub: "Match what you do most weeks." },
//   { icon: "⚡",   pre: "A few lifestyle", highlight: "habits", post: "to set expectations.", sub: "Smoking, drinking, parties." },
//   { icon: "🐾",   pre: "Any", highlight: "pets or allergies", post: "?", sub: "Helps avoid conflicts." },
//   { icon: "⛔",   pre: "Pick up to 3", highlight: "deal-breakers", post: ".", sub: "We’ll flag conflicts transparently." },
//   { icon: "✅",   pre: "All set —", highlight: "Synapse", post: "is ready.", sub: "Badges now power housing & approvals." },
// ];

const STEP_META = [
  { iconKey: "language",   pre: "Which", highlight: "language", post: "do you use most day-to-day?", sub: "Choose one. Add others if you’re comfortable." },
  { iconKey: "home",       pre: "Where do you call", highlight: "home", post: "?", sub: "Pick your country, then state/region. City is optional." },
  { iconKey: "moveBudget", pre: "When are you moving and what’s your", highlight: "monthly budget", post: "?", sub: "Used only to filter obvious mismatches." },
  { iconKey: "commute",    pre: "How far from campus is okay, and how will you", highlight: "commute", post: "?", sub: "Pick a distance and one or more modes." },
  { iconKey: "sleep",      pre: "What’s your", highlight: "sleep style", post: "and quiet hours?", sub: "We show compatibility bands, not exact times." },
  { iconKey: "clean",      pre: "How", highlight: "tidy", post: "do you like shared spaces?", sub: "Rate 1–5 for expectations." },
  { iconKey: "diet",       pre: "Tell us your", highlight: "diet", post: "and cooking rhythm.", sub: "Match what you do most weeks." },
  { iconKey: "habits",     pre: "A few lifestyle", highlight: "habits", post: "to set expectations.", sub: "Smoking, drinking, parties." },
  { iconKey: "pets",       pre: "Any", highlight: "pets or allergies", post: "?", sub: "Helps avoid conflicts." },
  { iconKey: "dealbreakers", pre: "Pick up to 3", highlight: "deal-breakers", post: ".", sub: "We’ll flag conflicts transparently." },
  { iconKey: "finish",     pre: "All set —", highlight: "Synapse", post: "is ready.", sub: "Badges now power housing & approvals." },
];

/* =============================== */
/* Stepper (even spacing; no line  */
/* through numbers; glow; desc)    */
/* =============================== */
function Stepper({ steps, current, onJump, meta = {} }) {
  const DOT = 34;
  const TRACK = 5;
  const GAP = 12;

  return (
    <Panel className="p-4 sm:p-5 h-full">
      <div className="mb-3 text-[12px] font-semibold tracking-wide text-white/60">
        SETUP STEPS
      </div>

      <ol
        className="grid h-[calc(100%-8px)]"
        style={{ gridTemplateRows: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((label, i) => {
          const isActive = i === current;
          const isDone = i < current;

          return (
            <li
              key={label}
              className="relative min-h-[34px]"
              style={{ ['--dot']: `${DOT}px`, ['--trk']: `${TRACK}px` }}
            >
              {/* top connector (ends at circle edge) */}
              {i > 0 && (
                <span
                  aria-hidden
                  className={`absolute left-[calc(var(--dot)/2-var(--trk)/2)] w-[var(--trk)] rounded-full ${
                    i <= current
                      ? 'bg-emerald-400/85 shadow-[0_0_10px_rgba(16,185,129,.45)]'
                      : 'bg-white/12'
                  }`}
                  style={{ top: 0, height: `calc(50% - ${DOT / 2}px)` }}
                />
              )}
              {/* bottom connector */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[calc(var(--dot)/2-var(--trk)/2)] w-[var(--trk)] rounded-full ${
                    i < current
                      ? 'bg-emerald-400/85 shadow-[0_0_10px_rgba(16,185,129,.45)]'
                      : 'bg-white/12'
                  }`}
                  style={{ bottom: 0, height: `calc(50% - ${DOT / 2}px)` }}
                />
              )}

              {/* circle */}
              <button
                type="button"
                onClick={() => onJump?.(i)}
                aria-current={isActive ? 'step' : undefined}
                className={[
                  'absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center rounded-full text-[12px] font-semibold transition',
                  isActive
                    ? 'bg-white text-black ring-2 ring-amber-300/70 shadow-[0_8px_24px_rgba(255,255,255,.18)]'
                    : isDone
                    ? 'bg-emerald-400 text-black shadow-[0_0_16px_rgba(16,185,129,.55)]'
                    : 'bg-white/[0.06] text-white/75 border border-white/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]',
                ].join(' ')}
                style={{ width: DOT, height: DOT }}
              >
                {isDone ? '✓' : i + 1}
              </button>

              {/* label + optional description */}
              <div style={{ paddingLeft: DOT + GAP, minHeight: DOT }}>
                <div
                  className={`flex items-center leading-none ${
                    isActive ? 'text-white' : 'text-white/85'
                  }`}
                  style={{ minHeight: DOT }}
                >
                  <span className="text-[17px] md:text-[19px] font-semibold">{label}</span>
                </div>
                {isActive && meta?.[i]?.sub ? (
                  <p className="mt-1 text-[12px] text-white/65 max-w-[270px]">
                    {meta[i].sub}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* =============================== */
/* Centered, clamped question card */
/* =============================== */
function QuestionCard({ step, total, title, sub, icon = null, loading = false }) {
  return (
    <div className="relative nr-panel h-full p-0 overflow-hidden
                ring-1 ring-white/5
                shadow-[0_28px_80px_rgba(0,0,0,.55),0_8px_24px_rgba(0,0,0,.28)]">
      {/* ambient */}
      {/* <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-24 rounded-[28px]
                bg-[radial-gradient(ellipse_at_25%_20%,rgba(255,163,26,.16),transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(255,255,255,.07),transparent_55%)]" />
      </div> */}

      {/* centered content */}
      <div className="grid h-full place-items-center px-8 text-center">
        <div className="max-w-[760px] xl:max-w-[820px]">
          {icon ? (
            <div
              className="mx-auto mb-4 grid h-14 w-14 place-items-center
                        rounded-full border border-white/15 bg-white/[0.05]
                        ring-1 ring-white/10 shadow-[0_0_18px_rgba(255,153,0,.14)]
                        transform-gpu scale-[1.5]"
            >
              <span className="text-2xl">{icon}</span>
            </div>
          ) : null}


          {loading ? (
            <div className="text-white/90 text-base">
              <span className="inline-flex gap-1" aria-live="polite">
                <span className="animate-pulse">•</span>
                <span className="animate-pulse delay-150">•</span>
                <span className="animate-pulse delay-300">•</span>
              </span>
            </div>
          ) : (
            <>
              {/* Bigger but safe: scales with width AND a bit with height */}
              <h2
                className="font-black tracking-tight text-white leading-[1.03]
                          text-[clamp(34px,min(4vw,6.2vh),60px)]
                          xl:text-[clamp(36px,min(3.6vw,6.6vh),64px)]
                          [text-wrap:balance] [text-shadow:0_10px_28px_rgba(255,153,0,.14)]"
              >
                {title}
              </h2>
              {sub ? (
                <p className="mx-auto mt-3 max-w-[640px] text-[14px] md:text-[15px] text-white/70">
                  {sub}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* =============================== */
/* Page                            */
/* =============================== */
export default function Roommate() {
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const STEPS = useMemo(
    () => [
      "Language & Comfort",
      "Country & Region",
      "Move-in & Budget",
      "Distance & Commute",
      "Sleep & Quiet Hours",
      "Cleanliness",
      "Diet & Cooking",
      "Habits",
      "Pets",
      "Deal-breakers",
      "Finish",
    ],
    []
  );

  const [prefs, setPrefs] = useState({
    culture: {
      primaryLanguage: "",
      otherLanguages: [],
      languageComfort: "either",
      home: { country: "", countryISO: "", region: "", city: "" },
      visibility: { showAvatarInPreviews: false, shareCultureInPreviews: "banded" },
    },
    logistics: { moveInMonth: null, leaseMonths: 12, budgetMax: null, maxDistanceMiles: 2, commuteMode: [] },
    lifestyle: { sleepPattern: "", quietAfter: "22:00", quietUntil: "07:00", cleanliness: 3 },
    habits: { diet: "", cookingFreq: "sometimes", smoking: "no", drinking: "social", partying: "occasionally" },
    pets: { hasPets: false, okWithPets: true, allergies: [] },
    dealbreakers: [],
  });

  /* Load saved prefs */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await axiosInstance.get("/synapse/preferences");
        if (mounted && r?.data?.preferences) setPrefs((p) => ({ ...p, ...r.data.preferences }));
      } catch {}
      finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const savePrefs = async (next) => {
    setSaving(true);
    setError("");
    try {
      const merged = typeof next === "function" ? next(prefs) : { ...prefs, ...next };
      setPrefs(merged);
      await axiosInstance.post("/synapse/preferences", merged);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const setCulture   = (patch) => savePrefs({ culture:   { ...prefs.culture,   ...patch } });
  const setLogistics = (patch) => savePrefs({ logistics: { ...prefs.logistics, ...patch } });
  const setLifestyle = (patch) => savePrefs({ lifestyle: { ...prefs.lifestyle, ...patch } });
  const setHabits    = (patch) => savePrefs({ habits:    { ...prefs.habits,    ...patch } });
  const setPets      = (patch) => savePrefs({ pets:      { ...prefs.pets,      ...patch } });

  const nextStep = async () => {
    setTyping(true); await new Promise((r) => setTimeout(r, 220 + Math.random() * 280)); setTyping(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));
  const goToStep = (i) => setStep(Math.max(0, Math.min(i, STEPS.length - 1)));

  /* =============================== */
  /* STEP 1: Language                */
  /* =============================== */
const LANG_PRESETS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "hi", label: "Hindi" },

  // South India
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },

  { code: "zh", label: "Mandarin" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "bn", label: "Bengali" },
];

  const StepLanguage = () => (
  <div>
    {/* Label + pill: slight gap and baseline align */}
    <div className="mb-2 flex items-baseline gap-[10px]">
      <span className="text-sm md:text-[15px] font-semibold text-white/90">Daily language</span>
      <Pill className="translate-y-[1px]">Used for vibe only</Pill>
    </div>

    {/* Chip grid + 'Other' share the same width so input doesn't span the card */}
    <div className="max-w-[640px]">
      <div className="flex flex-wrap gap-2">
        {LANG_PRESETS.map((l) => (
          <Chip
            key={l.code}
            active={prefs.culture.primaryLanguage === l.code}
            onClick={() => setCulture({ primaryLanguage: l.code })}
          >
            {l.label}
          </Chip>
        ))}
      </div>

      {/* Compact 'Other' input aligned with chips */}
      <div className="mt-3">
        <Input
          className="w-full max-w-[520px] md:max-w-[560px]"
          placeholder="Other (type and Enter)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              const code = e.currentTarget.value.trim().toLowerCase().slice(0, 12);
              setCulture({ primaryLanguage: code });
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>

    <Divider />

    <div className="mb-2 text-[13px] font-semibold">Also comfortable with… (optional)</div>
    <div className="flex flex-wrap gap-2 max-w-[640px]">
      {LANG_PRESETS.map((l) => {
        const arr = prefs.culture.otherLanguages || [];
        const on = arr.includes(l.code);
        return (
          <Chip
            key={l.code}
            active={on}
            onClick={() =>
              setCulture({
                otherLanguages: on ? arr.filter((x) => x !== l.code) : [...arr, l.code],
              })
            }
          >
            {l.label}
          </Chip>
        );
      })}
    </div>

    <Divider />

    <div className="mb-2 text-[13px] font-semibold">Language comfort with roommates</div>
    <div className="flex flex-wrap gap-2 max-w-[640px]">
      {[
        { k: "same", t: "Prefer same language" },
        { k: "either", t: "Either is fine" },
        { k: "learn", t: "Happy to learn/teach" },
      ].map((o) => (
        <Chip
          key={o.k}
          active={prefs.culture.languageComfort === o.k}
          onClick={() => setCulture({ languageComfort: o.k })}
        >
          {o.t}
        </Chip>
      ))}
    </div>
  </div>
);


  /* =============================== */
  /* STEP 2: Country / State / City  */
  /* =============================== */
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadCountries();
        setCountries(list);
      } catch (e) {
        console.warn("Countries fetch failed", e);
      }
    })();
  }, []);

  const StepCountry = () => {
    const selectedCountry = useMemo(() => {
      if (!prefs.culture.home.country) return null;
      const byIso =
        countries.find((c) => c.iso2 === prefs.culture.home.countryISO) || null;
      const byName =
        countries.find((c) => c.label === prefs.culture.home.country) || null;
      if (byIso) return byIso;
      if (byName) return byName;
      return {
        value: prefs.culture.home.country,
        label: prefs.culture.home.country,
        iso2: prefs.culture.home.countryISO,
        flag: flagEmoji(prefs.culture.home.countryISO),
      };
    }, [prefs.culture.home.country, prefs.culture.home.countryISO, countries]);

    const onCountry = async (opt) => {
      setCulture({ home: { country: opt.label, countryISO: opt.iso2, region: "", city: "" } });
      try { setStates(await loadStates(opt.label)); setCities([]); } catch { setStates([]); setCities([]); }
    };
    const onState = async (opt) => {
      setCulture({ home: { ...prefs.culture.home, region: opt.value, city: "" } });
      try { setCities(await loadCities(prefs.culture.home.country, opt.value)); } catch { setCities([]); }
    };
    const onCity = (opt) => setCulture({ home: { ...prefs.culture.home, city: opt.value } });

    const fmt = (o) => (o ? `${o.flag || ""} ${o.label}` : "");
    const leftFlag = (o) => (o ? <span className="text-lg">{o.flag || flagEmoji(o.iso2)}</span> : null);
    const rightDial = (o) => (o?.dial ? `+${o.dial}` : "");

    return (
      <div className="grid gap-3 md:grid-cols-2">
        <SearchSelect
          label="Country"
          value={selectedCountry}
          onChange={onCountry}
          options={countries}
          format={fmt}
          left={leftFlag}
          right={rightDial}
        />
        <SearchSelect
          label="State / Region"
          value={prefs.culture.home.region ? { value: prefs.culture.home.region, label: prefs.culture.home.region } : null}
          onChange={onState}
          options={states}
          disabled={!prefs.culture.home.country}
        />
        <SearchSelect
          label="Home city (optional)"
          value={prefs.culture.home.city ? { value: prefs.culture.home.city, label: prefs.culture.home.city } : null}
          onChange={onCity}
          options={cities}
          disabled={!prefs.culture.home.region}
        />
      </div>
    );
  };

  /* =============================== */
  /* Remaining steps (compact)       */
  /* =============================== */
  const monthISO = (d) => (d ? d.slice(0, 7) : null);

  const StepMoveBudget = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Move-in month & lease length</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="month" value={prefs.logistics.moveInMonth || ""} onChange={(e) => setLogistics({ moveInMonth: monthISO(e.target.value) })} />
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={prefs.logistics.leaseMonths === 6} onClick={() => setLogistics({ leaseMonths: 6 })}>6–9 mo</Chip>
          <Chip active={prefs.logistics.leaseMonths === 12} onClick={() => setLogistics({ leaseMonths: 12 })}>10–12 mo</Chip>
          <Chip active={prefs.logistics.leaseMonths === 15} onClick={() => setLogistics({ leaseMonths: 15 })}>12+ mo</Chip>
        </div>
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Max monthly budget (USD)</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="number"
          placeholder="e.g., 900"
          value={prefs.logistics.budgetMax ?? ""}
          onChange={(e) => setLogistics({ budgetMax: e.target.value ? Number(e.target.value) : null })}
        />
        <div className="flex flex-wrap gap-2">
          {[600, 800, 1000, 1200].map((v) => (
            <Chip key={v} active={prefs.logistics.budgetMax === v} onClick={() => setLogistics({ budgetMax: v })}>
              ≤ ${v}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );

  const StepDistanceCommute = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Max distance to campus</div>
      <div className="flex flex-wrap gap-2">
        {[0.8, 2, 5, 10].map((m) => (
          <Chip key={m} active={prefs.logistics.maxDistanceMiles === m} onClick={() => setLogistics({ maxDistanceMiles: m })}>
            {m <= 0.8 ? "Walkable (<0.8 mi)" : `≤ ${m} mi`}
          </Chip>
        ))}
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Commute mode (multi-select)</div>
      <div className="flex flex-wrap gap-2">
        {["walk", "bus", "car", "bike"].map((k) => {
          const on = prefs.logistics.commuteMode.includes(k);
          return (
            <Chip
              key={k}
              active={on}
              onClick={() =>
                setLogistics({ commuteMode: on ? prefs.logistics.commuteMode.filter((x) => x !== k) : [...prefs.logistics.commuteMode, k] })
              }
            >
              {k}
            </Chip>
          );
        })}
      </div>
    </div>
  );

  const StepSleepQuiet = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Sleep pattern</div>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "early_bird", t: "Early bird" },
          { k: "flex", t: "Flexible" },
          { k: "night_owl", t: "Night owl" },
        ].map((o) => (
          <Chip key={o.k} active={prefs.lifestyle.sleepPattern === o.k} onClick={() => setLifestyle({ sleepPattern: o.k })}>
            {o.t}
          </Chip>
        ))}
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Quiet hours (weeknights)</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="time" value={prefs.lifestyle.quietAfter} onChange={(e) => setLifestyle({ quietAfter: e.target.value })}/>
        <Input type="time" value={prefs.lifestyle.quietUntil} onChange={(e) => setLifestyle({ quietUntil: e.target.value })}/>
      </div>
    </div>
  );

  const StepCleanliness = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Cleanliness level</div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={prefs.lifestyle.cleanliness}
        onChange={(e) => setLifestyle({ cleanliness: Number(e.target.value) })}
        className="w-full accent-white/90"
      />
      <div className="mt-2 text-sm text-white/80">Preference: {prefs.lifestyle.cleanliness}</div>
    </div>
  );

  const StepDietCooking = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Diet</div>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "veg", t: "Vegetarian" },
          { k: "vegan", t: "Vegan" },
          { k: "nonveg", t: "Non-veg" },
        ].map((o) => (
          <Chip key={o.k} active={prefs.habits.diet === o.k} onClick={() => setHabits({ diet: o.k })}>
            {o.t}
          </Chip>
        ))}
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Cooking frequency</div>
      <div className="flex flex-wrap gap-2">
        {["rare", "sometimes", "often"].map((k) => (
          <Chip key={k} active={prefs.habits.cookingFreq === k} onClick={() => setHabits({ cookingFreq: k })}>
            {k === "rare" ? "Cook rarely" : k === "often" ? "Cook often" : "Cook sometimes"}
          </Chip>
        ))}
      </div>
    </div>
  );

  const StepHabits = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Smoking</div>
      <div className="flex flex-wrap gap-2">
        {["no", "outdoor_only", "yes"].map((k) => (
          <Chip key={k} active={prefs.habits.smoking === k} onClick={() => setHabits({ smoking: k })}>
            {k === "no" ? "No" : k === "yes" ? "Yes" : "Outdoor only"}
          </Chip>
        ))}
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Drinking</div>
      <div className="flex flex-wrap gap-2">
        {["no", "social", "frequent"].map((k) => (
          <Chip key={k} active={prefs.habits.drinking === k} onClick={() => setHabits({ drinking: k })}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </Chip>
        ))}
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Parties</div>
      <div className="flex flex-wrap gap-2">
        {["no", "occasionally", "frequent"].map((k) => (
          <Chip key={k} active={prefs.habits.partying === k} onClick={() => setHabits({ partying: k })}>
            {k === "no" ? "No parties" : k === "occasionally" ? "Occasionally" : "Frequent"}
          </Chip>
        ))}
      </div>
    </div>
  );

  const StepPets = () => (
    <div>
      <div className="mb-2 text-[13px] font-semibold">Pets</div>
      <div className="flex flex-wrap gap-2">
        <Chip active={prefs.pets.hasPets} onClick={() => setPets({ hasPets: !prefs.pets.hasPets })}>
          I have pets
        </Chip>
        <Chip active={prefs.pets.okWithPets} onClick={() => setPets({ okWithPets: !prefs.pets.okWithPets })}>
          I’m okay with pets
        </Chip>
      </div>

      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Allergies (type and Enter)</div>
      <Input
        placeholder="e.g., cats"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value.trim()) {
            const v = e.currentTarget.value.trim();
            setPets({ allergies: [...(prefs.pets.allergies || []), v] });
            e.currentTarget.value = "";
          }
        }}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {(prefs.pets.allergies || []).map((a) => (
          <Chip key={a} active onClick={() => setPets({ allergies: (prefs.pets.allergies || []).filter((x) => x !== a) })}>
            {a} ✕
          </Chip>
        ))}
      </div>
    </div>
  );

  const StepDealbreakers = () => {
    const opts = [
      ["no_smoking_indoors", "No smoking indoors"],
      ["no_late_night_parties", "No late-night parties"],
      ["no_pets", "No pets"],
      ["quiet_after_22", "Quiet after 10PM"],
      ["no_heavy_drinking", "No heavy drinking"],
    ];
    const limit = 3;
    const onToggle = (k) => {
      const cur = prefs.dealbreakers || [];
      if (cur.includes(k)) savePrefs({ dealbreakers: cur.filter((x) => x !== k) });
      else if (cur.length < limit) savePrefs({ dealbreakers: [...cur, k] });
    };
    return (
      <div>
        <div className="mb-2 text-[13px] font-semibold">Deal-breakers (pick up to 3)</div>
        <div className="flex flex-wrap gap-2">
          {opts.map(([k, t]) => (
            <Chip
              key={k}
              active={(prefs.dealbreakers || []).includes(k)}
              onClick={() => onToggle(k)}
              disabled={!((prefs.dealbreakers || []).includes(k)) && (prefs.dealbreakers || []).length >= limit}
            >
              {t}
            </Chip>
          ))}
        </div>
        <div className="mt-2 text-[12px] text-white/65">You chose {(prefs.dealbreakers || []).length} / {limit}</div>
      </div>
    );
  };

  const StepFinish = () => (
    <div>
      <div className="flex items-center gap-3">
        <div className="text-2xl">🎉</div>
        <div>
          <div className="text-lg font-semibold">Synapse is set!</div>
          <div className="text-white/70 text-sm">Compatibility badges will appear on housing cards and owner approvals.</div>
        </div>
      </div>
      <Divider />
      <div className="mb-2 text-[13px] font-semibold">Visibility</div>
      <div className="flex flex-wrap gap-2">
        <Chip
          active={prefs.culture.visibility.showAvatarInPreviews}
          onClick={() =>
            setCulture({
              visibility: {
                ...prefs.culture.visibility,
                showAvatarInPreviews: !prefs.culture.visibility.showAvatarInPreviews,
              },
            })
          }
        >
          Show my name & avatar in previews
        </Chip>
        <Chip
          active={prefs.culture.visibility.shareCultureInPreviews === "banded"}
          onClick={() =>
            setCulture({ visibility: { ...prefs.culture.visibility, shareCultureInPreviews: "banded" } })
          }
        >
          Share only “compatibility badges”
        </Chip>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return <StepLanguage />;
      case 1: return <StepCountry />;
      case 2: return <StepMoveBudget />;
      case 3: return <StepDistanceCommute />;
      case 4: return <StepSleepQuiet />;
      case 5: return <StepCleanliness />;
      case 6: return <StepDietCooking />;
      case 7: return <StepHabits />;
      case 8: return <StepPets />;
      case 9: return <StepDealbreakers />;
      case 10: return <StepFinish />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="nr-dots-page min-h-screen text-white">
        <Navbar />
        <main className="min-h-[60vh] grid place-items-center">Loading Synapse…</main>
      </div>
    );
  }

  const PANES_H = `calc(100vh - ${PANES_TOP + PANES_VPAD}px)`;

  return (
    <div className="nr-dots-page text-white" style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      <Navbar />

      {/* Compact hero */}
      <section className="nr-hero-bg" style={{ paddingTop: 10, paddingBottom: 6 }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-[6px] mb-2 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">NewRun Synapse</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">Private • Editable anytime</span>
          </div>
          <h1 className="mx-auto max-w-6xl text-center text-[42px] md:text-[58px] font-black tracking-tight leading-[1.05]">
            Let’s tune your <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">roommate vibe.</span>
          </h1>
        </div>
      </section>

      {/* Three-pane overlay */}
      <section
        className="mx-auto pl-4 pr-2 xl:pr-4 max-w-[88rem] 2xl:max-w-[96rem]"
        style={{
          position: "absolute",
          top: PANES_TOP,
          left: 0,
          right: 0,
          height: PANES_H,
        }}
      >
        <div
          id="roommateGrid"
          className="grid h-full items-start"
          style={{ gridTemplateColumns: "1fr 1.35fr 1.75fr", gap: GRID_GAP }}
        >
          {/* Left: Stepper */}
          <aside className="hidden lg:block h-full min-h-0 -ml-8 xl:-ml-12 2xl:-ml-16">
            <Stepper steps={STEPS} current={step} onJump={goToStep} meta={STEP_META} />
          </aside>

          {/* Middle: Big question (centered + glow) */}
          <div className="h-full min-h-0">
            <QuestionCard
              step={step}
              total={STEPS.length}
              loading={typing}
              icon={<Icon kind={STEP_META[step]?.iconKey} className="h-8 w-8 md:h-9 md:w-9 text-white/80" />}
              title={
                <>
                  {STEP_META[step]?.pre}{" "}
                  <Em>{STEP_META[step]?.highlight}</Em>{" "}
                  {STEP_META[step]?.post}
                </>
              }
              sub={STEP_META[step]?.sub}
            />
          </div>

          {/* Right: Answers + fixed controls strip */}
          <div className="h-full min-h-0">
            <Panel className="h-full p-0 flex flex-col">
              <div className="p-4 sm:p-5 grow overflow-auto stealth-scroll min-h-0">
                {renderStep()}
              </div>
              <div className="border-t border-white/10 bg-[#0f1115]/80 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-white/55">{saving ? "Saving…" : "Autosaved"}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevStep}
                      disabled={step === 0}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                        "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 transition",
                        step === 0 ? "opacity-40 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      ← Back
                    </button>
                    {step < STEPS.length - 1 ? (
                      <button
                        onClick={nextStep}
                        className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold active:translate-y-[1px] transition"
                      >
                        Continue →
                      </button>
                    ) : (
                      <a href="/properties" className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold">
                        See matches →
                      </a>
                    )}
                  </div>
                </div>
                {error ? <div className="mt-2 text-[12px] text-red-300">{error}</div> : null}
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* tiny CSS helpers injected locally */}
      <style>{`
        .stealth-scroll { scrollbar-width: none; }
        .stealth-scroll::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
    </div>
  );
}
