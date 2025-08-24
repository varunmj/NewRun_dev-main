import React from "react";

/**
 * NewRun Marketplace — Framer-style hero with dot-grid background.
 * No external icon libs. Pure Tailwind + tiny CSS utilities.
 */
export default function HeroPromo() {
  return (
    <section className="nr-hero-bg">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* tiny badges */}
        <div className="mb-6 flex items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
            Student-only marketplace
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
            Verified .edu accounts
          </span>
        </div>

        {/* headline */}
        <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight text-white md:text-6xl">
          Buy & sell{" "}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            campus essentials
          </span>{" "}
          in minutes.
          <br className="hidden md:block" />
          <span className="block mt-2">Safe, local, student-first.</span>
        </h1>

        {/* faux search / prompt bar */}
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/5/50 p-3 backdrop-blur-md">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101215] px-3 py-2.5">
              <span className="text-white/50">⌕</span>
              <input
                type="text"
                readOnly
                value={`Search: "mini fridge" · "desk" · "sofa" · "textbooks"`}
                className="flex-1 bg-transparent text-sm text-white/75 placeholder:text-white/40 focus:outline-none"
              />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
                Browse
              </span>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#market-grid"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,153,0,.25)] hover:bg-orange-400"
          >
            Explore listings <span aria-hidden>→</span>
          </a>
          <a
            href="/marketplace/sell"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
          >
            List an item
          </a>
        </div>
      </div>
    </section>
  );
}
