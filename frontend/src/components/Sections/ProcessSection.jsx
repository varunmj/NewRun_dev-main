import React from "react";
import { motion } from "framer-motion";

/** Small fake-window with a glassy card look */
function WindowCard({ title, kicker, desc, children, delay = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55, delay }}
      className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-5 shadow-2xl ring-1 ring-black/5"
    >
      {/* soft glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 blur-2xl transition group-hover:opacity-100"
           style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,0.20) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)" }}
      />
      {/* window chrome */}
      <div className="rounded-2xl bg-[#0E1014] ring-1 ring-inset ring-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="ml-3 h-2 w-24 rounded bg-white/10" />
        </div>

        {/* fake content area */}
        <div className="grid gap-4 p-5 md:p-6">
          <div className="grid gap-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-cyan-300/70">
              {kicker}
            </span>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-white/70">{desc}</p>
          </div>

          {/* visual / skeleton UI */}
          <div className="rounded-xl bg-[#0A0C10] p-4 ring-1 ring-inset ring-white/10">
            {children}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/** tiny UI blocks to mimic the second screenshot */
function Bars() {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-4 gap-2">
        <div className="h-16 rounded-lg bg-white/5 ring-1 ring-white/10" />
        <div className="h-16 rounded-lg bg-white/5 ring-1 ring-white/10" />
        <div className="h-16 rounded-lg bg-white/5 ring-1 ring-white/10" />
        <div className="h-16 rounded-lg bg-white/5 ring-1 ring-white/10" />
      </div>
      <div className="h-10 rounded-lg bg-white/5 ring-1 ring-white/10" />
      <div className="h-10 w-2/3 rounded-lg bg-white/5 ring-1 ring-white/10" />
    </div>
  );
}

function ToggleList() {
  return (
    <div className="grid gap-2">
      {["Verified", "Efficient", "Accurate", "Secure"].map((t, i) => (
        <div key={t} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <span className="text-sm text-white/80">{t}</span>
          <span className="relative inline-flex h-5 w-10 items-center rounded-full bg-white/10">
            <span className={`h-4 w-4 rounded-full bg-white/70 transition ${i % 2 ? "translate-x-5" : "translate-x-1"}`} />
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusPanel() {
  return (
    <div className="grid gap-3">
      <div className="h-32 rounded-lg bg-white/5 ring-1 ring-white/10" />
      <div className="grid gap-1">
        <div className="text-xs text-white/60">Status:</div>
        <div className="h-2 w-full rounded bg-white/10">
          <div className="h-2 w-1/2 rounded bg-gradient-to-r from-cyan-400 to-indigo-400" />
        </div>
        <div className="text-xs text-white/60">Updating…</div>
      </div>
    </div>
  );
}

export default function ProcessSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      {/* Kicker */}
      <div className="mx-auto mb-6 flex w-full max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 ring-1 ring-black/5">
        Process
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center text-4xl font-bold md:text-5xl"
      >
        Your path to excellence
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mx-auto mt-3 max-w-2xl text-center text-white/70"
      >
        A simple, effective approach to deliver excellence for every student.
      </motion.p>

      {/* Cards */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <WindowCard
          delay={0.05}
          kicker="Step 1"
          title="Join"
          desc="Create your profile and verify your university."
        >
          <Bars />
        </WindowCard>

        <WindowCard
          delay={0.12}
          kicker="Step 2"
          title="Set Up"
          desc="Get housing, essentials, and connections tailored to you."
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Bars />
            </div>
            <ToggleList />
          </div>
        </WindowCard>

        <WindowCard
          delay={0.18}
          kicker="Step 3"
          title="Thrive"
          desc="Meet people, join events, and feel at home from day one."
        >
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <ToggleList />
            </div>
            <div className="col-span-2">
              <StatusPanel />
            </div>
          </div>
        </WindowCard>
      </div>
    </section>
  );
}
