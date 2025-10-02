import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BorderBeam } from "./ui/border-beam";
import { GraduationCap } from "lucide-react";

const TOP_CAMPUSES = [
  { name: "Northern Illinois University", city: "DeKalb, IL", code: "NIU" },
  { name: "University of Illinois Urbana-Champaign", city: "Urbana, IL", code: "UIUC" },
  { name: "University of Chicago", city: "Chicago, IL", code: "UChicago" },
  { name: "Northwestern University", city: "Evanston, IL", code: "NU" },
];

export default function UniversityFinder() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useState(null);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef(null);
  const [nearby, setNearby] = useState(null);

  const recent = useMemo(() => {
    try {
      const raw = localStorage.getItem("nr_recent_campuses");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const suggestions = useMemo(() => {
    const base = [...(nearby ? [nearby] : []), ...recent, ...TOP_CAMPUSES];
    if (!query.trim()) return base.slice(0, 6);
    const q = query.toLowerCase();
    return base.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 6);
  }, [query, recent, nearby]);

  function commitSelection(campus) {
    setSelected(campus);
    try {
      const next = [campus, ...recent.filter(r => r.name !== campus.name)].slice(0, 6);
      localStorage.setItem("nr_recent_campuses", JSON.stringify(next));
    } catch {}
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((highlight + 1) % suggestions.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((highlight - 1 + suggestions.length) % suggestions.length); }
    if (e.key === 'Enter') { e.preventDefault(); commitSelection(suggestions[highlight]); }
  }

  // Basic geolocation for a simple "Near me" chip (can be replaced with backend proximity)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // Example: NIU as a plausible nearby campus placeholder
        setNearby({ name: "Northern Illinois University", city: "DeKalb, IL", code: "NIU" });
      },
      () => {}
    );
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 overflow-visible z-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
            <GraduationCap className="h-4 w-4 text-white" />
          </span>
          <h3 className="text-xl font-semibold">Select your university</h3>
        </div>
        <p className="text-white/70 text-sm mb-4">Choose your campus to enable verified, university‑only features and a personalized experience.</p>

        <div className="flex items-start gap-3">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              onFocus={()=>setFocus(true)}
              onBlur={()=>setTimeout(()=>setFocus(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Search university…"
              aria-label="Search university"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#2F64FF]"
            />
            {focus && (
              <div ref={listRef} className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-[#0E0F12] p-2 shadow-xl z-30 max-h-72 overflow-auto">
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-white/60">No matches</div>
                ) : suggestions.map((c, i) => (
                  <button
                    key={c.name}
                    onMouseDown={()=>commitSelection(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${i===highlight ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    aria-selected={i===highlight}
                  >
                    <div className="font-medium text-white/90">{c.name}</div>
                    <div className="text-white/50 text-xs">{c.city}</div>
                  </button>
                ))}
              </div>
            )}
            {/* Quick chips */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {nearby && (
                <button onClick={()=>commitSelection(nearby)} className="px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10">Near me: {nearby.code}</button>
              )}
              <button onClick={()=>setQuery('University of ')} className="px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10">Top campuses</button>
              {recent.slice(0,3).map(r => (
                <button key={r.name} onClick={()=>commitSelection(r)} className="px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10">{r.code || r.name.split(' ')[0]}</button>
              ))}
            </div>
            <div className="mt-2 text-xs text-white/50">Type to search • Use ↑/↓ to navigate • Press Enter to select</div>
          </div>

          <button
            onClick={()=> navigate('/signup')}
            className="self-start inline-flex h-12 items-center justify-center rounded-xl bg-[#2F64FF] px-6 font-semibold text-white shadow-[0_0_18px_rgba(47,100,255,0.35)] transition hover:bg-[#2958e3]"
          >
            Continue
          </button>
        </div>

        {selected && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
            <span className="text-white/90">{selected.name}</span>
            <span className="text-white/50">• {selected.city}</span>
          </div>
        )}

        <BorderBeam size={260} duration={5} colorFrom="#2F64FF" colorTo="#00D4FF" borderWidth={2} />
      </div>
    </div>
  );
}


