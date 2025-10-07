import React, { useId } from "react";

export default function BookmarkSvg({ active, className = "", ...props }) {
  const rid = useId(); // e.g. ":r2:"
  const filterId = `nr-soft-glow-${String(rid).replace(/[:]/g, "")}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {active && (
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <polygon
        points="98,109 60,88 22,109 22,12 98,12"
        fill={active ? "#ff1200" : "transparent"}
        stroke="#ff1200"
        strokeWidth={active ? 0 : 8}
        strokeLinejoin="round"
        strokeLinecap="round"
        shapeRendering="geometricPrecision"
        style={{
          filter: active
            ? `url(#${filterId}) drop-shadow(0 0 6px rgba(255,18,0,0.35))`
            : "none",
          transition:
            "filter 180ms ease, fill 180ms ease, stroke-width 180ms ease",
        }}
      />
    </svg>
  );
}
