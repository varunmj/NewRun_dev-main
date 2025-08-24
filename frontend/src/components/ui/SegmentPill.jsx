// src/components/ui/SegmentPill.jsx
import React from "react";

/**
 * A compact segmented control with pill styling.
 * - options: [{ value: string, label: string }]
 * - value: current value (string)
 * - onChange(nextValue)
 */
export default function SegmentPill({ options = [], value = "", onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel || "filter"}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1"
    >
      {options.map((opt) => {
        const active = String(value) === String(opt.value);
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            className={[
              "min-w-[88px] rounded-full px-3 py-1.5 text-sm transition",
              active
                ? "bg-white text-[#0B0C0F] shadow-sm"
                : "text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
