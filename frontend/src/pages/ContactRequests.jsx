import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';

export default function ContactRequests() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending'); // 'pending' | 'approved' | 'denied'
  const [loading, setLoading] = useState(true);

  const load = async (s = status) => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/contact-access/inbox?status=${s}`);
      setItems(r.data?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  useEffect(() => {
    let s;
    (async () => {
      const { io } = await import('socket.io-client');
      const url = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8000';
      s = io(url, { transports: ['websocket'], withCredentials: true });

      // register current user; your Navbar or app shell can send this too
      const raw = localStorage.getItem('user'); // or fetch /get-user and emit there
      const userId = raw ? JSON.parse(raw)?._id : null;
      if (userId) s.emit('registerUser', userId);

      s.on('contact_request:new', () => {
        // New request for me → reload if on pending
        if (status === 'pending') load('pending');
      });
      s.on('contact_request:updated', () => {
        // Request may have been approved/denied elsewhere
        load(status);
      });
    })();
    return () => { if (s) s.disconnect(); };
  }, [status]);

  const act = async (id, action) => {
    try {
      await axiosInstance.post(`/contact-access/${id}/${action}`);
      load(status);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Contact requests</h1>
          <div className="ml-auto flex items-center gap-2">
            {['pending','approved','denied'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  status === s ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-white/70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-white/60">No {status} requests.</div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r._id} className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">
                      {r?.propertyId?.title || 'Property'}
                    </div>
                    <div className="text-sm text-white/70">
                      From: {r?.requesterId?.firstName} {r?.requesterId?.lastName} ({r?.requesterId?.email})
                    </div>
                    <div className="text-xs text-white/50">
                      Requested {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
                        onClick={() => act(r._id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-600"
                        onClick={() => act(r._id, 'deny')}
                      >
                        Deny
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-white/70">
                      Status: {r.status}
                      {r.status === 'approved' && (r.phone || r.email) ? (
                        <span className="ml-2">
                          — shared: {r.phone || '—'} {r.email ? `• ${r.email}` : ''}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
