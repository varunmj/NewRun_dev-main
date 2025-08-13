import React from "react";
import { motion } from "framer-motion";

/* Small skeleton atoms ---------------------------------------------------- */
const Bar = ({ w = "w-32", h = "h-2.5", className = "" }) => (
  <div className={`skel ${w} ${h} rounded-md ${className}`} />
);

const Pill = ({ w = "w-20", h = "h-7", className = "" }) => (
  <div className={`skel ${w} ${h} rounded-full ${className}`} />
);

const Dot = ({ className = "" }) => (
  <div className={`h-2 w-2 rounded-full bg-white/20 ${className}`} />
);

const Toggle = ({ on = true }) => (
  <div className="relative h-6 w-11 rounded-full bg-white/10 glass-outline">
    <div
      className={`absolute top-[2px] h-5 w-5 rounded-full transition ${
        on ? "left-[22px] bg-cyan-400" : "left-[2px] bg-white/30"
      }`}
    />
  </div>
);

/* Card wrapper ------------------------------------------------------------ */
const Card = ({ children, title, caption }) => (
  <motion.div
    initial={{ opacity: 0, y: 14, scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.55, ease: "easeOut" }}
    whileHover={{ y: -4 }}
    className="group relative flex flex-col rounded-2xl bg-[#0B0D10]/80 p-4 sm:p-5 glass-outline backdrop-blur"
  >
    {/* browser chrome hint */}
    <div className="mb-4 flex items-center gap-2">
      <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
      <div className="h-2.5 w-2.5 rounded-full bg-amber-300/60" />
      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
      <div className="ml-3 skel h-2.5 w-36 rounded-full" />
    </div>

    {children}

    <div className="mt-5">
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/60">{caption}</div>
    </div>

    {/* soft hover glow */}
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
      <div className="glowband absolute inset-x-6 bottom-0 h-12 rounded-full blur-2xl" />
    </div>
  </motion.div>
);

/* Section ----------------------------------------------------------------- */
export default function AnimatedFeatureGrid() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="mx-auto max-w-4xl text-center mb-12">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">
            How NewRun helps
        </span>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Start strong. Settle fast.
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-white/70">
            AI-guided onboarding to secure verified housing, find a compatible roommate,
            grab your essentials, and plug into your campus community — all in one flow.
        </p>
        </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. AI Concierge / Chat */}
        <Card
          title="AI Concierge"
          caption="Ask anything. Your campus guide drafts answers, routes you, and follows up."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start gap-3">
              <div className="skel h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Bar w="w-48" />
                <Bar w="w-40" />
              </div>
              <div className="skel h-6 w-6 shrink-0 rounded-md" />
            </div>

            <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
              <div className="space-y-1.5">
                <Bar w="w-56" />
                <Bar w="w-40" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
              <div className="skel h-7 w-7 rounded-md" />
              <div className="skel h-9 w-full rounded-xl relative">
                <div className="absolute left-2 top-2 h-5 w-40 rounded-md bg-white/10" />
              </div>
              <div className="skel h-9 w-10 rounded-xl" />
            </div>
          </div>
        </Card>

        {/* 2. Smart Matching / Content Generator vibe */}
        <Card
          title="Smart Matching"
          caption="Generate tailored roommate & housing options from your preferences."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="skel h-9 w-full rounded-lg" />
              <div className="skel h-9 w-24 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="skel h-28 rounded-lg" />
              <div className="skel h-28 rounded-lg" />
              <div className="skel h-28 rounded-lg" />
              <div className="skel h-28 rounded-lg" />
              <div className="skel h-28 rounded-lg" />
              <div className="skel h-28 rounded-lg" />
            </div>
          </div>
        </Card>

        {/* 3. Verified Network (contact cards) */}
        <Card
          title="Verified Network"
          caption="Only .edu-verified peers & hosts. Safer conversations, better results."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <Dot /><Dot /><Dot />
              <div className="ml-3 skel h-2 w-40 rounded-full" />
            </div>

            <div className="mt-3 space-y-2">
              {/* Two stacked cards to imply contacts */}
              {[0, 1].map((i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-3">
                    <div className="skel h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Bar w="w-40" />
                      <Bar w="w-24" className="mt-1" />
                    </div>
                    <div className="skel h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 4. Data Insights (mini dashboard look) */}
        <Card
          title="Arrival Insights"
          caption="See your readiness and deadlines as friendly, glanceable metrics."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex items-center justify-between">
              <Pill w="w-28" />
              <Pill w="w-16" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 rounded-lg bg-white/[0.035] p-3">
                <div className="space-y-2">
                  <Pill w="w-24" h="h-6" />
                  <Bar w="w-28" />
                  <Bar w="w-24" />
                  <Bar w="w-20" />
                  <Bar w="w-16" />
                </div>
              </div>
              <div className="col-span-2 rounded-lg bg-white/[0.035] p-3">
                <div className="skel h-28 w-full rounded-md" />
                <div className="mt-2 flex items-center justify-between">
                  <Bar w="w-24" />
                  <Pill w="w-20" h="h-8" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 5. Live Help (call tiles) */}
        <Card
          title="Live Help"
          caption="Hop into office hours with mentors, seniors, or staff — all verified."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-3">
              <Pill w="w-16" h="h-6" />
              <Pill w="w-16" h="h-6" />
              <Pill w="w-16" h="h-6" />
              <div className="ml-auto skel h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skel h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </Card>

        {/* 6. Notes / Tasks (progress) */}
        <Card
          title="Checklist"
          caption="Lightweight pre-arrival tasks with progress — zero forms here."
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="space-y-3">
              {/* rows */}
              {[0,1,2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skel h-5 w-5 rounded-md" />
                  <Bar w="w-48" />
                  <Toggle on={i !== 2} />
                </div>
              ))}
              <div className="mt-2">
                <div className="mb-1 text-xs text-white/60">Progress</div>
                <div className="h-2.5 w-full rounded-full bg-white/10 glass-outline">
                  <motion.div
                    initial={{ width: "10%" }}
                    whileInView={{ width: "68%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
