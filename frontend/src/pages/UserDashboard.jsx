// src/pages/UserDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import {
  MdClose, MdArrowForwardIos, MdMicNone, MdTune,
  MdKingBed, MdBathtub, MdSquareFoot, MdPets,
  MdLocalParking, MdLocalLaundryService, MdCalendarToday, MdLocationOn,
  MdFavoriteBorder, MdFavorite, MdVisibilityOff, MdInfoOutline
} from "react-icons/md";


import Navbar from "../components/Navbar/Navbar";
import AddEditProperty from "../pages/AddEditProperty";
import AddEditItem from "../pages/AddEditItem";
import Toast from "../components/ToastMessage/Toast";
import axiosInstance from "../utils/axiosInstance";

import "../styles/newrun-hero.css";

/* -------------------------- feature flags -------------------------- */
const SHOW_LISTS = false;

/* helpers */
const cx = (...s) => s.filter(Boolean).join(" ");
const fmtMoney = (n) =>
  typeof n === "number" && !Number.isNaN(n) ? `$${n.toLocaleString()}` : null;

// ---- image helpers (normalize & fallbacks) ----
const API_BASE =
  (axiosInstance?.defaults?.baseURL || "").replace(/\/+$/, ""); // no trailing slash

const isAbsoluteUrl = (u = "") => /^https?:\/\//i.test(u);
const normalizeUrl = (u = "") => {
  if (!u) return "";
  if (isAbsoluteUrl(u)) return u;
  if (!API_BASE) return u.startsWith("/") ? u : `/${u}`;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${API_BASE}${path}`;
};

const collectImages = (obj) => {
  const o = obj ?? {}; // handles null/undefined
  let arr = [];
  if (Array.isArray(o.images)) arr = o.images;
  else if (Array.isArray(o.photos)) arr = o.photos;
  else if (typeof o.image === "string") arr = [o.image];
  else if (typeof o.thumbnailUrl === "string") arr = [o.thumbnailUrl];
  return arr.filter(Boolean).map(normalizeUrl);
};

const primaryImageUrl = (obj) => {
  const imgs = collectImages(obj);
  return imgs.length ? imgs[0] : "";
};

// merge & dedupe images from multiple objects (e.g., lightweight card + full details)
const collectAllImages = (...objs) => {
  const urls = [];
  for (const o of objs) urls.push(...collectImages(o));
  return Array.from(new Set(urls));
};



/* ---------- new helpers (Batch 1) ---------- */
const daysAgo = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};

// Haversine (miles)
const distanceMilesBetween = (a, b) => {
  if (!a || !b) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
};

const safeMoney = (n) =>
  typeof n === "number" && n > 0 ? fmtMoney(n) : "Not set";




/*=================== UI atoms ===================== */
/* ---------- tiny UI atoms (Batch 1) ---------- */
function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-sm text-black/80 hover:bg-black/[0.08]"
    >
      {children}
    </button>
  );
}

function ChipEditor({ label, type = "number", value, onChange, onApply, min }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <label className="text-sm text-black/70 w-24">{label}</label>
      <input
        type={type}
        min={min}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-40 rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none"
      />
      <button
        onClick={onApply}
        className="rounded-md bg-black px-3 py-1 text-sm text-white hover:bg-black/90"
      >
        Apply
      </button>
    </div>
  );
}

function Nudge({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs hover:bg-black/10"
    >
      {children}
    </button>
  );
}



/* ---------- Agent thread UI ---------- */
function AgentThread({ agent, onAnswer, loading }) {
  if (!agent) return null;
  return (
    <div className="space-y-2">
      {(agent.messages || []).map((m, i) => (
        <div
          key={i}
          className={
            m.role === "assistant"
              ? "rounded-lg bg-black/[0.04] p-3 text-sm"
              : "rounded-lg border border-black/10 p-3 text-sm"
          }
        >
          {m.text}
        </div>
      ))}

      {loading && (
        <div className="rounded-lg bg-black/[0.03] p-3 text-sm text-black/60">
          Working… searching sources and ranking matches.
        </div>
      )}

      {!!(agent.questions || []).length && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 items-start">
          {(agent.questions || []).map((q, qi) => (
            <div
              key={qi}
              className="h-full rounded-lg border border-black/10 bg-white px-3 py-2"
            >
              <div className="mb-1 text-xs font-semibold text-black/70">{q.text}</div>
              <div className="flex flex-wrap gap-2">
                {(q.options || []).map((opt, oi) => (
                  <button
                    key={oi}
                    className="rounded-full bg-black/5 px-3 py-1 text-sm hover:bg-black/10"
                    onClick={() => onAnswer?.(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}




/* ============================ HERO ============================ */
function SolveHero({
  firstName,
  value,
  setValue,
  onSubmit,
  onNewProperty,
  onNewItem,
}) {

      // --- Voice input (Web Speech API) ---
    const recRef = React.useRef(null);
    const [listening, setListening] = useState(false);
    
    const baseTextRef = useRef("");        // text present before we started listening
    const [autoSubmitFromMic, setAutoSubmitFromMic] = useState(false);

    function ToolsPopover({ onPickTemplate, getValue, onAutoMicChanged }) {
      const [open, setOpen] = React.useState(false);
      const [autoMic, setAutoMic] = React.useState(false);
      const rootRef = React.useRef(null);

      React.useEffect(() => onAutoMicChanged?.(autoMic), [autoMic, onAutoMicChanged]);

      // Close on outside click or Esc
      React.useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
          if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        const onEsc = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
          document.removeEventListener("mousedown", onDocClick);
          document.removeEventListener("keydown", onEsc);
        };
      }, [open]);

      const templates = [
        "Find me a room near campus under $900 for October",
        "2BR within 1 mile under $1200, in-unit laundry",
        "Short-term sublease Oct–Dec, budget $800",
      ];

      return (
        <div ref={rootRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-xs hover:bg-white/15"
          >
            <MdTune className="text-sm" /> Tools
          </button>

          {open && (
            <div className="absolute left-0 top-[115%] z-20 w-[min(520px,92vw)] rounded-xl border border-white/10 bg-black/70 p-3 text-white/90 shadow-lg backdrop-blur">
              <div className="mb-1 text-[11px] uppercase tracking-wide text-white/60">Templates</div>
              <div className="flex flex-wrap gap-2">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onPickTemplate?.(t); setOpen(false); }}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { onPickTemplate?.((getValue?.() || '') + ' near campus'); setOpen(false); }}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                  title="Quick nudge"
                >
                  + near campus
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoMic}
                    onChange={(e) => setAutoMic(e.target.checked)}
                    className="h-4 w-4 accent-white/80"
                  />
                  Auto-run after voice input
                </label>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }



    // tidy up on unmount
    useEffect(() => () => {
      try { recRef.current?.abort?.(); } catch {}
    }, []);

    const toggleMic = () => {
      if (listening) {
        try { recRef.current?.stop?.(); } catch {}
        return;
      }

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert("Speech recognition isn’t supported in this browser. Try Chrome or Edge.");
        return;
      }

      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;   // show words as you speak
      rec.continuous = false;      // one utterance per click (change to true if you want)

      rec.onstart = () => {
        baseTextRef.current = value || "";
        setListening(true);
      };

      rec.onresult = (e) => {
        // Combine all results from the current session
        let spoken = "";
        for (let i = 0; i < e.results.length; i++) {
          spoken += e.results[i][0].transcript;
        }
        spoken = spoken.trim();

        const prefix = baseTextRef.current.trim();
        // Keep the original text, then live-update with the speech
        setValue(prefix ? `${prefix} ${spoken}` : spoken);
      };

      rec.onerror = () => {
        setListening(false);
        recRef.current = null;
      };

      rec.onend = () => {
        setListening(false);
        recRef.current = null;
        // if (autoSubmitFromMic) onSubmit?.();   // <- submit after voice
      };

      recRef.current = rec;
      rec.start();
    };

  return (
    <section className="nr-hero-bg nr-hero-starry">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10">
        <p className="mb-2 text-center text-[11px] tracking-[0.18em] text-white/60 uppercase">
          Limited Beta
        </p>

        <header className="text-center">
          <h1 className="text-[clamp(2.6rem,5vw,4rem)] font-extrabold leading-tight tracking-tight">
            Master campus life in{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Solve Threads
            </span>
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-white/75">
            Tell NewRun what you need. We’ll scout, message, and organize next
            steps for you.
          </p>
        </header>

        <div className="mx-auto mt-6 max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur">
            {/* Tools button + popover */}
            <div className="flex items-center justify-between px-2 pb-2 text-white/70">
              <ToolsPopover
                onPickTemplate={(t) => setValue(t)}
                getValue={() => value}
                onAutoMicChanged={(v) => setAutoSubmitFromMic(v)}
              />
            </div>

            <div className="flex items-center gap-2 px-1 pb-1">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit?.();
                  }
                }}
                placeholder='Try: "Find me a room near campus under $900 for October"'
                className="flex-1 rounded-xl bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={toggleMic}
                className={
                  "grid h-10 w-10 place-items-center rounded-xl text-white transition " +
                  (listening
                    ? "bg-white/20 ring-2 ring-amber-500 animate-pulse"
                    : "bg-white/10 hover:bg-white/15")
                }
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                aria-pressed={listening}
                title={listening ? "Listening… click to stop" : "Voice"}
              >
                <MdMicNone />
              </button>

              <button
                onClick={() => onSubmit?.()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95"
              >
                Start solving <MdArrowForwardIos className="text-[14px]" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onNewProperty}
              className="rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white hover:bg-white/[0.12]"
            >
              New property
            </button>
            <button
              onClick={onNewItem}
              className="rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white hover:bg-white/[0.12]"
            >
              New item
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/70">
          Over 200+ campus requests solved this week.
        </p>
      </div>
    </section>
  );
}

/* ====================== Solve Housing Panel ====================== */
function SolveHousingPanel({ initialText, onCreateProperty, onClose }) {
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState(null);
  const [cands, setCands] = useState([]);
  const [plan, setPlan] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [reqState, setReqState] = useState({}); // _id -> state
  // Batch 2: selection & details
  const [selected, setSelected] = useState(new Set()); // Set<string>
  const [detailFor, setDetailFor] = useState(null); // candidate object or null
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);

  // Shortlist / hide / why-open / notes
  const [favorites, setFavorites] = useState(new Set());     // Set<string>
  const [hidden, setHidden] = useState(new Set());           // Set<string>
  const [whyOpen, setWhyOpen] = useState(new Set());         // Set<string>
  const [notes, setNotes] = useState({});                    // { [id]: string }
  const [shortlistOnly, setShortlistOnly] = useState(false); // UI filter

  // local editable filters (chips)
  const [filters, setFilters] = useState({
    maxPrice: undefined,
    moveIn: undefined, // ISO or yyyy-mm-dd
    distanceMiles: undefined,
  });

  // --- Pagination constants & state (Batch 3) ---
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [agent, setAgent] = useState({
    messages: [],
    questions: [],
    relaxations: [],
  });

  // Build default messages if backend doesn't send them yet
const buildDefaultMessages = (data) => {
  const msgs = [];
  const c = data?.criteria || {};
  const bits = [];
  if (typeof c.maxPrice === "number") bits.push(`≤ ${fmtMoney(c.maxPrice)}`);
  if (c.moveIn) bits.push(`move-in ${c.moveIn}`);
  if (typeof c.distanceMiles === "number") bits.push(`${c.distanceMiles} mi`);
  if (c.campus) bits.push(c.campus);
  msgs.push({
    role: "assistant",
    text: `I parsed your request${bits.length ? `: ${bits.join(" · ")}` : ""}.`,
  });

  const plan = Array.isArray(data?.plan) ? data.plan : [];
  if (plan[0]) msgs.push({ role: "assistant", text: plan[0] });
  return msgs;
};

// Build default clarifying questions if backend doesn't send them yet
  const buildDefaultQuestions = (data) => {
    const qs = [];
    const c = data?.criteria || {};
    if (!c.moveIn) {
      const today = new Date().toISOString().slice(0, 10);
      qs.push({
        id: "moveIn",
        text: "Do you have a move-in date?",
        options: [
          { label: "Oct 1", key: "moveIn", value: today },
          { label: "This month", key: "moveIn", value: today },
          { label: "Skip", key: null, value: null },
        ],
      });
    }
    if (typeof c.distanceMiles !== "number") {
      qs.push({
        id: "distanceMiles",
        text: "How close to campus?",
        options: [
          { label: "≤ 0.5 mi", key: "distanceMiles", value: 0.5 },
          { label: "≤ 1 mi", key: "distanceMiles", value: 1 },
          { label: "≤ 2 mi", key: "distanceMiles", value: 2 },
        ],
      });
    }
    return qs;
  };

  // When user taps a question option, apply to filters and refetch
  const handleQuestionAnswer = (opt) => {
    if (!opt || !opt.key) return;
    const next = { ...cleanFilters(), [opt.key]: opt.value };
    setFilters((f) => ({ ...f, [opt.key]: opt.value }));
    fetchSolve({ filters: next, page: 1, append: false });
  };


  // build a clean filter object from current chip state
  const cleanFilters = () => {
    const out = {};
    if (typeof filters.maxPrice === "number" && filters.maxPrice > 0) out.maxPrice = filters.maxPrice;
    if (filters.moveIn) out.moveIn = filters.moveIn;
    if (typeof filters.distanceMiles === "number" && filters.distanceMiles > 0) out.distanceMiles = filters.distanceMiles;
    return out;
  };


  // which editor is open
  const [openEditor, setOpenEditor] = useState(null); // 'budget' | 'date' | 'distance' | null
  const [showCompare, setShowCompare] = useState(false);
  
  const fetchSolve = async (opts = {}) => {
    try {
      setLoading(true);

      const body = {
        prompt: initialText || "",
        page: opts.page ?? 1,
        limit: PAGE_SIZE,
      };
      if (opts.filters) body.filters = opts.filters;

      const { data } = await axiosInstance.post("/solve/housing", body);

      

      setThreadId(data?.threadId || null);
      setCriteria(data?.criteria || null);
      setPlan(Array.isArray(data?.plan) ? data.plan : []);

      const next = Array.isArray(data?.candidates) ? data.candidates : [];

      // NEW: agent wiring (backward-compatible)
      setAgent({
        messages: Array.isArray(data?.messages) && data.messages.length
          ? data.messages
          : buildDefaultMessages(data),
        questions: Array.isArray(data?.questions) ? data.questions : buildDefaultQuestions(data),
        relaxations: Array.isArray(data?.suggestedRelaxations) ? data.suggestedRelaxations : [],
      });

      // append or replace
      setCands((prev) => (opts.append ? [...prev, ...next] : next));

      // compute hasMore (server flag preferred, fallback to page size)
      setHasMore(Boolean(data?.hasMore) || next.length === PAGE_SIZE);
      setPage(body.page);

      // initialize filters from criteria only when not set yet (keep your logic)
      setFilters((prev) => ({
        maxPrice:
          prev.maxPrice !== undefined
            ? prev.maxPrice
            : (typeof data?.criteria?.maxPrice === "number" ? data.criteria.maxPrice : undefined),
        moveIn:
          prev.moveIn !== undefined
            ? prev.moveIn
            : (data?.criteria?.moveIn || undefined),
        distanceMiles:
          prev.distanceMiles !== undefined
            ? prev.distanceMiles
            : (typeof data?.criteria?.distanceMiles === "number" ? data.criteria.distanceMiles : undefined),
      }));
    } catch {
      if (!opts.append) setCands([]);
      setPlan([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };


  // inside SolveHousingPanel
  const cleanFrom = (obj = {}) => {
    const out = {};
    if (typeof obj.maxPrice === "number" && obj.maxPrice > 0) out.maxPrice = obj.maxPrice;
    if (obj.moveIn) out.moveIn = obj.moveIn;
    if (typeof obj.distanceMiles === "number" && obj.distanceMiles > 0) out.distanceMiles = obj.distanceMiles;
    return out;
  };

  const resetToParsed = () => {
    const next = {
      maxPrice: typeof criteria?.maxPrice === "number" ? criteria.maxPrice : undefined,
      moveIn: criteria?.moveIn || undefined,
      distanceMiles: typeof criteria?.distanceMiles === "number" ? criteria.distanceMiles : undefined,
    };
    setFilters(next);
    fetchSolve({ filters: cleanFrom(next), page: 1, append: false });
  };

  const diffBudget   = typeof filters.maxPrice === "number"    && filters.maxPrice !== criteria?.maxPrice;
  const diffMoveIn   = !!filters.moveIn                        && filters.moveIn   !== criteria?.moveIn;
  const diffDistance = typeof filters.distanceMiles === "number" && filters.distanceMiles !== criteria?.distanceMiles;
  const filtersOverrideParsed = diffBudget || diffMoveIn || diffDistance;

  // restore from localStorage on mount
    useEffect(() => {
      // filters
      const raw = localStorage.getItem("solve:filters");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setFilters((f) => ({ ...f, ...parsed }));
          // optional: immediately refetch using restored filters
          fetchSolve({
            filters: {
              ...(typeof parsed.maxPrice === "number" && parsed.maxPrice > 0 ? { maxPrice: parsed.maxPrice } : {}),
              ...(parsed.moveIn ? { moveIn: parsed.moveIn } : {}),
              ...(typeof parsed.distanceMiles === "number" && parsed.distanceMiles > 0 ? { distanceMiles: parsed.distanceMiles } : {}),
            },
            page: 1,
            append: false,
          }).finally(() => {
            didInitialFetch.current = true; // mark hydrated if we fetched here
          });
        } catch {}
      }

      // threadId
      const t = localStorage.getItem("solve:threadId");
      if (t) setThreadId(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const didInitialFetch = useRef(false);

      // didInitialFetch.current = true;

      useEffect(() => {
        if (didInitialFetch.current) return;
        fetchSolve({ page: 1, append: false });
        didInitialFetch.current = true;
      }, [initialText]);


    // Load from localStorage on mount
    useEffect(() => {
      try {
        const favRaw = JSON.parse(localStorage.getItem("solve:favs") || "[]");
        const hidRaw = JSON.parse(localStorage.getItem("solve:hidden") || "[]");
        const nRaw = JSON.parse(localStorage.getItem("solve:notes") || "{}");
        const sOnly = JSON.parse(localStorage.getItem("solve:shortlistOnly") || "false");
        setFavorites(new Set(Array.isArray(favRaw) ? favRaw : []));
        setHidden(new Set(Array.isArray(hidRaw) ? hidRaw : []));
        setNotes(typeof nRaw === "object" && nRaw ? nRaw : {});
        setShortlistOnly(Boolean(sOnly));
      } catch {}
    }, []);

  // Persist when they change
    useEffect(() => {
      localStorage.setItem("solve:favs", JSON.stringify([...favorites]));
    }, [favorites]);

    useEffect(() => {
      localStorage.setItem("solve:hidden", JSON.stringify([...hidden]));
    }, [hidden]);

    useEffect(() => {
      localStorage.setItem("solve:notes", JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
      localStorage.setItem("solve:shortlistOnly", JSON.stringify(shortlistOnly));
    }, [shortlistOnly]);


    // persist on change
    useEffect(() => {
      localStorage.setItem("solve:filters", JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
      if (threadId) localStorage.setItem("solve:threadId", threadId);
    }, [threadId]);


  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setDetailFor(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const applyFilters = async () => {
    await fetchSolve({ filters: cleanFilters(), page: 1, append: false });
    setOpenEditor(null);
  };

  const requestContact = async (propertyId) => {
    try {
      setReqState((s) => ({ ...s, [propertyId]: "requesting" }));
      const { data } = await axiosInstance.post("/contact-access/request", {
        propertyId,
      });
      if (data?.self) {
        setReqState((s) => ({ ...s, [propertyId]: "self" }));
      } else if (data?.approved) {
        setReqState((s) => ({ ...s, [propertyId]: "approved" }));
      } else if (data?.pending || data?.already) {
        setReqState((s) => ({ ...s, [propertyId]: "pending" }));
      } else {
        setReqState((s) => ({ ...s, [propertyId]: "pending" }));
      }
    } catch {
      setReqState((s) => ({ ...s, [propertyId]: "error" }));
    }
  };

  const buttonLabel = (state) => {
    switch (state) {
      case "requesting":
        return "Requesting…";
      case "pending":
        return "Requested";
      case "approved":
        return "Approved";
      case "self":
        return "You own this";
      case "error":
        return "Failed, retry";
      default:
        return "Request contact";
    }
  };
  const isDisabled = (state) =>
    state === "requesting" || state === "pending" || state === "approved" || state === "self";

    // Batch 2: selection helpers
  const canSelect = (state) =>
    !(state === "requesting" || state === "pending" || state === "approved" || state === "self");


  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const hideListing = (id) => {
    setHidden(prev => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
  };

  const toggleWhy = (id) => {
    setWhyOpen(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const saveNote = (id, text) => {
    setNotes(prev => ({ ...prev, [id]: text }));
  };


  const visibleCands = cands.filter(p => {
    if (hidden.has(p._id)) return false;
    if (shortlistOnly && !favorites.has(p._id)) return false;
    return true;
  });

  

  const toggleSelect = (id, disabled) => {
    if (disabled) return;
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const allSelectableIds = visibleCands
    .filter((p) => canSelect(reqState[p._id]))
    .map((p) => p._id);

  useEffect(() => {
    const visible = new Set(visibleCands.map(p => p._id));
    setSelected(prev => new Set([...prev].filter(id => visible.has(id))));
  }, [visibleCands]);

  const allSelected =
    allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      const s = new Set(prev);
      allSelectableIds.forEach((id) => s.add(id));
      return s;
    });
  };

    const selectedList = visibleCands.filter(p => selected.has(p._id)).slice(0, 4);

  useEffect(() => {
    setSelected(prev => {
      const kept = new Set([...prev].filter(id => {
        const s = reqState[id];
        return !(s === "requesting" || s === "pending" || s === "approved" || s === "self");
      }));
      return kept;
    });
  }, [reqState]);

  


  // ArrowLeft / ArrowRight in the details drawer
    useEffect(() => {
      if (!detailFor) return;
      const onKey = (e) => {
        const imgs = collectAllImages(detailFull, detailFor);
        if (!imgs.length) return;
        if (e.key === "ArrowLeft") {
          setDetailPhotoIndex((i) => (i - 1 + imgs.length) % imgs.length);
        }
        if (e.key === "ArrowRight") {
          setDetailPhotoIndex((i) => (i + 1) % imgs.length);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [detailFor, detailFull]);

    useEffect(() => {
      if (!detailFor) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }, [detailFor]);



    // Batch 2: bulk request
  const bulkRequest = async () => {
    if (!selected.size) return;
    for (const id of Array.from(selected)) {
      if (!canSelect(reqState[id])) continue;
      await requestContact(id);
    }
    clearSelection();
  };

  // progress counts
  const counts = Object.values(reqState).reduce(
    (acc, s) => {
      if (s === "pending") acc.requested += 1;
      if (s === "approved") acc.approved += 1;
      return acc;
    },
    { requested: 0, approved: 0 }
  );

  // --- Live status sync (Batch 3) ---
  useEffect(() => {
    // ids we still care about
    const ids = cands
      .map((p) => p._id)
      .filter((id) => ["requesting", "pending"].includes(reqState[id]));

    if (!ids.length) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const { data } = await axiosInstance.post("/contact-access/status", { ids });
        if (cancelled || !data?.statuses) return;

        setReqState((prev) => {
          const next = { ...prev };
          for (const s of data.statuses) {
            const { id, status, self } = s || {};
            if (!id) continue;
            next[id] =
              self ? "self" :
              status === "approved" ? "approved" :
              status === "pending" ? "pending" :
              status === "requesting" ? "requesting" :
              prev[id];
          }
          return next;
        });
      } catch {
        /* ignore polling errors */
      }
    };

    tick(); // immediate
    const iv = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [cands, reqState]);


  const selectableSelectedCount = [...selected].filter(id => canSelect(reqState[id])).length;


  // Change this to match your backend route if different
  const PROPERTY_DETAILS_ENDPOINT = (id) => `/properties/${id}`;


  const openDetails = async (cand) => {
    setDetailFor(cand);
    setDetailFull(null);
    setDetailPhotoIndex(0);
    try {
      setDetailLoading(true);
      const { data } = await axiosInstance.get(PROPERTY_DETAILS_ENDPOINT(cand._id));
      // Accept either {property: {...}} or the object itself
      const full = data?.property || data;
      setDetailFull(full || null);
    } catch (e) {
      // if fetch fails we still show whatever we have
      setDetailFull(null);
    } finally {
      setDetailLoading(false);
    }
  };



  // empty-state reason
  const emptyReason = () => {
    const bits = [];
    if (filters.maxPrice) bits.push(`under ${fmtMoney(filters.maxPrice)}`);
    if (filters.distanceMiles) bits.push(`within ${filters.distanceMiles} mi`);
    if (filters.moveIn) bits.push(`for ${filters.moveIn}`);
    return bits.length ? `No listings ${bits.join(" ")}.` : "No listings matched your request.";
  };

  const campusPoint =
    criteria?.campusLocation &&
    typeof criteria.campusLocation.lat === "number" &&
    typeof criteria.campusLocation.lng === "number"
      ? { lat: criteria.campusLocation.lat, lng: criteria.campusLocation.lng }
      : null;

  return (
    <div className="space-y-5">
      {/* header with progress + global CTA */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Housing Solve Thread</h3>
          <p className="mt-1 text-sm text-black/70">
            We parsed your request and found matches. We’ll message owners via SafeContact. Typical replies: 24–48h.
          </p>
          <p className="mt-1 text-xs text-black/60">
            Requested: <span className="font-medium">{counts.requested}</span> · Approved:{" "}
            <span className="font-medium">{counts.approved}</span>
          </p>
        </div>

        <button
          onClick={onCreateProperty}
          className="shrink-0 rounded-lg border border-black/10 bg-black text-white px-3 py-1.5 text-sm hover:bg-black/90"
        >
          Post my housing request
        </button>
      </header>

      {/* criteria chips with inline edit */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip onClick={() => setOpenEditor(openEditor === "budget" ? null : "budget")}>
          <span className="text-xs uppercase text-black/60">Budget:</span>
          <span className="font-medium">{safeMoney(filters.maxPrice)}</span>
          {diffBudget && <span className="text-xs text-black/50 ml-1">(saved)</span>}
        </Chip>
        <Chip onClick={() => setOpenEditor(openEditor === "date" ? null : "date")}>
          <span className="text-xs uppercase text-black/60">Move-in:</span>
          <span className="font-medium">{filters.moveIn || "Not set"}</span>
          {diffMoveIn && <span className="text-xs text-black/50 ml-1">(saved)</span>}
        </Chip>
        <Chip onClick={() => setOpenEditor(openEditor === "distance" ? null : "distance")}>
          <span className="text-xs uppercase text-black/60">Distance:</span>
          <span className="font-medium">{filters.distanceMiles ? `${filters.distanceMiles} mi` : "Not set"}</span>
          {diffDistance && <span className="text-xs text-black/50 ml-1">(saved)</span>}
        </Chip>
        <Chip onClick={() => setShortlistOnly(v => !v)}>
          <span className="text-xs uppercase text-black/60">Shortlist:</span>
          <span className="font-medium">{shortlistOnly ? "On" : "Off"}</span>
        </Chip>
        {filtersOverrideParsed && (
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">
              Filters override parsed
            </span>
            <button onClick={resetToParsed} className="text-xs underline text-black/70 hover:text-black">
              Use parsed
            </button>
          </div>
        )}
      </div>

      {openEditor === "budget" && (
        <ChipEditor
          label="Max budget ($)"
          type="number"
          min={0}
          value={filters.maxPrice ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, maxPrice: v === "" ? undefined : Number(v) }))}
          onApply={applyFilters}
        />
      )}
      {openEditor === "date" && (
        <ChipEditor
          label="Move-in date"
          type="date"
          value={filters.moveIn ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, moveIn: v || undefined }))}
          onApply={applyFilters}
        />
      )}
      {openEditor === "distance" && (
        <ChipEditor
          label="Within (mi)"
          type="number"
          min={0}
          value={filters.distanceMiles ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, distanceMiles: v === "" ? undefined : Number(v) }))}
          onApply={applyFilters}
        />
      )}

      {/* Agent thread (messages + questions) */}
      <AgentThread
        agent={agent}
        onAnswer={handleQuestionAnswer}
        loading={loading && cands.length === 0}
      />

      {/* Criteria & plan boxes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Criteria</div>
          <ul className="mt-1 list-disc pl-4">
            <li>Max price: {safeMoney(criteria?.maxPrice)}</li>
            {criteria?.moveIn && <li>Move-in: {criteria.moveIn}</li>}
            {typeof criteria?.distanceMiles === "number" && (
              <li>Within {criteria.distanceMiles} miles</li>
            )}
            {!!(criteria?.keywords || []).length && (
              <li>Keywords: {(criteria.keywords || []).join(", ")}</li>
            )}
            {criteria?.campus && <li>Campus: {criteria.campus}</li>}
            {typeof criteria?.bedrooms === "number" && <li>Bedrooms: {criteria.bedrooms}+</li>}
            {typeof criteria?.bathrooms === "number" && <li>Bathrooms: {criteria.bathrooms}+</li>}
            
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Plan</div>
          <ul className="mt-1 list-disc pl-4">
            {(plan.length
              ? plan
              : [
                  "We parsed your request into search criteria.",
                  "Here are matching listings — select ones you like.",
                  "Tap Request contact to ask owners (uses SafeContact).",
                  "Typical owner replies: 24–48h.",
                ]).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : visibleCands.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-6 text-center text-black/80 space-y-3">
          <div>{emptyReason()}</div>
          <div className="flex flex-wrap justify-center gap-2">
            <Nudge onClick={() => setFilters((f) => ({ ...f, maxPrice: (Number(f.maxPrice) || 0) + 100 }))}>
              + Increase budget by $100
            </Nudge>
            <Nudge onClick={() => setFilters((f) => ({ ...f, distanceMiles: (Number(f.distanceMiles) || 0) + 0.5 }))}>
              + Expand radius to +0.5 mi
            </Nudge>
            <Nudge
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  moveIn: f.moveIn || new Date().toISOString().slice(0, 10),
                }))
              }
            >
              + Set a move-in date
            </Nudge>
            <Nudge onClick={applyFilters}>Apply nudges</Nudge>
          </div>
          <div>
            <button
              className="mt-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90"
              onClick={onCreateProperty}
            >
              Post my housing request
            </button>
          </div>
        </div>
      ) : (
  <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleCands.map((p) => {
        const img = primaryImageUrl(p);
        const state = reqState[p._id];
        const posted = daysAgo(p?.createdAt);
        let distance = null;

        if (typeof p?.distanceMiles === "number") {
          distance = p.distanceMiles;
        } else if (
          campusPoint &&
          p?.location?.coordinates &&
          Array.isArray(p.location.coordinates) &&
          p.location.coordinates.length === 2
        ) {
          const [lng, lat] = p.location.coordinates;
          const d = distanceMilesBetween(campusPoint, { lat, lng });
          if (d) distance = d;
        }

        return (
          <div key={p._id} className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <div className="aspect-[16/10] w-full bg-black/5">
              {img ? (
                <img
                  src={img}
                  alt={p.title}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : null}
            </div>
            {/* <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-black/60">
              {posted && <span>Posted {posted}</span>}
              {typeof distance === "number" && <span>· {distance} mi to campus</span>}
              {(Array.isArray(p.why) && p.why.length > 0) && (
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2"
                  title={p.why.join("\n")}
                >
                  Why?
                </button>
              )}
            </div> */}
            <div className="p-3">
              {/* title row with checkbox */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="Select listing"
                    checked={selected.has(p._id)}
                    disabled={!canSelect(state)}
                    onChange={() => toggleSelect(p._id, !canSelect(state))}
                    className={`h-4 w-4 accent-black ${!canSelect(state) ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <h4 className="line-clamp-1 font-semibold">{p.title}</h4>
                </div>
                {/* {typeof p.price === "number" && (
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-sm font-medium">
                    {fmtMoney(p.price)}
                  </span>
                )} */}
                {/* existing price badge stays */}
                {typeof p.price === "number" && (
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-sm font-medium">
                    {fmtMoney(p.price)}
                  </span>
                )}
                {/* NEW: match score badge, if present */}
                {typeof p.matchScore === "number" && (
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                    {Math.round(p.matchScore)}% match
                  </span>
                )}
                {/* Favorite toggle */}
              <button
                type="button"
                onClick={() => toggleFavorite(p._id)}
                className="grid h-8 w-8 place-items-center rounded-md bg-black/5 hover:bg-black/10"
                title={favorites.has(p._id) ? "Remove from shortlist" : "Add to shortlist"}
                aria-pressed={favorites.has(p._id)}
              >
                {favorites.has(p._id) ? <MdFavorite className="text-rose-600" /> : <MdFavoriteBorder />}
              </button>

              {/* Hide listing */}
              <button
                type="button"
                onClick={() => hideListing(p._id)}
                className="grid h-8 w-8 place-items-center rounded-md bg-black/5 hover:bg-black/10"
                title="Hide this listing"
              >
                <MdVisibilityOff />
              </button>
              </div>
              

              {/* meta row */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-black/60">
                {posted && <span>Posted {posted}</span>}
                {typeof distance === "number" && <span>· {distance} mi to campus</span>}
                {Array.isArray(p.why) && p.why.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleWhy(p._id)}
                    className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2"
                    title="Why this matched?"
                  >
                    <MdInfoOutline /> Why?
                  </button>
                )}
              </div>

              <p className="mt-1 line-clamp-2 text-[13.5px] text-black/70">
                {p.address?.street || p.address || p.description || ""}
                
              </p>
              {whyOpen.has(p._id) && Array.isArray(p.why) && p.why.length > 0 && (
                <div className="mt-2 rounded-lg border border-black/10 bg-black/[0.03] p-2">
                  <div className="mb-1 text-xs font-semibold text-black/60">Why this match</div>
                  <ul className="list-disc pl-5 text-[13px] text-black/80">
                    {p.why.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
            )}

              {/* state chip */}
              {state && (
                <div
                  className={cx(
                    "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    state === "approved"
                      ? "bg-emerald-600 text-white"
                      : state === "pending"
                      ? "bg-amber-400 text-black"
                      : state === "self"
                      ? "bg-black text-white"
                      : state === "error"
                      ? "bg-rose-600 text-white"
                      : "bg-black/5 text-black/70"
                  )}
                >
                  {buttonLabel(state)}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => requestContact(p._id)}
                    disabled={isDisabled(state)}
                    aria-busy={state === "requesting"}
                    className={cx(
                      "rounded-lg px-3 py-1.5 text-sm font-medium",
                      state === "approved"
                        ? "bg-emerald-600 text-white"
                        : state === "pending"
                        ? "bg-amber-500 text-black"
                        : state === "self"
                        ? "bg-black text-white opacity-70"
                        : state === "error"
                        ? "bg-rose-600 text-white"
                        : "bg-black text-white hover:bg-black/90"
                    )}
                  >
                    {buttonLabel(state)}
                  </button>

                  <button
                    onClick={() => openDetails(p)}
                    className="rounded-lg bg-black/5 px-3 py-1.5 text-sm hover:bg-black/10"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {!loading && hasMore && (
      <div className="mt-3 flex justify-center">
        <button
          onClick={() =>
            fetchSolve({
              filters: cleanFilters(),
              page: page + 1,
              append: true,
            })
          }
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-60"
        >
          Load more results
        </button>
      </div>
    )}
  </>
)
}
        {/* Details peek (right drawer) */}
        {detailFor && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-end bg-black/30 backdrop-blur-sm"
          onClick={() => { setDetailFor(null); setDetailFull(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="h-full w-[min(560px,92vw)] overflow-auto bg-white p-4 text-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold">
                  {detailFull?.title || detailFor?.title || "Listing"}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {typeof (detailFull?.price ?? detailFor?.price) === "number" && (
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 font-medium">
                      {fmtMoney(detailFull?.price ?? detailFor?.price)}
                    </span>
                  )}
                  {(() => {
                    const posted = daysAgo(detailFull?.createdAt || detailFor?.createdAt);
                    return posted ? <span className="text-black/60">Posted {posted}</span> : null;
                  })()}
                </div>
              </div>
              <button
                className="rounded-md bg-black/5 px-2 py-1 text-sm"
                onClick={() => { setDetailFor(null); setDetailFull(null); }}
              >
                Close
              </button>
            </div>

            

            {/* Gallery (height-capped) */}
            <div className="relative">
              <div className="w-full overflow-hidden rounded-lg bg-black/5">
                <div className="h-[260px] sm:h-[300px] md:h-[340px] lg:h-[380px] max-h-[62vh]">
                  {(() => {
                    const imgs = collectAllImages(detailFull, detailFor);
                    const hero = imgs?.[detailPhotoIndex];
                    if (!imgs?.length) {
                      return (
                        <div className="grid h-full w-full place-items-center text-sm text-black/50">
                          {detailLoading ? "Loading photos…" : "No photos yet"}
                        </div>
                      );
                    }
                    return (
                      <img
                        src={hero}
                        alt={detailFull?.title || detailFor?.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Gallery controls */}
              {(() => {
                const imgs = collectAllImages(detailFull, detailFor);
                if (!imgs?.length) return null;
                const prev = () => setDetailPhotoIndex((i) => (i - 1 + imgs.length) % imgs.length);
                const next = () => setDetailPhotoIndex((i) => (i + 1) % imgs.length);
                return (
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={prev} className="rounded-md bg-black/5 px-2 py-1 text-sm hover:bg-black/10">
                      Prev
                    </button>
                    <div className="text-xs text-black/60">
                      {detailPhotoIndex + 1} / {imgs.length}
                    </div>
                    <button onClick={next} className="rounded-md bg-black/5 px-2 py-1 text-sm hover:bg-black/10">
                      Next
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Key facts */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-3">
              {(() => {
                const src = detailFull || detailFor || {};
                const facts = [
                  { icon: <MdKingBed />, label: "Bedrooms", value: src.bedrooms },
                  { icon: <MdBathtub />, label: "Bathrooms", value: src.bathrooms },
                  { icon: <MdSquareFoot />, label: "Sq Ft", value: src.sqft || src.squareFeet },
                  { icon: <MdCalendarToday />, label: "Move-in", value: src.moveIn || src.availableFrom },
                  { icon: <MdLocalLaundryService />, label: "Laundry", value: src.laundry || (src.inUnitLaundry ? "In-unit" : src.onSiteLaundry ? "On-site" : null) },
                  { icon: <MdLocalParking />, label: "Parking", value: src.parking || (src.parkingAvailable ? "Available" : null) },
                  { icon: <MdPets />, label: "Pets", value: src.pets || (src.petsAllowed ? "Allowed" : src.pets ? src.pets : null) },
                  { icon: <MdLocationOn />, label: "Distance", value: (() => {
                      let d = src.distanceMiles;
                      if (!d && campusPoint && src?.location?.coordinates?.length === 2) {
                        const [lng, lat] = src.location.coordinates;
                        d = distanceMilesBetween(campusPoint, { lat, lng });
                      }
                      return typeof d === "number" ? `${d} mi to campus` : null;
                    })(),
                  },
                ].filter(f => f.value !== undefined && f.value !== null && f.value !== "");
                if (!facts.length) return null;
                return facts.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.03] px-2.5 py-2">
                    <div className="text-[18px] text-black/70">{f.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[12px] uppercase tracking-wide text-black/50">{f.label}</div>
                      <div className="truncate">{f.value}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            

            {/* Amenities */}
            {(() => {
              const src = detailFull || detailFor || {};
              const list =
                (Array.isArray(src.amenities) && src.amenities) ||
                (Array.isArray(src.features) && src.features) ||
                [];
              if (!list.length) return null;
              return (
                <div className="mt-4">
                  <div className="mb-1 text-sm font-semibold">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((a, i) => (
                      <span key={i} className="rounded-full bg-black/5 px-2.5 py-1 text-[13px]">{a}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Pricing & terms */}
            {(() => {
              const src = detailFull || detailFor || {};
              const deposit = src.deposit || src.securityDeposit;
              const fees = src.fees || src.applicationFee;
              const lease = src.lease || src.leaseLength;
              const utilities =
                (Array.isArray(src.utilitiesIncluded) && src.utilitiesIncluded.length
                  ? src.utilitiesIncluded.join(", ")
                  : null) ||
                (src.utilities && typeof src.utilities === "string" ? src.utilities : null);
              if (!deposit && !fees && !lease && !utilities) return null;
              return (
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-semibold">Pricing & Terms</div>
                  <ul className="list-disc pl-5 text-[14px]">
                    {lease && <li>Lease: {lease}</li>}
                    {deposit && <li>Security deposit: {fmtMoney(Number(deposit)) || deposit}</li>}
                    {fees && <li>Application fee: {fmtMoney(Number(fees)) || fees}</li>}
                    {utilities && <li>Utilities included: {utilities}</li>}
                  </ul>
                </div>
              );
            })()}

            {/* Description */}
            {(() => {
              const desc = detailFull?.description || detailFor?.description;
              if (!desc) return null;
              return (
                <div className="mt-4">
                  <div className="mb-1 text-sm font-semibold">About this place</div>
                  <p className="whitespace-pre-wrap text-[14px] text-black/80">{desc}</p>
                </div>
              );
            })()}

            {/* Address */}
            {(() => {
              const addr =
                detailFull?.address?.street || detailFull?.address ||
                detailFor?.address?.street || detailFor?.address;
              if (!addr) return null;
              return (
                <div className="mt-4 text-[14px]">
                  <div className="mb-1 text-sm font-semibold">Address</div>
                  <div className="text-black/80">{addr}</div>
                </div>
              );
            })()}

            <div className="mt-4">
              <div className="mb-1 text-sm font-semibold">Your notes</div>
              <textarea
                rows={3}
                value={notes[detailFor._id] || ""}
                onChange={(e) => saveNote(detailFor._id, e.target.value)}
                className="w-full rounded-md border border-black/10 bg-white p-2 text-[14px] outline-none"
                placeholder="e.g., Ask about utilities, FaceTime tour at 5pm, roommate likes cats…"
              />
            </div>

            {/* CTA */}
            <div className="mt-6">
              {(() => {
                const state = reqState[detailFor._id];
                return (
                  <button
                    onClick={() => requestContact(detailFor._id)}
                    disabled={isDisabled(state)}
                    className={cx(
                      "rounded-lg px-3 py-1.5 text-sm font-medium",
                      state === "approved"
                        ? "bg-emerald-600 text-white"
                        : state === "pending"
                        ? "bg-amber-500 text-black"
                        : state === "self"
                        ? "bg-black text-white opacity-70"
                        : state === "error"
                        ? "bg-rose-600 text-white"
                        : "bg-black text-white hover:bg-black/90"
                    )}
                  >
                    {buttonLabel(state)}
                  </button>
                );
              })()}
              {detailLoading && (
                <div className="mt-2 text-xs text-black/60">Loading more details…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCompare(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mt-6 max-h-[85vh] w-[min(980px,96vw)] overflow-auto rounded-2xl bg-white p-4 text-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Compare {selectedList.length} places</h4>
              <button
                className="rounded-md bg-black/5 px-2 py-1 text-sm"
                onClick={() => setShowCompare(false)}
              >
                Close
              </button>
            </div>

            <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3">
              {selectedList.map((p) => {
                const img = primaryImageUrl(p);
                const state = reqState[p._id];

                const facts = [];
                if (typeof p.price === "number") facts.push(["Price", fmtMoney(p.price)]);
                if (typeof p.matchScore === "number") facts.push(["Match", `${Math.round(p.matchScore)}%`]);
                if (typeof p.bedrooms === "number") facts.push(["Bedrooms", p.bedrooms]);
                if (typeof p.bathrooms === "number") facts.push(["Bathrooms", p.bathrooms]);
                if (typeof p.sqft === "number" || p.squareFeet) facts.push(["Sq Ft", p.sqft || p.squareFeet]);
                if (p.moveIn) facts.push(["Move-in", p.moveIn]);
                if (typeof p.distanceMiles === "number") facts.push(["Distance", `${p.distanceMiles} mi`]);
                if (p.laundry || p.inUnitLaundry || p.onSiteLaundry) {
                  facts.push([
                    "Laundry",
                    p.laundry || (p.inUnitLaundry ? "In-unit" : p.onSiteLaundry ? "On-site" : "")
                  ]);
                }
                if (p.parking || p.parkingAvailable) {
                  facts.push(["Parking", p.parking || (p.parkingAvailable ? "Available" : "")]);
                }
                if (p.pets || p.petsAllowed) {
                  facts.push(["Pets", p.pets || (p.petsAllowed ? "Allowed" : "")]);
                }

                return (
                  <div key={p._id} className="rounded-xl border border-black/10 bg-black/[0.02]">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-t-xl bg-black/5">
                      {img && (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="mb-1 line-clamp-1 font-semibold">{p.title}</div>
                      <div className="mb-2 line-clamp-2 text-[13px] text-black/60">
                        {p.address?.street || p.address || ""}
                      </div>

                      <dl className="space-y-1 text-[13px]">
                        {facts.map(([k, v], i) => (
                          <div key={i} className="flex justify-between gap-2">
                            <dt className="text-black/60">{k}</dt>
                            <dd className="font-medium text-right">{v}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-3">
                        <button
                          onClick={() => requestContact(p._id)}
                          disabled={isDisabled(state)}
                          className={cx(
                            "w-full rounded-md px-3 py-1.5 text-sm",
                            state === "approved" ? "bg-emerald-600 text-white"
                            : state === "pending" ? "bg-amber-500 text-black"
                            : state === "self" ? "bg-black text-white opacity-70"
                            : state === "error" ? "bg-rose-600 text-white"
                            : "bg-black text-white hover:bg-black/90"
                          )}
                        >
                          {buttonLabel(state)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}



        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div className="sticky bottom-0 z-30 mt-2 flex items-center justify-between rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="rounded-md bg-black/5 px-2 py-1"
              >
                {allSelected ? "Unselect all" : "Select all on page"}
              </button>
              <span className="text-black/70">{selected.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearSelection} className="rounded-md bg-black/5 px-3 py-1.5">
                Clear
              </button>
              <button
                onClick={() => setShowCompare(true)}
                disabled={selectedList.length < 2}
                className={`rounded-md px-3 py-1.5 ${
                  selectedList.length < 2
                    ? "bg-black/30 text-white/70 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                Compare selected ({selectedList.length})
              </button>
              <button
                onClick={bulkRequest}
                disabled={selectableSelectedCount === 0}
                className={`rounded-md px-3 py-1.5 ${
                  selectableSelectedCount === 0
                    ? "bg-black/30 text-white/70 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                Request contact for selected ({selectableSelectedCount})
              </button>
            </div>
          </div>
        )}



      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90">
          Done
        </button>
      </div>
    </div>
  );
}


/* ============================ PAGE ============================ */
export default function UserDashboard() {
  const nav = useNavigate();

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
    modalType: "",
  });
  const [toast, setToast] = useState({
    isShown: false,
    type: "add",
    message: "",
  });

  const [userInfo, setUserInfo] = useState(null);
  const [solveText, setSolveText] = useState("");

  const fetchUser = async () => {
    try {
      const r = await axiosInstance.get("/get-user");
      return r?.data?.user || null;
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.clear();
        nav("/login");
      }
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await fetchUser();
      if (!mounted) return;
      setUserInfo(u);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type) =>
    setToast({ isShown: true, message, type });
  const closeToast = () => setToast({ isShown: false, message: "" });

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} handleClearSearch={() => {}} />

      <SolveHero
        firstName={userInfo?.firstName}
        value={solveText}
        setValue={setSolveText}
        onSubmit={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: { __solveText: solveText },
            modalType: "solve-housing",
          })
        }
        onNewProperty={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null,
            modalType: "property",
          })
        }
        onNewItem={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null,
            modalType: "item",
          })
        }
      />

      {SHOW_LISTS && <div className="mx-auto max-w-7xl px-4 pb-24" />}

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({
            isShown: false,
            type: "add",
            data: null,
            modalType: "",
          })
        }
        ariaHideApp={false}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm"
        className="mx-auto mt-14 w-[min(960px,92vw)] max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-white p-5 text-black shadow-2xl outline-none"
      >
        {openAddEditModal.modalType === "property" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Property</h3>
              <button
                className="grid h-8 w-8 place-items-center rounded-full bg-black/5"
                onClick={() =>
                  setOpenAddEditModal({
                    isShown: false,
                    type: "add",
                    data: null,
                    modalType: "",
                  })
                }
              >
                <MdClose />
              </button>
            </div>
            <AddEditProperty
              type={openAddEditModal.type}
              propertyData={openAddEditModal.data}
              onClose={() =>
                setOpenAddEditModal({
                  isShown: false,
                  type: "add",
                  data: null,
                  modalType: "",
                })
              }
              getAllProperties={async () => {}}
              showToastMessage={(m, t) => showToast(m, t || "add")}
            />
          </>
        )}

        {openAddEditModal.modalType === "item" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Marketplace Item</h3>
              <button
                className="grid h-8 w-8 place-items-center rounded-full bg-black/5"
                onClick={() =>
                  setOpenAddEditModal({
                    isShown: false,
                    type: "add",
                    data: null,
                    modalType: "",
                  })
                }
              >
                <MdClose />
              </button>
            </div>
            <AddEditItem
              type={openAddEditModal.type}
              itemData={openAddEditModal.data}
              onClose={() =>
                setOpenAddEditModal({
                  isShown: false,
                  type: "add",
                  data: null,
                  modalType: "",
                })
              }
              getAllItems={async () => {}}
              showToastMessage={(m, t) => showToast(m, t || "add")}
            />
          </>
        )}

        {openAddEditModal.modalType === "solve-housing" && (
          <SolveHousingPanel
            initialText={openAddEditModal?.data?.__solveText || ""}
            onCreateProperty={() =>
              setOpenAddEditModal({
                isShown: true,
                type: "add",
                data: {
                  title: "Housing Request",
                  description: openAddEditModal?.data?.__solveText || "",
                },
                modalType: "property",
              })
            }
            onClose={() =>
              setOpenAddEditModal({
                isShown: false,
                type: "add",
                data: null,
                modalType: "",
              })
            }
          />
        )}
      </Modal>

      <Toast
        isShown={toast.isShown}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
}
