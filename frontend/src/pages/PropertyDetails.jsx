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

/* ---------------------------- map & helpers ---------------------------- */
const MAP_STYLE = { width: "100%", height: "420px" };
const INITIAL_CENTER = { lat: 41.8781, lng: -87.6298 };
const MAP_OPTIONS = { streetViewControl: false, mapTypeControl: false, fullscreenControl: false };

const money = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : String(n || ""));
const addressLine = (addr) => {
  if (!addr) return "";
  const { street, city, state, zipCode, zip } = addr;
  return [street, city, state, zipCode || zip].filter(Boolean).join(", ");
};

const geocode = (query) =>
  new Promise((resolve, reject) => {
    const g = new window.google.maps.Geocoder();
    g.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const l = results[0].geometry.location;
        resolve({ lat: l.lat(), lng: l.lng() });
      } else reject(status);
    });
  });

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "—";
  const [user, domain] = email.split("@");
  const left = user.slice(0, 1);
  const right = user.slice(-1);
  return `${left}•••••${right}@${domain}`;
};
const maskPhone = (phone) => {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return "••••";
  return `••••••${digits.slice(-2)}`;
};

/* ------------------------------ component ----------------------------- */
export default function PropertyDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isLoaded } = useGoogleMapsLoader();

  // data
  const [property, setProperty] = useState(null);
  const [userId, setUserId] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // likes
  const [likesCount, setLikesCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);

  // gallery
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  // map state
  const [originLL, setOriginLL] = useState(null);
  const [campusLL, setCampusLL] = useState(null);
  const [directions, setDirections] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // contact gating status (queried from server)
  const [contactStatus, setContactStatus] = useState({
    approved: false,
    pending: false,
    phone: "",
    email: "",
    supported: true,
  });

  // request modal state (pure UI)
  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  /** 'idle' | 'sent' | 'pending' | 'approved' | 'self' | 'error' */
  const [reqState, setReqState] = useState("idle");
  const [reqError, setReqError] = useState("");

  /* ---------------------------- custom markers --------------------------- */
  const PROPERTY_ICON = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      url:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2f64ff"/>
                <stop offset="1" stop-color="#22d3ee"/>
              </linearGradient>
              <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/>
              </filter>
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
            <defs>
              <filter id="s2" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/>
              </filter>
            </defs>
            <path d="M20 3c6.6 0 12 5.4 12 12 0 8.8-12 22-12 22S8 23.8 8 15c0-6.6 5.4-12 12-12z" fill="#EF4444" filter="url(#s2)"/>
            <circle cx="20" cy="15" r="5" fill="white"/>
          </svg>`
        ),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 38),
    };
  }, [isLoaded]);

  /* ------------------------------ loaders ------------------------------- */
  const fetchUser = async () => {
    try {
      const r = await axiosInstance.get("/get-user");
      if (r?.data?.user?._id) setUserId(r.data.user._id);
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
      setLikesCount(Array.isArray(p.likes) ? p.likes.length : 0);
      setLoading(false);
    } catch {
      setErr("Unable to load property.");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [fetchProperty]);

  // likedByUser only after both user & property known
  useEffect(() => {
    if (!property || !userId) return;
    const liked =
      Array.isArray(property.likes) &&
      property.likes.some((uid) => String(uid) === String(userId));
    setLikedByUser(liked);
    setLikesCount(Array.isArray(property.likes) ? property.likes.length : 0);
  }, [property, userId]);

  // load/refresh gated contact status
  const loadContactStatus = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/contact-access/status/${id}`);
      if (r?.data) {
        setContactStatus({
          approved: !!r.data.approved,
          pending: !!r.data.pending,
          phone: r.data.phone || "",
          email: r.data.email || "",
          supported: true,
        });
      }
    } catch {
      setContactStatus((s) => ({ ...s, supported: false }));
    }
  }, [id]);

  useEffect(() => {
    loadContactStatus();
  }, [loadContactStatus]);

  // real-time: host approved/denied
  useEffect(() => {
    let s;
    (async () => {
      try {
        const { io } = await import("socket.io-client");
        const socketURL = (
          import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
          import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
          import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
          (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')
        );
        s = io(socketURL, { transports: ["websocket"], withCredentials: true });
        if (userId) s.emit("registerUser", userId);
        s.on("contact_request:updated", (payload) => {
          if (payload?.propertyId === id) loadContactStatus();
        });
      } catch {}
    })();
    return () => {
      if (s) s.disconnect();
    };
  }, [userId, id, loadContactStatus]);

  /* -------------------------- maps: geocode & route -------------------------- */
  useEffect(() => {
    if (!isLoaded || !property) return;

    const propAddr = addressLine(property.address);
    const campusQuery =
      property.campusName || "NIU College of Business, Barsema Hall, DeKalb, IL 60115";

    (async () => {
      try {
        const [o, d] = await Promise.all([
          propAddr ? geocode(propAddr) : Promise.resolve(null),
          geocode(campusQuery).catch(() =>
            geocode("Northern Illinois University, DeKalb, IL 60115")
          ),
        ]);

        if (o) setOriginLL(o);
        if (d) setCampusLL(d);

        if (o && d) {
          const svc = new window.google.maps.DirectionsService();
          svc.route(
            { origin: o, destination: d, travelMode: window.google.maps.TravelMode.DRIVING },
            (res, status) => {
              if (status === "OK") setDirections(res);
            }
          );
        }
      } catch {}
    })();
  }, [isLoaded, property]);

  /* ------------------------------ actions -------------------------------- */
  const toggleLike = async () => {
    const next = !likedByUser;
    setLikedByUser(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const r = await axiosInstance.put(`/property/${id}/like`);
      if (typeof r.data?.likes === "number") setLikesCount(r.data.likes);
      if (typeof r.data?.liked === "boolean") setLikedByUser(r.data.liked);
    } catch {
      setLikedByUser(!next);
      setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  };

  const startDM = async () => {
    try {
      const r = await axiosInstance.post("/conversations/initiate", {
        receiverId: property?.userId?._id || property?.userId,
      });
      if (r.data?.success) nav(`/messaging/${r.data.conversationId}`);
    } catch {}
  };

  // ---- request flow (handles self/already paths) ----
  const requestContact = async () => {
    setRequesting(true);
    setReqError("");
    try {
      const r = await axiosInstance.post("/contact-access/request", { propertyId: id });
      const d = r?.data || {};
      if (d.self) {
        setReqState("self");
        return;
      }
      if (d.already) {
        if (d.approved) {
          setContactStatus((s) => ({ ...s, approved: true, pending: false }));
          setReqState("approved");
        } else if (d.pending) {
          setContactStatus((s) => ({ ...s, pending: true, approved: false }));
          setReqState("pending");
        } else setReqState("sent");
        return;
      }
      if (d.pending || r.status === 201) {
        setContactStatus((s) => ({ ...s, pending: true, approved: false }));
        setReqState("sent");
        return;
      }
      setReqState("sent");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) setReqError("Please sign in to request contact details.");
      else if (code === 404) setReqError("Listing not found.");
      else setReqError("We couldn’t send the request right now.");
      setReqState("error");
    } finally {
      setRequesting(false);
    }
  };

  /* ------------------------------ render --------------------------------- */
  if (loading)
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14">Loading…</div>
      </div>
    );
  if (err)
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14 text-red-400">{err}</div>
      </div>
    );

  const contact = property.contactInfo || {};
  const imgs = Array.isArray(property.images) ? property.images : [];

  const ownerId = String(property?.userId?._id || property?.userId || "");
  const me = String(userId || "");
  const isOwner = ownerId && me && ownerId === me;

  const canShowContact = isOwner
    ? true
    : contactStatus.supported && contactStatus.approved;
  const isPending =
    !isOwner && contactStatus.supported && contactStatus.pending && !contactStatus.approved;

  const phoneDisplay = canShowContact
    ? contactStatus.phone || contact.phone || "—"
    : maskPhone(contact.phone);
  const emailDisplay = canShowContact
    ? contactStatus.email || contact.email || "—"
    : maskEmail(contact.email);

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <div className="container mx-auto py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT: gallery */}
          <div className="flex flex-col space-y-4">
            {imgs.length ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <img
                    src={imgs[0]}
                    alt="Main"
                    className="h-auto w-full cursor-pointer rounded-lg"
                    onClick={() => {
                      setIdx(0);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
                {imgs.length > 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {imgs.slice(1).map((src, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                        <img
                          src={src}
                          alt={`Thumb ${i + 2}`}
                          className="h-auto w-full cursor-pointer rounded-lg"
                          onClick={() => {
                            setIdx(i + 1);
                            setIsModalOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <img src={default_property_image} alt="Default" className="rounded-lg" />
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">{property.title}</h1>
            <p className="text-2xl font-semibold text-white/90">{`USD $${money(property.price)}`}</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Like Button */}
              <div className="flex items-center gap-3">
                <button
                  className={`grid h-12 w-12 place-items-center rounded-full transition ${
                    likedByUser ? "bg-rose-500" : "bg-white/10 hover:bg-white/15"
                  }`}
                  onClick={toggleLike}
                  title="Like this property"
                >
                  {likedByUser ? <AiFillHeart className="text-white text-lg" /> : <AiOutlineHeart className="text-rose-400 text-lg" />}
                </button>
                <span className="text-white/70 font-medium">
                  {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                </span>
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  className="group flex-1 sm:flex-none px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
                  onClick={startDM}
                >
                  <FaEnvelope className="text-sm group-hover:scale-110 transition-transform duration-300" />
                  Message Host
                </button>

                {!isOwner && !canShowContact && (
                  isPending ? (
                    <div className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 text-center font-medium animate-pulse">
                      ⏳ Contact Request Pending
                    </div>
                  ) : (
                    <button
                      className="group flex-1 sm:flex-none px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                      onClick={() => {
                        setReqState("idle");
                        setRequestOpen(true);
                      }}
                    >
                      <FaEnvelope className="text-sm group-hover:scale-110 transition-transform duration-300" />
                      Request Contact Info
                    </button>
                  )
                )}
              </div>
            </div>

            {/* facts */}
            <div className="space-y-2 text-lg text-white/80">
              <p>
                <strong className="text-white/90">Available:</strong>{" "}
                <span
                  className={`text-xl ${
                    property.availabilityStatus === "available" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {property.availabilityStatus === "available" ? "Yes" : "No"}
                </span>
              </p>
              <p>
                <strong className="text-white/90">Location:</strong>{" "}
                <span className="text-white/70">{addressLine(property.address) || "N/A"}</span>
              </p>
              <p>
                <strong className="text-white/90">Distance from University:</strong>{" "}
                <span className="text-white/70">{property.distanceFromUniversity || "N/A"} miles</span>
              </p>
              <p>
                <strong className="text-white/90">Bedrooms:</strong>{" "}
                <span className="text-white/70">{property.bedrooms || "N/A"}</span>
              </p>
              <p>
                <strong className="text-white/90">Bathrooms:</strong>{" "}
                <span className="text-white/70">{property.bathrooms || "N/A"}</span>
              </p>

              {/* Contact Section */}
              <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Contact Information</h3>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-xs font-medium text-emerald-300">Privacy Protected</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Host Name</p>
                      <p className="text-white font-medium">
                        {property?.userId?.firstName || contact.name || "—"} {property?.userId?.lastName || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <FaWhatsapp className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Phone</p>
                      <p className="text-white font-medium">{phoneDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <FaEnvelope className="text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Email</p>
                      <p className="text-white font-medium">{emailDisplay}</p>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">🔒</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Privacy Protected</p>
                      <p className="text-xs text-blue-300/80 mt-1">
                        Contact information is only shared with approved users to ensure your safety and prevent spam.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== MAP ====== */}
              <div className="relative mt-8">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={MAP_STYLE}
                    center={originLL || campusLL || INITIAL_CENTER}
                    zoom={originLL ? 14 : 12}
                    options={MAP_OPTIONS}
                  >
                    {directions && (
                      <DirectionsRenderer
                        directions={directions}
                        options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#2f64ff", strokeWeight: 6 } }}
                      />
                    )}

                    {originLL && (
                      <Marker position={originLL} icon={PROPERTY_ICON} onClick={() => setShowInfo((s) => !s)} />
                    )}
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

                {(originLL || campusLL) && (
                  <div className="mt-3">
                    <a
                      className="inline-block rounded-md bg-[#2f64ff] px-3 py-2 text-white hover:bg-[#2958e3]"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                        `${originLL?.lat},${originLL?.lng}`
                      )}&destination=${encodeURIComponent(`${campusLL?.lat},${campusLL?.lng}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
              {/* ====== /MAP ====== */}
            </div>
          </div>
        </div>
      </div>

      {/* gallery modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <button className="absolute right-5 top-5 text-white" onClick={() => setIsModalOpen(false)}>
            <MdClose size={35} />
          </button>
          <div className="relative w-11/12 max-w-5xl md:w-2/3">
            <img src={imgs[idx]} alt={`Image ${idx + 1}`} className="h-auto w-full rounded-lg shadow-lg" />
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setIdx((i) => (i === 0 ? imgs.length - 1 : i - 1))}
            >
              <MdChevronLeft size={35} />
            </button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setIdx((i) => (i === imgs.length - 1 ? 0 : i + 1))}
            >
              <MdChevronRight size={35} />
            </button>
          </div>
        </div>
      )}

      {/* request contact modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 text-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-in zoom-in-50 duration-700 delay-200 shadow-lg shadow-blue-500/25">
                <FaEnvelope className="text-2xl text-white animate-in bounce-in duration-1000 delay-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-top-2 duration-700 delay-300">Request Contact Info</h3>
              <p className="text-white/70 text-sm animate-in fade-in slide-in-from-top-2 duration-700 delay-400">Get direct contact details for this property</p>
            </div>

            {/* Content based on state */}
            {reqState === "idle" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
                <div className="text-center">
                  <p className="text-white/80 mb-4">
                    To protect your privacy and safety, contact information is only shared with approved users.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 animate-in slide-in-from-bottom-1 duration-700 delay-600">
                    <p className="text-blue-300 text-sm font-medium">
                      The host will be notified and can approve your request
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reqState === "self" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-green-300 font-medium">You own this property</p>
                <p className="text-white/70 text-sm mt-2">No need to request contact information</p>
              </div>
            )}

            {reqState === "pending" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-yellow-300 font-medium">Request Pending</p>
                <p className="text-white/70 text-sm mt-2">The host will be notified and you'll see contact details once approved</p>
              </div>
            )}

            {reqState === "approved" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-green-300 font-medium">Request Approved!</p>
                <p className="text-white/70 text-sm mt-2">Contact information is now visible above</p>
              </div>
            )}

            {reqState === "sent" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">📤</span>
                </div>
                <p className="text-green-300 font-medium">Request Sent!</p>
                <p className="text-white/70 text-sm mt-2">The host has been notified. You'll see contact details once they approve</p>
              </div>
            )}

            {reqState === "error" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-red-300 font-medium">Request Failed</p>
                <p className="text-white/70 text-sm mt-2">
                  {reqError || "Please try again or use in-app messaging"}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700">
              {(reqState === "idle" || reqState === "error") && (
                <button
                  type="button"
                  disabled={requesting}
                  onClick={requestContact}
                  className="group relative w-full py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  <span className="relative z-10">
                    {requesting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="animate-pulse">Sending Request...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Send Request</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                    )}
                  </span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="w-full py-3 text-white/70 hover:text-white font-medium transition-all duration-300 hover:bg-white/5 rounded-xl hover:scale-[1.01]"
              >
                {reqState === "idle" || reqState === "error" ? "Cancel" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
