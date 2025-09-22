import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users, ShoppingBag, MessageCircle, Star } from "lucide-react";

const CHIP_OPTIONS = [
  { label: "Housing", icon: Home },
  { label: "Roommate", icon: Users },
  { label: "Essentials", icon: ShoppingBag },
  { label: "Community", icon: MessageCircle },
  { label: "Everything", icon: Star }
] as const;
type Focus = (typeof CHIP_OPTIONS)[number]["label"];

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
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-20 bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="w-full max-w-5xl rounded-3xl p-8 md:p-10 text-white bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to NewRun! 🎉
          </h1>
          <p className="text-white/70 text-lg">
            What should we help you with first?
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {CHIP_OPTIONS.map((option) => {
            const selected = focus === option.label;
            const IconComponent = option.icon;
            return (
              <button
                key={option.label}
                onClick={() => setFocus(option.label)}
                className={[
                  "rounded-2xl px-6 py-4 text-base md:text-lg transition-all duration-200",
                  "ring-1 ring-inset transform flex items-center gap-3",
                  selected
                    ? "bg-white text-black ring-white scale-105 shadow-lg"
                    : "text-white/90 ring-white/15 hover:ring-white/30 hover:bg-white/5 hover:scale-105",
                  "focus:outline-none focus:ring-white/50"
                ].join(" ")}
              >
                <IconComponent size={20} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <button
            onClick={goNext}
            disabled={!focus}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              !focus 
                ? "opacity-50 pointer-events-none bg-gray-600" 
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
