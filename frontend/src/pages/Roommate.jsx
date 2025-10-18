// src/pages/Roommate.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import "../styles/newrun-hero.css";
import confetti from 'canvas-confetti';
import {
  Languages, MapPin, CalendarClock, Route, Moon, Sparkles, Utensils, PartyPopper, PawPrint,
  OctagonX, CheckCircle2, Timer, Cigarette, CigaretteOff, Wine, Heart, Ban, Plus, Users, BookOpen, Search, Edit, User, UserCheck, UserX, UserPlus, Users2, UserMinus
} from "lucide-react";
import { BorderBeam } from "../components/ui/border-beam";

/* =============================== */
/* Laptop-first layout constants   */
/* =============================== */
const PANES_TOP = 220;            // where the 3-pane overlay starts (from viewport top)
const PANES_TOP_WIDE   = 220;  // NEW: tighter top for wide steps
const PANES_VPAD = 16;            // breathing room at the bottom
const GRID_GAP = "1.25rem";        // horizontal gap between columns

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

// Small “add” pill for suggested allergies
function SuggestChip({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
        "text-[12px] font-medium transition",
        "border-white/12 bg-white/[0.06] text-white/80 hover:bg-white/[0.12]",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

// Destructive-looking tag used for active allergies (click to remove)
function AllergyTag({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full
                 bg-rose-500/15 border border-rose-400/40 text-rose-200
                 px-2.5 py-1 text-[12px] hover:bg-rose-500/25"
      title="Remove"
    >
      {label}
      <span className="text-rose-200/80">✕</span>
    </button>
  );
}

/* ===== professional confetti (canvas-confetti) ===== */
// Professional confetti animation for Synapse completion
const triggerConfetti = () => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  
  const end = Date.now() + 4 * 1000; // 4 seconds for major milestone
  const colors = ["#FF6B35", "#F7931E", "#FFD23F", "#3A86FF", "#FB5607", "#000000", "#FF0000", "#FFFFFF"];
  
  const frame = () => {
    if (Date.now() > end) return;
    
    // Left cannon - more particles for celebration
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    
    // Right cannon - more particles for celebration
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    
    requestAnimationFrame(frame);
  };
  
  frame();
};


function Chip({
  active,
  children,
  onClick,
  disabled,
  size = "md",
  block = false,
  className = "",
}) {
  const sizeCls =
    size === "lg"
      ? "px-4 py-2 text-[15px] rounded-2xl"
      : size === "sm"
      ? "px-2.5 py-1 text-[12px] rounded-full"
      : "px-3.5 py-1.5 text-[13px] rounded-full";

  const blockCls = block
    ? "w-full justify-center text-center whitespace-normal leading-tight min-h-[52px] md:min-h-[56px]"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-2 border font-semibold transition duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:translate-y-[1px]",
        sizeCls,
        blockCls,
        active
          ? "border-transparent bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_18px_rgba(255,153,0,.25)] hover:brightness-110"
          : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.12] hover:border-white/90",
        disabled ? "opacity-40 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      <span className="[text-wrap:balance]">{children}</span>
    </button>
  );
}

// Custom component for gender preference buttons with larger icons and dotted separator
function GenderPreferenceChip({ active, children, onClick, disabled, icon, iconComponent: IconComponent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "w-full flex items-center border font-semibold transition duration-150 min-h-[60px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:translate-y-[1px]",
        "px-4 py-3 text-[15px] rounded-2xl",
        active
          ? "border-transparent bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_18px_rgba(255,153,0,.25)] hover:brightness-110"
          : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.12] hover:border-white/90",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {/* Left section - Icon */}
      <div className="flex items-center w-10 h-12">
        {icon ? (
          <img 
            src={icon} 
            alt={children}
            className={`h-7 w-7 ml-0 ${active ? "opacity-100" : "opacity-80"}`}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : IconComponent ? (
          <IconComponent className={`${active ? "text-black/80" : "text-white/80"} h-7 w-7 ml-0`} strokeWidth={1.8} />
        ) : null}
      </div>
      
      {/* Dotted vertical separator */}
      {/* <div className={`h-8 w-px border-l-4 border-dotted mx-2 ${active ? "border-black/50" : "border-white/40"}`}></div> */}
      <div className={`h-6 sm:h-9 w-px border-l-4 border-dotted mx-3 ${active ? "border-black/50" : "border-white/40"}`} />

      {/* Right section - Text */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-center leading-tight">{children}</span>
      </div>
    </button>
  );
}

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={[
      "w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2",
      "text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus:bg-white/[0.07]",
      className,
    ].join(" ")}
  />
));

Input.displayName = "Input";
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const searchRef = useRef(null);           // NEW
  const listboxId = useMemo(() => `ss-${Math.random().toString(36).slice(2)}`, []);

  const formatSafe = (o) =>
    (typeof format === "function" ? format(o) : (o?.label ?? "")) || "";
  const leftSafe = (o) => (typeof left === "function" && o ? left(o) : null);
  const rightSafe = (o) => (typeof right === "function" && o ? right(o) : null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ⤵ Auto-focus the filter whenever the menu opens
  useEffect(() => {
    if (open) {
      // small rAF so the input is mounted
      requestAnimationFrame(() => {
        if (searchRef.current) {
          searchRef.current.focus();
          searchRef.current.select();
        }
      });
    }
  }, [open]);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [q]);

  const openAndFocus = () => {
    setOpen(true);
    // focus will happen via effect above
  };

  const onTriggerKeyDown = (e) => {
    // open on navigation keys
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAndFocus();
      return;
    }
    // type-ahead from closed state: open + seed first char
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      setQ(e.key);            // seed with the typed character
      openAndFocus();
    }
  };

  const filtered = (q
    ? options.filter((o) => formatSafe(o).toLowerCase().includes(q.toLowerCase()))
    : options
  ).slice(0, 200);

  return (
    <div ref={ref} className="relative">
      {label ? <div className="mb-1 text-[12px] font-semibold text-white/60">{label}</div> : null}

      {/* TRIGGER */}
      <button
        type="button"
        disabled={disabled}
        onClick={openAndFocus}                 // focus the filter automatically
        onKeyDown={onTriggerKeyDown}           // type-to-open
        role="combobox"                        // a11y
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
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

      {/* POPUP */}
      {open && (
        <div
          className="absolute z-30 mt-2 w-full rounded-xl border border-white/12 bg-[#0f1115] shadow-xl"
          role="listbox"
          id={listboxId}
        >
          <div className="p-2 border-b border-white/10">
            <Input
              ref={searchRef}                   // NEW
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Escape") { 
                  e.preventDefault(); 
                  setOpen(false); 
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered.length > 0) {
                    const selectedIndex = activeIndex >= 0 ? activeIndex : 0;
                    onChange(filtered[selectedIndex]);
                    setOpen(false);
                    setQ("");
                    setActiveIndex(-1);
                  }
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (filtered.length > 0) {
                    setActiveIndex(prev => 
                      prev < filtered.length - 1 ? prev + 1 : 0
                    );
                  }
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (filtered.length > 0) {
                    setActiveIndex(prev => 
                      prev > 0 ? prev - 1 : filtered.length - 1
                    );
                  }
                }
              }}
            />
          </div>
          <div className="max-h-64 overflow-auto stealth-scroll">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/60">No results</div>
            ) : (
              filtered.map((opt, index) => {
                const active = value && (value.value === opt.value);
                const isHighlighted = index === activeIndex;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => { onChange(opt); setOpen(false); setQ(""); setActiveIndex(-1); }}
                    className={[
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm border-b border-white/5",
                      "hover:bg-white/[0.06]",
                      active ? "bg-white/[0.08]" : "",
                      isHighlighted ? "bg-white/[0.12]" : "",
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


const STEP_META = [
  { iconKey: "language",   pre: "Which", highlight: "language", post: "do you use most day-to-day?", sub: "Choose one. Add others if you’re comfortable." },
  { iconKey: "home",       pre: "Where do you call", highlight: "home", post: "?", sub: "Pick your country, then state/region." },
  { iconKey: "moveBudget", pre: "Who you’ll live with, when you'll move-in, and", highlight: "what you can spend", post: "?", sub: "Used only to filter obvious mismatches." },
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
  const DOT = 34;        // circle diameter
  const TRACK = 5;       // connector width
  const GAP = 12;        // space from dot to text column
  const PAD = DOT + GAP; // left padding for text column
  const SUB_PAD = 28;    // vertical space we reserve for the midline subtitle

  return (
    <Panel className="p-4 sm:p-5 h-full">
      <div className="mb-3 text-[12px] font-bold tracking-wide text-white/70">
        SETUP STEPS
      </div>

      <ol
        className="grid h-[calc(100%-8px)]"
        style={{ gridTemplateRows: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((label, i) => {
          const isActive = i === current;
          const isDone = i < current;
          const hasSub = !!meta?.[i]?.sub;

          return (
            <li
              key={label}
              className="relative min-h-[34px]"
              style={{
                ['--dot']: `${DOT}px`,
                ['--trk']: `${TRACK}px`,
                // Reserve space only when the subtitle is shown and there *is* a next step.
                paddingBottom: isActive && hasSub && i < steps.length - 1 ? SUB_PAD : 0,
              }}
            >
              {/* top connector */}
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

              {/* title */}
              <div style={{ paddingLeft: PAD, minHeight: DOT }}>
                <div
                  className={`flex items-center leading-none ${
                    isActive ? 'text-white' : 'text-white/85'
                  }`}
                  style={{ minHeight: DOT }}
                >
                  <span className="text-[17px] md:text-[19px] font-semibold">{label}</span>
                </div>
              </div>

              {/* subtitle */}
              {isActive && hasSub ? (
                i < steps.length - 1 ? (
                  // Centered between this dot and the next; pointer-events none so it never steals clicks.
                  <p
                    className="absolute z-10 text-[12px] leading-snug text-white/65 max-w-[300px] pr-3 pointer-events-none"
                    style={{
                      left: PAD,
                      top: `calc(25% + ${DOT / 2}px + 4px)`, // midline + tiny nudge
                    }}
                  >
                    {meta[i].sub}
                  </p>
                ) : (
                  // Last item: just place under the title.
                  <p className="mt-1 text-[12px] text-white/65 max-w-[300px]" style={{ paddingLeft: PAD }}>
                    {meta[i].sub}
                  </p>
                )
              ) : null}
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
  const navigate = useNavigate();
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
    lifestyle: {
      sleepPattern: "",
      quietAfter: "22:00",
      quietUntil: "07:00",
      cleanliness: 3,
      cleanlinessDetail: { bathroom: 3, kitchen: 3, dishes: 3, trash: 3 }, // NEW
    },
    habits: { diet: "", cookingFreq: "sometimes", smoking: "no", drinking: "social", partying: "occasionally" },
    pets: { hasPets: false, okWithPets: true, allergies: [] },
    dealbreakers: [],
    matching: { roommateGender: "any" }, // "female" | "male" | "any" | "prefer_not_say"
  });

  /* Load saved prefs and check completion status */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Check if user wants to edit preferences (from URL params)
        const urlParams = new URLSearchParams(window.location.search);
        const editMode = urlParams.get('edit') === 'true';
        
        // Check completion status first
        const completionResponse = await axiosInstance.get("/synapse/completion-status");
        const completionData = completionResponse?.data;
        
        if (mounted && completionData?.completed && !editMode) {
          // User has completed Synapse and doesn't want to edit, redirect to matches
          navigate('/Synapsematches', { replace: true });
          return;
        }
        
        // Load preferences and set appropriate step
        const r = await axiosInstance.get("/synapse/preferences");
        if (mounted && r?.data?.preferences) {
          setPrefs((p) => ({ ...p, ...r.data.preferences }));
          
          // Set step based on completion progress
          if (completionData?.lastStep && completionData.lastStep > 0) {
            setStep(completionData.lastStep);
          }
        }
        
        // If user is in edit mode and completed, start from step 0 to allow full review
        if (editMode && completionData?.completed) {
          setStep(0);
        }
      } catch (error) {
        console.error('Error loading Synapse data:', error);
      } finally { 
        if (mounted) setLoading(false); 
      }
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
  const setMatching  = (patch) => savePrefs({ matching:  { ...prefs.matching,  ...patch } });

  const nextStep = async () => {
    setTyping(true); 
    await new Promise((r) => setTimeout(r, 220 + Math.random() * 280)); 
    setTyping(false);
    
    const newStep = Math.min(step + 1, STEPS.length - 1);
    setStep(newStep);
    
    // Update progress in backend
    try {
      const completionPercentage = Math.round(((newStep + 1) / STEPS.length) * 100);
      await axiosInstance.post("/synapse/progress", {
        step: newStep,
        completionPercentage
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
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

// STEP 1: Language (compact, 2-column, no ISO badges)
const StepLanguage = () => {
  // Keep a controlled input for "Other"
  const [otherLang, setOtherLang] = useState(() => {
    const pl = prefs.culture.primaryLanguage;
    const isPreset = LANG_PRESETS.some((l) => l.code === pl);
    return pl && !isPreset ? String(pl) : "";
  });

  // If primaryLanguage becomes a custom value elsewhere, reflect it here
  useEffect(() => {
    const pl = prefs.culture.primaryLanguage;
    const isPreset = LANG_PRESETS.some((l) => l.code === pl);
    if (pl && !isPreset) setOtherLang(String(pl));
  }, [prefs.culture.primaryLanguage]);

  const isPresetSelected = LANG_PRESETS.some(
    (l) => l.code === prefs.culture.primaryLanguage
  );
  const isCustomSelected =
    !!prefs.culture.primaryLanguage && !isPresetSelected;

  const handlePresetClick = (code) => {
    const next = prefs.culture.primaryLanguage === code ? "" : code;
    if (next && next !== prefs.culture.primaryLanguage) setOtherLang("");
    const cleanedOthers = (prefs.culture.otherLanguages || []).filter(x => x !== next);
    setCulture({ primaryLanguage: next, otherLanguages: cleanedOthers });
  };

  const commitCustom = () => {
    const v = (otherLang || "").trim();
    if (!v) return;
    const cleanedOthers = (prefs.culture.otherLanguages || []).filter(x => x !== v);
    setCulture({ primaryLanguage: v, otherLanguages: cleanedOthers });
  };

  const comfortOpts = [
    { k: "same", t: "Prefer same language" },
    { k: "either", t: "Either is fine" },
    { k: "learn", t: "Happy to learn/teach" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] items-start max-w-[920px]">
      {/* LEFT: Primary language + Other + Also comfortable */}
      <div>
        {/* Heading */}
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[16px] md:text-[18px] font-semibold text-white/95">
            Daily language
          </span>
          <Pill>Used for vibe only</Pill>
        </div>

        {/* Preset chips (text only; no ISO badges) */}
        <div className="flex flex-wrap gap-2">
          {LANG_PRESETS.map((l) => {
            const on = prefs.culture.primaryLanguage === l.code;
            return (
              <Chip key={l.code} active={on} onClick={() => handlePresetClick(l.code)}>
                {l.label}
              </Chip>
            );
          })}

          {/* Show selected custom language as a chip so it’s visible & dismissible */}
          {isCustomSelected && (
            <Chip
              active
              onClick={() => {
                setCulture({ primaryLanguage: "" });
              }}
            >
              {String(prefs.culture.primaryLanguage)} ✕
            </Chip>
          )}
        </div>

        {/* "Other" compact input */}
        <div className="mt-3 max-w-[560px]">
          <Input
            className="w-full"
            placeholder="Search or type another language… (press Enter)"
            value={otherLang}
            onChange={(e) => setOtherLang(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitCustom();
              }
            }}
          />
        </div>

        {/* Also comfortable with… — horizontal chip rail to avoid vertical scroll */}
        <div className="mt-6">
          <div className="mb-2 text-[13px] font-semibold">
            Also comfortable with… (optional)
          </div>

          {/* Same compact style as Daily language */}
          <div className="flex flex-wrap gap-2">
            {LANG_PRESETS.map((l) => {
              const arr = prefs.culture.otherLanguages || [];
              const on = arr.includes(l.code);
              return (
                <Chip
                  key={l.code}
                  active={on}
                  onClick={() =>{
                    if (l.code === prefs.culture.primaryLanguage) return;
                    setCulture({
                      otherLanguages: on
                        ? arr.filter((x) => x !== l.code)
                        : [...arr, l.code],
                    })
                  }}
                >
                  {l.label}
                </Chip>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right side: Language comfort with roommates */}
      <aside className="rounded-3xl border border-white/12 bg-white/[0.03] p-4 sm:p-5 w-full max-w-[320px]">
        <h3 className="text-white text-[20px] sm:text-[22px] font-bold leading-tight mb-3">
          Language
          <br /> comfort with
          <br /> roommates
        </h3>

        <div className="grid gap-3">
          {[
            { k: "same",   t: "Prefer same language" },
            { k: "either", t: "Either is fine" },
            { k: "learn",  t: "Happy to learn/teach" },
          ].map(({ k, t }) => {
            const on = prefs.culture.languageComfort === k;
            return (
              <Chip
                key={k}
                size="lg"
                className="w-full h-[48px] justify-center"
                active={on}
                onClick={() => setCulture({ languageComfort: k })}
              >
                {t}
              </Chip>
            );
          })}
        </div>

        <p className="mt-3 text-[12px] text-white/55">
          Used only to improve matching. You can change this anytime.
        </p>
      </aside>

    </div>
  );
};



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

    // ✅ Show label only (no flag here; the flag is rendered via `left`)
    const fmt = (o) => (o?.label ?? "");

    // ✅ Single flag on the left
    const leftFlag = (o) =>
      o ? <span className="text-lg leading-none">{o.flag || flagEmoji(o.iso2)}</span> : null;

    // (We no longer need rightDial)

    const onCountry = async (opt) => {
      setCulture({ home: { country: opt.label, countryISO: opt.iso2, region: "", city: "" } });
      try { setStates(await loadStates(opt.label)); setCities([]); } catch { setStates([]); setCities([]); }
    };
    const onState = async (opt) => {
      setCulture({ home: { ...prefs.culture.home, region: opt.value, city: "" } });
      try { setCities(await loadCities(prefs.culture.home.country, opt.value)); } catch { setCities([]); }
    };
    const onCity = (opt) => setCulture({ home: { ...prefs.culture.home, city: opt.value } });

    return (
      <div className="grid gap-3 md:grid-cols-2">
        <SearchSelect
          label="Country"
          value={selectedCountry}
          onChange={onCountry}
          options={countries}
          format={fmt}
          left={leftFlag}      // keep the single flag here
          // right removed to drop phone codes
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

  // STEP 3: Move-in & Budget
const StepMoveBudget = () => {
  const monthRef = useRef(null);

  // NEW: budget input stays focused while typing
  const budgetRef = useRef(null);
  const [draftBudget, setDraftBudget] = useState(
    prefs.logistics.budgetMax != null ? String(prefs.logistics.budgetMax) : ""
  );

  // Keep draft in sync with server/state changes, but don't overwrite while typing
  useEffect(() => {
    if (document.activeElement !== budgetRef.current) {
      setDraftBudget(prefs.logistics.budgetMax != null ? String(prefs.logistics.budgetMax) : "");
    }
  }, [prefs.logistics.budgetMax]);

  const commitBudget = () => {
    const cleaned = draftBudget.replace(/[^\d]/g, "");
    const n = cleaned === "" ? null : Number(cleaned);
    setLogistics({ budgetMax: n });
  };

  return (
    <div className="space-y-8">
      {/* Roommate gender comfort — discreet, respectful */}
      <div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[15px] md:text-[16px] font-semibold text-white">
            Who are you comfortable sharing a home with?
          </span>
          <span className="text-[12px] text-white/60">Used only for matching — kept private</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "female", t: "Female roommates only", icon: "/src/assets/icons/woman.png" },
            { k: "male", t: "Male roommates only", icon: "/src/assets/icons/man.png" },
            { k: "any", t: "Any gender is fine", icon: "/src/assets/icons/man_women.png" },
          ].map(({ k, t, icon }) => {
            const on = (prefs.matching?.roommateGender ?? "any") === k;
            return (
              <GenderPreferenceChip
                key={k}
                active={on}
                onClick={() => setMatching({ roommateGender: k })}
                icon={icon}
              >
                {t}
              </GenderPreferenceChip>
            );
          })}
        </div>
      </div>

      {/* Block 1 & 2 — Move-in month & Lease length (horizontal layout) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Move-in month section */}
        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[15px] md:text-[16px] font-semibold text-white">Move-in month</span>
            <span className="text-[12px] text-white/60">Used only to match timing</span>
          </div>

          <div
            className="relative max-w-[400px] cursor-text"
            role="button"
            aria-label="Open month picker"
            onClick={() => {
              const el = monthRef.current;
              if (!el) return;
              if (typeof el.showPicker === "function") el.showPicker();
              else el.focus();
            }}
          >
            <Input
              ref={monthRef}
              type="month"
              className="nr-month pr-20"  // room for icon + clear
              placeholder="Select month"
              value={prefs.logistics.moveInMonth || ""}
              onFocus={(e) => {
                // Open on focus for keyboard/tab users
                const el = e.currentTarget;
                if (typeof el.showPicker === "function") el.showPicker();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const el = monthRef.current;
                  if (!el) return;
                  if (typeof el.showPicker === "function") el.showPicker();
                }
              }}
              onChange={(e) => setLogistics({ moveInMonth: (e.target.value || "").slice(0, 7) })}
              aria-haspopup="dialog"
              aria-expanded="false"
            />

            {/* Calendar icon — decorative (clicks pass through) */}
            <span
              className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center"
              aria-hidden="true"
            >
              <CalendarClock size={18} className="text-white/80" />
            </span>

            {/* Clear button (appears only when set) */}
            {prefs.logistics.moveInMonth ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLogistics({ moveInMonth: null });
                  // Keep focus behavior sane
                  const el = monthRef.current;
                  if (el) el.focus();
                }}
                className="absolute inset-y-0 right-10 my-[4px] grid place-items-center rounded-lg px-2
                           text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-amber-400/60"
                aria-label="Clear selected month"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Quick picks (optional, tiny quality-of-life)
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip onClick={() => {
              const now = new Date();
              const v = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
              setLogistics({ moveInMonth: v });
            }}>This month</Chip>
            <Chip onClick={() => {
              const d = new Date(); d.setMonth(d.getMonth() + 1);
              const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
              setLogistics({ moveInMonth: v });
            }}>Next month</Chip>
          </div> */}
        </div>

        {/* Vertical dotted separator */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dotted border-white/20 transform -translate-x-1/2"></div>

        {/* Lease length section */}
        <div className="pl-3">
          <div className="mb-2 text-[15px] md:text-[16px] font-semibold text-white">Lease length</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={prefs.logistics.leaseMonths === 6}  onClick={() => setLogistics({ leaseMonths: 6  })}>6–9 mo</Chip>
            <Chip active={prefs.logistics.leaseMonths === 12} onClick={() => setLogistics({ leaseMonths: 12 })}>10–12 mo</Chip>
            <Chip active={prefs.logistics.leaseMonths === 15} onClick={() => setLogistics({ leaseMonths: 15 })}>12+ mo</Chip>
          </div>
        </div>
      </div>

      {/* Block 3 — Budget */}
        <div>
          <div className="mb-2 text-[15px] md:text-[16px] font-semibold text-white">
            Max monthly budget (USD)
          </div>

          <div className="grid gap-3 md:grid-cols-2 items-start">
            {/* Input with $ prefix; commit on blur/Enter */}
            <div className="relative max-w-[540px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/55">$</span>
              <Input
                ref={budgetRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="pl-7"
                placeholder="e.g., 900"
                value={draftBudget}
                onChange={(e) => setDraftBudget(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={commitBudget}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitBudget();
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Maximum monthly budget in USD"
              />
            </div>

            {/* Quick picks also update the draft immediately */}
            <div className="flex flex-wrap gap-2">
              {[600, 800, 1000, 1200].map((v) => (
                <Chip
                  key={v}
                  active={prefs.logistics.budgetMax === v}
                  onClick={() => {
                    setDraftBudget(String(v));
                    setLogistics({ budgetMax: v });
                  }}
                >
                  ≤ ${v}
                </Chip>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};



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
        {/* Quiet After Time Picker */}
        <div
          className="relative cursor-text"
          role="button"
          aria-label="Open quiet after time picker"
          onClick={() => {
            const el = document.querySelector('input[name="quietAfter"]');
            if (el) {
              if (typeof el.showPicker === "function") el.showPicker();
              else el.focus();
            }
          }}
        >
          <Input 
            name="quietAfter"
            type="time" 
            value={prefs.lifestyle.quietAfter} 
            onChange={(e) => setLifestyle({ quietAfter: e.target.value })}
            onFocus={(e) => {
              const el = e.currentTarget;
              if (typeof el.showPicker === "function") el.showPicker();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const el = e.currentTarget;
                if (typeof el.showPicker === "function") el.showPicker();
              }
            }}
          />
        </div>

        {/* Quiet Until Time Picker */}
        <div
          className="relative cursor-text"
          role="button"
          aria-label="Open quiet until time picker"
          onClick={() => {
            const el = document.querySelector('input[name="quietUntil"]');
            if (el) {
              if (typeof el.showPicker === "function") el.showPicker();
              else el.focus();
            }
          }}
        >
          <Input 
            name="quietUntil"
            type="time" 
            value={prefs.lifestyle.quietUntil} 
            onChange={(e) => setLifestyle({ quietUntil: e.target.value })}
            onFocus={(e) => {
              const el = e.currentTarget;
              if (typeof el.showPicker === "function") el.showPicker();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const el = e.currentTarget;
                if (typeof el.showPicker === "function") el.showPicker();
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  const FieldHeading = ({ children, hint }) => (
  <div className="mb-1.5 flex items-baseline gap-2">
    <span className="text-[16px] md:text-[18px] font-semibold text-white/95">
      {children}
    </span>
    {hint ? <span className="text-[11px] text-white/55">{hint}</span> : null}
  </div>
);

// Small 0/3 meter
function LimitMeter({ count = 0, limit = 3 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: limit }).map((_, i) => (
        <span
          key={i}
          className={[
            "inline-block h-2.5 w-2.5 rounded-full",
            i < count ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.55)]" : "bg-white/18"
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// Base icon with an optional "ban" overlay
function DBIcon({ Base, banned, size = "md" }) {
  const baseCls = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const banCls  = size === "lg" ? "h-4 w-4 -right-1 -bottom-1.5" : "h-3.5 w-3.5 -right-1 -bottom-1";
   return (
    <span className="relative inline-grid place-items-center">
      <Base className="h-4 w-4 text-white/85" />
      {banned && (<Ban className={`absolute ${banCls} text-rose-400 drop-shadow`} />)}
    </span>
  );
}

// Evenly-spaced chip grid that wraps across rows
function ChipCloud({ children, min = 140, className = "" }) {
  return (
    <div
      className={`grid gap-2 sm:gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {React.Children.map(children, (child) => (
        <div className="min-w-0">{child}</div>
      ))}
    </div>
  );
}


  // helper (place above StepCleanliness or near other small atoms)
function SliderRow({ label, value, onChange, left = "Low", right = "High" }) {
  return (
    <div className="mb-5">
      <div className="mb-1 text-[14px] md:text-[15px] font-semibold text-white">{label}</div>
      <div className="flex items-center gap-3">
        <span className="w-32 shrink-0 text-[12px] text-white/55">{left}</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="nr-range"                       // NEW
          style={{ "--pct": `${((value - 1) / 4) * 100}%` }} // NEW: fill up to thumb
        />
        <span className="w-32 shrink-0 text-right text-[12px] text-white/55">{right}</span>
      </div>
      <div className="mt-1 text-[12px] text-white/60 flex items-center gap-2">
        Preference: <PrefBadge value={value} />
      </div>
    </div>
  );
}

function prefScale(v) {
  // 1 (relaxed) → 5 (meticulous)
  switch (v) {
    case 1: return { text: "text-rose-300",     bg: "bg-rose-500/10",     ring: "ring-rose-400/30",     dot: "bg-rose-400",     label: "Very relaxed" };
    case 2: return { text: "text-orange-300",   bg: "bg-orange-500/10",   ring: "ring-orange-400/30",   dot: "bg-orange-400",   label: "Relaxed" };
    case 3: return { text: "text-amber-300",    bg: "bg-amber-500/10",    ring: "ring-amber-400/30",    dot: "bg-amber-400",    label: "Moderate" };
    case 4: return { text: "text-lime-300",     bg: "bg-lime-500/10",     ring: "ring-lime-400/30",     dot: "bg-lime-400",     label: "High" };
    default:
    case 5: return { text: "text-emerald-300",  bg: "bg-emerald-500/10",  ring: "ring-emerald-400/30",  dot: "bg-emerald-400",  label: "Very high" };
  }
}

function PrefBadge({ value }) {
  const t = prefScale(Number(value) || 0);
  return (
    <span
      title={t.label}
      className={[
        "inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-[2px]",
        "text-[12px] font-semibold ring-1",
        t.text, t.bg, t.ring,
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {value}
    </span>
  );
}

function CompactSliderRow({
  label,
  minLabel,
  maxLabel,
  value = 3,
  onChange,
  className = "",
}) {
  return (
    <div className={`py-1 ${className}`}>
      {/* Title + colored badge inline to save vertical space */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] md:text-[15px] font-semibold text-white">
          {label}
        </div>
        <PrefBadge value={value} />
      </div>

      {/* Slider + tiny endpoints */}
      <div className="mt-1">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="mt-1 flex justify-between text-[11px] text-white/55 leading-none">
          <span className="truncate pr-2">{minLabel}</span>
          <span className="truncate pl-2">{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}


const StepCleanliness = () => {
  const L = prefs.lifestyle || {};
  return (
    <div className="max-w-[820px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {/* Full-width first row */}
        <CompactSliderRow
          className="md:col-span-2"
          label="Overall cleanliness"
          minLabel="Laid-back"
          maxLabel="Meticulous"
          value={L.cleanliness ?? 3}
          onChange={(v) => setLifestyle({ cleanliness: v })}
        />

        <CompactSliderRow
          label="Bathroom upkeep"
          minLabel="OK if clean weekly"
          maxLabel="Spotless daily"
          value={L.bathroomUpkeep ?? 3}
          onChange={(v) => setLifestyle({ bathroomUpkeep: v })}
        />

        <CompactSliderRow
          label="Kitchen cleanup"
          minLabel="Tidy later"
          maxLabel="Clean after cooking"
          value={L.kitchenCleanup ?? 3}
          onChange={(v) => setLifestyle({ kitchenCleanup: v })}
        />

        <CompactSliderRow
          label="Dishes turnaround"
          minLabel="Within 24–48h"
          maxLabel="After each meal"
          value={L.dishesTurnaround ?? 3}
          onChange={(v) => setLifestyle({ dishesTurnaround: v })}
        />

        <CompactSliderRow
          label="Trash & recycling cadence"
          minLabel="When full"
          maxLabel="Every 1–2 days"
          value={L.trashCadence ?? 3}
          onChange={(v) => setLifestyle({ trashCadence: v })}
        />
      </div>
    </div>
  );
};



  const StepDietCooking = () => (
  <div className="space-y-7">
    {/* Diet */}
    <div>
      <FieldHeading>Diet</FieldHeading>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "veg", t: "Vegetarian" },
          { k: "vegan", t: "Vegan" },
          { k: "nonveg", t: "Non-veg" },
        ].map((o) => (
          <Chip
            key={o.k}
            size="lg"
            active={prefs.habits.diet === o.k}
            onClick={() => setHabits({ diet: o.k })}
          >
            {o.t}
          </Chip>
        ))}
      </div>
    </div>

    <Divider />

    {/* Cooking frequency – segmented look */}
    <div>
      <FieldHeading>Cooking frequency</FieldHeading>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "rare",       t: "Cook rarely",     I: Moon     },
          { k: "sometimes",  t: "Cook sometimes",  I: Timer    },
          { k: "often",      t: "Cook often",      I: Utensils },
        ].map(({ k, t, I }) => {
          const active = prefs.habits.cookingFreq === k;
          return (
            <Chip
              key={k}
              size="lg"
              active={active}
              onClick={() => setHabits({ cookingFreq: k })}
            >
              <I
                className={`h-4 w-4 ${active ? "text-black/80" : "text-white/80"}`}
                strokeWidth={1.8}
              />
              <span>{t}</span>
            </Chip>
          );
        })}
      </div>
    </div>
  </div>
);


  const StepHabits = () => (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-15">
    {/* Smoking */}
    <div className="space-y-2">
      <FieldHeading hint="No judgement — just setting expectations">Smoking</FieldHeading>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "no",           t: "No",            I: CigaretteOff },
          { k: "outdoor_only", t: "Outdoor only",  I: Cigarette    },
          { k: "yes",          t: "Yes",           I: Cigarette    },
        ].map(({ k, t, I }) => {
          const on = prefs.habits.smoking === k;
          return (
            <Chip key={k} active={on} onClick={() => setHabits({ smoking: k })}>
              <I className={`${on ? "text-black/80" : "text-white/80"} h-4 w-4`} strokeWidth={1.8} />
              <span>{t}</span>
            </Chip>
          );
        })}
      </div>
      <p className="text-[12px] text-white/45">“Outdoor only” = balconies/porches, never indoors.</p>
    </div>

    {/* Drinking */}
    <div className="space-y-2">
      <FieldHeading>Drinking</FieldHeading>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "no",       t: "No",      I: Ban  },
          { k: "social",   t: "Social",  I: Wine },
          { k: "frequent", t: "Frequent",I: Wine },
        ].map(({ k, t, I }) => {
          const on = prefs.habits.drinking === k;
          return (
            <Chip key={k} active={on} onClick={() => setHabits({ drinking: k })}>
              <I className={`${on ? "text-black/80" : "text-white/80"} h-4 w-4`} strokeWidth={1.8} />
              <span>{t}</span>
            </Chip>
          );
        })}
      </div>
    </div>

    {/* Parties (full width) */}
    <div className="space-y-2 xl:col-span-2">
      <FieldHeading>Parties</FieldHeading>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "no",           t: "No parties",   I: Ban         },
          { k: "occasionally", t: "Occasionally", I: PartyPopper },
          { k: "frequent",     t: "Frequent",     I: PartyPopper },
        ].map(({ k, t, I }) => {
          const on = prefs.habits.partying === k;
          return (
            <Chip key={k} active={on} onClick={() => setHabits({ partying: k })}>
              <I className={`${on ? "text-black/80" : "text-white/80"} h-4 w-4`} strokeWidth={1.8} />
              <span>{t}</span>
            </Chip>
          );
        })}
      </div>
    </div>
  </div>
);


  const StepPets = () => {
  const suggestions = ["cats", "dogs", "birds", "rabbits", "rodents", "reptiles", "fish"];

  const addAllergy = (v) => {
    const val = (v || "").trim();
    if (!val) return;
    const cur = prefs.pets.allergies || [];
    if (!cur.includes(val)) setPets({ allergies: [...cur, val] });
  };

  const removeAllergy = (v) =>
    setPets({ allergies: (prefs.pets.allergies || []).filter((x) => x !== v) });

  return (
    <div className="space-y-6 max-w-[760px]">
      {/* Row: binary preferences */}
      <div className="space-y-2">
        <FieldHeading>Pets</FieldHeading>
        <div className="flex flex-wrap gap-2">
          <Chip
            active={prefs.pets.hasPets}
            onClick={() => setPets({ hasPets: !prefs.pets.hasPets })}
          >
            <PawPrint className={`${prefs.pets.hasPets ? "text-black/80" : "text-white/85"} h-4 w-4`} />
            I have pets
          </Chip>
          <Chip
            active={prefs.pets.okWithPets}
            onClick={() => setPets({ okWithPets: !prefs.pets.okWithPets })}
          >
            {prefs.pets.okWithPets ? (
              <Heart className="h-4 w-4 text-black/80" />
            ) : (
              <Heart className="h-4 w-4 text-white/85" />
            )}
            I’m okay with pets
          </Chip>
          {!prefs.pets.okWithPets && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/60">
              <Ban className="h-3.5 w-3.5" /> roommates’ pets not preferred
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/45">
          This helps us match you with owners and roommates who align with your comfort.
        </p>
      </div>

      {/* Row: allergies */}
      <div className="space-y-2">
        <FieldHeading>Allergies</FieldHeading>
        <div className="relative w-full">
          <Input
            placeholder="Type an allergy and press Enter (e.g., cats)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAllergy(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
            aria-label="Add a pet allergy"
          />
        </div>

        {/* Quick add suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <SuggestChip
              key={s}
              onClick={() => addAllergy(s)}
              disabled={(prefs.pets.allergies || []).includes(s)}
            >
              {s}
            </SuggestChip>
          ))}
        </div>

        {/* Active allergy tokens */}
        {(prefs.pets.allergies || []).length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {(prefs.pets.allergies || []).map((a) => (
              <AllergyTag key={a} label={a} onRemove={() => removeAllergy(a)} />
            ))}
          </div>
        ) : (
          <div className="text-[12px] text-white/45">No allergies added.</div>
        )}
      </div>
    </div>
  );
};


  const StepDealbreakers = () => {
  const opts = [
    { k: "no_smoking_indoors",   t: "No smoking indoors",  Base: Cigarette,  banned: true  },
    { k: "no_late_night_parties",t: "No late-night parties", Base: PartyPopper, banned: true },
    { k: "no_pets",              t: "No pets",             Base: PawPrint,   banned: true  },
    { k: "quiet_after_22",       t: "Quiet after 10PM",    Base: Moon,       banned: false },
    { k: "no_heavy_drinking",    t: "No heavy drinking",   Base: Wine,       banned: true  },
  ];

  const limit = 3;
  const selected = prefs.dealbreakers || [];
  const count = selected.length;
  const atLimit = count >= limit;

  const onToggle = (k) => {
    if (selected.includes(k)) {
      savePrefs({ dealbreakers: selected.filter((x) => x !== k) });
    } else if (!atLimit) {
      savePrefs({ dealbreakers: [...selected, k] });
    }
  };

  return (
    <div className="space-y-4 max-w-[780px]">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[16px] md:text-[18px] font-semibold">Deal-breakers</div>
        <div className="flex items-center gap-2 text-[12px]">
          <LimitMeter count={count} limit={limit} />
          <span className={atLimit ? "text-rose-300" : "text-white/65"}>
            You chose {count} / {limit}
          </span>
        </div>
      </div>
      <p className="text-[12px] text-white/55 -mt-2">Pick up to 3 non-negotiables.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opts.map(({ k, t, Base, banned }) => {
          const on = selected.includes(k);
          const disabled = !on && atLimit;
          return (
            <Chip
              key={k}
              size="lg"
              className="w-full min-h-[52px]"   // bigger target & full width
              active={on}
              disabled={disabled}
              onClick={() => onToggle(k)}
            >
              <DBIcon Base={Base} banned={banned} size="lg" />
              <span className="ml-1 leading-tight">{t}</span>
            </Chip>
          );
        })}
      </div>

      {count > 0 && (
        <div className="pt-1 text-[12px] text-white/60">
          Selected:&nbsp;
          {opts
            .filter(o => selected.includes(o.k))
            .map(o => o.t)
            .join(" • ")}
        </div>
      )}
    </div>
  );
};


  const StepFinish = () => {
  // Fire confetti when this step mounts - enhanced for major milestone
  useEffect(() => {
    // Delay confetti to let the completion message settle
    const t = setTimeout(() => {
      triggerConfetti();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const Badge = ({ children }) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/80">
      {children}
    </span>
  );

  return (
    <div className="relative">

      {/* Success header */}
      <div className="rounded-2xl ring-1 ring-white/10 p-4 sm:p-5 mb-4
                      bg-gradient-to-r from-emerald-400/10 via-amber-400/10 to-fuchsia-400/10">
        <div className="flex items-start gap-3">
          <div className="shrink-0 grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg">
            ✓
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold">Synapse is set!</div>
            <div className="text-white/75 text-sm md:text-[15px]">
              Compatibility badges will appear on housing cards and owner approvals.
            </div>
          </div>
        </div>

        {/* A tiny preview of the kinds of badges users will see */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge><Sparkles className="h-4 w-4" /> Clean & tidy</Badge>
          <Badge><Moon className="h-4 w-4" /> Quiet hours</Badge>
          <Badge><Utensils className="h-4 w-4" /> Cooking rhythm</Badge>
          <Badge><Route className="h-4 w-4" /> Commute</Badge>
          <Badge>Roommate comfort saved</Badge>
        </div>
      </div>

      <Divider />

      {/* Visibility settings */}
      <div className="space-y-2">
        <div className="text-[15px] md:text-[16px] font-semibold">Visibility</div>

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
              setCulture({
                visibility: { ...prefs.culture.visibility, shareCultureInPreviews: "banded" },
              })
            }
          >
            Share only “compatibility badges”
          </Chip>

          <Chip
            active={prefs.culture.visibility.shareCultureInPreviews === "details"}
            onClick={() =>
              setCulture({
                visibility: { ...prefs.culture.visibility, shareCultureInPreviews: "details" },
              })
            }
          >
            Share brief details
          </Chip>
        </div>

        <p className="text-[12px] text-white/55">
          You’re in control. Change these anytime in Settings. We never share your contact info without consent.
        </p>
      </div>
    </div>
  );
};


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

    // Add just above: const PANES_H = `calc(100vh - ${PANES_TOP + PANES_VPAD}px)`;
    const blockMsg = useMemo(() => {
      // Return a non-empty string to block the "Continue" button with this message.
      switch (step) {
        case 0: // Language & Comfort
          return prefs?.culture?.primaryLanguage
            ? ""
            : "Select your daily language to continue.";
        case 1: // Country & Region
          return prefs?.culture?.home?.country && prefs?.culture?.home?.region
            ? ""
            : "Pick your country and state/region to continue.";
        case 2: // Move-in & Budget
          return prefs?.logistics?.moveInMonth && (prefs?.logistics?.budgetMax ?? null) !== null
            ? ""
            : "Add your move-in month and a max monthly budget to continue.";
        case 3: // Distance & Commute
          return (prefs?.logistics?.commuteMode || []).length > 0
            ? ""
            : "Choose at least one commute mode to continue.";
        case 4: // Sleep & Quiet Hours
          return prefs?.lifestyle?.sleepPattern
            ? ""
            : "Pick your sleep pattern to continue.";
        case 6: // Diet & Cooking
          return prefs?.habits?.diet
            ? ""
            : "Select your diet to continue.";
        default:
          return ""; // other steps are optional / have safe defaults
      }
    }, [step, prefs]);
    const canContinue = !blockMsg;

  if (loading) {
    return (
      <div className="nr-dots-page min-h-screen text-white">
        <Navbar />
        <main className="min-h-[60vh] grid place-items-center">Loading Synapse…</main>
      </div>
    );
  }

  const PANES_H = `calc(100vh - ${PANES_TOP + PANES_VPAD}px)`;

  const isWideStep = step === 0; // Language screen gets more space
  const TOP = isWideStep ? PANES_TOP_WIDE : PANES_TOP;

  return (
    <div className="nr-dots-page text-white" style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 200% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <Navbar />

      {/* Clean hero section - minimal and space-efficient */}
      <section className="nr-hero-bg" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-start justify-between gap-8">
            {/* Left side - Title */}
            <div className="flex-1">
              <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-black tracking-tight leading-[1.1]">
                {(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const editMode = urlParams.get('edit') === 'true';
                  return editMode ? (
                    <div className="space-y-1">
                      <div className="text-white">Update your</div>
                      <div 
                        className="drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                        style={{
                          background: 'linear-gradient(90deg, #2563eb, #1e40af, #000000, #2563eb)',
                          backgroundSize: '200% 100%',
                          animation: 'gradientShift 3s ease-in-out infinite',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Synapse preferences.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-white">Let's tune your</div>
                      <div 
                        className="drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                        style={{
                          background: 'linear-gradient(90deg, #2563eb, #1e40af, #000000, #2563eb)',
                          backgroundSize: '200% 100%',
                          animation: 'gradientShift 3s ease-in-out infinite',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Synapse profile.
                      </div>
                    </div>
                  );
                })()}
              </h1>
            </div>

            {/* Right side - Edit Mode Banner */}
            {(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const editMode = urlParams.get('edit') === 'true';
              return editMode ? (
                <div className="flex-shrink-0">
                  <div className="relative bg-black border border-green-400/30 rounded-2xl p-5 w-[300px] shadow-lg shadow-green-500/10 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Edit className="text-green-300 text-xl" />
                      </div>
                      <div className="text-left">
                        <div className="text-green-300 font-bold text-lg">Edit Mode</div>
                        <div className="text-green-400/70 text-sm">Auto-saved changes</div>
                      </div>
                    </div>
                    <BorderBeam 
                      size={200}
                      duration={4}
                      colorFrom="#10b981"
                      colorTo="#000000"
                      borderWidth={2}
                      delay={0}
                      initialOffset={0}
                      reverse={false}
                    />
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </section>

      {/* Three-pane overlay */}
      <section
        className={`mx-auto ${isWideStep ? "max-w-[106rem] 2xl:max-w-[116rem]" : "max-w-[88rem] 2xl:max-w-[96rem]"} px-3 sm:px-4`}
        style={{
          position: "absolute",
          top: TOP,          // was PANES_TOP
          left: 0,
          right: 0,
          height: PANES_H,   // uses TOP above
        }}
      >
         <div
          id="roommateGrid"
          className="grid h-full items-start"
          style={{
            // widen the answers column on Language step
            gridTemplateColumns: isWideStep ? "0.7fr 0.75fr 1.3fr" : "1fr 1.35fr 1.75fr",
            gap: GRID_GAP,
          }}
        >
          {/* Left: Stepper */}
          <aside
            className={`hidden lg:block h-full min-h-0 ${
              isWideStep ? "ml-0" : "-ml-8 xl:-ml-12 2xl:-ml-16"
            }`}
          >
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
                        onClick={() => { if (canContinue) nextStep(); }}
                        disabled={!canContinue}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                          canContinue
                            ? "bg-white text-black active:translate-y-[1px]"
                            : "bg-white/10 text-white/50 cursor-not-allowed border border-white/15"
                        ].join(" ")}
                        aria-disabled={!canContinue}
                      >
                        Continue →
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // Mark as completed
                            await axiosInstance.post("/synapse/mark-complete");
                            // Redirect to matches
                            navigate('/Synapsematches');
                          } catch (error) {
                            console.error('Error marking as complete:', error);
                            // Still redirect even if API call fails
                            navigate('/Synapsematches');
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        See matches →
                      </button>
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
