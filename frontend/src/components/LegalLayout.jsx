import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function LegalLayout({ title, sections, children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nr_legal_theme') || 'dark';
    } catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem('nr_legal_theme', theme); } catch {}
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <main className={`min-h-screen ${isLight ? 'bg-white' : 'bg-black'}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="brand-script text-5xl leading-none bg-gradient-to-r from-[#2F64FF] to-[#00D4FF] bg-clip-text text-transparent">NewRun</h1>
          {/* Theme toggle */}
          <div className="flex items-center gap-2">
            <span className={`${isLight ? 'text-black/70' : 'text-white/70'} text-xs`}>Dark</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isLight} onChange={(e)=>setTheme(e.target.checked ? 'light' : 'dark')} />
              <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-[#2F64FF] transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transform transition-transform peer-checked:translate-x-4"></div>
            </label>
            <span className={`${isLight ? 'text-black/70' : 'text-white/70'} text-xs`}>Light</span>
          </div>
        </div>
        <h2 className={`${isLight ? 'text-black' : 'text-white'} text-2xl font-semibold mt-2`}>{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] items-start gap-8 relative" style={isLight ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}>
          {/* Sticky sidebar */}
          <aside className="md:sticky md:top-6 h-max z-0">
            <nav className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-white/70 text-xs uppercase tracking-wide mb-2">On this page</div>
              <ul className="space-y-1 text-sm">
                {sections?.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-white/85 hover:bg-white/10">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 relative z-10">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}


