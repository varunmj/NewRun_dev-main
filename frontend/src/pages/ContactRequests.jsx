import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';

export default function ContactRequests() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const r = await axiosInstance.get('/contact-access/inbox');
    setItems(r.data?.items || []);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, approve) => {
    await axiosInstance.post(`/contact-access/${id}/${approve ? 'approve' : 'deny'}`);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Contact requests</h1>
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it._id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{it.propertyId?.title || 'Property'}</div>
                <div className="text-sm text-white/70">
                  {it.requesterId?.firstName} {it.requesterId?.lastName} — {it.requesterId?.email}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md bg-emerald-500 px-3 py-2 text-sm" onClick={() => act(it._id, true)}>Approve</button>
                <button className="rounded-md bg-rose-500 px-3 py-2 text-sm" onClick={() => act(it._id, false)}>Deny</button>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-white/60">No pending requests.</div>}
        </div>
      </div>
    </div>
  );
}
