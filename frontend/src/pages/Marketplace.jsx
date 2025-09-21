// src/pages/Marketplace.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import MarketplaceItemCard from "../components/Cards/MarketplaceItemCard";
import HeroPromo from "../components/Sections/HeroPromo";
import FeatureSplit from "../components/Sections/FeatureSplit";
import ListingDrawer from "../components/marketplace/ListingDrawer";
import "../styles/newrun-hero.css"; // once
import "../styles/neumorphic-button.css";

/* --------------------------------- data --------------------------------- */
const CATEGORIES = ["Furniture", "Electronics", "Books", "Bikes", "Kitchen", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];
const DELIVERY = [
  { key: "", label: "Any delivery" },
  { key: "pickup", label: "Pickup" },
  { key: "localDelivery", label: "Local delivery" },
  { key: "shipping", label: "Shipping" },
];

const SORT_OPTIONS = [
  { key: "-createdAt", label: "Newest First" },
  { key: "createdAt", label: "Oldest First" },
  { key: "price", label: "Price: Low to High" },
  { key: "-price", label: "Price: High to Low" },
  { key: "-favorites", label: "Most Popular" },
  { key: "-views", label: "Most Viewed" },
];

/* ------------------------------ tiny helpers ----------------------------- */
function classNames(...s) {
  return s.filter(Boolean).join(" ");
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-full px-3.5 py-1.5 text-sm transition-all duration-200",
        active ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
      )}
    >
      {children}
    </button>
  );
}

/** Simple dropdown built with <details> for great a11y and zero deps */
function ChipDropdown({ label, activeLabel, children }) {
  const detailsRef = useRef(null);
  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className={classNames(
          "list-none cursor-pointer select-none rounded-full px-3.5 py-1.5 text-sm transition-all duration-200",
          "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 marker:content-none",
          "group-open:bg-white/10 group-open:text-white group-open:border-white/20"
        )}
      >
        {activeLabel || label}
      </summary>
      <div
        className="absolute left-0 z-20 mt-2 w-[min(92vw,320px)] rounded-2xl border border-white/10 bg-[#0f1115]/90 backdrop-blur-xl p-2 shadow-2xl"
        onClick={(e) => {
          // keep it open only for inner buttons; outside click will close automatically
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </details>
  );
}

/** Field group used in the Price dropdown */
function Field({ label, ...props }) {
  return (
    <label className="grid gap-1 text-xs text-white/60">
      <span>{label}</span>
      <input
        {...props}
        className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-500"
      />
    </label>
  );
}

/* =============================== Page =================================== */
export default function Marketplace() {
  const nav = useNavigate();

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [delivery, setDelivery] = useState("");
  const [campus, setCampus] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");

  // data
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

  // drawer state
  const [isListingDrawerOpen, setIsListingDrawerOpen] = useState(false);

  // derived
  const filters = useMemo(() => {
    const p = {
      q, campus, delivery,
      category, condition,
      min: minPrice, max: maxPrice,   // backend v1
      minPrice, maxPrice,             // backend v2
      sort: sortBy,
    };
    Object.keys(p).forEach((k) => (p[k] === "" || p[k] == null) && delete p[k]);
    return p;
  }, [q, campus, delivery, category, condition, minPrice, maxPrice, sortBy]);

  const load = async (append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const r = await axiosInstance.get("/marketplace/items", {
        params: { ...filters, cursor: append ? cursor : undefined, limit: 24 },
      });
      const next = r?.data?.items || [];
      setItems((prev) => (append ? [...prev, ...next] : next));
      setCursor(r?.data?.nextCursor || null);
    } catch {
      if (!append) setItems([]);
      setCursor(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // auto load w/ debounce
  useEffect(() => {
    const t = setTimeout(() => load(false), 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Listen for search events from hero
  useEffect(() => {
    const handleHeroSearch = (event) => {
      setQ(event.detail.query);
    };

    window.addEventListener('marketplaceSearch', handleHeroSearch);
    return () => window.removeEventListener('marketplaceSearch', handleHeroSearch);
  }, []);

  const toggleFav = async (item) => {
    try {
      const r = await axiosInstance.post(`/marketplace/favorites/${item._id}`);
      setFavIds((ids) => {
        const next = new Set(ids);
        if (r?.data?.favored) next.add(item._id);
        else next.delete(item._id);
        return next;
      });
    } catch {}
  };


  /* ------------------------------ UI ----------------------------------- */
  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      </div>
      
      <Navbar />
      
        <HeroPromo onListItem={() => setIsListingDrawerOpen(true)} />
      <FeatureSplit />

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-2xl border border-white/10 bg-[#0f1115]/50 backdrop-blur-sm">
            <div className="text-3xl font-bold text-blue-400 mb-2">{items.length}+</div>
            <div className="text-sm text-white/70">Active Items</div>
          </div>
          <div className="text-center p-6 rounded-2xl border border-white/10 bg-[#0f1115]/50 backdrop-blur-sm">
            <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-sm text-white/70">Available</div>
          </div>
          <div className="text-center p-6 rounded-2xl border border-white/10 bg-[#0f1115]/50 backdrop-blur-sm">
            <div className="text-3xl font-bold text-teal-400 mb-2">100%</div>
            <div className="text-sm text-white/70">Student Verified</div>
          </div>
          <div className="text-center p-6 rounded-2xl border border-white/10 bg-[#0f1115]/50 backdrop-blur-sm">
            <div className="text-3xl font-bold text-green-400 mb-2">$0</div>
            <div className="text-sm text-white/70">Transaction Fees</div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16">

        {/* Enhanced Filter Toolbar */}
        <section className="sticky top-[68px] z-10 mb-8 rounded-2xl border border-white/10 bg-[#0f1115]/90 backdrop-blur-xl shadow-2xl">
          <div className="p-4">
            {/* Active Filters Row */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white/70">Active filters:</span>
              {category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                  {category}
                  <button onClick={() => setCategory("")} className="ml-1 hover:text-blue-100">×</button>
                </span>
              )}
              {condition && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                  {condition}
                  <button onClick={() => setCondition("")} className="ml-1 hover:text-purple-100">×</button>
                </span>
              )}
              {delivery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-3 py-1 text-xs text-teal-300">
                  {DELIVERY.find(d => d.key === delivery)?.label}
                  <button onClick={() => setDelivery("")} className="ml-1 hover:text-teal-100">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                  ${minPrice || 0}–${maxPrice || "∞"}
                  <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="ml-1 hover:text-green-100">×</button>
                </span>
              )}
              {campus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">
                  {campus}
                  <button onClick={() => setCampus("")} className="ml-1 hover:text-orange-100">×</button>
                </span>
              )}
              {(category || condition || delivery || minPrice || maxPrice || campus) && (
                <button
                  onClick={() => {
                    setCategory(""); setCondition(""); setDelivery("");
                    setMinPrice(""); setMaxPrice(""); setCampus("");
                  }}
                  className="text-xs text-white/50 hover:text-white/80"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-white/10 bg-[#0f1115]/50 backdrop-blur-xl">
              {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search items…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-8 pr-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              />
            </div>

            {/* Campus */}
            <input
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Campus"
                className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              />

              {/* Sort Dropdown */}
              <ChipDropdown
                label="Sort"
                activeLabel={SORT_OPTIONS.find(s => s.key === sortBy)?.label || "Newest First"}
              >
                <div className="grid gap-1 p-1">
                  {SORT_OPTIONS.map((option) => (
                    <Chip
                      key={option.key}
                      active={sortBy === option.key}
                      onClick={() => setSortBy(option.key)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </ChipDropdown>

            {/* Category dropdown chip */}
              <ChipDropdown label="Category" activeLabel={category || "All Categories"}>
              <div className="grid grid-cols-2 gap-2 p-1">
                <Chip active={!category} onClick={() => setCategory("")}>All</Chip>
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Condition dropdown chip */}
              <ChipDropdown label="Condition" activeLabel={condition || "Any Condition"}>
              <div className="grid grid-cols-2 gap-2 p-1">
                <Chip active={!condition} onClick={() => setCondition("")}>Any</Chip>
                {CONDITIONS.map((c) => (
                  <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>{c}</Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Delivery dropdown chip */}
            <ChipDropdown
              label="Delivery"
                activeLabel={DELIVERY.find((d) => d.key === delivery)?.label || "Any Delivery"}
            >
              <div className="grid grid-cols-2 gap-2 p-1">
                {DELIVERY.map((d) => (
                  <Chip
                    key={d.key || "any"}
                    active={delivery === d.key}
                    onClick={() => setDelivery(d.key)}
                  >
                    {d.label}
                  </Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Price dropdown chip */}
            <ChipDropdown
                label="Price Range"
              activeLabel={
                  minPrice || maxPrice ? `$${minPrice || 0}–$${maxPrice || "∞"}` : "Any Price"
              }
            >
              <div className="grid gap-3 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Min price"
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                  />
                  <Field
                    label="Max price"
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="text-xs text-white/70 hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => load(false)}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </ChipDropdown>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <div className="mb-6 flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-[#0f1115]/30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              {loading ? "Loading items..." : `${items.length} items found`}
            </h2>
            {!loading && items.length > 0 && (
              <span className="text-sm text-white/60">
                Sorted by {SORT_OPTIONS.find(s => s.key === sortBy)?.label.toLowerCase()}
              </span>
            )}
          </div>
          
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>View:</span>
              <button className="rounded-lg bg-white/10 px-3 py-1 text-white text-sm">Grid</button>
              <button className="rounded-lg px-3 py-1 hover:bg-white/5 text-sm">List</button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div id="market-grid">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0f1115] shadow-[0_12px_32px_-12px_rgba(0,0,0,.60)]">
                {/* Image skeleton */}
                <div className="aspect-[16/10] w-full animate-pulse bg-white/[0.06]"></div>
                
                {/* Content skeleton */}
                <div className="p-5">
                  <div className="mb-2">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-white/[0.06] mb-2"></div>
                    <div className="h-4 w-full animate-pulse rounded bg-white/[0.04]"></div>
                  </div>
                  
                  <div className="my-3 h-px w-full bg-white/8"></div>
                  
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.04]"></div>
                    <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.08]"></div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.04]"></div>
                    <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f1115]/50 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              No items match your current filters. Try adjusting your search criteria or browse all items.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setQ(""); setCategory(""); setCondition(""); setDelivery("");
                  setMinPrice(""); setMaxPrice(""); setCampus("");
                }}
                className="styled-button--sm"
              >
                Clear all filters
              </button>
              <button
                onClick={() => nav('/marketplace/create')}
                className="styled-button--sm"
              >
                Sell your first item
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => (
                <MarketplaceItemCard
                  key={it._id}
                  item={it}
                  favored={favIds.has(it._id)}
                  onToggleFav={toggleFav}
                  onClick={() => nav(`/marketplace/item/${it._id}`)}
                />
              ))}
            </div>

            {cursor && (
              <div className="mt-12 grid place-items-center">
                <button
                  disabled={loadingMore}
                  onClick={() => load(true)}
                  className="styled-button group relative disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Loading more items...
                      </>
                    ) : (
                      <>
                        Load more items
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Listing Drawer */}
      <ListingDrawer
        isOpen={isListingDrawerOpen}
        onClose={() => setIsListingDrawerOpen(false)}
        onItemCreated={() => {
          // Refresh the items list
          fetchItems();
        }}
      />
    </div>
  );
}
