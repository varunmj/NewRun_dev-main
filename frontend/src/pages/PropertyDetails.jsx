// src/pages/PropertyDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { GoogleMap, Marker, InfoWindow, Polyline } from "@react-google-maps/api";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import default_property_image from "../assets/Images/default-property-image.jpg";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";

const mapContainerStyle = { width: "100%", height: "400px" };
const initialCenter = { lat: 41.8781, lng: -87.6298 }; // Chicago fallback

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map state
  const [center, setCenter] = useState(initialCenter);
  const [markerPos, setMarkerPos] = useState(null);
  const [campus, setCampus] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Gallery modal
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Likes
  const [likesCount, setLikesCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);

  const { isLoaded } = useGoogleMapsLoader();

  /* ----------------------------- helpers ----------------------------- */
  const formatMoney = (n) =>
    typeof n === "number" ? n.toLocaleString("en-US") : String(n || "");

  const formatAddressLine = (addrObj) => {
    if (!addrObj) return "";
    const { street, city, state, zipCode, zip } = addrObj;
    return [street, city, state, zipCode || zip].filter(Boolean).join(", ");
  };

  const geocodePlace = (query, onDone) => {
    if (!window.google?.maps?.Geocoder) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        onDone({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  };

  /* ------------------------------- data ------------------------------ */
  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get("/get-user");
      if (res.data?.user?._id) setUserId(res.data.user._id);
    } catch {
      // ok if not logged in
    }
  };

  const fetchPropertyDetails = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/properties/${id}`);
      if (!res.data?.property) {
        setError("Property not found");
        setLoading(false);
        return;
      }

      const p = res.data.property;
      setProperty(p);
      setLikesCount(p.likes?.length || 0);
      if (userId) setLikedByUser(Boolean(p.likes?.includes(userId)));

      const addrLine = formatAddressLine(p.address);
      if (addrLine && window.google?.maps) {
        geocodePlace(addrLine, (pt) => {
          setCenter(pt);
          setMarkerPos(pt);          // <- explicit marker position
        });
      }

      const uniQuery =
        p?.university ||
        (p?.address?.city && p?.address?.state
          ? `${p.address.city} ${p.address.state} university`
          : null);
      if (uniQuery && window.google?.maps) {
        geocodePlace(uniQuery, setCampus);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching property details:", err);
      setError("An error occurred while fetching property details.");
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    if (property?.likes && userId) {
      setLikedByUser(Boolean(property.likes.includes(userId)));
    }
  }, [property, userId]);

  useEffect(() => {
    fetchUserInfo();
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  /* ------------------------------ actions ---------------------------- */
  const initiateConversation = async () => {
    try {
      const response = await axiosInstance.post("/conversations/initiate", {
        receiverId: property.userId._id,
      });
      if (response.data?.success) {
        navigate(`/messaging/${response.data.conversationId}`);
      }
    } catch (err) {
      console.error("Error initiating conversation:", err);
    }
  };

  const toggleLike = async () => {
    try {
      const response = await axiosInstance.put(`/property/${id}/like`);
      if (typeof response.data?.likes === "number") {
        setLikesCount(response.data.likes);
        setLikedByUser((s) => !s);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  /* ------------------------------ gallery ---------------------------- */
  const openModal = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const showPreviousImage = () =>
    setCurrentImageIndex((i) =>
      i === 0 ? (property?.images?.length || 1) - 1 : i - 1
    );
  const showNextImage = () =>
    setCurrentImageIndex((i) =>
      i === (property?.images?.length || 1) - 1 ? 0 : i + 1
    );

  /* ------------------------------- render ---------------------------- */
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  const address = property.address || {};
  const contactInfo = property.contactInfo || {};
  const images = Array.isArray(property.images) ? property.images : [];

  return (
    <div>
      <Navbar />

      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 gap-8">
          {/* LEFT: gallery */}
          <div className="flex flex-col space-y-4">
            {images.length ? (
              <>
                <div className="bg-white/5 p-4 rounded-lg shadow-lg">
                  <img
                    src={images[0]}
                    alt="Main"
                    className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                    onClick={() => openModal(0)}
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {images.slice(1).map((img, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded-lg shadow-lg">
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 2}`}
                          className="w-full h-auto rounded-lg cursor-pointer"
                          onClick={() => openModal(idx + 1)}
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
            <p className="text-2xl font-semibold text-white/90">{`USD $${formatMoney(
              property.price
            )}`}</p>
            <p className="text-lg text-white/70">{property.description}</p>

            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                className={`p-2 rounded-full transition ${
                  likedByUser ? "bg-red-500" : "bg-white/20"
                }`}
                onClick={toggleLike}
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

              {/* Contact owner */}
              <button
                className="ml-auto bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-neutral-800 transition"
                onClick={initiateConversation}
              >
                Contact - {contactInfo.name || "Owner"}
              </button>
            </div>

            <div className="text-lg text-white/70 mt-4">
              <div className="space-y-2">
                <p>
                  <strong className="text-white/90">Available:</strong>{" "}
                  <span className="text-emerald-400 text-xl">
                    {property.availabilityStatus === "available" ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  <strong className="text-white/90">Location:</strong>{" "}
                  <span className="text-white/70">
                    {formatAddressLine(address) || "N/A"}
                  </span>
                </p>
                <p>
                  <strong className="text-white/90">Distance from University:</strong>{" "}
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
              </div>

              {/* Contact information */}
              <div className="flex justify-between items-center gap-8 mt-8">
                <div className="flex-1">
                  <p className="font-bold text-white/90">Contact Name</p>
                  <p className="text-white/70">{contactInfo.name || "N/A"}</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white/90">Contact Phone</p>
                  <div className="flex items-center">
                    <FaWhatsapp className="text-emerald-400 mr-2" size={20} />
                    <p className="text-white/70 whitespace-nowrap">
                      {contactInfo.phone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-bold text-white/90">Contact Email</p>
                  <div className="flex items-center">
                    <FaEnvelope className="text-sky-400 mr-2" size={20} />
                    <p className="text-white/70 whitespace-nowrap">
                      {contactInfo.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-8">
                {isLoaded ? (
                  <>
                    <GoogleMap
                      key={center.lat + "," + center.lng}
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={18}  // <- tighter zoom
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        gestureHandling: "greedy",
                      }}
                    >
                      {/* Property pin (default Google marker) */}
                      {markerPos && (
                        <Marker
                          position={markerPos}
                          onClick={() => setShowInfo((s) => !s)}
                        />
                      )}

                      {showInfo && markerPos && (
                        <InfoWindow
                          position={markerPos}
                          onCloseClick={() => setShowInfo(false)}
                        >
                          <div style={{ minWidth: 180 }}>
                            <div style={{ fontWeight: 600 }}>{property.title}</div>
                            <div>USD ${formatMoney(property.price)}</div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${markerPos.lat},${markerPos.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#2f64ff" }}
                            >
                              Get directions →
                            </a>
                          </div>
                        </InfoWindow>
                      )}

                      {/* Campus pin + dashed line (if available) */}
                      {campus && markerPos && (
                        <>
                          <Marker position={campus} label="Campus" />
                          <Polyline
                            path={[markerPos, campus]}
                            options={{
                              strokeOpacity: 0,
                              icons: [
                                {
                                  icon: {
                                    path: "M 0,-1 0,1",
                                    strokeOpacity: 1,
                                    scale: 3,
                                  },
                                  offset: "0",
                                  repeat: "16px",
                                },
                              ],
                            }}
                          />
                        </>
                      )}
                    </GoogleMap>

                    <div className="mt-3">
                      <a
                        className="inline-block rounded-md bg-[#2f64ff] px-3 py-2 text-white hover:bg-[#2958e3]"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${(markerPos?.lat ?? center.lat)},${(markerPos?.lng ?? center.lng)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </>
                ) : (
                  <p>Loading map...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button className="absolute top-5 right-5 text-white" onClick={closeModal}>
            <MdClose size={35} />
          </button>
          <div className="relative w-11/12 md:w-2/3 max-w-5xl">
            <img
              src={(property.images || [])[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={showPreviousImage}
            >
              <MdChevronLeft size={35} />
            </button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={showNextImage}
            >
              <MdChevronRight size={35} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
