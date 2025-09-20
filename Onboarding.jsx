import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, clearProgress } from "./frontend/src/utils/onboardingProgress";

// ✅ Added a Housing card that links to /all-properties
const cards = [
  {
    id: "housing",
    label: "HOUSING",
    title: "Find a place near campus",
    desc: "Verified listings with filters for budget, roommates, and distance.",
    cta: { text: "Browse properties", to: "/all-properties", prefill: {} },
  },
  {
    id: "roommate",
    label: "ROOMMATE",
    title: "Find a compatible roommate",
    desc: "2-minute quiz considers sleep/study habits and lifestyle preferences.",
    cta: { text: "Start roommate quiz", to: "/roommate", prefill: {} },
  },
  {
    id: "essentials",
    label: "ESSENTIALS",
    title: "Your Essentials Pack",
    desc: "Prebuilt for Bank so Day 1 is easy.",
    cta: { text: "Open my pack", to: "/marketplace", prefill: { category: "essentials" } },
  },
  {
    id: "community",
    label: "COMMUNITY",
    title: "Meet your people",
    desc: "Clubs and events matched to your interests and program.",
    cta: { text: "Explore community", to: "/community", prefill: {} },
  },
  {
    id: "checklist",
    label: "CHECKLIST",
    title: "Arrival checklist",
    desc: "Here’s a 7-day pre-arrival plan + airport transit.",
    cta: { text: "View checklist", to: "/welcome", prefill: {} },
  },
];

export default function Onboarding() {
  const nav = useNavigate();

  useEffect(() => {
    // mark we entered onboarding
    saveProgress({ stage: "landing" });
  }, []);

  const handleCta = (card) => {
    // save what they clicked last
    saveProgress({ stage: `go_${card.id}`, last: card.id });
    nav(card.cta.to, { state: { prefill: card.cta.prefill, from: "onboarding" } });
  };

  const handleDone = () => {
    saveProgress({ completed: true, stage: "finished" });
    nav("/chatbot", { state: { from: "onboarding_complete" } });
  };

  const handleReset = () => {
    clearProgress();
    saveProgress({ stage: "landing" });
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-2 text-xs tracking-widest text-white/50">
          Verified students only • secure marketplace • campus specific
        </div>
        <h1 className="text-balance text-4xl font-bold md:text-5xl">
          Let’s make your first weeks effortless
        </h1>
        <p className="mt-2 text-white/60">We’ll build a plan in under 90 seconds.</p>
      </div>

      {/* 5 cards now; will wrap nicely */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-semibold tracking-wider text-white/50">{c.label}</div>
            <div className="mt-1 text-lg font-semibold">{c.title}</div>
            <div className="mt-1 text-white/60">{c.desc}</div>
            <div className="mt-4">
              <button
                onClick={() => handleCta(c)}
                className="rounded-xl bg-[#1283f6] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f74d8]"
              >
                {c.cta.text}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Start over
        </button>

        <button
          onClick={handleDone}
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-400/15"
        >
          I’m done for now
        </button>
      </div>
    </div>
  );
}
