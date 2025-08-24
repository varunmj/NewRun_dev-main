// src/components/ui/Lightbox.jsx
import React, { useEffect } from "react";
import { MdClose, MdChevronLeft, MdChevronRight } from "react-icons/md";

export default function Lightbox({ images = [], index = 0, onClose, onNext, onPrev }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  const src = images[index] || "";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/15"
      >
        <MdClose size={22} />
      </button>

      <div className="relative flex h-full w-full items-center justify-center p-6">
        <button
          aria-label="Previous"
          onClick={onPrev}
          className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/15"
        >
          <MdChevronLeft size={26} />
        </button>

        <img
          src={src}
          alt=""
          className="max-h-[84vh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl"
        />

        <button
          aria-label="Next"
          onClick={onNext}
          className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/15"
        >
          <MdChevronRight size={26} />
        </button>
      </div>
    </div>
  );
}
