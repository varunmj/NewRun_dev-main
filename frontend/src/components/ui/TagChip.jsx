// src/components/ui/TagChip.jsx
import React from "react";

export default function TagChip({ children, tone = "neutral", className = "" }) {
  const toneCls =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "danger"
      ? "bg-rose-500/15 text-rose-300"
      : tone === "accent"
      ? "bg-sky-500/15 text-sky-300"
      : "bg-white/10 text-white/75";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${toneCls} ${className}`}
    >
      {children}
    </span>
  );
}
