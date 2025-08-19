// src/pages/PropertyDetailPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import default_property_image from "../assets/Images/default-property-image.jpg";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";
import { io } from "socket.io-client";

const MAP_STYLE = { width: "100%", height: "420px" };
const INITIAL_CENTER = { lat: 41.8781, lng: -87.6298 };
const MAP_OPTIONS = { streetViewControl: false, mapTypeControl: false, fullscreenControl: false };

/* ---------- helpers ---------- */
const money = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : String(n || ""));
const addressLine = (a) => (!a ? "" : [a.street, a.city, a.state, a.zipCode || a.zip].filter(Boolean).join(", "));
const geocode = (q) =>
  new Promise((res, rej) => {
    const g = new window.google.maps.Geocoder();
    g.geocode({ address: q }, (r, s) => (s === "OK" && r?.[0] ? res({ lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() }) : rej(s)));
  });

const maskEmail = (e = "") => (e.includes("@") ? `${e.split("@")[0][0]}•••@${e.split("@")[1]}` : e);
const maskPhone = (p = "") => p.replace(/\d(?=\d{4})/g, "*");
const idEq = (a, b) => String(a) === String(b);
const isLikedBy = (likes, uid) => Array.isArray(likes) && likes.some((v) => idEq(v?._id ?? v, uid));

export default function PropertyDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isLoaded } = useGoogleMapsLoader();

  const [property, setProperty] = useState(null);
  const [userId, setUserId] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [likesCount, setLikesCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const [originLL, setOriginLL] = useState(null);
  const [campusLL, setCampusLL] = useState(null);
  const [directions, setDirections] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // reveal modal state
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [requestStatus, setRequestStatus] = useState("idle"); // idle | pending | approved | declined

  // socket (reuse a single connection if present)
  useEffect(() => {
    if (!userId) return;
    if (!window.__nrSocket) {
      window.__nrSocket = io(import.meta.env.VITE_API_BASE || "http://localhost:8000", { transports: ["websocket"] });
    }
    const s = window.__nrSocket;
    s.emit("register", { userId });
    const onApproved = (payload) => {
      if (payload?.propertyId === id) {
        setRevealed(payload.contact);
        setRequestStatus("approved");
        setRevealOpen(true);
      }
    };
    s.on("contact:request:approved", onApproved);
    return () => s.off("contact:request:approved", onApproved);
  }, [userId, id]);

  // custom markers
  const PROPERTY_ICON = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      url:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f64ff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
              <filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/></filter>
            </defs>
            <path d="M20 3c6.6 0 12 5.4 12 12 0 8.8-12 22-12 22S8 23.8 8 15c0-6.6 5.4-12 12-12z" fill="url(#g)" filter="url(#s)"/>
            <circle cx="20" cy="15" r="5" fill="white"/>
          </svg>`
        ),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 38),
    };
  }, [isLoaded]);

  const CAMPUS_ICON = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      url:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs><filter id="s2" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/></filter></defs>
            <path d="M20 3c6.6 0 12 5.4 12 12 0 8.8-12 22-12 22S8 23.8 8 15c0-6.6 5.4-12 12-12z" fill="#EF4444" filter="url(#s2)"/>
            <circle cx="20" cy="15" r="5" fill="white"/>
          </svg>`
        ),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 38),
    };
  }, [isLoaded]);

  /* load user + property */
  const fetchUser = async () => {
    try {
      const r = await axiosInstance.get("/get-user");
      if (r.data?.user?._id) setUserId(r.data.user._id);
    } catch {}
  };

  const fetchProperty = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/properties/${id}`);
      const p = r.data?.property;
      if (!p) {
        setErr("Property not found.");
        setLoading(false);
        return;
      }
      setProperty(p);
      setLikesCount(Array.isArray(p.likes) ? p.likes.length : p.likesCount || 0);
      setLikedByUser(isLikedBy(p.likes, userId));
      setLoading(false);
    } catch (e) {
      setErr("Unable to load property.");
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [fetchProperty]);

  /* geocode + directions */
  useEffect(() => {
    if (!isLoaded || !property) return;
    const propAddr = addressLine(property.address);
    const campusQuery = property.campusName || "NIU College of Business, Barsema Hall, DeKalb, IL 60115";
    (async () => {
      try {
        const [o, d] = await Promise.all([propAddr ? geocode(propAddr) : Promise.resolve(null), geocode(campusQuery).catch(() => geocode("Northern Illinois University, DeKalb, IL 60115"))]);
        if (o) setOriginLL(o);
        if (d) setCampusLL(d);
        if (o && d) {
          const svc = new window.google.maps.DirectionsService();
          svc.route({ origin: o, destination: d, travelMode: window.google.maps.TravelMode.DRIVING }, (res, s) => (s === "OK" ? setDirections(res) : console.warn("Directions failed:", s)));
        }
      } catch (e) {
        console.warn("Geocode/Directions error:", e);
      }
    })();
  }, [isLoaded, property]);

  /* likes (optimistic, then sync to server) */
  const toggleLike = async () => {
    const next = !likedByUser;
    setLikedByUser(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      const r = await axiosInstance.put(`/property/${id}/like`);
      if (typeof r.data?.likes === "number") setLikesCount(r.data.likes);
      if (typeof r.data?.liked === "boolean") setLikedByUser(r.data.liked);
    } catch (e) {
      // rollback on error
      setLikedByUser(!next);
      setLikesCount((c) => c + (!next ? 1 : -1));
      console.error(e);
    }
  };

  const startDM = async () => {
    try {
      const r = await axiosInstance.post("/conversations/initiate", { receiverId: property.userId._id });
      if (r.data?.success) nav(`/messaging/${r.data.conversationId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const requestReveal = async () => {
    try {
      setRevealing(true);
      setRequestStatus("pending");
      setRevealed(null);
      const { data } = await axiosInstance.post("/contacts/reveal", { propertyId: property._id });
      // If host already approved earlier, backend can return approved immediately
      if (data?.status === "approved" && data?.contact) {
        setRevealed(data.contact);
        setRequestStatus("approved");
      } else if (data?.status === "pending") {
        // wait for socket approval
        setRequestStatus("pending");
      } else if (data?.status === "declined") {
        setRequestStatus("declined");
      }
    } catch (e) {
      setRequestStatus("idle");
      alert(e?.response?.data?.message || "Could not send request. Please try again.");
    } finally {
      setRevealing(false);
    }
  };

  const openModal = (i) => {
    setIdx(i);
    setIsModalOpen(true);
  };

  if (loading) return <p className="min-h-screen bg-[#0b0c0f] text-white p-6">Loading…</p>;
  if (err) return <p className="min-h-screen bg-[#0b0c0f] text-red-400 p-6">{err}</p>;

  const contact = property.contactInfo || {};
  const imgs = Array.isArray(property.images) ? property.images : [];

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 gap-8">
          {/* LEFT: gallery */}
          <div className="flex flex-col space-y-4">
            {imgs.length ? (
              <>
                <div className="bg-white/5 p-4 rounded-lg shadow-lg">
                  <img src={imgs[0]} alt="Main" className="w-full h-auto rounded-lg shadow-lg cursor-pointer" onClick={() => openModal(0)} />
                </div>
                {imgs.length > 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {imgs.slice(1).map((src, i) => (
                      <div key={i} className="bg-white/5 p-2 rounded-lg">
                        <img src={src} alt={`Thumb ${i + 2}`} className="w-full h-auto rounded-lg cursor-pointer" onClick={() => openModal(i + 1)} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/5 p-4 rounded-lg shadow-lg">
                <img src={default_property_image} alt="Default" className="rounded-lg shadow-sm" />
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">{property.title}</h1>
            <p className="text-2xl font-semibold text-white/90">{`USD $${money(property.price)}`}</p>
            <p className="text-lg text-white/70">{property.description}</p>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <button className={`p-2 rounded-full transition ${likedByUser ? "bg-red-500" : "bg-white/20"}`} onClick={toggleLike} title="Like">
                {likedByUser ? <AiFillHeart className="text-white" /> : <AiOutlineHeart className="text-red-500" />}
              </button>
              <span className="text-white/70">{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>

              <button className="ml-auto rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 transition" onClick={startDM}>
                Message host
              </button>
              <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition" onClick={() => { setRevealOpen(true); setRevealed(null); setRequestStatus("idle"); }}>
                Request phone / email
              </button>
            </div>

            {/* Facts */}
            <div className="text-lg text-white/70 mt-4 space-y-2">
              <p><strong className="text-white/90">Available:</strong> <span className="text-emerald-400 text-xl">{property.availabilityStatus === "available" ? "Yes" : "No"}</span></p>
              <p><strong className="text-white/90">Location:</strong> <span className="text-white/70">{addressLine(property.address) || "N/A"}</span></p>
              <p><strong className="text-white/90">Distance from University:</strong> <span className="text-white/70">{property.distanceFromUniversity || "N/A"} miles</span></p>
              <p><strong className="text-white/90">Bedrooms:</strong> <span className="text-white/70">{property.bedrooms || "N/A"}</span></p>
              <p><strong className="text-white/90">Bathrooms:</strong> <span className="text-white/70">{property.bathrooms || "N/A"}</span></p>

              {/* masked preview only */}
              {(contact.email || contact.phone || contact.name) && (
                <div className="mt-4 grid grid-cols-3 gap-6">
                  <div>
                    <p className="font-bold text-white/90">Host</p>
                    <p className="text-white/70">{contact.name || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-white/90">Phone</p>
                    <div className="flex items-center gap-2">
                      <FaWhatsapp className="text-emerald-400" />
                      <span className="text-white/70 whitespace-nowrap">{contact.phone ? maskPhone(contact.phone) : "—"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-white/90">Email</p>
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-sky-400" />
                      <span className="text-white/70 whitespace-nowrap">{contact.email ? maskEmail(contact.email) : "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="mt-8 relative">
                {isLoaded ? (
                  <GoogleMap mapContainerStyle={MAP_STYLE} center={originLL || campusLL || INITIAL_CENTER} zoom={originLL ? 14 : 12} options={MAP_OPTIONS}>
                    {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#2f64ff", strokeWeight: 6 } }} />}
                    {originLL && <Marker position={originLL} icon={PROPERTY_ICON} onClick={() => setShowInfo((s) => !s)} />}
                    {campusLL && <Marker position={campusLL} icon={CAMPUS_ICON} />}
                    {showInfo && originLL && (
                      <InfoWindow position={originLL} onCloseClick={() => setShowInfo(false)}>
                        <div style={{ minWidth: 180 }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{property.title}</div>
                          <div style={{ color: "#111827" }}>USD ${money(property.price)}</div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <p className="text-white/70">Loading map…</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button className="absolute top-5 right-5 text-white" onClick={() => setIsModalOpen(false)}><MdClose size={35} /></button>
          <div className="relative w-11/12 md:w-2/3 max-w-5xl">
            <img src={imgs[idx]} alt={`Image ${idx + 1}`} className="w-full h-auto rounded-lg shadow-lg" />
            <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full" onClick={() => setIdx((i) => (i === 0 ? imgs.length - 1 : i - 1))}><MdChevronLeft size={35} /></button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full" onClick={() => setIdx((i) => (i === imgs.length - 1 ? 0 : i + 1))}><MdChevronRight size={35} /></button>
          </div>
        </div>
      )}

      {/* Reveal contact modal */}
      {revealOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121318] p-5 text-white">
            <div className="mb-2 text-lg font-semibold">Request host contact</div>
            <p className="text-sm text-white/70">To protect hosts from spam, we gate direct contact. Please use in-app messaging when possible.</p>

            <div className="mt-4 flex items-center gap-2">
              <button disabled={revealing || requestStatus === "pending"} className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-60" onClick={requestReveal}>
                {revealing ? "Requesting…" : requestStatus === "pending" ? "Request sent" : "Reveal once"}
              </button>
              <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2" onClick={() => setRevealOpen(false)}>Close</button>
            </div>

            {requestStatus === "pending" && (
              <div className="mt-3 text-xs text-white/60">Waiting for host approval. We’ll notify you here.</div>
            )}

            {requestStatus === "declined" && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">Host declined this request. You can still message the host in-app.</div>
            )}

            {requestStatus === "approved" && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
                {revealed?.phone && <div>Phone: {revealed.phone}</div>}
                {revealed?.email && <div>Email: {revealed.email}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
