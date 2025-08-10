import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FOCUS_OPTIONS, initProfile } from "../../lib/onboardingSchema";
import { composePlan } from "../../lib/planComposer";

// Icons for plan cards
import { MdHome, MdGroups, MdChecklist, MdShoppingBag, MdBolt } from "react-icons/md";

// --- tiny UI helpers --------------------------------------------------------

function Chip({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition
        ${active ? "border-sky-400 bg-sky-500/10 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="edge-panel w-full rounded-2xl border border-white/5 bg-[#131418] p-5 shadow-[0_0_1px_rgba(255,255,255,0.05)]">
      <div className="mb-3 text-[15px] font-semibold text-white">{title}</div>
      {children}
    </div>
  );
}

const tagMeta = {
  Housing: { Icon: MdHome, grad: "from-sky-500/15 via-sky-400/5 to-transparent", dot: "bg-sky-400" },
  Roommate: { Icon: MdGroups, grad: "from-fuchsia-500/15 via-fuchsia-400/5 to-transparent", dot: "bg-fuchsia-400" },
  Checklist: { Icon: MdChecklist, grad: "from-emerald-500/15 via-emerald-400/5 to-transparent", dot: "bg-emerald-400" },
  Essentials: { Icon: MdShoppingBag, grad: "from-amber-500/15 via-amber-400/5 to-transparent", dot: "bg-amber-400" },
  Community: { Icon: MdBolt, grad: "from-indigo-500/15 via-indigo-400/5 to-transparent", dot: "bg-indigo-400" },
};

function PlanCard({ card, onOpen, idx }) {
  const meta = tagMeta[card.tag] ?? tagMeta.Housing;
  const Icon = meta.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101114]"
    >
      {/* soft gradient */}
      <div className={`pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br ${meta.grad}`} />

      <div className="relative z-10 p-5">
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/60">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {card.tag}
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-white/5 p-2 text-white/80">
            <Icon size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-snug">{card.title}</h3>
            <p className="mt-1 text-white/70">{card.body}</p>
            <div className="mt-4">
              <button
                onClick={onOpen}
                className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400"
              >
                {card.cta.label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

export default function ChatbotUI() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.state?.mode ?? "onboarding";

  // --- state
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("nr_onboarding");
      return saved ? JSON.parse(saved) : initProfile();
    } catch {
      return initProfile();
    }
  });

  const [step, setStep] = useState(0);
  const [inputBudget, setInputBudget] = useState({ min: "", max: "" });
  const [inputDate, setInputDate] = useState("");

  // persist
  useEffect(() => {
    localStorage.setItem("nr_onboarding", JSON.stringify(profile));
  }, [profile]);

  // steps definition (chat-like)
  const steps = [
    {
      key: "focus",
      title: "What should we help you with first?",
      render: () => (
        <div className="flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              active={profile.focus === opt}
              onClick={() => {
                setProfile((p) => ({ ...p, focus: opt }));
                next();
              }}
            >
              {opt}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "arrival_date",
      title: "When will you arrive?",
      render: () => (
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={inputDate || profile.arrival_date || ""}
            onChange={(e) => setInputDate(e.target.value)}
            className="w-[220px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-sky-400"
          />
          <Chip
            onClick={() => {
              const iso = inputDate || profile.arrival_date || "";
              if (!iso) return;
              setProfile((p) => ({ ...p, arrival_date: iso }));
              next();
            }}
          >
            Continue
          </Chip>
        </div>
      ),
    },
    {
      key: "budget_range",
      title: "What’s your monthly housing budget (USD)?",
      render: () => (
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={inputBudget.min}
            onChange={(e) => setInputBudget((b) => ({ ...b, min: e.target.value }))}
            className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-sky-400"
          />
          <span className="text-white/40">–</span>
          <input
            type="number"
            placeholder="Max"
            value={inputBudget.max}
            onChange={(e) => setInputBudget((b) => ({ ...b, max: e.target.value }))}
            className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-sky-400"
          />
          <Chip
            onClick={() => {
              const min = Number(inputBudget.min || 0);
              const max = Number(inputBudget.max || 0);
              if (!min || !max || min > max) return;
              setProfile((p) => ({ ...p, budget_range: { min, max } }));
              next();
            }}
          >
            Continue
          </Chip>
        </div>
      ),
    },
    {
      key: "housing_need",
      title: "Any preference for housing type?",
      render: () => (
        <div className="flex flex-wrap gap-2">
          {["On-campus", "Off-campus", "Sublet", "Undecided"].map((opt) => (
            <Chip
              key={opt}
              active={profile.housing_need === opt}
              onClick={() => {
                setProfile((p) => ({ ...p, housing_need: opt }));
                next();
              }}
            >
              {opt}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "roommate_interest",
      title: "Do you want a roommate match?",
      render: () => (
        <div className="flex gap-2">
          <Chip
            active={profile.roommate_interest === true}
            onClick={() => {
              setProfile((p) => ({ ...p, roommate_interest: true }));
              next();
            }}
          >
            Yes
          </Chip>
          <Chip
            active={profile.roommate_interest === false}
            onClick={() => {
              setProfile((p) => ({ ...p, roommate_interest: false }));
              next();
            }}
          >
            No
          </Chip>
        </div>
      ),
    },
    {
      key: "essentials",
      title: "Pick any essentials to prep now",
      render: () => {
        const opts = ["SIM", "Bedding", "Bank", "Cookware", "Transit"];
        const toggle = (x) =>
          setProfile((p) => {
            const has = p.essentials?.includes(x);
            const nextList = has ? p.essentials.filter((i) => i !== x) : [...(p.essentials || []), x];
            return { ...p, essentials: nextList };
          });
        return (
          <div className="flex flex-wrap items-center gap-2">
            {opts.map((x) => (
              <Chip key={x} active={profile.essentials?.includes(x)} onClick={() => toggle(x)}>
                {x}
              </Chip>
            ))}
            <Chip onClick={() => next()}>{profile.essentials?.length ? "Done" : "Skip"}</Chip>
          </div>
        );
      },
    },
  ];

  const isComplete = step >= steps.length || profile.completed;
  const plan = useMemo(() => (isComplete ? composePlan(profile) : []), [isComplete, profile]);

  function next() {
    setStep((s) => {
      const n = s + 1;
      if (n >= steps.length) {
        setProfile((p) => ({ ...p, completed: true }));
        try {
          localStorage.setItem("nr_onboarding_saved_at", new Date().toISOString());
        } catch {}
      }
      return n;
    });
  }

  // Reset if user re-enters onboarding
  useEffect(() => {
    if (location.state?.mode === "onboarding" && profile.completed) {
      setStep(steps.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedAtISO = (() => {
    try {
      return localStorage.getItem("nr_onboarding_saved_at");
    } catch {
      return null;
    }
  })();

  // ---------------- UI -------------------------------------------------------

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B0C0E] pt-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        {/* Header */}
        <div className="relative mx-auto mt-2 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0E1013]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-20%,rgba(56,189,248,0.18),transparent_60%)]" />
          <div className="relative z-10 px-6 py-7 text-center">
            <div className="text-xs text-white/55">
              Verified students only • secure marketplace • campus specific
            </div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Let’s make your first weeks effortless</h1>
            <div className="mt-1 text-sm text-white/60">
              We’ll build a plan in under 90 seconds
              {profile.arrival_date
                ? ` — landing ${new Date(profile.arrival_date).toLocaleDateString()}`
                : "."}
            </div>
            {savedAtISO && (
              <div className="mt-2 text-[11px] text-white/45">
                Last saved {new Date(savedAtISO).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Plan (improved cards) */}
        {isComplete && plan.length > 0 && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {plan.map((card, i) => (
                <PlanCard
                  key={card.id}
                  card={card}
                  idx={i}
                  onOpen={() => navigate(card.cta.to, { state: card.cta.state })}
                />
              ))}
            </div>

            {/* actions */}
            <div className="mx-auto mt-2 flex w-full max-w-3xl items-center justify-between px-1">
              <button
                onClick={() => setStep(0)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Refine answers
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    try {
                      const payload = {
                        plan,
                        profile,
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem("nr_saved_plan", JSON.stringify(payload));
                      // simple inline feedback
                      alert("Saved to this device. We’ll remember your plan here.");
                    } catch {}
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Save plan
                </button>

                <button
                  onClick={() => {
                    setProfile(() => initProfile());
                    setStep(0);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Start over
                </button>
              </div>
            </div>
          </>
        )}

        {/* Guided steps (unchanged) */}
        {!isComplete && (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="mx-auto w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Step {step + 1} / {steps.length}
            </div>
            <SectionCard title={steps[step].title}>{steps[step].render()}</SectionCard>
            <div className="text-center text-xs text-white/40">You can change answers later.</div>

            <div className="mx-auto mt-2 flex w-full items-center justify-between px-1">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={() => setStep(steps.length)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Skip to plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
