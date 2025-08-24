// src/components/ui/NewRunImage.jsx
import React, { useState } from "react";

/**
 * Progressive image with blur-up & fade-in.
 * Use a solid gradient as placeholder when no blurDataURL.
 */
export default function NewRunImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  ratio = "aspect-[4/3]",
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${ratio} ${className}`}>
      {/* Placeholder */}
      <div
        className={[
          "absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
          "animate-pulse",
          loaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-300",
        ].join(" ")}
      />

      {/* Real image */}
      {src ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={[
            "h-full w-full object-cover will-change-transform",
            "transition duration-500",
            loaded ? "opacity-100 scale-[1.000]" : "opacity-0 scale-[1.02]",
            imgClassName,
          ].join(" ")}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="h-full w-full bg-white/[0.06]" />
      )}
    </div>
  );
}
