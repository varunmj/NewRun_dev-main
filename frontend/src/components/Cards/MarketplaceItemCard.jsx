import React from "react";
import { MdFavoriteBorder, MdFavorite } from "react-icons/md";

/**
 * MarketplaceItemCard
 * Props:
 * - item        : marketplace item doc
 * - favored     : boolean
 * - onToggleFav : (item) => void
 * - onClick     : () => void
 */
export default function MarketplaceItemCard({ item, favored, onToggleFav, onClick }) {
  const coverIdx =
    typeof item?.coverIndex === "number" && item.coverIndex >= 0 ? item.coverIndex : 0;

  const img =
    item?.images?.[coverIdx] ||
    item?.images?.[0] ||
    item?.thumbnailUrl ||
    "";

  const price =
    typeof item?.price === "number"
      ? `$${item.price.toLocaleString("en-US")}`
      : item?.price || "";

  const condition = (item?.condition || "").toLowerCase(); // e.g., "New" | "Like New" | "Good" | "Fair"

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
    >
      {/* Favorite */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav?.(item);
        }}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/55"
        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
      >
        {favored ? <MdFavorite className="text-lg text-rose-400" /> : <MdFavoriteBorder className="text-lg" />}
      </button>

      {/* Condition chip */}
      {condition && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-black">
          {condition}
        </div>
      )}

      {/* Media */}
      <button onClick={onClick} className="block w-full">
        <div className="aspect-[4/3] w-full overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={item?.title || "item"}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
              No image
            </div>
          )}
        </div>
      </button>

      {/* Body */}
      <div className="flex items-end justify-between gap-3 p-3">
        <div className="min-w-0">
          <button
            onClick={onClick}
            className="block w-full truncate text-[15px] font-semibold text-white hover:underline"
            title={item?.title}
          >
            {item?.title || "Untitled"}
          </button>
          <div className="mt-0.5 text-sm text-white/75">{price}</div>
        </div>
        {item?.location?.campus && (
          <div className="shrink-0 rounded-full bg-white/8 px-2 py-1 text-xs text-white/60">
            {item.location.campus}
          </div>
        )}
      </div>
    </div>
  );
}
