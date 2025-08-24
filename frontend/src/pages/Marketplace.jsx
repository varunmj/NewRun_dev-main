// src/pages/Marketplace.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import MarketplaceItemCard from "../components/Cards/MarketplaceItemCard";
import HeroPromo from "../components/Sections/HeroPromo";
import FeatureSplit from "../components/Sections/FeatureSplit";
import "../styles/newrun-hero.css"; // once

/* --------------------------------- data --------------------------------- */
const CATEGORIES = ["Furniture", "Electronics", "Books", "Bikes", "Kitchen", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];
const DELIVERY = [
  { key: "", label: "Any delivery" },
  { key: "pickup", label: "Pickup" },
  { key: "localDelivery", label: "Local delivery" },
  { key: "shipping", label: "Shipping" },
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
        "rounded-full px-3.5 py-1.5 text-sm transition-colors",
        active ? "bg-white text-black shadow" : "bg-white/10 text-white/85 hover:bg-white/15"
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
          "list-none cursor-pointer select-none rounded-full px-3.5 py-1.5 text-sm transition-colors",
          "bg-white/10 text-white/85 hover:bg-white/15 marker:content-none",
          "group-open:bg-white group-open:text-black group-open:shadow"
        )}
      >
        {activeLabel || label}
      </summary>
      <div
        className="absolute left-0 z-20 mt-2 w-[min(92vw,320px)] rounded-2xl border border-white/10 bg-[#0f1115] p-2 shadow-2xl"
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

  // data
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

  // derived
  const filters = useMemo(() => {
    const p = {
      q, campus, delivery,
      category, condition,
      min: minPrice, max: maxPrice,   // backend v1
      minPrice, maxPrice,             // backend v2
    };
    Object.keys(p).forEach((k) => (p[k] === "" || p[k] == null) && delete p[k]);
    return p;
  }, [q, campus, delivery, category, condition, minPrice, maxPrice]);

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
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar />
       <HeroPromo />
      <FeatureSplit />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        {/* Title */}
        <header className="mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-white/70">
            Buy &amp; sell campus essentials — fast, safe, student-only.
          </p>
        </header>

        {/* Sticky compact toolbar */}
        <section className="sticky top-[68px] z-10 mb-6 rounded-2xl border border-white/10 bg-[#0f1115]/80 p-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search (flex-grow) */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-8 pr-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-sky-500"
              />
            </div>

            {/* Campus */}
            <input
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Campus"
              className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-sky-500"
            />

            {/* Category dropdown chip */}
            <ChipDropdown label="Category" activeLabel={category || undefined}>
              <div className="grid grid-cols-2 gap-2 p-1">
                <Chip active={!category} onClick={() => setCategory("")}>All</Chip>
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                ))}
              </div>
            </ChipDropdown>

            {/* Condition dropdown chip */}
            <ChipDropdown label="Condition" activeLabel={condition || undefined}>
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
              activeLabel={DELIVERY.find((d) => d.key === delivery)?.label || undefined}
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
              label="Price"
              activeLabel={
                minPrice || maxPrice ? `$${minPrice || 0}–$${maxPrice || "∞"}` : undefined
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
        </section>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.06]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/70">
            No items match your filters. Try widening your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="mt-8 grid place-items-center">
                <button
                  disabled={loadingMore}
                  onClick={() => load(true)}
                  className="rounded-xl bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
