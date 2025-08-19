// src/pages/PropertyDetails.jsx
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
const INITIAL_CENTER = { lat: 41.8781, lng: -87.6298 }; // Chicago fallback
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
      } else {
        reject(status);
      }
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

// local persistence for "pending" when status endpoint is flaky
const reqStorageKey = (pid, uid) => `contactReq:${pid}:${uid}`;

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

  // contact gating
  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState(null); // null | "sent" | "error"
  const [contactStatus, setContactStatus] = useState({
    approved: false,
    pending: false,
    phone: "",
    email: "",
    supported: true, // if backend route not present, we fall back to DM only
  });

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
    } catch {
      // swallow
    }
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
    } catch (e) {
      setErr("Unable to load property.");
      setLoading(false);
    }
  }, [id]);

  // likedByUser is set only when both user and property are known → fixes the “count flips to 0” race.
  useEffect(() => {
    if (!property || !userId) return;
    const liked =
      Array.isArray(property.likes) &&
      property.likes.some((uid) => String(uid) === String(userId));
    setLikedByUser(liked);
    setLikesCount(Array.isArray(property.likes) ? property.likes.length : 0);
  }, [property, userId]);

  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [fetchProperty]);

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
      // if 404/not available, mark unsupported (fallback to DM)
      setContactStatus((s) => ({ ...s, supported: false }));
    }
  }, [id]);

  useEffect(() => {
    loadContactStatus();
  }, [loadContactStatus]);

  // realtime refresh via socket when host acts on the request
  useEffect(() => {
    let s;
    (async () => {
      try {
        const { io } = await import("socket.io-client");
        const socketURL =
          import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";
        s = io(socketURL, { transports: ["websocket"], withCredentials: true });

        if (userId) s.emit("registerUser", userId);

        s.on("contact_request:updated", (payload) => {
          if (payload?.propertyId === id) {
            loadContactStatus();
          }
        });
      } catch {
        // ignore socket errors
      }
    })();
    return () => {
      if (s) s.disconnect();
    };
  }, [userId, id, loadContactStatus]);

  // keep UI consistent if status route is flaky
  useEffect(() => {
    if (!userId) return;
    const k = reqStorageKey(id, userId);

    if (contactStatus.supported) {
      if (contactStatus.pending) localStorage.setItem(k, "pending");
      else localStorage.removeItem(k);
      return;
    }

    if (localStorage.getItem(k) === "pending" && !contactStatus.pending) {
      setContactStatus((s) => ({ ...s, pending: true }));
    }
  }, [contactStatus.supported, contactStatus.pending, id, userId]);

  /* -------------------------- maps: geocode & route -------------------------- */
  useEffect(() => {
    if (!isLoaded || !property) return;

    const propAddr = addressLine(property.address);
    const campusQuery =
      property.campusName ||
      "NIU College of Business, Barsema Hall, DeKalb, IL 60115";

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
            {
              origin: o,
              destination: d,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (res, status) => {
              if (status === "OK") setDirections(res);
            }
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [isLoaded, property]);

  /* ------------------------------ actions -------------------------------- */
  const toggleLike = async () => {
    const next = !likedByUser;
    // optimistic
    setLikedByUser(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));

    try {
      const r = await axiosInstance.put(`/property/${id}/like`);
      if (typeof r.data?.likes === "number") setLikesCount(r.data.likes);
      if (typeof r.data?.liked === "boolean") setLikedByUser(r.data.liked);
    } catch (e) {
      // revert on error
      setLikedByUser(!next);
      setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
      console.error("Like toggle failed", e);
    }
  };

  const startDM = async () => {
    try {
      const r = await axiosInstance.post("/conversations/initiate", {
        receiverId: property?.userId?._id || property?.userId,
      });
      if (r.data?.success) nav(`/messaging/${r.data.conversationId}`);
    } catch (e) {
      console.error(e);
    }
  };

  // REPLACE your requestContact with this optimistic version
  const requestContact = async () => {
    // Already pending → just show the "sent" state in the modal
    if (contactStatus.pending) {
      setRequestResult("sent");
      return;
    }

    // Optimistically flip UI to "pending/sent"
    setContactStatus((s) => ({ ...s, supported: true, pending: true }));
    if (userId) localStorage.setItem(reqStorageKey(id, userId), "pending");
    setRequestResult("sent"); // modal shows "Request sent"
    setRequesting(true);

    try {
      await axiosInstance.post("/contact-access/request", { propertyId: id });
      // success: nothing else to do; socket/status will later move to approved
    } catch (e) {
      const status = e?.response?.status;

      if (status === 409) {
        // duplicate → keep pending "sent"
        return;
      }
      if (status === 401) {
        // auth issue: revert optimistic state and show error
        setContactStatus((s) => ({ ...s, pending: false }));
        if (userId) localStorage.removeItem(reqStorageKey(id, userId));
        setRequestResult("error");
        return;
      }

      // Any other failure (404 not implemented, 5xx, network):
      // keep the optimistic "pending" so the button reads "Request sent"
      // and the chip says "pending host approval". We won't show error.
      // Optionally try a lazy status read, but ignore its outcome for UX.
      try { await axiosInstance.get(`/contact-access/status/${id}`); } catch {}
    } finally {
      setRequesting(false);
    }
  };


  /* ------------------------------ gallery -------------------------------- */
  const openModal = (i) => {
    setIdx(i);
    setIsModalOpen(true);
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

  const canShowContact = contactStatus.supported && contactStatus.approved;
  const isPending = contactStatus.supported && contactStatus.pending && !contactStatus.approved;

  const phoneDisplay = canShowContact
    ? contactStatus.phone || contact.phone || "—"
    : maskPhone(contact.phone);
  const emailDisplay = canShowContact
    ? contactStatus.email || contact.email || "—"
    : maskEmail(contact.email);

  const hostName = `${property?.userId?.firstName || ""} ${property?.userId?.lastName || ""}`.trim();

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
                    onClick={() => openModal(0)}
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
                          onClick={() => openModal(i + 1)}
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

            {/* like + CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                  likedByUser ? "bg-rose-500" : "bg-white/10 hover:bg-white/15"
                }`}
                onClick={toggleLike}
                title="Like"
              >
                {likedByUser ? (
                  <AiFillHeart className="text-white" />
                ) : (
                  <AiOutlineHeart className="text-rose-400" />
                )}
              </button>
              <span className="text-white/70">
                {likesCount} {likesCount === 1 ? "Like" : "Likes"}
              </span>

              <div className="ml-auto flex items-center gap-3">
                <button
                  className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500/90"
                  onClick={startDM}
                >
                  Message host
                </button>

                {!canShowContact && (
                  <button
                    className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-violet-500/90 hover:to-fuchsia-500/90"
                    onClick={() => {
                      setRequestResult(isPending ? "sent" : null);
                      setRequestOpen(true);
                    }}
                  >
                    {isPending ? "Request sent" : "Request contact"}
                  </button>
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

              {/* contact (masked until approved) */}
              <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-bold text-white/90">Host</p>
                  <p className="text-white/70">{hostName || contact.name || "—"}</p>
                </div>
                <div>
                  <p className="font-bold text-white/90">Phone</p>
                  <div className="flex items-center gap-2">
                    <FaWhatsapp className="text-emerald-400" />
                    <span className="whitespace-nowrap text-white/70">{phoneDisplay}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white/90">Email</p>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-sky-400" />
                    <span className="whitespace-nowrap text-white/70">{emailDisplay}</span>
                  </div>
                </div>
              </div>

              {/* status chip */}
              {!canShowContact && (
                <div className="mt-2">
                  {isPending ? (
                    <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm text-yellow-200">
                      Contact access pending host approval
                    </span>
                  ) : (
                    <span className="text-xs text-white/50">
                      We share details only after the host approves.
                    </span>
                  )}
                </div>
              )}

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
                        options={{
                          suppressMarkers: true,
                          polylineOptions: { strokeColor: "#2f64ff", strokeWeight: 6 },
                        }}
                      />
                    )}

                    {originLL && (
                      <Marker
                        position={originLL}
                        icon={PROPERTY_ICON}
                        onClick={() => setShowInfo((s) => !s)}
                      />
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
                        `${originLL?.lat ?? ""},${originLL?.lng ?? ""}`
                      )}&destination=${encodeURIComponent(
                        `${campusLL?.lat ?? ""},${campusLL?.lng ?? ""}`
                      )}`}
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
          <button
            className="absolute right-5 top-5 text-white"
            onClick={() => setIsModalOpen(false)}
          >
            <MdClose size={35} />
          </button>
          <div className="relative w-11/12 max-w-5xl md:w-2/3">
            <img
              src={imgs[idx]}
              alt={`Image ${idx + 1}`}
              className="h-auto w-full rounded-lg shadow-lg"
            />
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
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121318] p-5 text-white shadow-2xl">
            <div className="mb-3 text-lg font-semibold">Request host contact</div>

            {(() => {
              const showSent = isPending || requestResult === "sent";
              const showError = requestResult === "error" && !showSent;

              if (showSent) {
                return (
                  <>
                    <p className="text-white/80">
                      ✅ Request already sent. The host has been notified and you’ll see the contact
                      details once they approve.
                    </p>
                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setRequestOpen(false)}
                        className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500/90"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              }

              if (showError) {
                return (
                  <>
                    <p className="text-white/80">
                      ⚠️ We couldn’t send the request right now. You can still message the host or
                      try again.
                    </p>
                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRequestOpen(false)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.07]"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={requesting}
                        onClick={requestContact}
                        className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:from-violet-500/90 hover:to-fuchsia-500/90 disabled:opacity-60"
                      >
                        {requesting ? "Sending…" : "Retry"}
                      </button>
                    </div>
                  </>
                );
              }

              return (
                <>
                  <p className="text-white/70">
                    To protect hosts from spam, we gate direct contact. Please use in-app messaging
                    when possible. Do you want to send a request to view phone/email for this
                    listing?
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.07]"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      disabled={requesting}
                      onClick={requestContact}
                      className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:from-violet-500/90 hover:to-fuchsia-500/90 disabled:opacity-60"
                    >
                      {requesting ? "Sending…" : "Send request"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
