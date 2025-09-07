// src/pages/Roommate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

/* ------------------------------ content data ------------------------------ */
const majors = ["MIS","CS","Data Science","Electrical Engineering","Mechanical Engineering","Business Analytics","Finance","Marketing","Information Systems","Cybersecurity"];
const languagePool = ["English","Hindi","Tamil","Telugu","Malayalam","Kannada","Marathi","Gujarati","Punjabi","Bengali","Urdu","Spanish","Chinese","Arabic","Korean","Japanese","French","German"];

const distanceOptions = ["Walk","Bike","Bus","No preference"];
const petsOptions = ["Yes","No","Ok if others have"];
const smokingOptions = ["Allowed","Not allowed","Outdoor only"];
const sleepOptions = ["Early","Late","Mixed"];
const dietOptions = ["Vegetarian","Vegan","Eggetarian","Halal","Kosher","Omnivore"];
const alcoholHomeOptions = ["Allowed","Not allowed","Occasional"];
const guestFreq = ["Rarely","Sometimes","Often"];
const quietHours = ["Early evenings","Late nights OK","No preference"];

/* ------------------------------ country utils ----------------------------- */
const countries = [
  { code:"IN", name:"India" }, { code:"CN", name:"China" }, { code:"US", name:"United States" },
  { code:"PK", name:"Pakistan" }, { code:"BD", name:"Bangladesh" }, { code:"LK", name:"Sri Lanka" },
  { code:"NP", name:"Nepal" }, { code:"AE", name:"United Arab Emirates" }, { code:"SA", name:"Saudi Arabia" },
  { code:"NG", name:"Nigeria" }, { code:"VN", name:"Vietnam" }, { code:"KR", name:"South Korea" },
  { code:"JP", name:"Japan" }, { code:"MY", name:"Malaysia" }, { code:"SG", name:"Singapore" },
  { code:"ID", name:"Indonesia" }, { code:"PH", name:"Philippines" }, { code:"TH", name:"Thailand" },
  { code:"GB", name:"United Kingdom" }, { code:"CA", name:"Canada" }, { code:"FR", name:"France" },
  { code:"DE", name:"Germany" }, { code:"IT", name:"Italy" }, { code:"ES", name:"Spain" },
  { code:"TR", name:"Türkiye" }, { code:"IR", name:"Iran" }, { code:"MX", name:"Mexico" },
  { code:"BR", name:"Brazil" }, { code:"KE", name:"Kenya" }, { code:"GH", name:"Ghana" }
];
const flag = (cc) =>
  String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));

/* ------------------------------ typing helper ----------------------------- */
function typeWords(text, onTick, onDone, wpm = 520) {
  const words = String(text).split(/\s+/);
  const iv = Math.max(26, Math.round(60000 / wpm));
  let i = 0;
  const id = setInterval(() => {
    onTick(words[i] + (i < words.length - 1 ? " " : ""));
    i++;
    if (i >= words.length) {
      clearInterval(id);
      onDone?.();
    }
  }, iv);
  return () => clearInterval(id);
}

/* ------------------------------- stage config ----------------------------- */
const STAGES = [
  {
    key: "logistics",
    title: "Logistics",
    steps: [
      { id: "budget", kind: "number", prompt: "What’s your monthly budget (USD)?" },
      { id: "moveInStart", kind: "date", prompt: "When would you like to move in? (start date)" },
      { id: "moveInEnd", kind: "date", prompt: "And your move-in end date? (or same as start)" },
      { id: "distancePref", kind: "chips", prompt: "How far from campus is okay?", options: distanceOptions }
    ]
  },
  {
    key: "lifestyle",
    title: "Lifestyle",
    steps: [
      { id: "petsAllowed", kind: "chips", prompt: "Pets at home?", options: petsOptions },
      { id: "smokingAtHome", kind: "chips", prompt: "Smoking at home?", options: smokingOptions },
      { id: "sleepSchedule", kind: "chips", prompt: "What’s your sleep schedule?", options: sleepOptions },
      { id: "cleanliness", kind: "slider", prompt: "Cleanliness? (1 Laid-back → 5 Neat)" },
    ]
  },
  {
    key: "food_habits",
    title: "Food & Habits",
    steps: [
      { id: "diet", kind: "chips", prompt: "Diet preference?", options: dietOptions },
      { id: "alcoholAtHome", kind: "chips", prompt: "Alcohol at home is…", options: alcoholHomeOptions },
      { id: "guestFrequency", kind: "chips", prompt: "Guests at home?", options: guestFreq },
      { id: "quietHoursPref", kind: "chips", prompt: "Quiet / prayer-friendly hours?", options: quietHours },
    ]
  },
  {
    key: "background",
    title: "Background",
    steps: [
      { id: "major", kind: "chipsText", prompt: "Your major?", options: majors },
      { id: "country", kind: "country", prompt: "Where are you from originally?" },
      { id: "languages", kind: "multi", prompt: "Languages you’re comfortable speaking at home?", options: languagePool },
      { id: "about", kind: "textarea", prompt: "One line about you (optional)." },
      { id: "consent", kind: "toggles", prompt: "Use these only to improve ranking — never to block others." },
    ]
  },
  { key: "finish", title: "Finish", steps: [{ id: "finish", kind: "finish", prompt: "Awesome. Saving and fetching your best matches…" }] }
];

// Flattened order for cursor management
const ALL_STEPS = STAGES.flatMap(s => s.steps);

/* ---------------------------------- atoms --------------------------------- */
const Tag = ({ children }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] border border-[#2a2a2a] text-gray-300">
    {children}
  </span>
);

const Chip = ({ children, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-2 rounded-full text-xs border transition
      ${selected ? "bg-white text-black border-white"
                 : "bg-[#151515] text-gray-300 border-[#2a2a2a] hover:border-[#3a3a3a]"}`}
  >
    {children}
  </button>
);

const Sparkles = ({ className="w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2l1.7 3.8L18 7.5l-3.3 1.7L12 13l-2.7-3.8L6 7.5l4.3-1.7L12 2zM5 14l.9 2 2 1-2 1L5 20l-.9-2-2-1 2-1 .9-2zm14 0l.9 2 2 1-2 1L19 20l-.9-2-2-1 2-1 .9-2z"/>
  </svg>
);

/* --------------------------- orbit answers display ------------------------- */
const OrbitAnswers = ({ items }) => {
  // Only show last 10 to avoid clutter
  const list = items.slice(-10);
  const radius = 220; // px
  const angleStep = 360 / Math.max(5, list.length);
  return (
    <div className="pointer-events-none absolute inset-0 -z-0">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite]">
        {list.map((txt, i) => {
          const angle = i * angleStep;
          return (
            <div
              key={i}
              className="absolute"
              style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)` }}
            >
              <div className="pointer-events-auto text-[11px] px-3 py-1.5 rounded-xl border border-[#2a2a2a] bg-[#0b0b0b]/80 backdrop-blur text-gray-200 shadow-[0_0_24px_rgba(64,119,255,0.15)]">
                {txt}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------------------- country selector --------------------------- */
const CountrySelect = ({ value, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? countries.filter(c => c.name.toLowerCase().includes(t)) : countries;
  }, [q]);
  const current = countries.find(c => c.name === value);

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center gap-3 bg-[#0c0f1c] border border-[#2a3b8f] rounded-2xl px-4 py-3 cursor-text ${disabled ? "opacity-60" : ""}`}
        onClick={() => !disabled && setOpen(v => !v)}
      >
        <span className="text-lg">{current ? flag(current.code) : "🌐"}</span>
        <input
          type="text"
          placeholder={current ? current.name : "Search country…"}
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500"
        />
        <Sparkles className="w-4 h-4 text-blue-300" />
      </div>
      {open && (
        <div className="absolute mt-2 z-20 w-full max-h-60 overflow-y-auto rounded-xl border border-[#2a3b8f] bg-[#0c0f1c] shadow-[0_0_30px_rgba(64,119,255,0.25)]">
          <div className="px-3 py-2 text-[11px] text-gray-400">Type to filter…</div>
          {filtered.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onSelect(c.name); setQ(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-[#0f1630] flex items-center gap-3 text-sm"
            >
              <span className="text-lg">{flag(c.code)}</span>
              <span className="text-gray-200">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------ page state/init ---------------------------- */
const initialForm = {
  // logistics
  budget: "",
  moveInStart: "",
  moveInEnd: "",
  distancePref: "No preference",
  // lifestyle
  petsAllowed: "Ok if others have",
  smokingAtHome: "Not allowed",
  cleanliness: 3,
  sleepSchedule: "Mixed",
  // habits
  diet: "",
  alcoholAtHome: "Occasional",
  guestFrequency: "Sometimes",
  quietHoursPref: "No preference",
  // background
  major: "",
  country: "",
  languages: [],
  about: "",
  // toggles
  useMajorBoost: true,
  useCountryBoost: true,
  useLanguageBoost: true,
};

const Roommate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const [cursor, setCursor] = useState(0);          // index into ALL_STEPS
  const [typed, setTyped] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [answers, setAnswers] = useState([]);       // strings to orbit
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);

  const cardRef = useRef(null);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const progress = Math.min(100, Math.round((cursor / (ALL_STEPS.length - 1)) * 100));
  const currentStageIdx = useMemo(() => {
    let i = 0, sum = 0;
    for (const s of STAGES) {
      const len = s.steps.length;
      if (cursor < sum + len) return i;
      sum += len; i++;
    }
    return STAGES.length - 1;
  }, [cursor]);

  /* ------------------------------- typing flow ------------------------------ */
  const showPrompt = (index) => {
    const step = ALL_STEPS[index];
    if (!step) return;
    setCursor(index);
    setTyped("");
    setStreaming(true);
    typeWords(step.prompt, (chunk) => setTyped((t) => t + chunk), () => setStreaming(false));
  };

  const answerThenNext = (displayValue) => {
    // push to orbit list
    if (displayValue) setAnswers((a) => [...a, displayValue]);
    // scroll the prompt card into view
    cardRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const next = Math.min(ALL_STEPS.length - 1, cursor + 1);
    showPrompt(next);
  };

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/roommate/preferences");
        const p = r.data?.profile;
        if (p) {
          setForm({
            ...initialForm,
            budget: p.budget || "",
            moveInStart: p.moveInStart ? String(p.moveInStart).slice(0,10) : "",
            moveInEnd: p.moveInEnd ? String(p.moveInEnd).slice(0,10) : "",
            distancePref: p.distancePref || "No preference",
            petsAllowed: p.petsAllowed || "Ok if others have",
            smokingAtHome: p.smokingAtHome || "Not allowed",
            cleanliness: Number(p.cleanliness) || 3,
            sleepSchedule: p.sleepSchedule || "Mixed",
            major: p.major || "",
            country: p.country || "",
            languages: Array.isArray(p.languages) ? p.languages : [],
            about: p.about || "",
            useMajorBoost: !!p.useMajorBoost,
            useCountryBoost: !!p.useCountryBoost,
            useLanguageBoost: !!p.useLanguageBoost,
          });
        }
      } catch {}
      showPrompt(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ server calls ------------------------------ */
  const saveAndFetch = async () => {
    setLoading(true);
    try {
      // Only send fields your current backend knows; extra keys are harmless if ignored
      const payload = {
        budget: Number(form.budget) || 0,
        moveInStart: form.moveInStart,
        moveInEnd: form.moveInEnd,
        distancePref: form.distancePref,
        petsAllowed: form.petsAllowed,
        smokingAtHome: form.smokingAtHome,
        cleanliness: form.cleanliness,
        sleepSchedule: form.sleepSchedule,
        major: form.major,
        country: form.country,
        languages: form.languages.filter(Boolean),
        about: form.about,
        useMajorBoost: form.useMajorBoost,
        useCountryBoost: form.useCountryBoost,
        useLanguageBoost: form.useLanguageBoost,
        // FYI: diet/alcohol/guest/quiet are captured for future scoring, but schema changes are needed to persist them.
      };
      await axiosInstance.post("/roommate/preferences", payload);
      const r = await axiosInstance.get("/roommate/matches");
      setMatches(r.data?.matches || []);
      setTyped("");
      typeWords("Here are your best matches. You can adjust answers anytime.", (c)=>setTyped(t=>t+c), ()=>{});
    } catch (e) {
      console.error(e);
      setTyped("");
      typeWords("Hmm, something went wrong saving your answers. Please try again.", (c)=>setTyped(t=>t+c), ()=>{});
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- composer bar ----------------------------- */
  const step = ALL_STEPS[cursor];

  const Composer = useMemo(() => {
    if (!step) return null;
    const disabled = streaming || loading;

    const NextBtn = ({ onClick, label="Next" }) => (
      <button
        type="button"
        disabled={disabled}
        className={`ml-2 rounded-xl px-4 py-2 bg-white text-black font-medium hover:opacity-90 transition ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        onClick={onClick}
      >
        {label}
      </button>
    );

    switch (step.kind) {
      case "number":
        return (
          <div className="mt-4 flex items-center gap-2 w-full max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#245BFF] via-[#6B9BFF] to-[#245BFF] opacity-40 blur-md"></div>
              <div className="relative flex items-center gap-3 bg-[#0c0f1c] border border-[#2a3b8f] rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(64,119,255,0.25)]">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min={50}
                  placeholder="Enter budget e.g., 700"
                  disabled={disabled}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const n = Number(e.currentTarget.value);
                      if (!n || n < 50) return;
                      setField("budget", n);
                      answerThenNext(`$${n}`);
                    }
                  }}
                />
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
            </div>
            <NextBtn onClick={() => {
              const el = document.activeElement;
              const n = el && "value" in el ? Number(el.value) : 0;
              if (!n || n < 50) return;
              setField("budget", n);
              answerThenNext(`$${n}`);
            }} />
          </div>
        );

      case "date": {
        const fid = step.id;
        const label = fid === "moveInStart" ? "Move-in start" : "Move-in end";
        return (
          <div className="mt-4 flex items-center gap-2 w-full max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#245BFF] via-[#6B9BFF] to-[#245BFF] opacity-40 blur-md"></div>
              <div className="relative flex items-center gap-3 bg-[#0c0f1c] border border-[#2a3b8f] rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(64,119,255,0.25)]">
                <input
                  id={fid}
                  type="date"
                  defaultValue={form[fid]}
                  disabled={disabled}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-200"
                />
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
            </div>
            <NextBtn onClick={() => {
              const el = document.getElementById(fid);
              const v = el && "value" in el ? String(el.value).trim() : "";
              setField(fid, v);
              answerThenNext(`${label}: ${v || "—"}`);
            }} />
          </div>
        );
      }

      case "chips":
        return (
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {step.options.map((opt) => (
              <Chip
                key={opt}
                selected={(form[step.id] || "") === opt}
                onClick={() => { setField(step.id, opt); answerThenNext(opt); }}
              >
                {opt}
              </Chip>
            ))}
          </div>
        );

      case "slider":
        return (
          <div className="mt-6 w-full max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                defaultValue={form.cleanliness}
                onChange={(e) => setField("cleanliness", Number(e.target.value))}
                className="flex-1 accent-white"
              />
              <div className="text-sm text-gray-300 w-10 text-center">{form.cleanliness}/5</div>
              <NextBtn onClick={() => answerThenNext(`Cleanliness: ${form.cleanliness}/5`)} />
            </div>
          </div>
        );

      case "chipsText":
        return (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {step.options.map((opt) => (
                <Chip key={opt} selected={form.major === opt} onClick={() => { setField("major", opt); answerThenNext(opt); }}>
                  {opt}
                </Chip>
              ))}
            </div>
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#245BFF] via-[#6B9BFF] to-[#245BFF] opacity-40 blur-md"></div>
                <div className="relative flex items-center gap-3 bg-[#0c0f1c] border border-[#2a3b8f] rounded-2xl px-4 py-3">
                  <input
                    list="majors"
                    type="text"
                    placeholder="Type your major"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const v = e.currentTarget.value.trim();
                        setField("major", v);
                        answerThenNext(v);
                      }
                    }}
                  />
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  <datalist id="majors">
                    {majors.map((m) => <option value={m} key={m} />)}
                  </datalist>
                </div>
              </div>
            </div>
          </div>
        );

      case "country":
        return (
          <div className="mt-5 w-full max-w-2xl mx-auto">
            <CountrySelect
              value={form.country}
              disabled={disabled}
              onSelect={(name) => { setField("country", name); answerThenNext(`${name}`); }}
            />
          </div>
        );

      case "multi":
        return (
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {step.options.map((opt) => {
              const selected = form.languages.includes(opt);
              return (
                <Chip
                  key={opt}
                  selected={selected}
                  onClick={() => setField("languages", selected ? form.languages.filter((l) => l !== opt) : [...form.languages, opt])}
                >
                  {opt}
                </Chip>
              );
            })}
            <button
              type="button"
              className="ml-2 rounded-xl px-4 py-2 bg-white text-black font-medium hover:opacity-90 transition"
              onClick={() => answerThenNext(form.languages.join(", ") || "No preference")}
            >
              Done
            </button>
          </div>
        );

      case "textarea":
        return (
          <div className="mt-4 w-full max-w-2xl mx-auto">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#245BFF] via-[#6B9BFF] to-[#245BFF] opacity-40 blur-md"></div>
              <div className="relative bg-[#0c0f1c] border border-[#2a3b8f] rounded-2xl p-3">
                <textarea
                  rows={2}
                  className="w-full bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500 resize-none"
                  placeholder="Early riser, veg, quiet study."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const v = e.currentTarget.value.trim();
                      setField("about", v);
                      answerThenNext(v || "—");
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case "toggles":
        return (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.useLanguageBoost} onChange={(e)=>setField("useLanguageBoost", e.target.checked)} />
              <span>Use language</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.useMajorBoost} onChange={(e)=>setField("useMajorBoost", e.target.checked)} />
              <span>Use major</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.useCountryBoost} onChange={(e)=>setField("useCountryBoost", e.target.checked)} />
              <span>Use country</span>
            </label>
            <button type="button" className="rounded-xl px-4 py-2 bg-white text-black font-medium hover:opacity-90 transition" onClick={() => answerThenNext("Boosters saved")}>Next</button>
          </div>
        );

      case "finish":
        return (
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              disabled={loading}
              className={`rounded-xl px-5 py-2 bg-white text-black font-medium hover:opacity-90 transition ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={saveAndFetch}
            >
              Save & Show Matches
            </button>
            <button
              type="button"
              className="rounded-xl px-5 py-2 border border-[#2a2a2a] text-sm text-gray-300 hover:border-[#3a3a3a]"
              onClick={() => { setAnswers([]); setCursor(0); showPrompt(0); }}
            >
              Restart
            </button>
          </div>
        );

      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form, streaming, loading]);

  /* ---------------------------------- UI ---------------------------------- */
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <Navbar />

      {/* dots background (fixed, below everything) */}
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* subtle vignette so dots remain visible */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Hero */}
      <section className="relative border-b border-[#1b1b1b]">
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-wrap gap-2">
            <Tag>Student-only roommate matching</Tag>
            <Tag>Verified .edu accounts</Tag>
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight">
            Find roommates who feel right —{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#60A5FA]">fast & safely</span>.
          </h1>
          <p className="mt-3 text-sm text-gray-400 max-w-2xl">
            We ask a few questions, then use language / major / country as <span className="font-medium">boosters</span> — never blockers.
          </p>

          {/* stage tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {STAGES.filter(s=>s.key!=="finish").map((s, idx) => (
              <div
                key={s.key}
                className={`px-3 py-1 rounded-full text-[11px] border ${idx===currentStageIdx ? "border-white text-white" : "border-[#2a2a2a] text-gray-400"}`}
              >
                {s.title}
              </div>
            ))}
          </div>

          <div className="mt-6 h-1 w-full rounded-full bg-[#141414]">
            <div className="h-1 bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* Blue glow card + orbit answers */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className="relative mx-auto mt-6 w-full max-w-4xl rounded-3xl overflow-visible">
          {/* orbit chips */}
          {answers.length > 0 && (
            <OrbitAnswers items={answers} />
          )}

          {/* glow layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1028] via-[#0C174A] to-[#09122B] rounded-3xl -z-10" />
          <div className="absolute -inset-x-32 -top-28 h-64 rounded-[50%] blur-3xl bg-[radial-gradient(circle_at_center,_rgba(64,119,255,0.55),_transparent_60%)] -z-10" />

          {/* card content */}
          <div className="relative p-6 md:p-10 border border-[#1b2a66] rounded-3xl shadow-[0_20px_80px_rgba(64,119,255,0.25)]">
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              Tell us a bit — we’ll do the roommate magic ✨
            </h2>

            {/* typed line */}
            <div ref={cardRef} className="mt-4 max-h-[38vh] overflow-y-auto">
              <div className="rounded-xl bg-[#0f1227]/70 border border-[#1b2a66] px-4 py-3 text-sm text-gray-200">
                {typed || "\u00A0"}
              </div>
            </div>

            {/* composer */}
            <div className="mt-4">
              {Composer}
            </div>
          </div>
        </div>

        {/* Matches */}
        {matches.length > 0 && (
          <section className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Top matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((m, idx) => (
                <div key={idx} className="bg-[#141414] p-4 rounded-2xl border border-[#222] hover:border-[#2a2a2a] transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2b2b2b] to-[#1b1b1b] border border-[#2a2a2a]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {(m?.user?.firstName || "") + (m?.user?.lastName ? ` ${m.user.lastName}` : "") || (m?.user?.email || "Student")}
                      </div>
                      <div className="text-xs text-gray-400">{m?.user?.major || m?.profile?.major || "Student"}</div>
                    </div>
                    <div className="text-sm font-semibold">{m.score}%</div>
                  </div>
                  {m.profile?.about ? (
                    <div className="mt-3 text-xs text-gray-300 line-clamp-3">{m.profile.about}</div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(m.reasons || []).map((r, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-[#1b1b1b] border border-[#2a2a2a] text-gray-300">{r}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl font-medium bg-white text-black hover:opacity-90 transition"
                      onClick={() => navigate("/messaging")}
                    >
                      Message
                    </button>
                    <button type="button" className="px-4 py-2 rounded-xl border border-[#2a2a2a] text-sm text-gray-300 hover:border-[#3a3a3a]">
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      
    </div>
  );
};

export default Roommate;
