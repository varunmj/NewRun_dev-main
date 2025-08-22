import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import MarketplaceItemCard from "../components/Cards/MarketplaceItemCard";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Furniture", "Electronics", "Books", "Bikes", "Kitchen", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];
const DELIVERY = [
  { key: "pickup", label: "Pickup" },
  { key: "localDelivery", label: "Local delivery" },
  { key: "shipping", label: "Shipping" },
];

export default function Marketplace() {
  const nav = useNavigate();

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [campus, setCampus] = useState("");
  const [delivery, setDelivery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // data
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

  const params = useMemo(
    () => ({ q, category, condition, campus, delivery, minPrice, maxPrice }),
    [q, category, condition, campus, delivery, minPrice, maxPrice]
  );

  const load = async (append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v != null)
      );

      const r = await axiosInstance.get("/marketplace/items", {
        params: { ...clean, cursor: append ? cursor : undefined, limit: 24 },
      });

      setItems((prev) => (append ? [...prev, ...(r.data?.items || [])] : r.data?.items || []));
      setCursor(r.data?.nextCursor || null);
    } catch (e) {
      console.error("Marketplace load error:", e?.response?.data || e.message);
      if (!append) setItems([]);
      setCursor(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // initial + on filters change (debounced)
  useEffect(() => {
    const t = setTimeout(() => load(false), 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.category, params.condition, params.campus, params.delivery, params.minPrice, params.maxPrice]);

  const toggleFav = async (item) => {
    try {
      // You can wire this when you add favorites API
      // const r = await axiosInstance.post(`/marketplace/favorites/${item._id}`);
      setFavIds((ids) => {
        const next = new Set(ids);
        if (next.has(item._id)) next.delete(item._id);
        else next.add(item._id);
        return next;
      });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="">Any condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            placeholder="Campus (optional)"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />

          <select
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="">Any delivery</option>
            {DELIVERY.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Price row */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:w-1/2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/70">
              No items match your filters. Try widening your search.
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
                    onClick={() => nav(`/marketplace/item/${it._id}`)}
                  />
                ))}
              </div>

              {cursor && (
                <div className="mt-6 grid place-items-center">
                  <button
                    disabled={loadingMore}
                    onClick={() => load(true)}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
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
