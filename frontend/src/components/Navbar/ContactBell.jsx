// src/components/Navbar/ContactBell.jsx
import React, { useEffect, useState } from "react";
import { MdNotifications } from "react-icons/md";
import axiosInstance from "../../utils/axiosInstance";
import ContactRequestsModal from "./ContactRequestsModal";

export default function ContactBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const load = async () => {
    try {
      const r = await axiosInstance.get("/contact-access/inbox?status=pending");
      setCount((r?.data?.items || []).length);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    let s;
    (async () => {
      await load();
      const { io } = await import("socket.io-client");
      const url = (
        import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
        import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
        import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
        (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')
      );
      s = io(url, { transports: ["websocket"], withCredentials: true });

      // register user so server can push events to this client
      try {
        const me = await axiosInstance.get("/get-user");
        const id = me?.data?.user?._id;
        if (id) s.emit("registerUser", id);
      } catch {}

      s.on("contact_request:new", load);
      s.on("contact_request:updated", load);
    })();

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  return (
    <>
      <button
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/5 backdrop-blur-md text-white/85 ring-1 ring-white/20 hover:bg-white/10 hover:ring-white/30 transition-all duration-200"
        title="Notifications"
        onClick={() => setOpen(true)}
      >
        <MdNotifications />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[11px] font-semibold leading-5 text-white shadow-lg">
            {count}
          </span>
        )}
      </button>

      {open && (
        <ContactRequestsModal
          onClose={() => setOpen(false)}
          onAnyAction={load} // refresh badge after approve/deny
        />
      )}
    </>
  );
}
