import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CHIP_OPTIONS = ["Housing", "Roommate", "Essentials", "Community", "Everything"] as const;
type Focus = (typeof CHIP_OPTIONS)[number];

export default function Onboarding() {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<Focus | null>(null);

  const goNext = () => {
    if (!focus) return;
    // Persist so later steps / the chatbot can pick it up
    localStorage.setItem("nr_onboarding_focus", focus);
    navigate("/chatbot", { state: { from: "onboarding", focus } });
  };

  return (
    <div className="body-obsidian min-h-screen w-full flex items-center justify-center px-6 py-20">
      <div className="edge-panel w-full max-w-5xl rounded-3xl p-8 md:p-10 text-white">
        <h1 className="text-3xl md:text-4xl font-bold">
          What should we help you with first?
        </h1>

        <div className="mt-8 flex flex-wrap gap-4">
          {CHIP_OPTIONS.map((label) => {
            const selected = focus === label;
            return (
              <button
                key={label}
                onClick={() => setFocus(label)}
                className={[
                  "rounded-2xl px-6 py-3 text-base md:text-lg transition",
                  "ring-1 ring-inset",
                  selected
                    ? "bg-white text-black ring-white"
                    : "text-white/90 ring-white/15 hover:ring-white/30 hover:bg-white/5",
                  "focus:outline-none focus:ring-white/50"
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <button
            onClick={goNext}
            disabled={!focus}
            className={`btn-metal ${!focus ? "opacity-50 pointer-events-none" : ""}`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
