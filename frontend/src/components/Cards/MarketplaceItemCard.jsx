// src/components/marketplace/ItemCard.jsx
import React from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

export default function ItemCard({
  item,
  onClick,
  onToggleFav,
  favored = false,
}) {
  const cover =
    Array.isArray(item.images) && item.images.length
      ? item.images[item.coverIndex || 0] || item.images[0]
      : null;

  const price = typeof item.price === "number" ? item.price.toLocaleString("en-US") : item.price;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-sm hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full bg-black/10">
        {cover ? (
          <img src={cover} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-white/40 text-sm">No image</div>
        )}

        {item.status !== "active" && (
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
            {item.status}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav?.(item);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/70"
          title={favored ? "Saved" : "Save"}
        >
          {favored ? <AiFillHeart /> : <AiOutlineHeart />}
        </button>
      </div>

      <div className="p-3">
        <div className="truncate text-sm font-semibold text-white">{item.title}</div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-white/80">${price}</span>
          {item.location?.campus && (
            <span className="text-xs text-white/50">{item.location.campus}</span>
          )}
        </div>
      </div>
    </div>
  );
}
