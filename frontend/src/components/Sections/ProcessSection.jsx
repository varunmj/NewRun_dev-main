import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* -------------------------------------------------------
   Tiny UI atoms (no external icon libs)
-------------------------------------------------------- */
const Dot = ({ color }) => (
  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
);

const Bar = ({ w = "w-28" }) => (
  <div className={`h-2 rounded ${w} bg-white/12`} />
);

const Chip = ({ children, i = 0 }) => (
  <motion.span
    initial={{ opacity: 0, y: 6 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35, delay: 0.04 * i }}
    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-white/80"
  >
    {children}
  </motion.span>
);

const InputLine = ({ w = "w-full", h = "h-10" }) => (
  <div
    className={[
      "relative overflow-hidden rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/12",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
      h,
      w,
    ].join(" ")}
  >
    {/* shimmer sweep */}
    <motion.span
      className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ["0%", "220%"] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

const Avatar = ({ initials = "NR", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    animate={{ y: [0, -3, 0] }}
    transitionOverride={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    className="grid h-16 w-16 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 ring-1 ring-inset ring-white/12"
  >
    <span className="text-sm font-semibold text-white/80">{initials}</span>
  </motion.div>
);

const Toggle = ({ on }) => (
  <motion.span
    layout
    className={`relative inline-flex h-5 w-10 items-center rounded-full ${
      on ? "bg-gradient-to-r from-cyan-400/60 to-indigo-400/60" : "bg-white/15"
    }`}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="h-4 w-4 rounded-full bg-white"
      style={{ x: on ? 20 : 4 }}
    />
  </motion.span>
);

/* Auto-toggling demo switch */
const AutoToggleItem = ({ label, startOn = false, period = 2800, offset = 0 }) => {
  const [on, setOn] = useState(startOn);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), period);
    const kick = setTimeout(() => setOn((v) => !v), offset);
    return () => {
      clearInterval(id);
      clearTimeout(kick);
    };
  }, [period, offset]);
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2.5 ring-1 ring-inset ring-white/12">
      <span className="text-sm text-white/85">{label}</span>
      <Toggle on={on} />
    </div>
  );
};

const ProgressAuto = ({ min = 35, max = 86, duration = 3.2 }) => {
  const [v, setV] = useState(min);
  useEffect(() => {
    let dir = 1;
    const id = setInterval(() => {
      setV((prev) => {
        const next = prev + dir * 3;
        if (next >= max) { dir = -1; return max; }
        if (next <= min) { dir = 1; return min; }
        return next;
      });
    }, (duration * 1000) / 20);
    return () => clearInterval(id);
  }, [min, max, duration]);
  return (
    <div className="grid gap-1">
      <div className="text-xs text-white/70">Status:</div>
      <div className="h-2 w-full rounded bg-white/12">
        <motion.div
          className="h-2 rounded bg-gradient-to-r from-cyan-400 to-indigo-400"
          animate={{ width: `${v}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="text-xs text-white/70">Updating…</div>
    </div>
  );
};

/* Listing + Event micro-cards (with slight motion) */
const ListingCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35 }}
    className="grid grid-cols-12 gap-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/12"
  >
    <div className="col-span-4 rounded-lg bg-gradient-to-br from-white/12 to-white/5" />
    <div className="col-span-8 grid gap-2">
      <div className="flex items-center gap-2">
        <Chip i={0}>1.2 mi</Chip>
        <Chip i={1}>$1095</Chip>
        <Chip i={2}>2 Bed</Chip>
      </div>
      <Bar w="w-40" />
      <Bar w="w-28" />
    </div>
  </motion.div>
);

const EventCard = () => (
  <motion.div
    initial={{ opacity: 0, x: 8 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35 }}
    className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/12"
  >
    <div className="mb-2 flex items-center gap-2">
      <motion.div
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-400/40 to-cyan-400/40"
      />
      <span className="text-sm font-medium text-white/85">Welcome Meetup</span>
    </div>
    <div className="grid gap-1">
      <Bar w="w-32" />
      <Bar w="w-24" />
    </div>
  </motion.div>
);

/* Glass window wrapper with hover tilt/glow */
function WindowCard({ kicker, title, desc, children, delay = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ rotateX: 1.2, rotateY: -1.2 }}
      className="group relative rounded-[26px] border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-4 shadow-2xl ring-1 ring-black/5 will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,0.18) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)",
        }}
      />
      <div className="rounded-2xl bg-[#0B0E12] ring-1 ring-inset ring-white/12">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex gap-1.5">
            <Dot color="#ff5f56" />
            <Dot color="#ffbd2e" />
            <Dot color="#27c93f" />
          </div>
          <Bar />
        </div>

        {/* header */}
        <div className="grid gap-2 px-5 pt-5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300/80">
            {kicker}
          </span>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mb-2 text-white/75">{desc}</p>
        </div>

        {/* content */}
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-[#0A0D11] p-4 ring-1 ring-inset ring-white/10">
            {children}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ===================== Section ===================== */

export default function ProcessSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto mb-6 w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75 ring-1 ring-black/5">
        Process
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="text-center text-4xl font-bold md:text-5xl"
      >
        Your path to excellence
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mx-auto mt-3 max-w-2xl text-center text-white/75"
      >
        A simple, effective approach to deliver excellence for every student.
      </motion.p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {/* STEP 1 — Join */}
        <WindowCard
          delay={0.05}
          kicker="Step 1"
          title="Join"
          desc="Create your profile and verify your university."
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              <Avatar initials="VM" delay={0.02} />
              <Avatar initials="AL" delay={0.06} />
              <Avatar initials="SJ" delay={0.1} />
              <Avatar initials="NR" delay={0.14} />
            </div>

            <div className="flex items-center gap-3">
              <Chip i={0}>
                {/* shield icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" className="opacity-80">
                  <path d="M12 3l7 3v6c0 4.4-3 8.4-7 9-4-0.6-7-4.6-7-9V6l7-3z" fill="currentColor" className="text-cyan-400/80" />
                  <path d="M10.2 12.6l-1.4-1.4L7.4 12.6l2.8 2.8 6-6-1.4-1.4-4.6 4.6z" fill="#0b0d11"/>
                </svg>
                Verified
              </Chip>
              <Bar w="w-24" />
            </div>

            <InputLine />
            <InputLine w="w-2/3" h="h-9" />
          </div>
        </WindowCard>

        {/* STEP 2 — Set Up (12-col strict grid) */}
        <WindowCard
          delay={0.12}
          kicker="Step 2"
          title="Set Up"
          desc="Get housing, essentials, and connections tailored to you."
        >
          <div className="grid grid-cols-12 gap-4 items-stretch">
            {/* Left */}
            <div className="col-span-12 md:col-span-8 grid content-start gap-4">
              <div className="flex flex-wrap gap-2">
                <Chip i={0}>Housing</Chip>
                <Chip i={1}>Roommate</Chip>
                <Chip i={2}>Essentials</Chip>
                <Chip i={3}>Community</Chip>
                <Chip i={4}>Banking</Chip>
              </div>
              <ListingCard />
              <InputLine />
              <InputLine w="w-3/4" h="h-9" />
            </div>

            {/* Right */}
            <div className="col-span-12 md:col-span-4 grid content-start gap-3">
              <AutoToggleItem label="Verified" startOn offset={200} />
              <AutoToggleItem label="Efficient" startOn offset={800} />
              <AutoToggleItem label="Accurate" offset={1400} />
              <AutoToggleItem label="Secure" offset={2000} />
            </div>
          </div>
        </WindowCard>

        {/* STEP 3 — Thrive */}
        <WindowCard
          delay={0.18}
          kicker="Step 3"
          title="Thrive"
          desc="Meet people, join events, and feel at home from day one."
        >
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-12 md:col-span-7 grid content-start gap-3">
              <AutoToggleItem label="Verified" startOn />
              <AutoToggleItem label="Efficient" startOn offset={500} />
              <AutoToggleItem label="Accurate" offset={1000} />
              <AutoToggleItem label="Secure" offset={1500} />
            </div>
            <div className="col-span-12 md:col-span-5 grid gap-3">
              <EventCard />
              <ProgressAuto />
            </div>
          </div>
        </WindowCard>
      </div>
    </section>
  );
}
