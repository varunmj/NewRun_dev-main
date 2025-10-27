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
  { key: "createdAt", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { key: "createdAt-asc", label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { key: "price-asc", label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
  { key: "price-desc", label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
  { key: "likes-desc", label: "Most Popular", sortBy: "likes", sortOrder: "desc" },
  { key: "views-desc", label: "Most Viewed", sortBy: "views", sortOrder: "desc" },
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
        "w-full text-left rounded-lg px-3 py-2 text-sm transition-all duration-200",
        active 
          ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" 
          : "text-white/80 hover:bg-white/10 hover:text-white border border-transparent"
      )}
    >
      {children}
    </button>
  );
}

/** Simple dropdown built with controlled state for better z-index handling */
function ChipDropdown({ label, activeLabel, children, isOpen, onToggle }) {
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className={classNames(
          "rounded-full px-3.5 py-1.5 text-sm transition-all duration-200",
          isOpen ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
        )}
      >
        {activeLabel || label}
        <svg className="inline-block ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 z-[9999] mt-3 w-[280px] rounded-xl border border-white/20 bg-[#0f1115]/98 backdrop-blur-2xl p-1 shadow-2xl">
          {children}
        </div>
      )}
    </div>
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
  const [sortBy, setSortBy] = useState("createdAt");

  // dropdown states
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false);
  const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);

  // data
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

  // drawer state
  const [isListingDrawerOpen, setIsListingDrawerOpen] = useState(false);
  
  // scroll detection for filter behavior
  const [showFilterButton, setShowFilterButton] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // derived
  const filters = useMemo(() => {
    const selectedSort = SORT_OPTIONS.find(opt => opt.key === sortBy);
    const sortField = selectedSort?.sortBy ?? 'createdAt';
    const sortDir = selectedSort?.sortOrder ?? 'desc';

    const p = {
      query: q, // Map 'q' to 'query' for backend compatibility
      campus, delivery,
      category, condition,
      min: minPrice, max: maxPrice,   // backend v1
      minPrice, maxPrice,             // backend v2
      
      // Simplified - just send what backend expects
      sortBy: sortField,
      sortOrder: sortDir,
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
      
      // Client-side fallback sort
      const selected = SORT_OPTIONS.find(o => o.key === sortBy);
      const field = selected?.sortBy ?? 'createdAt';
      const dir = selected?.sortOrder ?? 'desc';
      const getVal = (x) => {
        if (field === 'createdAt') {
          // Handle both createdAt and createdOn fields
          const dateField = x.createdAt || x.createdOn;
          return new Date(dateField || 0).getTime();
        }
        return Number(x[field] ?? 0);
      };
      next.sort((a,b) => (dir === 'asc' ? 1 : -1) * (getVal(a) - getVal(b)));
      
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

  // Scroll detection for filter behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const filterSection = document.getElementById('filter-section');
      
      if (filterSection) {
        const filterRect = filterSection.getBoundingClientRect();
        const filterBottom = filterRect.bottom;
        
        // Show collapsed button when filter section is out of view
        if (filterBottom < 0) {
          setShowFilterButton(true);
          setIsFilterCollapsed(false);
        } else {
          setShowFilterButton(false);
          setIsFilterCollapsed(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterCollapsed && showFilterButton) {
        const button = document.querySelector('[data-filter-button]');
        const panel = document.querySelector('[data-filter-panel]');
        
        if (button && panel && 
            !button.contains(event.target) && 
            !panel.contains(event.target)) {
          setIsFilterCollapsed(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterCollapsed, showFilterButton]);

  // Reset pagination when sort/filter changes
  useEffect(() => { 
    setCursor(null); 
  }, [sortBy, q, category, condition, delivery, minPrice, maxPrice, campus]);

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

  const scrollToFilters = () => {
    const filterSection = document.getElementById('filter-section');
    if (filterSection) {
      filterSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setIsFilterCollapsed(false);
    }
  };

  const handleFilterButtonClick = () => {
    // Toggle the panel state
    setIsFilterCollapsed(prev => !prev);
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

      <main className="mx-auto max-w-7xl px-4 pb-16 overflow-visible">

        {/* Enhanced Filter Toolbar */}
        <section id="filter-section" className="relative z-50 mb-8 rounded-2xl border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl overflow-visible">
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
                isOpen={sortDropdownOpen}
                onToggle={setSortDropdownOpen}
              >
                <div className="grid gap-1 p-1">
                  {SORT_OPTIONS.map((option) => (
                    <Chip
                      key={option.key}
                      active={sortBy === option.key}
                      onClick={() => {
                        setSortBy(option.key);
                        setSortDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </ChipDropdown>

            {/* Category dropdown chip */}
              <ChipDropdown 
                label="Category" 
                activeLabel={category || "All Categories"}
                isOpen={categoryDropdownOpen}
                onToggle={setCategoryDropdownOpen}
              >
              <div className="grid grid-cols-2 gap-2 p-1">
                <Chip active={!category} onClick={() => {
                  setCategory("");
                  setCategoryDropdownOpen(false);
                }}>All</Chip>
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => {
                    setCategory(c);
                    setCategoryDropdownOpen(false);
                  }}>{c}</Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Condition dropdown chip */}
              <ChipDropdown 
                label="Condition" 
                activeLabel={condition || "Any Condition"}
                isOpen={conditionDropdownOpen}
                onToggle={setConditionDropdownOpen}
              >
              <div className="grid grid-cols-2 gap-2 p-1">
                <Chip active={!condition} onClick={() => {
                  setCondition("");
                  setConditionDropdownOpen(false);
                }}>Any</Chip>
                {CONDITIONS.map((c) => (
                  <Chip key={c} active={condition === c} onClick={() => {
                    setCondition(c);
                    setConditionDropdownOpen(false);
                  }}>{c}</Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Delivery dropdown chip */}
            <ChipDropdown
              label="Delivery"
              activeLabel={DELIVERY.find((d) => d.key === delivery)?.label || "Any Delivery"}
              isOpen={deliveryDropdownOpen}
              onToggle={setDeliveryDropdownOpen}
            >
              <div className="grid grid-cols-2 gap-2 p-1">
                {DELIVERY.map((d) => (
                  <Chip
                    key={d.key || "any"}
                    active={delivery === d.key}
                    onClick={() => {
                      setDelivery(d.key);
                      setDeliveryDropdownOpen(false);
                    }}
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
              isOpen={priceDropdownOpen}
              onToggle={setPriceDropdownOpen}
            >
              <div className="p-3">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Min Price</label>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-white/10 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Max Price</label>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="1000"
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-white/10 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      setPriceDropdownOpen(false);
                    }}
                    className="text-xs text-white/60 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      load(false);
                      setPriceDropdownOpen(false);
                    }}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
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
        <div className="relative z-10 mb-6 flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-[#0f1115]/30 backdrop-blur-xl">
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
          load(false);
        }}
      />

      {/* Floating Filter Button */}
      {showFilterButton && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
          <button
            data-filter-button
            onClick={handleFilterButtonClick}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      )}

      {/* Collapsed Filter Panel */}
      {showFilterButton && (
        <div className="fixed left-20 top-1/2 -translate-y-1/2 z-40">
          <div 
            data-filter-panel 
            className={`w-80 max-w-80 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl p-6 transition-all duration-500 ease-out transform overflow-hidden ${
              isFilterCollapsed 
                ? 'translate-x-0 opacity-100 scale-100' 
                : '-translate-x-full opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className={`flex items-center justify-between mb-4 transition-all duration-700 ease-out ${
              isFilterCollapsed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
              <h3 className="text-lg font-semibold text-white">Quick Filters</h3>
              <button
                onClick={scrollToFilters}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                View All Filters
              </button>
            </div>
            
            {/* Quick Filter Options */}
            <div className={`space-y-3 transition-all duration-700 ease-out delay-100 ${
              isFilterCollapsed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {/* Search */}
              <div className="w-full">
                <label className="block text-sm font-medium text-white/70 mb-2">Search</label>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search items..."
                  className="w-full max-w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-500"
                />
              </div>
              
              {/* Category */}
              <div className="w-full">
                <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full max-w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div className="w-full">
                <label className="block text-sm font-medium text-white/70 mb-2">Price Range</label>
                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-500"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}