import React from "react";
import {
  MdFavoriteBorder,
  MdFavorite,
  MdArrowForwardIos,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

/* ---------- helpers ---------- */
function coverOf(item) {
  const imgs = Array.isArray(item?.images) ? item.images : [];
  const hasIdx = typeof item?.coverIndex === "number" && item.coverIndex >= 0;
  return item?.coverUrl || imgs[hasIdx ? item.coverIndex : 0] || imgs[0] || item?.thumbnailUrl || "";
}
function chip(text) {
  if (!text) return null;
  return (
    <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
      {text}
    </span>
  );
}
function deliveryLabel(delivery = {}) {
  const out = [];
  if (delivery.pickup) out.push("Pickup");
  if (delivery.localDelivery) out.push("Local delivery");
  if (delivery.shipping) out.push("Shipping");
  return out.join(" • ");
}

/* ---------- big, rounded, image-first card ---------- */
export default function MarketplaceItemCard({
  item,
  favored = false,
  onToggleFav,
  onClick,
}) {
  const { user } = useAuth();
  const cover = coverOf(item);
  const price =
    typeof item?.price === "number"
      ? `$${item.price.toLocaleString("en-US")}`
      : item?.price || "";

  // Check if current user is the owner
  const isOwner = user && item?.userId && userId === item.userId;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full overflow-hidden rounded-3xl border border-white/10
        bg-[#0f1115] text-left shadow-[0_12px_32px_-12px_rgba(0,0,0,.60)]
        transition-transform hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-sky-500
      "
    >
      {/* Media */}
      <div className="relative">
        <div className="aspect-[16/10] w-full overflow-hidden bg-white/[0.04]">
          {cover ? (
            <img
              src={cover}
              alt={item?.title || "Item"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
              No image
            </div>
          )}
        </div>

        {/* top-left chips (condition / category) */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {chip(String(item?.condition || "").toLowerCase())}
          {chip(item?.category)}
        </div>

        {/* top-right favorite */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav?.(item);
            }}
            aria-label={favored ? "Unfavorite" : "Favorite"}
            className="
              grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white/95
              ring-1 ring-white/10 backdrop-blur hover:bg-black/60
            "
          >
            {favored ? <MdFavorite /> : <MdFavoriteBorder />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4 pt-4">
        {/* Title + short blurb */}
        <div className="mb-2">
          <h3 className="line-clamp-2 text-[20px] font-semibold leading-snug text-white">
            {item?.title || "Untitled"}
          </h3>
          {item?.description && (
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-white/70">
              {item.description}
            </p>
          )}
          {/* ownership badge */}
          {isOwner && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-black/80 px-2 py-[2px] text-[10px] text-white font-medium">
                Created by you
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 h-px w-full bg-white/8" />

        {/* Meta row 1: Campus (or owner)  •  Price */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 text-[13px] text-white/75">
            {item?.location?.campus ? (
              <span className="line-clamp-1">Campus: {item.location.campus}</span>
            ) : (
              <span className="line-clamp-1">{item?.category || "Item"}</span>
            )}
          </div>

          {price && (
            <div className="shrink-0 rounded-full bg-white/8 px-3 py-1 text-[13px] font-semibold text-white">
              {price}
            </div>
          )}
        </div>

        {/* Meta row 2: Delivery • Condition • Arrow */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] text-white/60">
            {deliveryLabel(item?.delivery) && (
              <span className="rounded-full bg-white/5 px-2 py-0.5">
                {deliveryLabel(item.delivery)}
              </span>
            )}
            {item?.condition && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize">
                {String(item.condition).toLowerCase()}
              </span>
            )}
          </div>

          <span
            className="
              grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/8 text-white/85
              transition-colors group-hover:bg-white/12
            "
          >
            <MdArrowForwardIos className="text-[14px]" />
          </span>
        </div>
      </div>
    </button>
  );
}
