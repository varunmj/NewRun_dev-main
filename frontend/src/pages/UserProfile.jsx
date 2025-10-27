import React, { useEffect, useRef, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import Navbar from "../components/Navbar/Navbar";
import axiosInstance from "../utils/axiosInstance";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";
import { Autocomplete } from "@react-google-maps/api";
import ProfilePictureUpload from "../components/ProfilePictureUpload/ProfilePictureUpload";
import MatchCard from "../components/ProfileCard/MatchCard";
import EditProfileModal from "../components/EditProfileModal/EditProfileModal";
import { useUserStatus } from "../context/UserStatusContext";
import { getUniversityLogoUrl } from "../utils/clearbitLogo";

import {
  MdWeb,
  MdBrush,
  MdShoppingBag,
  MdDesignServices,
  MdSchool,
  MdWorkOutline,
  MdCheckCircle,
  MdStar,
  MdOutlineAccessTime,
  MdPlace,
  MdOutlineMail,
  MdSchedule,
  MdOutlinePlayCircle,
  MdOutlineBolt,
  MdEdit,
  MdGroups,
  MdSettings,
  MdSupport,
  MdHome,
  MdPeople,
  MdPerson,
  MdCircle, 
  MdAccessTime, 
  MdDoNotDisturb, 
  MdOfflineBolt,
  MdKeyboardArrowDown,
  MdPhotoCamera,
  MdClose
} from "react-icons/md";
import { FaWhatsapp, FaInstagram, FaYoutube, FaDribbble, FaPinterest } from "react-icons/fa6";

/* =====================================================================
   User Status System
   ===================================================================== */
const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away', 
  DO_NOT_DISTURB: 'dnd',
  OFFLINE: 'offline'
};

const STATUS_CONFIG = {
  [USER_STATUS.ONLINE]: {
    label: 'Online',
    icon: MdCircle,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)'
  },
  [USER_STATUS.AWAY]: {
    label: 'Away',
    icon: MdAccessTime,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  [USER_STATUS.DO_NOT_DISTURB]: {
    label: 'Do Not Disturb',
    icon: MdDoNotDisturb,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  [USER_STATUS.OFFLINE]: {
    label: 'Offline',
    icon: MdOfflineBolt,
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)'
  }
};

/* =====================================================================
   University Logo Component
   ===================================================================== */
// Circle uni logo (no text)
function UniversityLogoCircle({ university, size = 56 }) {
  if (!university) return null;
  const url = getUniversityLogoUrl(university);
  if (!url) return null;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-white/10 bg-transparent"
      style={{ width: size, height: size }}
      title={university}
      aria-label={`University: ${university}`}
    >
      <img
        src={url}
        alt=""
        className="h-full w-full rounded-full object-contain"
        style={{ padding: Math.round(size * 0.06) }}
        onError={(e)=>{ e.currentTarget.style.display="none"; }}
      />
    </div>
  );
}

// Synapse Completion Status Component
const SynapseCompletionStatus = ({ onEditPreferences }) => {
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      try {
        const response = await axiosInstance.get('/synapse/completion-status');
        setCompletionData(response.data);
      } catch (error) {
        console.error('Error fetching completion status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionStatus();
  }, []);

  if (loading) return null;

  if (!completionData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <MdGroups className="text-blue-400 text-xl" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Synapse Profile</h3>
            <p className="text-gray-400 text-sm">
              {completionData.completed 
                ? `Completed on ${new Date(completionData.completedAt).toLocaleDateString()}`
                : `${completionData.completionPercentage}% Complete`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completionData.completed ? (
            <div className="flex items-center gap-2 text-green-400">
              <MdCheckCircle className="text-lg" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          ) : (
            <div className="w-16 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionData.completionPercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => window.location.href = completionData.completed ? '/Synapsematches' : '/Synapse'}
          className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {completionData.completed ? 'View Matches' : 'Complete Profile'}
        </button>
        <button
          onClick={onEditPreferences}
          className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <MdSettings className="text-sm" />
          Edit
        </button>
      </div>
    </div>
  );
};

// Normalize and parse "Spring 2023" → { season: "Spring", year: "2023" }
const parseTerm = (term = "") => {
  const m = term.match(/^\s*(spring|summer|fall)\s+(\d{4})\s*$/i);
  if (!m) return { season: "", year: "" };
  const season = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(); // Proper case
  return { season, year: m[2] };
};

// Rolling list of years (e.g., 2010 → current+6)
const buildYearOptions = (from = 2010, to = new Date().getFullYear() + 6) =>
  Array.from({ length: to - from + 1 }, (_, i) => String(to - i));


/* ----------------------- Particle background (repel) ---------------------- */
function ParticleField({
  count = 120,
  maxSpeed = 0.35,
  repelRadius = 120,
  repelStrength = 0.9,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const dpiRef = useRef(1);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const particlesRef = useRef([]);

  const setSize = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { innerWidth: w, innerHeight: h, devicePixelRatio: dpr = 1 } = window;
    dpiRef.current = Math.min(2, dpr);
    c.width = Math.floor(w * dpiRef.current);
    c.height = Math.floor(h * dpiRef.current);
    c.style.width = w + "px";
    c.style.height = h + "px";
  };

  const init = () => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height } = c;
    const rng = (min, max) => min + Math.random() * (max - min);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: rng(0, width),
      y: rng(0, height),
      vx: rng(-maxSpeed, maxSpeed),
      vy: rng(-maxSpeed, maxSpeed),
      size: rng(1.2, 2.8) * dpiRef.current,
      hue: 200 + Math.floor(Math.random() * 80),
    }));
  };

  const tick = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const { width, height } = c;

    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      0,
      width * 0.5,
      height * 0.35,
      Math.max(width, height) * 0.8
    );
    grad.addColorStop(0, "rgba(46, 64, 200, 0.10)");
    grad.addColorStop(1, "rgba(11, 12, 15, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const m = mouse.current;

    for (const p of particlesRef.current) {
      if (m.active) {
        const dx = p.x - m.x * dpiRef.current;
        const dy = p.y - m.y * dpiRef.current;
        const dist = Math.hypot(dx, dy);
        if (dist < repelRadius * dpiRef.current && dist > 0.01) {
          const f =
            (repelRadius * dpiRef.current - dist) /
            (repelRadius * dpiRef.current);
          p.vx += (dx / dist) * f * repelStrength * 0.2;
          p.vy += (dy / dist) * f * repelStrength * 0.2;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, 0.6)`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    setSize();
    init();
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      setSize();
      init();
    };
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [count, maxSpeed, repelRadius, repelStrength]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 particles" />;
}

/* =====================================================================
   Status Selector Component
   ===================================================================== */
function StatusSelector({ currentStatus, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[USER_STATUS.ONLINE];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = (status) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: currentConfig.bgColor,
          borderColor: currentConfig.borderColor,
          color: currentConfig.color
        }}
      >
        <CurrentIcon className="h-4 w-4" />
        <span>{currentConfig.label}</span>
        <MdKeyboardArrowDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#121318] p-2 shadow-xl">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon;
            const isSelected = status === currentStatus;
            
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <Icon 
                  className="h-4 w-4" 
                  style={{ color: config.color }}
                />
                <span className="text-white/90">{config.label}</span>
                {isSelected && (
                  <MdCheckCircle className="ml-auto h-4 w-4 text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Transform user data to match MatchCard format
   ===================================================================== */
// Function to determine academic status from onboarding data
function getAcademicStatus(user) {
  // Use the academicLevel from onboardingData if available
  if (user.onboardingData?.academicLevel) {
    console.log('🎓 Using onboardingData.academicLevel:', user.onboardingData.academicLevel);
    return user.onboardingData.academicLevel;
  }
  
  // Fallback to graduation date logic if onboarding data is not available
  if (!user.graduationDate) return null;
  
  const graduationDate = new Date(user.graduationDate);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const graduationYear = graduationDate.getFullYear();
  
  // If graduation is in the future, they're still a student
  if (graduationYear > currentYear) {
    // Determine if undergrad or graduate based on typical graduation ages
    const age = currentDate.getFullYear() - (new Date(user.dateOfBirth || '2000-01-01')).getFullYear();
    return age <= 22 ? 'undergraduate' : 'graduate';
  }
  
  // If graduated, they're alumni
  return 'alumni';
}

function transformUserToMatchCard(user, userStatus = USER_STATUS.ONLINE) {
  const displayName = (u) => [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "Complete your profile";
  const statusConfig = STATUS_CONFIG[userStatus] || STATUS_CONFIG[USER_STATUS.ONLINE];
  const academicStatus = getAcademicStatus(user);
  
  console.log('🔍 User data for badge:', {
    firstName: user.firstName,
    onboardingData: user.onboardingData,
    academicLevel: user.onboardingData?.academicLevel,
    determinedAcademicStatus: academicStatus
  });
  
  return {
    userId: user.id || user._id || "current-user",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    name: displayName(user),
    avatarUrl: user.avatar || "",
    university: user.university || "",
    graduation: user.graduationDate || "",
    verified: { edu: !!user.university },
    lastActive: new Date().toISOString(),
    distanceMi: 0, // Current user
    budget: null, // Could be added to user profile
    keyTraits: [],
    languages: [],
    petsOk: false,
    sleepStyle: "",
    matchScore: 100, // Perfect match for self
    reasons: [
      { type: "positive", text: "This is your profile" },
      { type: "positive", text: "Complete your information" },
      { type: "positive", text: "Find your perfect roommate match" }
    ],
    synapse: {},
    // Add custom props for self-profile
    isSelfProfile: true,
    contactText: "Edit Profile",
    // Status information
    userStatus: userStatus,
    statusLabel: statusConfig.label,
    statusColor: statusConfig.color,
    // Academic status
    academicStatus: academicStatus
  };
}

/* ----------------------------- tiny UI atoms ----------------------------- */
const Shell = ({ className = "", children }) => (
  <div
    className={
      "rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] " +
      className
    }
  >
    {children}
  </div>
);

const SectionLabel = ({ icon: Icon, children }) => (
  <div className="mb-2 flex items-center gap-2 text-xs text-white/60">
    {Icon && <Icon className="h-4 w-4 text-violet-300/90" />}
    <span className="tracking-wide">{children}</span>
  </div>
);

const Chip = ({ icon: Icon, text, onClick, isActionable = false }) => (
  <div 
    className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/85 ${
      isActionable 
        ? 'bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors' 
        : 'bg-white/[0.04]'
    }`}
    onClick={onClick}
  >
    {Icon && <Icon className="h-4 w-4 text-violet-300/90" />}
    <span>{text || "—"}</span>
  </div>
);

const StatCard = ({ value, label, icon: Icon, href }) => (
  <a 
    href={href} 
    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 rounded-2xl transition-transform group-hover:translate-y-[-1px]"
  >
    <Shell className="flex h-24 items-center justify-between px-5">
      <div className="text-4xl font-semibold text-white/95">{value}</div>
      <div className="flex items-center gap-2 text-sm text-white/70">
        {Icon && <Icon className="h-5 w-5 text-violet-300/90" />}
        <span>{label}</span>
      </div>
    </Shell>
  </a>
);

/* ----------------------------- helpers/data ------------------------------ */
const fullName = (u) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—";

const formatDateInput = (maybeDate) => {
  if (!maybeDate) return "";
  const d = new Date(maybeDate);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// Helper functions for consolidated user data access
const getCurrentLocation = (user) => {
  return user?.onboardingData?.city || user?.currentLocation || '';
};

const getUniversity = (user) => {
  return user?.onboardingData?.university || user?.university || '';
};

const getMajor = (user) => {
  return user?.onboardingData?.major || user?.major || '';
};

const getGraduationDate = (user) => {
  return user?.onboardingData?.graduationDate || user?.graduationDate || '';
};

const getBirthday = (user) => {
  return user?.onboardingData?.birthday || user?.birthday || null;
};

const normalizeUser = (raw) => {
  const u = raw || {};
  return {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    email: u.email || "",
    username: u.username || "",
    currentLocation: getCurrentLocation(u),
    hometown: u.hometown || "",
    birthday: getBirthday(u),
    university: getUniversity(u),
    major: getMajor(u),
    graduationDate: getGraduationDate(u),
    createdOn: u.createdOn || null,
    // Campus fields (kept at root level - can be edited independently)
    schoolDepartment: u.schoolDepartment || "",
    cohortTerm: u.cohortTerm || "",
    campusLabel: u.campusLabel || "",
    campusPlaceId: u.campusPlaceId || "",
    campusDisplayName: u.campusDisplayName || "",
    avatar: u.avatar || "",
    // Raw data
    onboardingData: u.onboardingData || {},
    synapse: u.synapse || {}
  };
};

/* ----------------------------- Edit Modal -------------------------------- */
// EditProfileModal is now imported from ../components/EditProfileModal/EditProfileModal
// Old implementation removed - using modern TypeScript version
function OldEditProfileModal({ open, onClose, initialUser, onSaved }) {
  const { isLoaded } = useGoogleMapsLoader(); // loads Places
  const [saving, setSaving] = useState(false);
  // Cohort/Term (split into season + year)
  const [cohortSeason, setCohortSeason] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const yearOptions = useMemo(() => buildYearOptions(2010), []);


  // schema fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [hometown, setHometown] = useState("");
  const [birthday, setBirthday] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [graduationDate, setGraduationDate] = useState("");

  // routing extras
  const [schoolDepartment, setSchoolDepartment] = useState("");
  const [cohortTerm, setCohortTerm] = useState("");
  const [campusLabel, setCampusLabel] = useState("");
  const [campusDisplayName, setCampusDisplayName] = useState("");
  const [campusPlaceId, setCampusPlaceId] = useState("");

  const acRef = useRef(null);

  useEffect(() => {
    if (!open || !initialUser) return;
    const { season, year } = parseTerm(initialUser?.cohortTerm || "");
    setCohortSeason(season);
    setCohortYear(year);
    setFirstName(initialUser.firstName || "");
    setLastName(initialUser.lastName || "");
    setCurrentLocation(initialUser.currentLocation || "");
    setHometown(initialUser.hometown || "");
    setBirthday(formatDateInput(initialUser.birthday));
    setUniversity(initialUser.university || "");
    setMajor(initialUser.major || "");
    setGraduationDate(initialUser.graduationDate || "");

    setSchoolDepartment(initialUser.schoolDepartment || "");
    setCohortTerm(initialUser.cohortTerm || "");
    setCampusLabel(initialUser.campusLabel || "");
    setCampusDisplayName(initialUser.campusDisplayName || "");
    setCampusPlaceId(initialUser.campusPlaceId || "");
  }, [open, initialUser]);

  const onPlaceChanged = () => {
    if (!acRef.current) return;
    const place = acRef.current.getPlace();
    if (!place) return;
    const name =
      place.name ||
      place.formatted_address ||
      (place.address_components && place.address_components.map((c) => c.long_name).join(", ")) ||
      "";
    setCampusDisplayName(name);
    setCampusPlaceId(place.place_id || "");
  };

  async function saveUser(payload) {
    // Try /update-user then /update-profile
    try {
      return await axiosInstance.patch("/update-user", payload);
    } catch (e1) {
      if (e1?.response?.status === 404) {
        return await axiosInstance.patch("/update-profile", payload);
      }
      throw e1;
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        currentLocation,
        hometown,
        birthday: birthday ? new Date(birthday).toISOString() : null,
        university,
        major,
        graduationDate,
        // optional extras for routing
        schoolDepartment,
        cohortTerm,
        campusLabel,
        campusPlaceId,
        campusDisplayName,
      };
      const { data } = await saveUser(payload);
      const updated = normalizeUser(data?.user || { ...(initialUser || {}), ...payload });
      onSaved?.(updated);
      onClose();
      // Show success feedback
      alert("Profile updated successfully!");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not save profile. Please try again.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-4xl">
        <form
          onSubmit={onSubmit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="editProfileTitle"
          className="relative w-full rounded-xl bg-white shadow-xl overflow-hidden"
        >
          {/* Header with Banner */}
          <div className="relative">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            {/* Profile Picture Overlay */}
            <div className="absolute -bottom-8 left-6">
              <div className="relative">
                <img
                  src={initialUser?.avatar || '/default-avatar.png'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-4 border-white object-cover"
                />
                {initialUser?.avatar && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="pt-12 pb-6">

            {/* User Info Header */}
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{fullName(initialUser)}</h2>
                  <p className="text-sm text-gray-500">@{initialUser?.firstName?.toLowerCase() || 'user'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Photo
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Banner
                  </button>
                </div>
              </div>
            </div>

            {/* Form Sections */}
            <div className="px-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current location</label>
                    <input
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="City, State (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
                    <input
                      value={hometown}
                      onChange={(e) => setHometown(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Hometown (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Graduation date</label>
                    <input
                      value={graduationDate}
                      onChange={(e) => setGraduationDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g., May 2026"
                    />
                  </div>
                </div>
              </div>


              {/* University Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">University Information</h3>
                <p className="text-sm text-gray-500 mb-4">Used for routing & distance on properties</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University name</label>
                    <input
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g., Northern Illinois University"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School / Department</label>
                    <input
                      value={schoolDepartment}
                      onChange={(e) => setSchoolDepartment(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g., College of Business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={(ac) => (acRef.current = ac)}
                        onPlaceChanged={onPlaceChanged}
                        options={{ fields: ["place_id", "name", "formatted_address"], componentRestrictions: { country: "us" } }}
                      >
                        <input
                          value={campusDisplayName}
                          onChange={(e) => setCampusDisplayName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Search for building..."
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        disabled
                        value={campusDisplayName}
                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-gray-50"
                        placeholder="Loading Google…"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Season</label>
                    <select
                      value={cohortSeason}
                      onChange={(e) => setCohortSeason(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Season</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Year</label>
                    <select
                      value={cohortYear}
                      onChange={(e) => setCohortYear(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">
                      Stored as: {cohortSeason} {cohortYear}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */
export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const { userStatus } = useUserStatus();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get("/get-user");
        console.log('🔍 Frontend get-user response:', JSON.stringify(data, null, 2));
        console.log('🔍 Frontend user.onboardingData:', data?.user?.onboardingData);
        setUser(normalizeUser(data?.user || {}));
      } catch (e) {
        console.error("Failed to load user", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Check for recent onboarding completion and refresh data
  useEffect(() => {
    const checkForRecentOnboarding = () => {
      // Check if user just completed onboarding (within last 5 minutes)
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      if (onboardingCompleted) {
        const completedTime = parseInt(onboardingCompleted);
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        if (completedTime > fiveMinutesAgo) {
          console.log('🔄 Recent onboarding completion detected, refreshing user data...');
          // Clear the flag
          localStorage.removeItem('onboarding_completed');
          // Refresh user data
          (async () => {
            try {
              const { data } = await axiosInstance.get("/get-user");
              setUser(normalizeUser(data?.user || {}));
            } catch (e) {
              console.error("Failed to refresh user data after onboarding", e);
            }
          })();
        }
      }
    };

    // Check immediately and also after a short delay
    checkForRecentOnboarding();
    const timeoutId = setTimeout(checkForRecentOnboarding, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Refresh user data when component becomes visible (e.g., after onboarding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh user data
        (async () => {
          try {
            const { data } = await axiosInstance.get("/get-user");
            setUser(normalizeUser(data?.user || {}));
          } catch (e) {
            console.error("Failed to refresh user data", e);
          }
        })();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh user data
      (async () => {
        try {
          const { data } = await axiosInstance.get("/get-user");
          setUser(normalizeUser(data?.user || {}));
        } catch (e) {
          console.error("Failed to refresh user data", e);
        }
      })();
    };

    // Listen for page visibility changes and window focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-14">
          <Shell>Couldn’t load your profile.</Shell>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0c0f] text-white">
      <ParticleField />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,25,45,0)_0%,rgba(11,12,15,0.65)_70%)]" />
      <style jsx="true">{`
        @media (prefers-reduced-motion: reduce) {
          .particles { display: none; }
        }
      `}</style>

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl gap-6 px-4 py-8 lg:grid lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <section className="space-y-6 lg:col-span-4">
            <Shell>
              <SectionLabel icon={MdOutlineBolt}>Quick Info</SectionLabel>
              <div className="mb-4 text-lg font-semibold">Campus profile</div>
              <div className="space-y-3">
                <div className="group rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/20 cursor-pointer" onClick={() => setOpenEdit(true)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20">
                      <MdPlace className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white/90">Location</div>
                      <div className="text-xs text-white/70">{user.currentLocation || "Add location"}</div>
                    </div>
                    {!user.currentLocation && <MdEdit className="h-3 w-3 text-white/40" />}
                  </div>
                </div>
                
                <div className="group rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/20 cursor-pointer" onClick={() => setOpenEdit(true)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20">
                      <MdSchool className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white/90">University</div>
                      <div className="text-xs text-white/70">{user.university || "Add university"}</div>
                    </div>
                    {!user.university && <MdEdit className="h-3 w-3 text-white/40" />}
                  </div>
                </div>
                
                <div className="group rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/20 cursor-pointer" onClick={() => setOpenEdit(true)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20">
                      <MdWorkOutline className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white/90">Major</div>
                      <div className="text-xs text-white/70">{user.major || "Add major"}</div>
                    </div>
                    {!user.major && <MdEdit className="h-3 w-3 text-white/40" />}
                  </div>
                </div>
                
                <div className="group rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/20 cursor-pointer" onClick={() => setOpenEdit(true)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20">
                      <MdOutlineAccessTime className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white/90">Graduation</div>
                      <div className="text-xs text-white/70">{user.graduationDate || "Add grad date"}</div>
                    </div>
                    {!user.graduationDate && <MdEdit className="h-3 w-3 text-white/40" />}
                  </div>
                </div>
              </div>
            </Shell>

            <StatCard value={"3"} label="Listings posted" icon={MdOutlinePlayCircle} href="/listings?owner=me" />
            <StatCard value={"12"} label="Saved properties" icon={MdStar} href="/saved" />
            <StatCard value={"5"} label="Active chats" icon={MdOutlineAccessTime} href="/messages" />

            <SynapseCompletionStatus 
              onEditPreferences={() => window.location.href = '/Synapse?edit=true'} 
            />

            <Shell>
              <SectionLabel icon={MdDesignServices}>Services</SectionLabel>
              <div className="mb-3 text-lg font-semibold">How NewRun helps</div>
              <div className="flex flex-wrap gap-2">
                <Chip icon={MdWeb} text="Housing" />
                <Chip icon={MdShoppingBag} text="Marketplace" />
                <Chip icon={MdDesignServices} text="Roommate Match" />
                <Chip icon={MdOutlinePlayCircle} text="Community" />
              </div>
            </Shell>
          </section>

          {/* CENTER COLUMN */}
          <section className="space-y-6 lg:col-span-5">
            {/* Use the exact same MatchCard component */}
            <div className="flex justify-center">
              <MatchCard
                item={transformUserToMatchCard(user, userStatus)}
                onOpen={() => setOpenEdit(true)}
                onMessage={(userId, message) => {
                  // For self-profile, redirect to edit
                  setOpenEdit(true);
                }}
                hideOverlays={false}
                className={`max-w-sm colorful-profile self-profile status-${userStatus}`}
                contactText="Edit Profile"
              />
              </div>

            {/* Custom CSS for self-profile styling */}
            <style>{`
              .self-profile .pc-contact-btn {
                background: rgba(59, 130, 246, 0.15) !important;
                border: 1px solid rgba(59, 130, 246, 0.3) !important;
                color: #60a5fa !important;
              }
              
              .self-profile .pc-contact-btn:hover {
                background: rgba(59, 130, 246, 0.25) !important;
                border-color: rgba(59, 130, 246, 0.5) !important;
                color: #93c5fd !important;
              }
              
              /* Status styling for profile cards */
              .status-online .pc-status {
                color: #22c55e !important;
              }
              
              .status-away .pc-status {
                color: #f59e0b !important;
              }
              
              .status-dnd .pc-status {
                color: #ef4444 !important;
              }
              
              .status-offline .pc-status {
                color: #6b7280 !important;
              }
            `}</style>
            

            <Shell>
              {/* About Section */}
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <MdPerson className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                    <p className="text-white/80 leading-relaxed">
                      {user.hometown
                        ? `From ${user.hometown}. Currently at ${user.currentLocation || "—"}.`
                        : "Tell others a bit about you in your profile."}
                    </p>
                    {!user.hometown && (
                      <button 
                        onClick={() => setOpenEdit(true)}
                        className="mt-3 inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <MdEdit className="h-4 w-4" />
                        Add your story
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Support Actions */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button className="group relative overflow-hidden rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 px-4 py-3 text-sm font-medium text-emerald-300 hover:from-emerald-500/20 hover:to-green-500/20 transition-all duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <FaWhatsapp className="h-4 w-4" />
                    <span>Chat with support</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
                <button className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.02] px-4 py-3 text-sm font-medium text-white/80 hover:from-white/[0.08] hover:to-white/[0.06] transition-all duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <MdOutlineMail className="h-4 w-4" />
                    <span>Email us</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              </div>
            </Shell>

            <Shell>
              <SectionLabel icon={MdDesignServices}>Stay connected</SectionLabel>
              <div className="mb-3 text-lg font-semibold">NewRun channels</div>
              <div className="flex flex-wrap gap-2">
                <Chip icon={FaYoutube} text="YouTube" onClick={() => window.open('https://youtube.com/@newrun', '_blank')} isActionable={true} />
                <Chip icon={FaDribbble} text="Product" onClick={() => window.open('https://dribbble.com/newrun', '_blank')} isActionable={true} />
                <Chip icon={FaPinterest} text="Inspo" onClick={() => window.open('https://pinterest.com/newrun', '_blank')} isActionable={true} />
                <Chip icon={FaInstagram} text="Instagram" onClick={() => window.open('https://instagram.com/newrun', '_blank')} isActionable={true} />
              </div>
            </Shell>
          </section>

          {/* RIGHT COLUMN */}
          <section className="space-y-6 lg:col-span-3">
            <Shell className="p-0">
              <div className="p-4">
                <SectionLabel icon={MdStar}>Get settled faster</SectionLabel>
                <div className="text-lg font-semibold">Tips</div>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto px-4 pb-4">
                {[
                  {
                    title: "Complete your profile",
                    text:
                      "Add your university, school and campus to unlock walking/driving routes on property pages.",
                  },
                  {
                    title: "Use distance filters",
                    text:
                      "We show distance from your campus. Set alerts to catch good deals early.",
                  },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/80"
                  >
                    <div className="mb-1 text-white/95">{t.title}</div>
                    <div>{t.text}</div>
                  </div>
                ))}
              </div>
            </Shell>

            <Shell>
              <SectionLabel icon={MdDesignServices}>Workflow</SectionLabel>
              <div className="text-lg font-semibold">NewRun Highlights</div>
              <div className="mt-3 space-y-2">
                {["Explore housing", "Match roommates", "Join community", "Save favorites"].map(
                  (step, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                    >
                      <span className="text-white/85">{step}</span>
                      <MdCheckCircle className="h-5 w-5 text-emerald-300" />
                    </div>
                  )
                )}
              </div>
            </Shell>

            <Shell>
              <div className="mb-2 flex items-center gap-2 text-sm">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/20 text-violet-200">
                  <MdStar className="h-4 w-4" />
                </div>
                <span className="font-semibold">Need help?</span>
              </div>
              <div className="text-sm text-white/70">
                Ping us and we’ll help you find a place or a roommate.
              </div>

              <div className="mt-3 space-y-2">
                <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.07]">
                  <span className="inline-flex items-center gap-2">
                    <MdOutlineMail className="h-4 w-4 text-violet-300/90" />
                    Email support
                  </span>
                  <MdOutlinePlayCircle className="h-5 w-5 text-white/50" />
                </button>

                <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.07]">
                  <span className="inline-flex items-center gap-2">
                    <MdSchedule className="h-4 w-4 text-violet-300/90" />
                    Schedule a call
                  </span>
                  <MdOutlinePlayCircle className="h-5 w-5 text-white/50" />
                </button>
              </div>
            </Shell>
          </section>
        </main>
      </div>

      <EditProfileModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        initialUser={user}
        onSaved={(u) => setUser(u)}
      />
    </div>
  );
}
