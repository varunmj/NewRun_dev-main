import React from "react";
import { motion } from "framer-motion";
import memojiVM from "../../assets/Images/memoji-vm.png";
import memojiSJ from "../../assets/Images/memoji-sj.png";

/* ---------------- Icons (inline, no extra deps) ---------------- */
const Icon = {
  House: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 10.5v8.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 20v-4.5h5V20" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Users: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 9a3 3 0 1 0 0-6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 16.5a4 4 0 0 1 5.5 3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Cart: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 4h2l2.2 11.5a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.7l2-7.1H7.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="20" r="1.6" fill="currentColor" />
      <circle cx="17" cy="20" r="1.6" fill="currentColor" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4M3 9.5h18" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7" y="12" width="4" height="3" rx="0.6" fill="currentColor" />
      <rect x="13" y="12" width="4" height="3" rx="0.6" fill="currentColor" opacity=".65" />
    </svg>
  ),
  Shield: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3 5 5.5v6.2c0 4.2 3.1 7.7 7 8.8 3.9-1.1 7-4.6 7-8.8V5.5L12 3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12l2.2 2.2L15.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Plane: (p) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 12l19.5-6-6.4 8.4L9 14l-2.5 4-1.5-.5L7 13l-5-.8z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Link: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M10 14a3 3 0 0 0 4.2 0l3.6-3.6a3 3 0 1 0-4.2-4.2L12 7.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 10a3 3 0 0 0-4.2 0L6.2 13.6a3 3 0 1 0 4.2 4.2L12 16.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Check: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* ---------------- Small helpers ---------------- */
const Card = ({ title, desc, icon, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#0F1115]/90 p-5 backdrop-blur-md shadow-lg">
    <div className="mb-3 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-white/90">
        {icon}
      </div>
      <div>
        <div className="text-white font-semibold">{title}</div>
        <div className="text-xs text-white/60">{desc}</div>
      </div>
    </div>
    {children}
  </div>
);

const Tag = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ y: 6, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    className="rounded-full bg-white/8 text-white/80 border border-white/10 px-2.5 py-1 text-xs"
  >
    {children}
  </motion.div>
);

/* ---------------- Tile animations (meaningful) ---------------- */

// Housing: house + looping meta chips
const HousingAnim = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-center gap-2 text-sky-300/90">
      <Icon.House />
      <div className="text-sm text-white/85">Verified housing only</div>
    </div>
    <div className="flex flex-wrap gap-2">
      {["1.2 mi", "$1095", "2 Bed"].map((t, i) => (
        <Tag key={t} delay={0.12 * i}>
          {t}
        </Tag>
      ))}
    </div>
    <motion.div
      className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10"
      animate={{ backgroundPositionX: ["0%", "200%"] }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.35) 50%, rgba(255,255,255,.08) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  </div>
);

// Roommates: two avatars connect with a pulsing link
const RoommatesAnim = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-center gap-2 text-emerald-300/90">
      <Icon.Users />
      <div className="text-sm text-white/85">AI roommate matching</div>
    </div>

    <div className="relative flex items-center justify-between px-2">
      {/* Left avatar */}
      <motion.img
        src={memojiVM}
        alt="Roommate candidate VM"
        className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.05)]"
        animate={{ y: [-2, 2, -2], rotate: [-1, 1, -1] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        onError={(e) => {
          // graceful fallback to initials if image missing
          e.currentTarget.replaceWith(Object.assign(document.createElement("div"), {
            className: "grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#1b2a4a] to-[#1b4a3a] text-white/90 ring-1 ring-white/10 text-sm font-medium",
            innerText: "VM",
          }));
        }}
      />

      {/* Connecting line with traveling pulse */}
      <div className="relative mx-2 flex h-5 w-28 items-center justify-center">
        <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-emerald-400/40 via-emerald-300/50 to-sky-400/40" />
        <motion.span
          className="absolute h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_3px_rgba(16,185,129,0.6)]"
          animate={{ x: ["-56px", "56px", "-56px"], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
      </div>

      {/* Right avatar */}
      <motion.img
        src={memojiSJ}
        alt="Roommate candidate SJ"
        className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.05)]"
        animate={{ y: [2, -2, 2], rotate: [1, -1, 1] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        onError={(e) => {
          e.currentTarget.replaceWith(Object.assign(document.createElement("div"), {
            className: "grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#2b2a4a] to-[#1b3a6a] text-white/90 ring-1 ring-white/10 text-sm font-medium",
            innerText: "SJ",
          }));
        }}
      />
    </div>

    <div className="mt-4 flex items-center gap-2 text-white/80">
      <Icon.Link />
      <div className="text-xs">Shared quiet hours • Similar budget</div>
    </div>
  </div>
);

// Essentials: boxes drop into cart + progress loop
// Essentials: chips slide in one-by-one, drop into the cart, slow & non-overlapping
const EssentialsAnim = () => {
  const items = [
    { label: "SIM",     icon: "📶" },
    { label: "Bank",    icon: "💳" },
    { label: "Transit", icon: "🚌" },
  ];

  // timing tuned so each chip finishes before the next starts
  const baseDelay = 0.35;         // when the first chip begins
  const perItemStagger = 1.15;    // gap between chips (increase for more spacing)
  const travelMs = 2700;          // total time for a chip to reach the cart
  const restMs = 1800;            // pause before the whole loop repeats

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2 text-indigo-300/90">
        <Icon.Cart />
        <div className="text-sm text-white/85">Essentials pack(Day-1 ready)</div>
      </div>

      <div className="relative h-24 w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
        {/* track line */}
        <div className="absolute left-8 right-24 top-1/2 h-px -translate-y-1/2 bg-white/15" />

        {/* moving chips — one by one */}
        {items.map((it, i) => (
          <motion.div
            key={it.label + i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={{
              // slide across the track then "drop" slightly into cart and fade
              x: [0, 120, 210, 240],          // end ~ where the cart sits
              y: [0, 0, 0, 8],
              opacity: [0, 1, 1, 0],
              scale: [1, 1, 1, 0.92],
            }}
            transition={{
              duration: travelMs / 1000,
              ease: [0.22, 1, 0.36, 1],
              delay: baseDelay + i * perItemStagger,
              repeat: Infinity,
              repeatDelay: restMs / 1000 + (items.length - 1 - i) * perItemStagger,
              times: [0, 0.75, 0.92, 1],
            }}
            className="absolute left-8 top-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-white/85">
              <span className="text-base leading-none">{it.icon}</span>
              <span className="text-sm">{it.label}</span>
            </div>
          </motion.div>
        ))}

        {/* cart (bigger) with a soft pulse when items arrive */}
        <motion.div
          className="absolute right-4 top-1/2 grid h-16 w-20 -translate-y-1/2 place-items-center rounded-lg border border-white/15 bg-white/[0.05]"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(99,102,241,0)",
              "0 0 24px 10px rgba(99,102,241,.18)",
              "0 0 0 0 rgba(99,102,241,0)",
            ],
          }}
          transition={{
            duration: travelMs / 1000,
            ease: "easeOut",
            delay: baseDelay + (items.length - 1) * perItemStagger,
            repeat: Infinity,
            repeatDelay: restMs / 1000,
          }}
        >
          <Icon.Cart className="scale-[1.25]" />
        </motion.div>
      </div>

      {/* subtle stepper */}
      <div className="mt-4 flex items-center gap-2 text-white/70">
        <span className="relative inline-flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-indigo-400/70" />
        </span>
        <span className="text-sm">Packing your Day-1 kit</span>
        <div className="ml-auto flex gap-3">
          <div className="h-3 w-10 rounded-full bg-white/12" />
          <div className="h-3 w-10 rounded-full bg-white/12" />
          <div className="h-3 w-10 rounded-full bg-indigo-400/30" />
        </div>
      </div>
    </div>
  );
};


// Community: calendar + popping event dots + RSVP chip
const CommunityAnim = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-center gap-2 text-fuchsia-300/90">
      <Icon.Calendar />
      <div className="text-sm text-white/85">Community & events</div>
    </div>

    <div className="relative mt-1 h-20 rounded-lg bg-white/5 ring-1 ring-white/10">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ delay: i * 0.4, duration: 2.2, repeat: Infinity }}
          className="absolute h-2.5 w-2.5 rounded-full bg-fuchsia-300"
          style={{ top: 12 + i * 12, left: 14 + (i % 2) * 40 }}
        />
      ))}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: [8, 0, 0, 8], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.4 }}
        className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/80"
      >
        RSVP sent
      </motion.div>
    </div>
  </div>
);

// Safety: shield check pulse + verified chip + auto toggle
const SafetyAnim = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-center gap-2 text-emerald-300/90">
      <Icon.Shield />
      <div className="text-sm text-white/85">Verified students • Safe trades</div>
    </div>
    <motion.div
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.8, repeat: Infinity }}
      className="grid h-20 w-full place-items-center rounded-lg bg-white/6 ring-1 ring-white/10"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
        <Icon.Check />
        Verified only
      </div>
    </motion.div>

    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/6 px-3 py-2">
      <div className="text-xs text-white/75">Marketplace protections</div>
      <motion.div
        initial={{ x: 0, backgroundColor: "#2a2f38" }}
        animate={{
          x: [0, 24, 0],
          backgroundColor: ["#2a2f38", "#22d3ee", "#2a2f38"],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-6 w-12 rounded-full"
      >
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
      </motion.div>
    </div>
  </div>
);

// Arrival: plane glide + sequential checklist ticks
const ArrivalAnim = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-center gap-2 text-sky-300/90">
      <Icon.Plane />
      <div className="text-sm text-white/85">Arrival checklist (pre-flight → day-7)</div>
    </div>

    <div className="relative h-10 overflow-hidden rounded-lg bg-white/6 ring-1 ring-white/10">
      <motion.div
        className="absolute left-2 top-1.5 text-sky-300"
        animate={{ x: ["0%", "88%", "0%"] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon.Plane />
      </motion.div>
    </div>

    <div className="mt-3 space-y-2">
      {["Airport pickup", "SIM & banking", "Campus ID"].map((t, i) => (
        <motion.div
          key={t}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ delay: i * 0.35, duration: 2.2, repeat: Infinity }}
          className="flex items-center gap-2 text-sm text-white/80"
        >
          <span className="h-2 w-2 rounded-full bg-sky-300/80" />
          {t}
        </motion.div>
      ))}
    </div>
  </div>
);

/* ---------------- Section ---------------- */
export default function NewRunServices() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
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

      <div className="grid gap-5 md:grid-cols-3">
        <Card
          title="Housing"
          desc="Verified near-campus listings"
          icon={<Icon.House />}
        >
          <HousingAnim />
        </Card>

        <Card
          title="Roommates"
          desc="Match by lifestyle & budget"
          icon={<Icon.Users />}
        >
          <RoommatesAnim />
        </Card>

        <Card
          title="Essentials"
          desc="Prebuilt packs for day-1"
          icon={<Icon.Cart />}
        >
          <EssentialsAnim />
        </Card>

        <Card
          title="Community"
          desc="Events and clubs you’ll like"
          icon={<Icon.Calendar />}
        >
          <CommunityAnim />
        </Card>

        <Card
          title="Safety"
          desc="Student-only, protected trades"
          icon={<Icon.Shield />}
        >
          <SafetyAnim />
        </Card>

        <Card
          title="Arrival"
          desc="Simple, guided checklist"
          icon={<Icon.Plane />}
        >
          <ArrivalAnim />
        </Card>
      </div>
    </section>
  );
}
