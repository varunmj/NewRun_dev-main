// src/pages/RoommateMatches.jsx
// Synapse — NewRun's Roommate Matching UI
// (V2.6 — NewRun hero + auto-scroll intro, dotted grid page bg, on-brand cards)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import MatchCard from "../components/ProfileCard/MatchCard";
import "../styles/newrun-hero.css";
import "../styles/neumorphic-button.css";
import VerifiedIcon from "../assets/icons/icons8-verified-48.png";
import { expandLanguageCodes, expandLangsInText } from "../utils/languageNames";

import {
  Info, X, MapPin, Clock, Filter, Check, Languages, PawPrint, Moon, ChevronLeft, ChevronRight
} from "lucide-react";

/* =====================================================================
   Tunables (easy to tweak later)
   ===================================================================== */
const CARD_RING_SIZE = 56;   // px — match score ring on cards
const CARD_UNI_SIZE  = 56;   // px — university logo circle on cards
const DRAWER_RING    = 56;   // px — ring in drawer header
const DRAWER_UNI     = 56;   // px — uni logo in drawer header

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
function ScoreRing({ value = 0, size = 64, animated = true }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const hue = Math.round(Math.max(0, Math.min(100, displayValue)) * 1.2); // 0->120
  const ringColor = `hsl(${hue}, 85%, 55%)`;
  const isHighScore = displayValue >= 80;
  const isMediumScore = displayValue >= 60;

  return (
    <div
      aria-label={`Match score ${Math.round(displayValue)}%`}
      className="relative shrink-0 rounded-full transition-all duration-500 ease-out"
      style={{ 
        width: size, 
        height: size, 
        backgroundImage: `conic-gradient(${ringColor} ${Math.max(0, Math.min(100, displayValue)) * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        filter: isHighScore ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))' : 
                isMediumScore ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.2))' : 'none'
      }}
    >
      <div className="absolute" style={{ inset: 4, borderRadius: "9999px", background: "#10131a" }} />
      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-white/90">
        {Math.round(displayValue)}%
      </div>
      {isHighScore && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
      )}
    </div>
  );
}

/* =====================================================================
   Clearbit university logos
   ===================================================================== */
const UNI_DOMAINS = { "Northern Illinois University": "niu.edu", "University of Illinois Urbana-Champaign": "illinois.edu" , "University of Illinois Chicago": "uic.edu","Northwestern University": "northwestern.edu", "University of Chicago": "uchicago.edu", "DePaul University": "depaul.edu", "Loyola University Chicago": "luc.edu", "Illinois Institute of Technology": "iit.edu", "Stanford University": "stanford.edu", "University of California Berkeley": "berkeley.edu", "University of California Los Angeles": "ucla.edu", "University of Southern California": "usc.edu", "University of Texas Austin": "utexas.edu", "University of Texas Dallas": "utdallas.edu", "University of Texas San Antonio": "utsa.edu", "University of Texas Arlington": "uta.edu"};
const universityLogoUrl = (name = "") => {
  const n = String(name || "").trim();
  if (!n) return "";
  const domain = UNI_DOMAINS[n] || `${n.toLowerCase().replace(/[^a-z0-9]+/g, "")}.edu`;
  return `https://logo.clearbit.com/${domain}`;
};

// Circle uni logo (no text)
function UniversityLogoCircle({ university, size = 56 }) {
  if (!university) return null;
  const url = universityLogoUrl(university);
  if (!url) return null;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-white/10 bg-transparent"
      style={{ width: size, height: size }}
      title={university}
      aria-label={`University: ${university}`}
    >
      <img
        src={url}
        alt=""
        className="h-full w-full rounded-full object-contain"
        style={{ padding: Math.round(size * 0.06) }}
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
        <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">{title}</span>
        <span className="text-white/60">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t border-white/10 px-4 py-3">{children}</div>}
    </div>
  );
}
function ScoreRow({ part }) {
  const pct = part.max ? Math.max(0, Math.min(100, (part.got / part.max) * 100)) : 0;
  const hue = Math.round(pct * 1.2);
  const barColor = `hsl(${hue},85%,55%)`;
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 px-3 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: barColor }} />
          {part.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">{part.got} / {part.max}</span>
      </div>
      {part.note && <div className="mt-0.5 text-xs text-white/60">{part.note}</div>}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
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
    if (fParts.length >= 2) return `${fParts[0]} ${fParts[1]}`.trim();
    if (fParts.length === 1 && lParts.length >= 2) return `${fParts[0]} ${lParts[lParts.length - 1]}`.trim();
    const f = fParts[0] || "";
    const l = lParts[lParts.length - 1] || "";
    return `${f} ${l}`.trim() || (full || "").trim();
  }
  const tokens = split(full);
  if (tokens.length <= 2) return tokens.join(" ").trim();
  return `${tokens[0]} ${tokens[1]}`.trim();
};

function UniLogoCircle({ university, size = 56 }) {
  if (!university) return null;
  const badge = { width: size, height: size, borderRadius: size / 2 };
  const imgSize = Math.round(size * 0.58);
  return (
    <div
      className="flex items-center justify-center border border-white/12 bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      style={badge}
      aria-label="University"
      title={university}
    >
      <img
        src={universityLogoUrl(university)}
        alt=""
        className="pointer-events-none"
        style={{ width: imgSize, height: imgSize, objectFit: "contain" }}
        onError={(e)=>{ e.currentTarget.style.display="none"; }}
      />
    </div>
  );
}

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
  const pData = pResp?.data || {};
  const prefs = pData?.preferences || {};
  const raw = mResp?.data?.results || mResp?.data?.matches || [];
  return { prefs, raw, pData };   // ⬅️ include full payload
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
   Small hero with dotted grid + 4-dot progress
   ===================================================================== */
function HeroIntro({ firstName = "", onSkip }) {
  const [step, setStep] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, 4)), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // REMOVED: Auto-scroll trigger on user interaction - let users scroll naturally
  // React.useEffect(() => {
  //   const cancel = () => onSkip?.("user");
  //   window.addEventListener("wheel", cancel, { passive: true });
  //   window.addEventListener("touchstart", cancel, { passive: true });
  //   window.addEventListener("keydown", cancel);
  //   return () => {
  //     window.removeEventListener("wheel", cancel);
  //     window.removeEventListener("touchstart", cancel);
  //     window.removeEventListener("keydown", cancel);
  //   };
  // }, [onSkip]);

  const name = String(firstName || "").trim();
  const line1 = name ? `${name}, we've crunched your preferences.` : `We've crunched your preferences.`;
  const line2 = `Here are the roommates who match your lifestyle best.`;

  return (
    <section className="nr-hero-bg nr-hero-starry relative flex min-h-[60vh] items-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      </div>

      <div className="mx-auto w-full max-w-[110rem] px-4 py-14 relative z-10">
        {/* Enhanced headline with better typography and animations */}
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-extrabold leading-[1.1] tracking-tight">
            <span className="block text-[clamp(28px,4.5vw,48px)] mb-2">
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-lg">
                {line1}
              </span>
            </span>
            <span className="block text-[clamp(24px,4vw,44px)] mt-2">
              <span className="animated-gradient bg-clip-text text-transparent drop-shadow-lg">
                {line2}
              </span>
            </span>
          </h1>
        </div>

        {/* Enhanced tagline with better styling */}
        <div className={`mt-6 text-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center gap-2 text-[14px] text-white/80 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm shadow-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Transparent reasons • Quick actions • Safer connections
          </span>
        </div>

        {/* Enhanced CTA section */}
        <div className={`mt-8 text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => onSkip?.("cta")} 
              className="hero-cta-button group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-bold text-black shadow-[0_12px_32px_rgba(255,153,0,.4)] hover:shadow-[0_16px_40px_rgba(255,153,0,.5)] hover:scale-105 transition-all duration-300 hover:from-orange-400 hover:to-orange-500" 
              type="button"
            >
              <span>See your matches</span>
              <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
            </button>
            
            <div className="flex items-center gap-3 text-white/70">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-sm font-medium">Scroll down to explore</span>
            </div>
          </div>
        </div>

        {/* Enhanced progress indicator */}
        <div className={`mt-8 flex justify-center gap-3 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <span
                className={`progress-dot block h-2 w-2 rounded-full transition-all duration-500 ${
                  step > i 
                    ? "bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg shadow-orange-500/50 active" 
                    : "bg-white/25"
                }`}
              />
              {step > i && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 animate-ping opacity-30" />
              )}
            </div>
          ))}
        </div>

        {/* Social proof or stats */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-6 text-sm text-white/60">
            <div className="social-proof-item flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <span>10,000+ students matched</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="social-proof-item flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              </div>
              <span>95% satisfaction rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// Try hard to find user's first name from prefs or caches
function pickFirstName(anyObj) {
  const grab = (o, path) => {
    try {
      return path.split(".").reduce((x, k) => (x && x[k] != null ? x[k] : undefined), o);
    } catch { return undefined; }
  };

  // 1) Direct fields we might get with prefs/me
  const candidates = [
    grab(anyObj, "user.firstName"),
    grab(anyObj, "profile.firstName"),
    grab(anyObj, "preferences.profile.firstName"),
    grab(anyObj, "preferences.user.firstName"),
    grab(anyObj, "preferences.firstName"),
    grab(anyObj, "firstName"),
    // If we only have a full name, take the first token
    (grab(anyObj, "profile.name") || grab(anyObj, "preferences.profile.name") || grab(anyObj, "name"))?.split?.(/\s+/)?.[0],
  ].filter(Boolean);

  let fromLocal = "";
  try {
    const keys = ["firstName", "userFirstName", "nr:firstName", "nr_user", "user", "me", "authUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      if (k === "firstName" || k === "userFirstName" || k === "nr:firstName") {
        fromLocal = raw;
        break;
      }
      // keys that may store JSON user blobs
      try {
        const parsed = JSON.parse(raw);
        const fn = parsed?.firstName || parsed?.profile?.firstName || parsed?.user?.firstName || parsed?.name?.split?.(" ")?.[0];
        if (fn) { fromLocal = fn; break; }
      } catch { /* ignore */ }
    }
  } catch { /* SSR or blocked storage */ }

  const val = (candidates.find(Boolean) || fromLocal || "").toString().trim();
  // Normalize casing (Varun, not VARUN / varun)
  return val ? (val[0].toUpperCase() + val.slice(1)) : "";
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
  const [drawerIndex, setDrawerIndex] = useState(-1); // index within visibleMatches
  const [saved, setSaved] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());

  // Hero → Matches anchor for smooth auto-scroll
  const matchesRef = useRef(null);
  const autoScrollDoneRef = useRef(false);
  const [firstName, setFirstName] = useState("");

  // Load Synapse prefs + matches
  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setLoading(true); setError("");
      try {
        const { prefs, raw, pData } = await fetchSynapseData(filters.scope, c.signal);
        setPrefs(prefs);
        setFirstName((prev) => prev || pickFirstName(pData)); // keep any previously found value
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

  const smoothScrollToMatches = React.useCallback(() => {
    if (!matchesRef.current) return;
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    matchesRef.current.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    autoScrollDoneRef.current = true;
  }, []);

  const handleHeroSkip = React.useCallback(() => {
    smoothScrollToMatches();
  }, [smoothScrollToMatches]);

  // Auto-scroll DISABLED - let users scroll naturally
  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     if (!autoScrollDoneRef.current) smoothScrollToMatches();
  //   }, 4000);
  //   return () => clearTimeout(t);
  // }, [smoothScrollToMatches]);

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

  // Keep drawerMatch in sync with index and visibleMatches
  useEffect(() => {
    if (drawerIndex >= 0 && drawerIndex < visibleMatches.length) {
      setDrawerMatch(visibleMatches[drawerIndex]);
    }
  }, [drawerIndex, visibleMatches]);

  // Prefetch neighbor avatars for smoother nav
  useEffect(() => {
    if (drawerIndex < 0) return;
    const prefetch = (idx) => {
      const m = visibleMatches[idx];
      if (m?.avatarUrl) {
        const img = new Image();
        img.src = m.avatarUrl;
      }
    };
    prefetch(drawerIndex - 1);
    prefetch(drawerIndex + 1);
  }, [drawerIndex, visibleMatches]);

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar />

      {/* Hero with dotted grid + progress; user or CTA will trigger scroll */}
      <HeroIntro firstName={firstName} onSkip={handleHeroSkip} />

      {/* Subtle transition to blend hero with main content */}
      <div className="hero-to-main-transition pointer-events-none" />

      {/* Anchor for smooth scrolling target */}
      <div ref={matchesRef} />

      <main className="mx-auto w-full max-w-[110rem] px-4 pb-24 pt-6">
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
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
            {error}
          </div>
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
            onOpen={(m) => setDrawerIndex(visibleMatches.findIndex(v => v.userId === m.userId))}
            drawerOpen={!!drawerMatch}
            navigate={navigate}
          />
        )}
      </main>

      <MatchDrawer
        match={drawerMatch}
        prefs={prefs}
        onClose={() => { setDrawerMatch(null); setDrawerIndex(-1); }}
        onStartChat={(id) => {
          const match = visibleMatches.find(m => m.userId === id);
          if (match) {
            const matchReasons = match.reasons?.slice(0, 3).map(r => r.text).join(', ') || 'We have compatible preferences';
            const nameShort = displayName({ full: match.name, firstName: match.firstName, lastName: match.lastName });
            const hasBudget = typeof match.budget === "number";
            const preFilledMessage = `Hi ${nameShort}! 👋 

I found you through NewRun's roommate matching and we have a ${Math.round(match.matchScore || 0)}% compatibility score! 

Here's why I think we'd be great roommates:
• ${matchReasons}

${match.university ? `I see you're also at ${match.university} - that's awesome!` : ''}
${hasBudget ? `My budget is around $${match.budget}/month.` : ''}

Would you be interested in chatting about potentially being roommates? I'd love to learn more about what you're looking for! 

Looking forward to hearing from you! 😊`;
            
            // Use a safer encoding method that handles emojis properly
            const encodedMessage = encodeURIComponent(preFilledMessage).replace(/'/g, '%27');
            navigate(`/messaging?to=${id}&ctx=roommate&message=${encodedMessage}`);
          } else {
            navigate(`/messaging?to=${id}&ctx=roommate`);
          }
        }}
        onSaveToggle={async (id) => {
          const next = new Set(saved); if (next.has(id)) next.delete(id); else next.add(id); setSaved(next);
          const res = await postSave(id); if (!res.ok) console.warn("Save failed:", res.error);
        }}
        isSaved={(id) => saved.has(id)}
        onPrev={() => setDrawerIndex(i => Math.max(0, i - 1))}
        onNext={() => setDrawerIndex(i => Math.min(visibleMatches.length - 1, i + 1))}
        hasPrev={drawerIndex > 0}
        hasNext={drawerIndex >= 0 && drawerIndex < visibleMatches.length - 1}
      />
    </div>
  );
}

/* =====================================================================
   Header Bar
   ===================================================================== */
function HeaderBar({ count, query, setQuery, sort, setSort, filters, setFilters }) {
  const clearAll = () => {
    setSort('match');
    setFilters({ pets:'any', sleep:'any', scope:'school' });
  };

  const activeChips = [];
  if (sort !== 'match') activeChips.push({ key:'sort', label:`Sort: ${sort}`, onClear:()=>setSort('match') });
  if (filters.pets !== 'any') activeChips.push({ key:'pets', label:`Pets: ${filters.pets.toUpperCase()}`, onClear:()=>setFilters(f=>({...f,pets:'any'})) });
  if (filters.sleep !== 'any') activeChips.push({ key:'sleep', label:`Sleep: ${filters.sleep}`, onClear:()=>setFilters(f=>({...f,sleep:'any'})) });
  if (filters.scope !== 'school') activeChips.push({ key:'scope', label:`Scope: ${filters.scope}`, onClear:()=>setFilters(f=>({...f,scope:'school'})) });

  return (
    <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Top Matches <span className="text-white/60">({count})</span>
        </h1>
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
            <div className="pointer-events-none absolute right-3 top-2.5 text-white/40">
              <Filter size={16} />
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
            <button onClick={() => setSort("match")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="match" ? "bg-white/10" : "text-white/70")}>Best Match</button>
            <button onClick={() => setSort("distance")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="distance" ? "bg-white/10" : "text-white/70")}>Distance</button>
            <button onClick={() => setSort("activity")} className={cn("rounded-lg px-2 py-1 text-xs", sort==="activity" ? "bg-white/10" : "text-white/70")}>Active</button>
          </div>
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
          <FilterChip
            icon={<Info size={14} />}
            label="Scope"
            value={filters.scope}
            options={[{k:"school", n:"School"},{k:"country", n:"Country"},{k:"any", n:"Any"}]}
            onChange={(v)=>setFilters(f=>({...f, scope:v}))}
          />
        </div>
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {activeChips.map(c => (
          <span key={c.key} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {c.label}
            <button onClick={c.onClear} className="rounded bg-white/10 px-1 text-white/70 hover:bg-white/20">×</button>
          </span>
        ))}
        {activeChips.length > 0 && (
          <button onClick={clearAll} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10">Clear all</button>
        )}
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
          <button key={o.k} onClick={()=>onChange(o.k)} className={cn("rounded-md px-2 py-1", value===o.k ? "bg-white/10" : "text-white/70")}>
            {o.n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   Grid + Cards
   ===================================================================== */
function MatchGrid({ items, saved, onSaveToggle, onHide, onOpen, drawerOpen, navigate }) {
  if (!items.length) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <h3 className="text-lg font-semibold">No matches found</h3>
        <p className="mt-2 max-w-xl text-sm text-white/70">Try adjusting your Synapse preferences or expanding the scope.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(item => (
        <MatchCard
          key={item.userId}
          item={item}
          onOpen={()=>onOpen(item)}
          onMessage={(userId, message) => {
            if (message) {
              const encodedMessage = encodeURIComponent(message);
              navigate(`/messaging?to=${userId}&ctx=roommate&message=${encodedMessage}`);
            } else {
              navigate(`/messaging?to=${userId}&ctx=roommate`);
            }
          }}
          hideOverlays={drawerOpen}
        />
      ))}
    </div>
  );
}

function NeoButton({ children, size = "sm", className = "", ...props }) {
  const sizeClass = size === "sm" ? "styled-button--sm" : "styled-button";
  return (
    <button type="button" {...props} className={cn(sizeClass, className)}>
      {children}
    </button>
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
function MatchDrawer({ match, prefs, onClose, onStartChat, onSaveToggle, isSaved, onPrev, onNext, hasPrev, hasNext }) {
  const panelRef = useRef(null);
  const open = !!match;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div aria-hidden={!open} className={cn("fixed inset-0 z-50 transition", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div onClick={onClose} className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full max-w-[700px] overflow-y-auto border-l border-white/10 bg-[#0d1017] shadow-2xl transition-transform will-change-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ 
          height: "100vh",
          maxHeight: "100vh", 
          overflowY: "auto",
          WebkitOverflowScrolling: "touch"
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Match details"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1017]/95 px-5 py-4 backdrop-blur">
          <span className="text-sm font-semibold">Match details</span>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10" aria-label="Close"><X size={16}/></button>
        </div>

        {!match ? <DrawerSkeleton /> :
          <DrawerBody profile={match} prefs={prefs} onStartChat={onStartChat} onSaveToggle={onSaveToggle} isSaved={isSaved} hasPrev={hasPrev} hasNext={hasNext} onPrev={onPrev} onNext={onNext} />
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

function DrawerBody({ profile, prefs, onStartChat, onSaveToggle, isSaved, hasPrev, hasNext, onPrev, onNext }) {
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
  const langsHuman = expandLanguageCodes(langs);

  return (
    <div className="px-5 pb-10 pt-4">
      {/* Header row: avatar + name + uni + ring */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-white/0 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white/10">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{profile.name.slice(0,1)}</div>}
            {profile.verified?.edu && (
              <img src={VerifiedIcon} alt="Verified" className="h-7 w-7 -mt-[1px] select-none" />
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

        <div className="rounded-2xl bg-black/40 p-2 border border-white/10 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
          <ScoreRing value={displayScore} size={DRAWER_RING} />
        </div>
      </div>
      </div>

      {/* Quick reasons */}
      {top3.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-4">
          <p className="text-sm text-white/70">Why this is a strong match</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm">
            {top3.map((r, i) => (
              <li key={i} className="inline-flex items-start gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Check size={14}/></span>
                <span>{expandLangsInText(r.text)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* About + languages/traits */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-wide text-white/80">About {profile.name.split(" ")[0]}</h4>
          {typeof profile.budget === "number" && <span className="text-xs text-white/60">${profile.budget}/mo</span>}
        </div>
        <p className="mt-2 text-sm text-white/80">
          {profile.bio || "They haven’t written a bio yet — start a chat to learn what they’re looking for."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {langs.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
              <Languages size={12}/> {langsHuman.join(", ")}
            </span>
          )}
          {traits.map(t => (
            <span key={t} className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">{t}</span>
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

      {/* CTAs (at bottom, not sticky to allow scrolling) */}
      <div className="mt-8">
      <div className="border-t border-white/10 bg-[#0d1017] pt-4 pb-6">
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <button
            disabled={!hasPrev}
            onClick={onPrev}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border border-white/10",
              hasPrev ? "bg-white/5 hover:bg-white/10" : "opacity-40 cursor-default"
            )}
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Prev</span>
          </button>
          <button
            disabled={!hasNext}
            onClick={onNext}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border border-white/10",
              hasNext ? "bg-white/5 hover:bg-white/10" : "opacity-40 cursor-default"
            )}
          >
            <span>Next</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        <div className="px-5 pb-3 flex gap-3">
          <button onClick={()=>onStartChat(profile.userId)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10">Start chat</button>
          <button onClick={()=>onSaveToggle(profile.userId)} className={cn("rounded-xl border border-white/10 px-4 py-3 text-sm font-medium", saved?"bg-pink-500/10 text-pink-300":"bg-white/5 hover:bg-white/10")}>{saved?"Saved":"Save match"}</button>
        </div>
      </div>
      </div>
    </div>
  );
}
