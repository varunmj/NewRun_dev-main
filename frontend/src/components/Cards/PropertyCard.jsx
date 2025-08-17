import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdKingBed,
  MdBathtub,
  MdPlace,
  MdVerified,
} from "react-icons/md";

/** ------- helpers ------- */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop";

const isUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

const pickCover = (images) => {
  if (!images) return FALLBACK_IMG;
  if (Array.isArray(images)) {
    const firstValid = images.find(isUrl);
    return firstValid || FALLBACK_IMG;
  }
  if (typeof images === "string") {
    return isUrl(images) ? images : FALLBACK_IMG;
  }
  return FALLBACK_IMG;
};

const formatPrice = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : n
    ? `$${String(n).replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
    : "—";

const formatDistance = (d) =>
  typeof d === "number" ? `${d.toFixed(d < 1 ? 1 : 1)} mi` : d ? `${d} mi` : "—";

const formatAddress = (addr) => {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  const { street, city, state, zipCode, zip } = addr || {};
  return [street, city, state, zipCode || zip].filter(Boolean).join(", ");
};

/** ------- card ------- */
export default function PropertyCard({ property }) {
  if (!property) return null;

  const {
    _id,
    title,
    price,
    bedrooms,
    bathrooms,
    distanceFromUniversity,
    address,
    images,
    isVerified, // optional
  } = property;

  const cover = useMemo(() => pickCover(images), [images]);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(cover);

  return (
    <Link
      to={`/properties/${_id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-20px_rgba(0,0,0,.5)] transition-transform hover:-translate-y-0.5"
    >
      {/* image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#6e46ff22,transparent_60%),linear-gradient(180deg,#0f1117,#0b0c0f)]">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-white/5" />
        )}
        <img
          src={src}
          alt={title || "Property photo"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setSrc(FALLBACK_IMG)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* subtle dark fade for text legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* body */}
      <div className="p-4">
        {/* title + price/badge */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[16px] font-semibold text-white/95">
                {title || "Untitled listing"}
              </h3>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-[2px] text-[10px] text-emerald-200">
                  <MdVerified className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-[15px] font-semibold text-white/95">
            {formatPrice(price)}
          </div>
        </div>

        {/* meta: beds • baths • distance */}
        <div className="mb-2 flex items-center gap-3 text-[13px] text-white/70">
          <span className="inline-flex items-center gap-1">
            <MdKingBed className="h-4 w-4 text-violet-300/90" />
            {bedrooms ?? "—"} bd
          </span>
          <span className="inline-flex items-center gap-1">
            <MdBathtub className="h-4 w-4 text-violet-300/90" />
            {bathrooms ?? "—"} ba
          </span>
          <span className="inline-flex items-center gap-1">
            <MdPlace className="h-4 w-4 text-violet-300/90" />
            {formatDistance(distanceFromUniversity)}
          </span>
        </div>

        {/* address */}
        <div className="truncate text-[13px] text-white/55">
          {formatAddress(address)}
        </div>
      </div>
    </Link>
  );
}
