// src/components/Navbar/ContactRequestsModal.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { MdClose } from "react-icons/md";

export default function ContactRequestsModal({ onClose, onAnyAction }) {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const r = await axiosInstance.get("/contact-access/inbox?status=pending");
      setItems(r?.data?.items || []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      await axiosInstance.post(`/contact-access/${id}/${action}`);
      setItems((xs) => xs.filter((x) => x._id !== id));
      onAnyAction?.(); // refresh bell count
    } catch {
      // you can toast an error here
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 px-3">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111318] p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Requests</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/10"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-10 text-center text-white/60">
            You’re all caught up ✨
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((req) => (
              <li
                key={req._id}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={req.property?.images?.[0] || "/placeholder.png"}
                    alt=""
                    className="h-16 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white/90">
                      {req.property?.title || "Property"}
                    </div>
                    <div className="mt-0.5 text-sm text-white/60">
                      <span className="font-medium">
                        {req.requester?.firstName} {req.requester?.lastName}
                      </span>{" "}
                      wants to view your contact info.
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busyId === req._id}
                    onClick={() => act(req._id, "approve")}
                    className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-500/90 disabled:opacity-60"
                  >
                    {busyId === req._id ? "Approving…" : "Approve"}
                  </button>
                  <button
                    disabled={busyId === req._id}
                    onClick={() => act(req._id, "deny")}
                    className="rounded-lg border border-white/10 bg-white/8 px-3 py-1.5 text-sm text-white/85 hover:bg-white/12 disabled:opacity-60"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
