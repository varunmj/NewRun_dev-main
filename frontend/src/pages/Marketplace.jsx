// src/pages/Marketplace.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../context/AuthContext.jsx";
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
  const { isAuthenticated } = useAuth();

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
  const [viewMode, setViewMode] = useState('grid');

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

  // Load favorites on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // Load user's favorite marketplace items
  const loadFavorites = async () => {
    try {
      const response = await axiosInstance.get('/marketplace/favorites');
      const favoriteIds = new Set(response.data.items.map(item => item._id));
      setFavIds(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

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
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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

      {/* Hero Section - starts from top */}
      <section className="nr-hero-bg nr-hero-starry relative flex min-h-screen items-center overflow-hidden pt-0">
        {/* Navbar overlay on top of hero */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-4">
          <Navbar />
        </div>
        
        <div className="relative z-10 w-full">
          <HeroPromo onListItem={() => setIsListingDrawerOpen(true)} />
        </div>
      </section>

      <div className="relative z-10">
        <FeatureSplit />

      {/* Compact intro section (replaces large stats cards) */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="p-0 relative">
          {!isAuthenticated && (
            <div className="mb-1">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm h-9 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/50 hover:shadow-lg hover:shadow-blue-500/60 transition-all duration-200"
              >
                [NEW] Student Portal
              </button>
            </div>
          )}
          {/* Right blue promo box (desktop) */}
          {!isAuthenticated && (
          <div className="hidden md:block space-y-4 md:absolute md:right-0 md:top-0">
            <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 p-4 rounded-lg shadow-md border border-indigo-400/20 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-yellow-300/20 p-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-4 w-4 text-yellow-300"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <span className="text-sm font-semibold text-white">Premium Marketplace</span>
                </div>
                <p className="text-xs text-white/90 mb-3">
                  Login to view verified items, instant messaging, ID‑verified sellers, and exclusive deals with our AI Assistant.
                </p>
                <button
                  type="button"
                  onClick={() => nav('/login?redirect=/marketplace')}
                  className="whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] h-8 rounded-md px-3 w-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5"
                >
                  <span>Login / Sign Up</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link h-3.5 w-3.5"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                </button>
            </div>
          </div>
          )}
          {/* Mobile blue banner */}
          {!isAuthenticated && (
          <div className="md:hidden flex items-center justify-between w-full bg-gradient-to-r from-blue-600/90 to-indigo-700/90 p-3 rounded-lg shadow-md border border-indigo-400/20 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-300/20 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-4 w-4 text-yellow-300"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a 5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <span className="text-sm font-medium text-white">Premium Marketplace</span>
            </div>
            <button
              type="button"
              onClick={() => nav('/login?redirect=/marketplace')}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              Login to view
            </button>
          </div>
          )}

          <h1 className="text-4xl md:text-5xl mt-1">Student Marketplace</h1>
          <h2 className="text-lg md:text-xl font-light text-white/80 max-w-md mt-1">
            Buy and sell items from verified students. Displays 20+ items per search; transparent pricing and no transaction fees.
          </h2>
          </div>
      </section>

      {/* Global search bar */}
      <section className="mx-auto max-w-7xl px-4 pb-2">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-white/50"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-lg border border-white/20 bg-[#121416]/70 px-4 py-3 pl-12 text-base text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-[#121416]/90 transition-all"
          />
          </div>
      </section>

      {/* Category quick links (chips) */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="mb-2 text-sm text-white/70">NewRun's Best in Category Lists:</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory('Furniture')}
            className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap text-xs px-3 py-1 border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Furniture
          </button>
          <button
            onClick={() => setCategory('Electronics')}
            className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap text-xs px-3 py-1 border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Electronics
          </button>
          <button
            onClick={() => setCategory('Bikes')}
            className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap text-xs px-3 py-1 border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Bikes
          </button>
          <button
            onClick={() => setCondition('Like New')}
            className="inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap text-xs px-3 py-1 border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Like New
          </button>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 overflow-visible">
        <div className="flex">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0 pr-6">
            <div className="sticky top-4" id="filter-section">
              {/* Filters Header */}
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Filters</h3>
              </div>

              {/* Search removed (global search bar above handles this) */}

              {/* Category */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Category</label>
                <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:bg-white/10 transition-all duration-200">
                  <option value="" className="bg-[#0f1115]">All</option>
                  {CATEGORIES.map(c => (<option key={c} value={c} className="bg-[#0f1115]">{c}</option>))}
                </select>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Condition</label>
                <select value={condition} onChange={(e)=>setCondition(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:bg-white/10 transition-all duration-200">
                  <option value="" className="bg-[#0f1115]">Any</option>
                  {CONDITIONS.map(c => (<option key={c} value={c} className="bg-[#0f1115]">{c}</option>))}
                </select>
              </div>

              {/* Delivery */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Delivery</label>
                <select value={delivery} onChange={(e)=>setDelivery(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:bg-white/10 transition-all duration-200">
                  {DELIVERY.map(d => (<option key={d.key||'any'} value={d.key} className="bg-[#0f1115]">{d.label}</option>))}
                </select>
              </div>

              {/* Price */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="Min" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-white/10 transition-all duration-200" />
                  <input type="number" min="0" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="Max" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-white/10 transition-all duration-200" />
                </div>
              </div>

              {/* Campus */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Campus</label>
                <input value={campus} onChange={(e)=>setCampus(e.target.value)} placeholder="Enter campus name" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400 focus:bg-white/10 transition-all duration-200" />
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="text-sm font-medium text-white/80 mb-2 block">Sort By</label>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:bg-white/10 transition-all duration-200">
                  {SORT_OPTIONS.map(o => (<option key={o.key} value={o.key} className="bg-[#0f1115]">{o.label}</option>))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button onClick={()=>load(false)} className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors">Apply Filters</button>
                <button onClick={()=>{setQ("");setCategory("");setCondition("");setDelivery("");setMinPrice("");setMaxPrice("");setCampus("");load(false);}} className="w-full rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors">Clear Filters</button>
              </div>
            </div>
          </div>

          {/* Separating Line */}
          <div className="w-px bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"></div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0 pl-6">
            {/* Results Section */}
            <div className="relative z-10 mb-6 flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-[#0f1115]/30 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-white">{loading ? "Loading items..." : `${items.length} items found`}</h2>
                {!loading && items.length>0 && (
                  <span className="text-sm text-white/60">Sorted by {SORT_OPTIONS.find(s=>s.key===sortBy)?.label.toLowerCase()}</span>
                )}
              </div>
              {!loading && items.length>0 && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>View:</span>
                  <button onClick={()=>setViewMode('grid')} className={`rounded-lg px-3 py-1 text-sm transition-all duration-200 ${viewMode==='grid' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}>Grid</button>
                  <button onClick={()=>setViewMode('list')} className={`rounded-lg px-3 py-1 text-sm transition-all duration-200 ${viewMode==='list' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}>List</button>
                </div>
              )}
            </div>
        
            {/* Grid */}
            <div id="market-grid">
              {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({length:8}).map((_,i)=>(
                    <div key={i} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0f1115] shadow-[0_12px_32px_-12px_rgba(0,0,0,.60)]">
                      <div className="aspect-[16/10] w-full animate-pulse bg-white/[0.06]"></div>
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length===0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f1115]/50 p-12 text-center backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
                  <p className="text-white/60 mb-6 max-w-md mx-auto">No items match your current filters. Try adjusting your search criteria or browse all items.</p>
                </div>
              ) : (
                viewMode==='grid' ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((it)=>(
                      <MarketplaceItemCard key={it._id} item={it} favored={favIds.has(it._id)} onToggleFav={toggleFav} onClick={()=>nav(`/marketplace/item/${it._id}`)} viewMode="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((it)=>(
                      <MarketplaceItemCard key={it._id} item={it} favored={favIds.has(it._id)} onToggleFav={toggleFav} onClick={()=>nav(`/marketplace/item/${it._id}`)} viewMode="list" />
                    ))}
                  </div>
                )
              )}
            </div>

            {cursor && (
              <div className="mt-12 grid place-items-center">
                <button disabled={loadingMore} onClick={()=>load(true)} className="styled-button group relative disabled:opacity-60">
                  <span className="relative z-10 flex items-center gap-2">
                    {loadingMore ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Loading more items...</>) : (<>Load more items <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>)}
                  </span>
                </button>
              </div>
            )}

          </div>
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
    </div>
  );
}