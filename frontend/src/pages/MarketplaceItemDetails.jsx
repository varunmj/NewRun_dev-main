// src/pages/MarketplaceItemDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";

function pickCover(item, idx) {
  const imgs = Array.isArray(item?.images) ? item.images : [];
  if (imgs[idx]) return imgs[idx];
  if (typeof item?.coverIndex === "number" && imgs[item.coverIndex]) return imgs[item.coverIndex];
  return item?.coverUrl || imgs[0] || item?.thumbnailUrl || null;
}

export default function MarketplaceItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [idx, setIdx] = useState(0);
  const [imgOk, setImgOk] = useState(true);

  const cover = useMemo(() => pickCover(item, idx), [item, idx]);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get(`/marketplace/item/${id}`);
        setItem(r?.data?.item || null);
      } catch {
        setItem(null);
      }
      // fire-and-forget view metric
      axiosInstance.post(`/marketplace/item/${id}/view`).catch(() => {});
    })();
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14">Loading…</div>
      </div>
    );
  }

  const price = typeof item.price === "number"
    ? `$${item.price.toLocaleString("en-US")}`
    : item.price;

  const imgs = Array.isArray(item.images) ? item.images : [];
  const condition = String(item?.condition || "")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="aspect-[4/3] w-full bg-white/[0.06]">
                {cover && imgOk ? (
                  <img
                    src={cover}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImgOk(false)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/40">
                    No image
                  </div>
                )}
              </div>
            </div>

            {imgs.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => { setIdx(i); setImgOk(true); }}
                    className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border ${
                      i === idx ? "border-sky-500" : "border-white/10"
                    } bg-white/[0.04]`}
                    title={`Image ${i + 1}`}
                  >
                    <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* content */}
          <div>
            <h1 className="text-3xl font-extrabold">{item.title}</h1>
            <div className="mt-1 text-2xl font-semibold text-white/90">{price}</div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/80">
              {item.category && (
                <span className="rounded-full bg-white/10 px-2 py-1">{item.category}</span>
              )}
              {condition && (
                <span className="rounded-full bg-white/10 px-2 py-1">{condition}</span>
              )}
              {item?.delivery?.pickup && (
                <span className="rounded-full bg-white/10 px-2 py-1">Pickup</span>
              )}
              {item?.delivery?.localDelivery && (
                <span className="rounded-full bg-white/10 px-2 py-1">Local delivery</span>
              )}
              {item?.delivery?.shipping && (
                <span className="rounded-full bg-white/10 px-2 py-1">Shipping</span>
              )}
            </div>

            <p className="prose prose-invert mt-4 max-w-none text-white/85 leading-6">
              {item.description || "—"}
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-white/70">Seller</div>
              <div className="mt-0.5 text-white font-medium">
                {item?.userId?.firstName || ""} {item?.userId?.lastName || ""}
              </div>

              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                  Make offer
                </button>
                <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                  Message seller
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* (optional) similar items section could be added later */}
      </div>
    </div>
  );
}
