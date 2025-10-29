import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/** ------- helpers ------- */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop";

const isUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

const pickCover = (images) => {
  if (!images) return FALLBACK_IMG;
  if (Array.isArray(images)) {
    const firstValid = images.find(isUrl);
    if (firstValid) return firstValid;
    // Try direct string if array contains strings
    const firstImage = images[0];
    if (typeof firstImage === 'string' && firstImage) return firstImage;
  }
  if (typeof images === "string") {
    return isUrl(images) ? images : FALLBACK_IMG;
  }
  return FALLBACK_IMG;
};

const formatPrice = (price) => {
  if (typeof price === "number") {
    return `$${price.toLocaleString("en-US")}`;
  }
  if (price && typeof price === "string") {
    return price;
  }
  return "—";
};

function deliveryLabel(delivery = {}) {
  const out = [];
  if (delivery?.pickup) out.push("Pickup");
  if (delivery?.localDelivery) out.push("Local delivery");
  if (delivery?.shipping) out.push("Shipping");
  return out.join(" • ");
}

/** ------- card ------- */
export default function MarketplaceItemCard({
  item,
  viewMode = 'grid',
  favored = false,
  onToggleFav,
  onClick,
}) {
  if (!item) return null;

  const { user, isAuthenticated } = useAuth();
  const {
    _id,
    title,
    price,
    images,
    category,
    condition,
    delivery,
    userId,
    coverUrl,
    coverIndex,
    thumbnailUrl,
  } = item;

  // Check if current user is the owner
  const isOwner = user && userId && String(user._id) === String(userId);

  // Get cover image using same logic as before
  const imgs = Array.isArray(images) ? images : [];
  const hasIdx = typeof coverIndex === "number" && coverIndex >= 0;
  const cover = coverUrl || imgs[hasIdx ? coverIndex : 0] || imgs[0] || thumbnailUrl || "";
  
  const coverImage = useMemo(() => pickCover(cover || images), [cover, images]);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(coverImage);

  const detailsPath = `/marketplace/item/${_id}`;

  return (
    <Link
      to={detailsPath}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group block overflow-hidden rounded-xl shadow-sm relative bg-gradient-to-br from-[#171717] to-blue-600 from-[85%] cursor-pointer transition-all duration-300 ring-1 ring-transparent hover:ring-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.25)] h-full flex flex-col ${
        viewMode === 'grid' 
          ? 'border border-white/10 hover:from-[#1c1c1c] hover:border-white/20' 
          : 'border-[1px] border-[#424242] hover:bg-[#1c1c1c]'
      }`}
    >
      {viewMode === 'grid' ? (
        // Grid View Layout - matching PropertyCard exactly
        <div className="flex flex-col gap-2 sm:gap-6 h-full">
          {/* Image Section */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-white/5" />
            )}
            <img
              src={src}
              alt={title || "Item photo"}
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFav(item);
                        }}
                        className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
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
                      </button>
                    )}
                    <button
                      type="button"
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
                      aria-label="Open in new tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link size-5 text-white">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Item Description/Category */}
                <div className="opacity-80 max-w-4/5">
                  <div className="text-white/70 text-sm leading-relaxed">
                    {category || 'Item'}
                  </div>
                </div>

                {/* Condition - matching PropertyCard's distance structure */}
                {condition ? (
                  <div className="flex items-center text-base text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-1 text-blue-400">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      <path d="M10 9h4"></path>
                      <path d="M10 13h4"></path>
                      <path d="M10 17h4"></path>
                    </svg>
                    <span className="text-white/60 capitalize">
                      {String(condition).toLowerCase()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-base text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-1 text-blue-400">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      <path d="M10 9h4"></path>
                      <path d="M10 13h4"></path>
                      <path d="M10 17h4"></path>
                    </svg>
                    <span className="text-white/60">
                      Item
                    </span>
                  </div>
                )}

                {/* Item Details Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {category && (
                    <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                      {category}
                    </span>
                  )}
                  {deliveryLabel(delivery) && (
                    <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                      {deliveryLabel(delivery)}
                    </span>
                  )}
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
        // List View Layout - matching PropertyCard exactly
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-80 h-48 md:h-auto overflow-hidden">
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-white/5" />
            )}
            <img
              src={src}
              alt={title || "Item photo"}
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
                  </div>
                  <div className="flex items-center mb-2">
                    <p className="text-white/70 text-sm truncate">
                      {category || 'Item'}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-x-2 cursor-pointer">
                  {onToggleFav && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFav(item);
                      }}
                      className="flex items-center p-3 bg-[#1a1a1a] border-[1px] border-[#424242] shadow-lg rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                      aria-label={favored ? "Remove from favorites" : "Add to favorites"}
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
                    </button>
                  )}
                  <button
                    type="button"
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
                    aria-label="Open in new tab"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link size-5 text-white">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Condition */}
              {condition && (
                <div className="flex items-center text-base text-muted-foreground mb-4">
                  <span className="text-white/60 capitalize">
                    {String(condition).toLowerCase()}
                  </span>
                </div>
              )}

              {/* Item Details Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {category && (
                  <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                    {category}
                  </span>
                )}
                {deliveryLabel(delivery) && (
                  <span className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 text-xs px-2 py-1 border-white/30 font-light text-white/80 bg-white/5">
                {deliveryLabel(delivery)}
                  </span>
                )}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
