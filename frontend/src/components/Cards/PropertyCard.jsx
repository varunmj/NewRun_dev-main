import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdKingBed,
  MdBathtub,
  MdPlace,
  MdVerified,
  MdFavorite,
  MdFavoriteBorder,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

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
export default function PropertyCard({ property, viewMode = 'grid', favored = false, onToggleFav }) {
  if (!property) return null;

  const { user, isAuthenticated } = useAuth();
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
    userId, // property owner ID
  } = property;

  // Check if current user is the owner
  const isOwner = user && userId && userId === userId;

  const cover = useMemo(() => pickCover(images), [images]);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(cover);

  const detailsPath = `/properties/${_id}`;

  return (
    <Link
      to={detailsPath}
      onClick={(e) => {
        if (!isAuthenticated) {
          e.preventDefault();
          window.location.href = `/login?redirect=${encodeURIComponent(detailsPath)}`;
        }
      }}
      className={`group block overflow-hidden rounded-xl shadow-sm relative bg-gradient-to-br from-[#171717] to-blue-600 from-[85%] cursor-pointer transition-all duration-300 ring-1 ring-transparent hover:ring-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.25)] h-full flex flex-col ${
        viewMode === 'grid' 
          ? 'border border-white/10 hover:from-[#1c1c1c] hover:border-white/20' 
          : 'border-[1px] border-[#424242] hover:bg-[#1c1c1c]'
      }`}
    >
      {viewMode === 'grid' ? (
        // Grid View Layout
        <div className="flex flex-col gap-2 sm:gap-6 h-full">
          {/* Image Section */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
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
            {/* Gradient overlay for better text readability */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
            
            {/* Price overlay */}
            <div className="absolute top-3 right-3">
              <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-semibold text-sm">
                {formatPrice(price)}
              </div>
            </div>

          </div>

          {/* Content Section */}
          <div className="p-6 relative flex-1 flex flex-col">
            {/* Diffuse seam between image and content (stronger and smoother) */}
            <div className="pointer-events-none absolute -top-6 left-0 right-0 h-12 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-0"></div>
            <div className="relative z-10 flex flex-col gap-4 flex-1">
              <div className="flex-1 space-y-2">
                {/* Title and Action Buttons */}
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-white w-4/5 leading-tight">
                    {title || "Untitled listing"}
                  </h2>
                  <div className="flex gap-x-2 cursor-pointer">
                    {onToggleFav && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFav(property);
                        }}
                        className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        {favored ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark-check size-5 text-blue-400">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path>
                            <path d="m9 10 2 2 4-4"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark size-5 text-white">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path>
                          </svg>
                        )}
                      </div>
                    )}
                    <a
                      href={detailsPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isAuthenticated) {
                          window.open(detailsPath, '_blank');
                        } else {
                          window.location.href = `/login?redirect=${encodeURIComponent(detailsPath)}`;
                        }
                      }}
                      className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link size-5 text-white">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </a>
                    {isVerified && (
                      <div className="flex items-center p-2 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer">
                        <MdVerified className="size-4 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Description/Address */}
                <div className="opacity-80 max-w-4/5">
                  <div className="text-white/70 text-sm leading-relaxed">
                    {formatAddress(address)}
                  </div>
                </div>

                {/* Location and Distance */}
                <div className="flex items-center text-base text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-1 text-blue-400">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    <path d="M10 9h4"></path>
                    <path d="M10 13h4"></path>
                    <path d="M10 17h4"></path>
                  </svg>
                  <span className="text-white/60">
                    {formatDistance(distanceFromUniversity)} from campus
                  </span>
                </div>

                {/* Property Details Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                    <MdKingBed className="size-3 mr-1" />
                    {bedrooms ?? "—"} bd
                  </span>
                  <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                    <MdBathtub className="size-3 mr-1" />
                    {bathrooms ?? "—"} ba
                  </span>
                  {isOwner && (
                    <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-blue-400/40 font-light text-blue-300 bg-blue-400/10">
                      Created by you
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View Layout - With Images (like useultra but with property images)
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-80 h-48 md:h-auto overflow-hidden">
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
            
            {/* Price overlay */}
            <div className="absolute top-3 right-3">
              <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-semibold text-sm">
                {formatPrice(price)}
              </div>
            </div>

            {/* Diffuse seam where image meets content (vertical join) */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/70 via-black/40 to-transparent hidden md:block"></div>

          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 relative">
            {/* Diffuse seam where content meets image (vertical join) */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/70 via-black/40 to-transparent hidden md:block"></div>
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {title || "Untitled listing"}
                    </h3>
                    {isVerified && (
                      <div className="flex items-center p-1.5 bg-emerald-400/20 border border-emerald-400/30 rounded-md">
                        <MdVerified className="size-4 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center mb-2">
                    <MdPlace className="mr-1 size-4 text-blue-400" />
                    <p className="text-white/70 text-sm truncate">
                      {formatAddress(address)}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-x-2 cursor-pointer">
                  {onToggleFav && (
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFav(property);
                      }}
                      className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {favored ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark-check size-5 text-blue-400">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path>
                          <path d="m9 10 2 2 4-4"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark size-5 text-white">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path>
                        </svg>
                      )}
                    </div>
                  )}
                  <a
                    href={detailsPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isAuthenticated) {
                        window.open(detailsPath, '_blank');
                      } else {
                        window.location.href = `/login?redirect=${encodeURIComponent(detailsPath)}`;
                      }
                    }}
                    className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link size-5 text-white">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Distance from Campus */}
              <div className="flex items-center text-base text-muted-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-1 text-blue-400">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <path d="M10 9h4"></path>
                  <path d="M10 13h4"></path>
                  <path d="M10 17h4"></path>
                </svg>
                <span className="text-white/60">
                  {formatDistance(distanceFromUniversity)} from campus
                </span>
              </div>

              {/* Property Details Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                  <MdKingBed className="size-3 mr-1" />
                  {bedrooms ?? "—"} bd
                </span>
                <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                  <MdBathtub className="size-3 mr-1" />
                  {bathrooms ?? "—"} ba
                </span>
                {isOwner && (
                  <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-blue-400/40 font-light text-blue-300 bg-blue-400/10">
                    Created by you
                  </span>
                )}
              </div>

              {/* Bottom Section */}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {formatPrice(price)}
                  </span>
                  <span className="text-sm text-white/50">/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
