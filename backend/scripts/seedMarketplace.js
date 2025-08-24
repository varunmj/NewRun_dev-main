// src/pages/Marketplace.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import MarketplaceItemCard from "../components/Cards/MarketplaceItemCard";
import SegmentPill from "../components/ui/SegmentPill";

const CATEGORIES = ["Furniture", "Electronics", "Books", "Bikes", "Kitchen", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

const CATEGORY_OPTS = [{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))];
const CONDITION_OPTS = [{ value: "", label: "Any condition" }, ...CONDITIONS.map((c) => ({ value: c, label: c }))];
const DELIVERY_OPTS = [
  { value: "", label: "Any delivery" },
  { value: "pickup", label: "Pickup" },
  { value: "localDelivery", label: "Local delivery" },
  { value: "shipping", label: "Shipping" },
];

export default function Marketplace() {
  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTS[0].value);
  const [condition, setCondition] = useState(CONDITION_OPTS[0].value);
  const [campus, setCampus] = useState("");
  const [delivery, setDelivery] = useState(DELIVERY_OPTS[0].value);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // data
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

  const params = useMemo(
    () => ({ q, category, condition, campus, delivery, min: minPrice, max: maxPrice }),
    [q, category, condition, campus, delivery, minPrice, maxPrice]
  );

  const fetchItems = async (nextPage = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      // remove empty values
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v != null)
      );

      const r = await axiosInstance.get("/marketplace/items", {
        params: { ...clean, page: nextPage, limit: 24 },
      });

      const arr = r.data?.items || [];
      setItems((prev) => (append ? [...prev, ...arr] : arr));
      setPage(nextPage);
      const total = r.data?.total || 0;
      const lim = r.data?.limit || 24;
      setHasMore(nextPage * lim < total);
    } catch (e) {
      console.error("marketplace load error", e?.response?.data || e);
      if (!append) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // initial + filter changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchItems(1, false), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.category, params.condition, params.campus, params.delivery, params.min, params.max]);

  const toggleFav = (item) => {
    setFavIds((ids) => {
      const next = new Set(ids);
      if (next.has(item._id)) next.delete(item._id);
      else next.add(item._id);
      return next;
    });
    // (optional) call your API for persistence
    // axiosInstance.post(`/marketplace/favorites/${item._id}`).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-6">
        {/* Top copy */}
        <div className="mb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-sm text-white/70">Buy & sell campus essentials — fast, safe, student-only.</p>
        </div>

        {/* Filters row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 outline-none placeholder:text-white/45 focus:border-sky-500 md:max-w-md"
          />

          <SegmentPill
            ariaLabel="Category"
            options={CATEGORY_OPTS}
            value={category}
            onChange={setCategory}
          />
          <SegmentPill
            ariaLabel="Condition"
            options={CONDITION_OPTS}
            value={condition}
            onChange={setCondition}
          />
          <SegmentPill
            ariaLabel="Delivery"
            options={DELIVERY_OPTS}
            value={delivery}
            onChange={setDelivery}
          />
        </div>

        {/* Secondary filters */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:max-w-xl">
          <input
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            placeholder="Campus (optional)"
            className="col-span-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/45 focus:border-sky-500 md:col-span-1"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min price"
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/45 focus:border-sky-500"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/45 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-white/[0.06]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
              <div className="text-white/70">
                No items match your filters.
                <button
                  onClick={() => {
                    setQ(""); setCategory(""); setCondition(""); setCampus("");
                    setDelivery(""); setMinPrice(""); setMaxPrice("");
                  }}
                  className="ml-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/15"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((it) => (
                  <MarketplaceItemCard
                    key={it._id}
                    item={it}
                    favored={favIds.has(it._id)}
                    onToggleFav={toggleFav}
                    onClick={() => (window.location.href = `/marketplace/item/${it._id}`)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 grid place-items-center">
                  <button
                    disabled={loadingMore}
                    onClick={() => fetchItems(page + 1, true)}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
