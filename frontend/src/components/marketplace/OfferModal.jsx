// src/components/marketplace/OfferModal.jsx
import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function OfferModal({ itemId, open, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async () => {
    setErr("");
    if (!amount || Number(amount) <= 0) {
      setErr("Please enter a valid amount.");
      return;
    }
    try {
      setSending(true);
      // TODO: wire this to your real offer endpoint when ready
      await axiosInstance.post(`/marketplace/offers`, {
        itemId,
        amount: Number(amount),
        message,
      });
      setSending(false);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setSending(false);
      setErr("Could not send your offer. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101217] p-5 text-white shadow-2xl">
        <div className="mb-1 text-lg font-semibold">Make an offer</div>
        <p className="text-sm text-white/60">
          Your offer will be sent to the seller. They can accept or counter.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-white/70">Offer amount (USD)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none focus:border-sky-500"
              placeholder="e.g. 120"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Message (optional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 outline-none focus:border-sky-500"
              placeholder="Share pickup timing, questions, etc."
            />
          </div>
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
            disabled={sending}
            onClick={submit}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
