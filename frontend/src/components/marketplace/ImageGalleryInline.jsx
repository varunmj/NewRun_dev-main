import React from "react";

/**
 * Lightweight inline image gallery with arrows & thumbnails.
 * - No portals, no body scroll side effects, no overlays.
 * - Safely renders with 0 or many images.
 */
export default function ImageGalleryInline({
  images = [],
  value = 0,
  onChange,
  className = "",
  ratio = "aspect-[4/3]",
}) {
  const [idx, setIdx] = React.useState(Math.max(0, Math.min(value, images.length - 1)));

  React.useEffect(() => {
    // allow controlled-ish updates
    if (typeof value === "number" && value !== idx) {
      setIdx(Math.max(0, Math.min(value, images.length - 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, images.length]);

  const setIndex = (next) => {
    const clamped = Math.max(0, Math.min(next, images.length - 1));
    setIdx(clamped);
    onChange?.(clamped);
  };

  const hasImages = images && images.length > 0;
  const canPrev = hasImages && idx > 0;
  const canNext = hasImages && idx < images.length - 1;

  return (
    <div className={`w-full ${className}`}>
      {/* Main frame */}
      <div
        className={`${ratio} relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]`}
      >
        {hasImages ? (
          <img
            src={images[idx]}
            alt={`image-${idx + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-white/40">
            No image
          </div>
        )}

        {/* Prev / Next — inline, not full-screen */}
        {hasImages && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => canPrev && setIndex(idx - 1)}
              disabled={!canPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/60 disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => canNext && setIndex(idx + 1)}
              disabled={!canNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/60 disabled:opacity-40"
            >
              ›
            </button>

            {/* Position pill */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2 py-0.5 text-xs text-white">
              {idx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-16 overflow-hidden rounded-lg border ${
                i === idx ? "border-sky-500" : "border-white/10 hover:border-white/20"
              } bg-white/[0.04]`}
              aria-label={`Go to image ${i + 1}`}
            >
              <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
