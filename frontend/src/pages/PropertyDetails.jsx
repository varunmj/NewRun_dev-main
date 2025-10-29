import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import { FaWhatsapp } from "react-icons/fa";
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { Phone,Brain, MessageSquare, Mail, MapPin, Route, BedDouble, Bath, Copy, Share2, CheckCircle2, XCircle, Bus, Clock, UserRound, Shield, LockKeyhole, Info, ContactRound } from "lucide-react";
import default_property_image from "../assets/Images/default-property-image.jpg";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";
import IntelligentInsights from "../components/AI/IntelligentInsights";
import { BorderBeam } from "../components/ui/border-beam";

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

  // distance & transit info
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [transitDirections, setTransitDirections] = useState(null);

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

  // Property Manager AI state
  const [showPropertyManagerAI, setShowPropertyManagerAI] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

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
      if (r?.data?.user?._id) {
        setUserId(r.data.userId);
        const previousUserInfo = userInfo;
        setUserInfo(r.data.user);
        
        // Log campus info for debugging (always in dev mode)
        if (import.meta.env.DEV) {
          console.log('📍 User campus data loaded:', {
            campusPlaceId: r.data.user.campusPlaceId,
            campusLabel: r.data.user.campusLabel,
            campusDisplayName: r.data.user.campusDisplayName,
            previousCampusPlaceId: previousUserInfo?.campusPlaceId,
            changed: previousUserInfo?.campusPlaceId !== r.data.user.campusPlaceId
          });
        }
        
        // Force map recalculation if campus data changed
        if (previousUserInfo?.campusPlaceId !== r.data.user.campusPlaceId || 
            previousUserInfo?.campusDisplayName !== r.data.user.campusDisplayName) {
          if (import.meta.env.DEV) {
            console.log('🔄 Campus location changed, map will recalculate...');
          }
        }
      }
    } catch (err) {
      // User might not be logged in, which is OK
      if (import.meta.env.DEV) {
        console.log('User not logged in or error fetching user:', err);
      }
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
    } catch {
      setErr("Unable to load property.");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [fetchProperty]);

  // Refetch user info when profile is updated (listen for storage events or window focus)
  useEffect(() => {
    // Listen for storage events (when profile is updated in another tab/modal)
    const handleStorageChange = (e) => {
      if (e.key === 'profile_updated' || e.key === 'user_profile_updated') {
        if (import.meta.env.DEV) {
          console.log('🔄 Profile updated detected, refetching user info...');
        }
        fetchUser();
      }
    };

    // Listen for window focus (when user comes back from editing profile)
    const handleFocus = () => {
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        fetchUser();
      }, 500);
    };

    // Listen for custom event (if profile modal triggers it)
    const handleProfileUpdate = () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Profile update event received, refetching user info...');
      }
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, []);

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
    // Wait for map to load and property data, but allow userInfo to be null (user might not be logged in)
    if (!isLoaded || !property) return;

    // Clear previous campus location when userInfo changes to force recalculation
    setCampusLL(null);
    setDirections(null);
    setDistanceInfo(null);
    setTransitDirections(null);

    const propAddr = addressLine(property.address);
    
    // Get user's campus location from their profile (prioritize Place ID, then label, then display name)
    const getUserCampusQuery = () => {
      // Only use user's campus location if it exists - no hardcoded fallback
      if (userInfo?.campusPlaceId) {
        if (import.meta.env.DEV) {
          console.log('🗺️ Using campusPlaceId for map:', userInfo.campusPlaceId);
        }
        return { placeId: userInfo.campusPlaceId };
      }
      if (userInfo?.campusLabel) {
        if (import.meta.env.DEV) {
          console.log('🗺️ Using campusLabel for map:', userInfo.campusLabel);
        }
        return userInfo.campusLabel;
      }
      if (userInfo?.campusDisplayName) {
        if (import.meta.env.DEV) {
          console.log('🗺️ Using campusDisplayName for map:', userInfo.campusDisplayName);
        }
        return userInfo.campusDisplayName;
      }
      // If user has no campus set, use property's campus if available, otherwise return null
      if (property.campusName) {
        if (import.meta.env.DEV) {
          console.log('🗺️ Using property.campusName as fallback:', property.campusName);
        }
        return property.campusName;
      }
      // Return null to indicate no campus should be shown
      if (import.meta.env.DEV) {
        console.log('🗺️ No campus location found');
      }
      return null;
    };

    const campusQuery = getUserCampusQuery();
    
    if (import.meta.env.DEV && campusQuery) {
      console.log('🗺️ Campus query resolved to:', campusQuery);
    }
    
    // If no campus query available, only show property location
    if (!campusQuery) {
      if (propAddr) {
        geocode(propAddr).then(o => {
          if (o) setOriginLL(o);
        }).catch(err => console.error('Error geocoding property:', err));
      }
      return;
    }

    (async () => {
      try {
        // Geocode property address
        const o = propAddr ? await geocode(propAddr) : null;
        
        // Geocode user's campus (handle Place ID vs address string)
        let d = null;
        if (typeof campusQuery === 'object' && campusQuery.placeId) {
          if (import.meta.env.DEV) {
            console.log('🗺️ Geocoding campus using Place ID:', campusQuery.placeId);
          }
          // Use Places API for Place ID
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          await new Promise((resolve) => {
            service.getDetails({ placeId: campusQuery.placeId, fields: ['geometry', 'name', 'formatted_address'] }, (place, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                d = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
                if (import.meta.env.DEV) {
                  console.log('🗺️ Place ID resolved to:', {
                    name: place.name,
                    address: place.formatted_address,
                    location: d
                  });
                }
              } else {
                if (import.meta.env.DEV) {
                  console.warn('🗺️ Place ID lookup failed:', status);
                }
              }
              resolve();
            });
          });
          if (!d) {
            if (import.meta.env.DEV) {
              console.log('🗺️ Place ID lookup returned null, trying geocode fallback...');
            }
            d = await geocode(campusQuery.placeId).catch(() => null);
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('🗺️ Geocoding campus using address string:', campusQuery);
          }
          // Geocode the user's campus location string
          d = await geocode(campusQuery).catch((err) => {
            if (import.meta.env.DEV) {
              console.error('🗺️ Error geocoding campus location:', err);
            }
            return null;
          });
          if (d && import.meta.env.DEV) {
            console.log('🗺️ Address geocoded to location:', d);
          }
        }

        if (o) setOriginLL(o);
        if (d) setCampusLL(d);

        if (o && d) {
          const svc = new window.google.maps.DirectionsService();
          
          // Get driving directions
          svc.route(
            { origin: o, destination: d, travelMode: window.google.maps.TravelMode.DRIVING },
            (res, status) => {
              if (status === "OK") {
                setDirections(res);
                // Extract distance and duration
                const route = res.routes[0];
                const leg = route.legs[0];
                setDistanceInfo({
                  driving: {
                    distance: leg.distance.text,
                    distanceValue: leg.distance.value, // meters
                    duration: leg.duration.text,
                    durationValue: leg.duration.value, // seconds
                  }
                });
              }
            }
          );

          // Get transit directions (bus/public transport)
          svc.route(
            { 
              origin: o, 
              destination: d, 
              travelMode: window.google.maps.TravelMode.TRANSIT,
              transitOptions: {
                modes: [window.google.maps.TransitMode.BUS, window.google.maps.TransitMode.RAIL],
                routingPreference: window.google.maps.TransitRoutePreference.LESS_WALKING
              }
            },
            (res, status) => {
              if (status === "OK") {
                setTransitDirections(res);
                const route = res.routes[0];
                const leg = route.legs[0];
                
                // Extract transit line information from steps
                const transitSteps = [];
                leg.steps?.forEach(step => {
                  if (step.transit) {
                    const line = step.transit.line;
                    const transitInfo = {
                      lineName: line?.short_name || line?.name || 'Bus',
                      vehicleType: step.transit.line?.vehicle?.name || 'Bus',
                      departureStop: step.transit.departure_stop?.name || '',
                      arrivalStop: step.transit.arrival_stop?.name || '',
                      numStops: step.transit.num_stops || 0
                    };
                    transitSteps.push(transitInfo);
                  }
                });
                
                // Count transfers
                const numTransfers = Math.max(0, transitSteps.length - 1);
                
                setDistanceInfo(prev => ({
                  ...prev,
                  transit: {
                    distance: leg.distance.text,
                    distanceValue: leg.distance.value,
                    duration: leg.duration.text,
                    durationValue: leg.duration.value,
                    transitLines: transitSteps,
                    numTransfers: numTransfers,
                    summary: transitSteps.map(t => t.lineName).join(' → ')
                  }
                }));
              } else {
                // Transit not available, but that's OK
                if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MAPS) {
                  console.log('Transit directions not available:', status);
                }
              }
            }
          );
        }
      } catch (err) {
        console.error('Error calculating distance:', err);
      }
    })();
  }, [isLoaded, property, userInfo]);

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
      <div 
        className="min-h-screen bg-[#0b0c0f] text-white relative"
        style={{
          backgroundImage: 'url("/assets/gradient-BZl8jpii.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[#0b0c0f]/60 pointer-events-none"></div>
        <div className="relative z-10">
          <Navbar />
          <div className="mx-auto max-w-5xl px-4 py-14">Loading…</div>
        </div>
      </div>
    );
  if (err)
    return (
      <div 
        className="min-h-screen bg-[#0b0c0f] text-white relative"
        style={{
          backgroundImage: 'url("/assets/gradient-BZl8jpii.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[#0b0c0f]/60 pointer-events-none"></div>
        <div className="relative z-10">
          <Navbar />
          <div className="mx-auto max-w-5xl px-4 py-14 text-red-400">{err}</div>
        </div>
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
    <div 
      className="min-h-screen bg-[#0b0c0f] text-white relative"
      style={{
        backgroundImage: 'url("/assets/gradient-BZl8jpii.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle overlay to ensure content readability */}
      <div className="absolute inset-0 bg-[#0b0c0f]/60 pointer-events-none"></div>
      
      {/* Navbar - fixed at top with high z-index */}
      <div className="fixed top-0 left-0 right-0 z-[100] pt-4">
        <Navbar />
      </div>

      {/* Main content with padding to account for navbar */}
      <div className="container mx-auto py-8 lg:py-10 pt-24 relative z-10">
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
          <div className="space-y-6 relative lg:pl-8">
            {/* Vertical fading blue line separator - only visible on lg screens and above */}
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/0 via-blue-500/60 to-blue-500/0"></div>
            <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold text-white">{property.title}</h1>
              {property.availabilityStatus === "available" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-emerald-300 font-medium">Available</span>
                  <CheckCircle2 size={16} className="text-emerald-300" />
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-sm text-rose-300 font-medium">Not Available</span>
                  <XCircle size={16} className="text-rose-300" />
                </div>
              )}

              {(property.bedrooms != null || property.bathrooms != null) && (
                <div className="flex items-center gap-2">
                  {property.bedrooms != null && (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/5 ring-1 ring-white/10 text-white/90">
                      <BedDouble size={14} className="text-white/70" />
                      <span className="text-xs font-semibold">{property.bedrooms} Beds</span>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/5 ring-1 ring-white/10 text-white/90">
                      <Bath size={14} className="text-white/70" />
                      <span className="text-xs font-semibold">{property.bathrooms} Baths</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                {/* Ask Property Manager AI */}
                <button
                  className="relative px-6 py-3 rounded-lg font-semibold text-sm text-white bg-black/50 hover:bg-black/70 hover:text-blue-100 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 backdrop-blur-sm overflow-hidden"
                  onClick={() => setShowPropertyManagerAI(true)}
                >
                  {/* <Brain size={18} /> */}
                  NewRun AI
                  <BorderBeam 
                    size={120}
                    duration={4}
                    colorFrom="#2F64FF"
                    colorTo="#00D4FF"
                    borderWidth={2}
                  />
                </button>

                {/* Message Host */}
                <button
                  className="px-6 py-3 rounded-lg font-semibold text-sm text-white border border-white/30 bg-transparent hover:border-blue-100 hover:text-blue-100 hover:-translate-y-0.5 transition-all relative overflow-hidden flex items-center justify-center gap-2"
                  onClick={startDM}
                >
                  {/* <MessageSquare size={18} /> */}
                  Message Host
                </button>

                {!isOwner && !canShowContact && (
                  isPending ? (
                    <div className="px-6 py-3 rounded-lg font-semibold text-sm text-gray-200 border border-gray-400/30 bg-gray-500/10 backdrop-blur-sm pending-button flex items-center justify-center gap-2">
                      {/* <Clock size={18} className="text-gray-300" /> */}
                      <span>Request Pending</span>
                    </div>
                  ) : (
                    <button
                      className="px-6 py-3 rounded-lg font-semibold text-sm bg-gradient-to-tr from-blue-300 to-blue-100 text-slate-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/30 transition-all relative overflow-hidden flex items-center justify-center gap-2"
                      onClick={() => {
                        setReqState("idle");
                        setRequestOpen(true);
                      }}
                    >
                      {/* <Mail size={18} /> */}
                      Request Contact Info
                    </button>
                  )
                )}
              </div>
            </div>

            {/* facts */}
            <div className="space-y-4">
              {/* Location + Copy/Share */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-rose-600" />
                  <div className="text-white/85">
                    <span className="font-semibold">Location</span>
                    <span className="mx-2 text-white/40">•</span>
                    <span className="text-white/80">{addressLine(property.address) || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Copy address"
                    onClick={() => navigator.clipboard.writeText(addressLine(property.address) || "")}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors"
                  >
                    <Copy size={16} className="text-white/80" />
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(property.address) || "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors"
                    title="Open in Google Maps"
                  >
                    <Share2 size={16} className="text-white/80" />
                  </a>
                </div>
              </div>

              {/* Distance - Driving & Transit side by side */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Driving Route */}
                <div className="flex-1 flex items-center justify-between gap-3 p-3 rounded-lg bg-transparent backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <Route size={19} className="text-blue-750 flex-shrink-0" />
                    <div className="text-white/85 min-w-0">
                      <span className="font-semibold text-sm">
                        {userInfo?.campusLabel || userInfo?.campusDisplayName 
                          ? `Distance to Your Campus` 
                          : `Distance from University`}
                </span>
                      <span className="mx-2 text-white/40">•</span>
                      {distanceInfo?.driving ? (
                        <span className="text-white/80 text-sm">
                          {distanceInfo.driving.distance} ({distanceInfo.driving.duration})
                        </span>
                      ) : (
                        <span className="text-white/80 text-sm">
                          {property.distanceFromUniversity || "N/A"} {property.distanceFromUniversity ? "miles" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {(originLL && campusLL) && (
                    <a
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 border border-blue-500/30 transition-colors flex-shrink-0"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${originLL.lat},${originLL.lng}`)}&destination=${encodeURIComponent(`${campusLL.lat},${campusLL.lng}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open route
                      <Route size={12} />
                    </a>
                  )}
                </div>
                
                {/* Dotted vertical separator */}
                {distanceInfo?.transit && (
                  <div className="hidden sm:block w-px self-stretch dotted-separator"></div>
                )}
                
                {/* Transit/Bus Route Info */}
                {distanceInfo?.transit && (
                  <div className="flex-1 flex items-center justify-between gap-3 p-3 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
                    <Bus size={19} className="text-blue-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white/85">Bus/Transit Route</span>
                        {distanceInfo.transit.numTransfers > 0 && (
                          <span className="text-xs text-white/50">• {distanceInfo.transit.numTransfers} transfer{distanceInfo.transit.numTransfers > 1 ? 's' : ''}</span>
                        )}
                  </div>
                      <div className="text-sm font-semibold text-white/90 mb-1">
                        {distanceInfo.transit.duration} • {distanceInfo.transit.distance}
                      </div>
                      {distanceInfo.transit.transitLines?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {distanceInfo.transit.transitLines.map((line, i) => (
                            <div key={i} className="inline-flex items-center gap-1.5 rounded px-2 py-1 bg-white/5 border border-white/10">
                              <span className="text-[10px] font-bold text-white/60 uppercase">{line.vehicleType}</span>
                              <span className="text-xs font-semibold text-white/90">{line.lineName}</span>
                              {i < distanceInfo.transit.transitLines.length - 1 && (
                                <span className="text-xs text-white/40 mx-1">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {(originLL && campusLL) && (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/10 text-white/90 hover:bg-white/15 border border-white/20 transition-colors flex-shrink-0"
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${originLL.lat},${originLL.lng}`)}&destination=${encodeURIComponent(`${campusLL.lat},${campusLL.lng}`)}&travelmode=transit`}
                        target="_blank"
                        rel="noreferrer"
                        title="View full transit route in Google Maps"
                      >
                        View route
                      </a>
                    )}
                  </div>
                )}
                </div>
                
              {/* Beds/Baths moved next to title */}
                    </div>

            {/* Contact Section */}
            <div className="mt-8 p-6 edge-blend" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
                    <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent tracking-tight">
                      Wanna connect with the host?
                    </h3>
                    <p className="text-xs text-white/50 font-medium mt-0.5">Learn the contact details of the host and use it to connect with them to know more about the rent/room details.</p>
                  </div>
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 grid place-items-center transition-all duration-300 hover:scale-110"
                      title="Privacy information"
                    >
                      <Info size={16} className="text-white/60 group-hover:text-white/90" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none overflow-hidden" style={{
                      background: 'linear-gradient(135deg, #050505 0%, #000000 50%, #080808 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.9)'
                    }}>
                      <div className="absolute top-0 left-0 right-0 h-1/2 opacity-20" style={{
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%)'
                      }}></div>
                      <p className="text-xs text-white/90 leading-relaxed relative z-10">
                        Contact information is only shared with approved users to ensure your safety and prevent spam.
                      </p>
                      <div className="absolute -top-1 right-4 w-2 h-2 rotate-45" style={{
                        background: 'linear-gradient(135deg, #050505 0%, #000000 50%, #080808 100%)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}></div>
                    </div>
                    </div>
                  </div>

                <div className="space-y-3 relative z-10">
                  {/* Host Name - Full Row */}
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-emerald-500/30 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-white/5 transition-all duration-300 cursor-default">
                    <div className="relative w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-all duration-300" style={{
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #2a2a2a 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.8)'
                    }}>
                      <UserRound size={18} className="text-white/90 relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.3))' }} />
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)'
                      }}></div>
                      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl opacity-30" style={{
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)'
                      }}></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white/60 mb-0.5 uppercase tracking-wide">Host Name</p>
                      <p className="text-sm font-semibold text-white truncate">
                        {property?.userId?.firstName || contact.name || "—"} {property?.userId?.lastName || ""}
                      </p>
                    </div>
                  </div>

                  {/* Phone & Email - Two Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phone */}
                    <div className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-emerald-500/30 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-white/5 transition-all duration-300 cursor-default">
                      <div className="relative w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-all duration-300" style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #2a2a2a 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.8)'
                      }}>
                        <Phone size={18} className="text-white/90 relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.3))' }} />
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)'
                        }}></div>
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl opacity-30" style={{
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)'
                        }}></div>
                    </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white/60 mb-0.5 uppercase tracking-wide">Phone</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{phoneDisplay}</p>
                          {canShowContact && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 flex-shrink-0 hover:scale-105 active:scale-95"
                              onClick={() => {
                                navigator.clipboard?.writeText(contact?.phone || "");
                              }}
                              title="Copy phone number"
                            >
                              <Copy size={12} className="text-white/80" />
                            </button>
                          )}
                          {!canShowContact && (
                            <div className="hidden xs:flex items-center gap-1 text-[10px] text-white/50">
                              <LockKeyhole size={10} className="text-white/40" />
                            </div>
                          )}
                    </div>
                  </div>
                </div>

                    {/* Email */}
                    <div className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-emerald-500/30 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-white/5 transition-all duration-300 cursor-default">
                      <div className="relative w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-all duration-300" style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #2a2a2a 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.8)'
                      }}>
                        <Mail size={18} className="text-white/90 relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.3))' }} />
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)'
                        }}></div>
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl opacity-30" style={{
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)'
                        }}></div>
                    </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white/60 mb-0.5 uppercase tracking-wide">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{emailDisplay}</p>
                          {canShowContact && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 flex-shrink-0 hover:scale-105 active:scale-95"
                              onClick={() => {
                                navigator.clipboard?.writeText(contact?.email || "");
                              }}
                              title="Copy email"
                            >
                              <Copy size={12} className="text-white/80" />
                            </button>
                          )}
                          {!canShowContact && (
                            <div className="hidden xs:flex items-center gap-1 text-[10px] text-white/50">
                              <LockKeyhole size={10} className="text-white/40" />
                            </div>
                          )}
                        </div>
                      </div>
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
                <Mail className="text-white animate-in bounce-in duration-1000 delay-500" size={32} />
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

      {/* Property Manager AI */}
      <IntelligentInsights
        propertyManagerMode={showPropertyManagerAI}
        property={property}
        userInfo={userInfo}
        onPropertyManagerClose={() => setShowPropertyManagerAI(false)}
      />
    </div>
  );
}
