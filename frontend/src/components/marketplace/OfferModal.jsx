// src/components/marketplace/OfferModal.jsx
import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function OfferModal({ itemId, open, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await axiosInstance.post("/marketplace/offers", { itemId, amount: Number(amount), message });
      onSuccess?.();
      onClose();
    } catch (e) {
      const code = e?.response?.status;
      setErr(
        code === 401 ? "Please sign in to make an offer." :
        code === 400 ? (e?.response?.data?.message || "Invalid offer.") :
        "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121318] p-5 text-white shadow-2xl">
        <div className="mb-3 text-lg font-semibold">Make an offer</div>
        <div className="space-y-3">
          <input
            type="number"
            min="0"
            placeholder="Your offer amount (USD)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />
          <textarea
            rows={3}
            placeholder="Optional message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none placeholder:text-white/40 focus:border-sky-500"
          />
          {err && <div className="text-sm text-rose-400">{err}</div>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !amount}
            onClick={submit}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
