import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";

export default function MarketplaceItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [idx, setIdx] = useState(0);

  // Build a gallery that supports both images[] and legacy thumbnailUrl
  const gallery = useMemo(() => {
    if (!item) return [];
    if (Array.isArray(item.images) && item.images.length) return item.images;
    return item.thumbnailUrl ? [item.thumbnailUrl] : [];
  }, [item]);

  const cover = gallery[idx] || null;

  const load = async () => {
    try {
      const r = await axiosInstance.get(`/marketplace/item/${id}`);
      setItem(r?.data?.item || null);
    } catch (e) {
      console.error("Item load error:", e?.response?.data || e.message);
    }
  };

  useEffect(() => {
    load();
    // optional: record a view if you wire this endpoint later
    // axiosInstance.post(`/marketplace/item/${id}/view`).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-14">Loading…</div>
      </div>
    );
  }

  const price =
    typeof item.price === "number" ? item.price.toLocaleString("en-US") : item.price;

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {cover ? (
                <img
                  src={cover}
                  alt={item.title}
                  className="h-auto w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full" />
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-20 overflow-hidden rounded-xl border ${
                      i === idx ? "border-sky-500" : "border-white/10"
                    } bg-white/[0.04]`}
                  >
                    <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content / Actions */}
          <div className="lg:col-span-5">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="text-2xl font-semibold text-white/90">${price}</div>

              <div className="flex flex-wrap gap-2 pt-2 text-sm text-white/80">
                {item.category && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">{item.category}</span>
                )}
                {item.condition && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {(item.condition + "").toLowerCase()}
                  </span>
                )}
                {item.location?.campus && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {item.location.campus}
                  </span>
                )}
                {item.delivery?.pickup && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">Pickup</span>
                )}
                {item.delivery?.localDelivery && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">Local delivery</span>
                )}
                {item.delivery?.shipping && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1">Shipping</span>
                )}
              </div>

              <div className="prose prose-invert max-w-none leading-7 text-white/85">
                <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {item.description || "—"}
                </p>
              </div>

              {/* Sticky actions card */}
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">${price}</div>
                  <div className="text-sm text-white/60">
                    {item.location?.city ? item.location.city : ""}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      // you can open your OfferModal here if you want to keep it
                      // setOfferOpen(true)
                      // For now, this could navigate to chat with seller if you want to hook it
                    }}
                    className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Make offer
                  </button>
                  <button
                    onClick={() => {
                      // wire to conversations/initiate using seller userId (item.userId)
                      // nav(`/messages?to=${item.userId}`)
                    }}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                  >
                    Message seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
