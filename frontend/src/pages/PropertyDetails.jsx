import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import default_property_image from "../assets/Images/default-property-image.jpg";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";

const MAP_STYLE = { width: "100%", height: "420px" };
const INITIAL_CENTER = { lat: 41.8781, lng: -87.6298 }; // Chicago fallback
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// ===== helpers =====
const money = (n) =>
  typeof n === "number" ? n.toLocaleString("en-US") : String(n || "");

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

  // custom markers (created only when API is ready)
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

  // load user & property
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
      setLikesCount(p.likes?.length || 0);
      if (p.likes && userId) setLikedByUser(p.likes.includes(userId));
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

  // compute geocodes → directions
  useEffect(() => {
    if (!isLoaded || !property) return;

    const propAddr = addressLine(property.address);
    // Pick a specific, unambiguous campus string.
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
              else console.warn("Directions failed:", status);
            }
          );
        }
      } catch (e) {
        console.warn("Geocode/Directions error:", e);
      }
    })();
  }, [isLoaded, property]);

  // likes / contact
  const toggleLike = async () => {
    try {
      const r = await axiosInstance.put(`/property/${id}/like`);
      if (typeof r.data?.likes === "number") {
        setLikesCount(r.data.likes);
        setLikedByUser((s) => !s);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startDM = async () => {
    try {
      const r = await axiosInstance.post("/conversations/initiate", {
        receiverId: property.userId._id,
      });
      if (r.data?.success) nav(`/messaging/${r.data.conversationId}`);
    } catch (e) {
      console.error(e);
    }
  };

  // gallery helpers
  const openModal = (i) => {
    setIdx(i);
    setIsModalOpen(true);
  };

  if (loading) return <p>Loading…</p>;
  if (err) return <p className="text-red-400">{err}</p>;

  const contact = property.contactInfo || {};
  const imgs = Array.isArray(property.images) ? property.images : [];

  return (
    <div>
      <Navbar />

      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 gap-8">
          {/* LEFT: gallery */}
          <div className="flex flex-col space-y-4">
            {imgs.length ? (
              <>
                <div className="bg-white/5 p-4 rounded-lg shadow-lg">
                  <img
                    src={imgs[0]}
                    alt="Main"
                    className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                    onClick={() => openModal(0)}
                  />
                </div>
                {imgs.length > 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {imgs.slice(1).map((src, i) => (
                      <div key={i} className="bg-white/5 p-2 rounded-lg">
                        <img
                          src={src}
                          alt={`Thumb ${i + 2}`}
                          className="w-full h-auto rounded-lg cursor-pointer"
                          onClick={() => openModal(i + 1)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/5 p-4 rounded-lg shadow-lg">
                <img
                  src={default_property_image}
                  alt="Default"
                  className="rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{property.title}</h1>
            <p className="text-2xl font-semibold text-white/90">
              {`USD $${money(property.price)}`}
            </p>
            <p className="text-lg text-white/70">{property.description}</p>

            <div className="flex items-center gap-4">
              <button
                className={`p-2 rounded-full transition ${
                  likedByUser ? "bg-red-500" : "bg-white/20"
                }`}
                onClick={toggleLike}
                title="Like"
              >
                {likedByUser ? (
                  <AiFillHeart className="text-white" />
                ) : (
                  <AiOutlineHeart className="text-red-500" />
                )}
              </button>
              <span className="text-white/70">
                {likesCount} {likesCount === 1 ? "Like" : "Likes"}
              </span>

              <button
                className="ml-auto bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-neutral-800 transition"
                onClick={startDM}
              >
                Contact – {contact.name || "Owner"}
              </button>
            </div>

            {/* facts */}
            <div className="text-lg text-white/70 mt-4 space-y-2">
              <p>
                <strong className="text-white/90">Available:</strong>{" "}
                <span className="text-emerald-400 text-xl">
                  {property.availabilityStatus === "available" ? "Yes" : "No"}
                </span>
              </p>
              <p>
                <strong className="text-white/90">Location:</strong>{" "}
                <span className="text-white/70">
                  {addressLine(property.address) || "N/A"}
                </span>
              </p>
              <p>
                <strong className="text-white/90">
                  Distance from University:
                </strong>{" "}
                <span className="text-white/70">
                  {property.distanceFromUniversity || "N/A"} miles
                </span>
              </p>
              <p>
                <strong className="text-white/90">Bedrooms:</strong>{" "}
                <span className="text-white/70">{property.bedrooms || "N/A"}</span>
              </p>
              <p>
                <strong className="text-white/90">Bathrooms:</strong>{" "}
                <span className="text-white/70">{property.bathrooms || "N/A"}</span>
              </p>

              {/* contact */}
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div>
                  <p className="font-bold text-white/90">Contact Name</p>
                  <p className="text-white/70">{contact.name || "N/A"}</p>
                </div>
                <div>
                  <p className="font-bold text-white/90">Contact Phone</p>
                  <div className="flex items-center gap-2">
                    <FaWhatsapp className="text-emerald-400" />
                    <span className="text-white/70 whitespace-nowrap">
                      {contact.phone || "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white/90">Contact Email</p>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-sky-400" />
                    <span className="text-white/70 whitespace-nowrap">
                      {contact.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ====== MAP ====== */}
              <div className="mt-8 relative">
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
                          suppressMarkers: true, // we render custom pins
                          polylineOptions: {
                            strokeColor: "#2f64ff",
                            strokeWeight: 6,
                          },
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
                      <InfoWindow
                        position={originLL}
                        onCloseClick={() => setShowInfo(false)}
                      >
                        <div style={{ minWidth: 180 }}>
                          <div style={{ fontWeight: 600 }}>{property.title}</div>
                          <div>USD ${money(property.price)}</div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <p>Loading map…</p>
                )}

                {(originLL || campusLL) && (
                  <div className="mt-3">
                    <a
                      className="inline-block rounded-md bg-[#2f64ff] px-3 py-2 text-white hover:bg-[#2958e3]"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                        `${originLL?.lat},${originLL?.lng}`
                      )}&destination=${encodeURIComponent(
                        `${campusLL?.lat},${campusLL?.lng}`
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button
            className="absolute top-5 right-5 text-white"
            onClick={() => setIsModalOpen(false)}
          >
            <MdClose size={35} />
          </button>
          <div className="relative w-11/12 md:w-2/3 max-w-5xl">
            <img
              src={imgs[idx]}
              alt={`Image ${idx + 1}`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={() => setIdx((i) => (i === 0 ? imgs.length - 1 : i - 1))}
            >
              <MdChevronLeft size={35} />
            </button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={() => setIdx((i) => (i === imgs.length - 1 ? 0 : i + 1))}
            >
              <MdChevronRight size={35} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
