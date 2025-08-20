// src/pages/MarketplaceItemDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import OfferModal from "../components/marketplace/OfferModal";

export default function MarketplaceItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [idx, setIdx] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);

  const cover = useMemo(() => {
    if (!item?.images?.length) return null;
    return item.images[idx];
  }, [item, idx]);

  const load = async () => {
    try {
      const r = await axiosInstance.get(`/marketplace/items`, { params: { cursor: undefined, limit: 1 }});
      // If you already have a dedicated GET by id, use it instead:
      const one = await axiosInstance.get(`/marketplace/item/${id}`).catch(() => null);
      if (one?.data?.item) setItem(one.data.item);
    } catch {}
  };

  useEffect(() => {
    load();
    axiosInstance.post(`/marketplace/item/${id}/view`).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14">Loading…</div>
      </div>
    );
  }

  const price = typeof item.price === "number" ? item.price.toLocaleString("en-US") : item.price;

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              {cover ? (
                <img src={cover} alt={item.title} className="h-auto w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] w-full" />
              )}
            </div>
            {item.images?.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {item.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-20 overflow-hidden rounded-lg border ${i === idx ? "border-sky-500" : "border-white/10"} bg-white/[0.04]`}
                  >
                    <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            <div className="text-2xl font-semibold text-white/90">${price}</div>

            {item.location?.campus && (
              <div className="text-white/70">Campus: {item.location.campus}</div>
            )}

            <div className="prose prose-invert max-w-none leading-6 text-white/85">
              {/* natural wrapping, no truncation */}
              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.description || "—"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-sm text-white/60">
              {item.category && <span className="rounded-full bg-white/5 px-2 py-1">{item.category}</span>}
              {item.condition && <span className="rounded-full bg-white/5 px-2 py-1">{item.condition}</span>}
              {item.delivery?.pickup && <span className="rounded-full bg-white/5 px-2 py-1">Pickup</span>}
              {item.delivery?.localDelivery && <span className="rounded-full bg-white/5 px-2 py-1">Local delivery</span>}
              {item.delivery?.shipping && <span className="rounded-full bg-white/5 px-2 py-1">Shipping</span>}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setOfferOpen(true)}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Make offer
              </button>
            </div>
          </div>
        </div>
      </div>

      <OfferModal
        itemId={id}
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
