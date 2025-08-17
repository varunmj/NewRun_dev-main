import React, { useEffect, useRef, useState, useMemo } from "react";
import Navbar from "../components/Navbar/Navbar";
import axiosInstance from "../utils/axiosInstance";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";
import { Autocomplete } from "@react-google-maps/api";

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
} from "react-icons/md";
import { FaWhatsapp, FaInstagram, FaYoutube, FaDribbble, FaPinterest } from "react-icons/fa6";

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

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
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

const Chip = ({ icon: Icon, text }) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/85">
    {Icon && <Icon className="h-4 w-4 text-violet-300/90" />}
    <span>{text || "—"}</span>
  </div>
);

const StatCard = ({ value, label, icon: Icon }) => (
  <Shell className="flex h-24 items-center justify-between px-5">
    <div className="text-4xl font-semibold text-white/95">{value}</div>
    <div className="flex items-center gap-2 text-sm text-white/70">
      {Icon && <Icon className="h-5 w-5 text-violet-300/90" />}
      <span>{label}</span>
    </div>
  </Shell>
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

const normalizeUser = (raw) => {
  const u = raw || {};
  return {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    email: u.email || "",
    username: u.username || "",
    currentLocation: u.currentLocation || "",
    hometown: u.hometown || "",
    birthday: u.birthday || null,
    university: u.university || "",
    major: u.major || "",
    graduationDate: u.graduationDate || "",
    createdOn: u.createdOn || null,
    // new optional routing fields (if your API already returns them)
    schoolDepartment: u.schoolDepartment || "",
    cohortTerm: u.cohortTerm || "",
    campusLabel: u.campusLabel || "",
    campusPlaceId: u.campusPlaceId || "",
    campusDisplayName: u.campusDisplayName || "",
    avatar:
      u.avatar ||
      "https://images.unsplash.com/photo-1628157588553-5eeea00dbf54?q=80&w=200&h=200&fit=crop&auto=format",
  };
};

/* ----------------------------- Edit Modal -------------------------------- */
function EditProfileModal({ open, onClose, initialUser, onSaved }) {
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
    const { season, year } = parseTerm(initial?.cohortTerm || "");
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
  }, [open, initialUser,initial]);

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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#121318] p-5 text-white shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Edit profile</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white/80 hover:bg-white/[0.07]"
          >
            Close
          </button>
        </div>

        {/* Basic identity */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/60">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/60">Current location</label>
            <input
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              placeholder="City, State (optional)"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Hometown</label>
            <input
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              placeholder="Hometown (optional)"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/60">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Graduation date (Month/Year)
            </label>
            <input
              value={graduationDate}
              onChange={(e) => setGraduationDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              placeholder="e.g., May 2026"
            />
          </div>
        </div>

        {/* University Routing (your original asks) */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-3 text-sm font-medium text-white/85">
            University (used for routing & distance on properties)
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">University name</label>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                placeholder="e.g., Northern Illinois University"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">School / Department</label>
              <input
                value={schoolDepartment}
                onChange={(e) => setSchoolDepartment(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                placeholder="e.g., College of Business"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              {/* <label className="mb-1 block text-xs text-white/60">Cohort / Term</label> */}
              {/* Cohort / Term */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/60">Cohort / Term</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Season */}
                    <select
                      value={cohortSeason}
                      onChange={(e) => setCohortSeason(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                    >
                      <option value="">Season</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                    </select>

                    {/* Year */}
                    <select
                      value={cohortYear}
                      onChange={(e) => setCohortYear(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                    >
                      <option value="">Year</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-white/40">
                    We’ll store it as <code>{cohortSeason && cohortYear ? `${cohortSeason} ${cohortYear}` : "Season YYYY"}</code>
                    {" "}for routing and campus grouping.
                  </p>
                </div>

                {/* Campus label (unchanged, keep your current input/autocomplete here) */}
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Campus label (e.g., NIU College of Business)
                  </label>
                  <input
                    value={campusLabel}
                    onChange={(e) => setCampusLabel(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                    placeholder="e.g., NIU College of Business (Barsema Hall)"
                  />
                </div>
              </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                Campus label (e.g., NIU College of Business)
              </label>
              <input
                value={campusLabel}
                onChange={(e) => setCampusLabel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                placeholder="e.g., NIU College of Business (Barsema Hall)"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs text-white/60">
              Campus (Google Maps place)
            </label>
            {isLoaded ? (
              <Autocomplete
                onLoad={(ac) => (acRef.current = ac)}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: ["us"] }}
              >
                <input
                  value={campusDisplayName}
                  onChange={(e) => setCampusDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                  placeholder="Search for the exact building (e.g., Barsema Hall)…"
                />
              </Autocomplete>
            ) : (
              <input
                disabled
                value={campusDisplayName}
                className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
                placeholder="Loading Google…"
              />
            )}
            <div className="mt-1 text-xs text-white/40">
              We store the Place ID behind the scenes for accurate routing.
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */
export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get("/get-user");
        setUser(normalizeUser(data?.user || {}));
      } catch (e) {
        console.error("Failed to load user", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
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

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl gap-6 px-4 py-8 lg:grid lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <section className="space-y-6 lg:col-span-4">
            <Shell>
              <SectionLabel icon={MdOutlineBolt}>Quick Info</SectionLabel>
              <div className="mb-3 text-lg font-semibold">Campus profile</div>
              <div className="grid grid-cols-2 gap-3">
                <Chip icon={MdPlace} text={user.currentLocation || "Add location"} />
                <Chip icon={MdSchool} text={user.university || "Add university"} />
                <Chip icon={MdWorkOutline} text={user.major || "Add major"} />
                <Chip icon={MdOutlineAccessTime} text={user.graduationDate || "Grad date"} />
              </div>
            </Shell>

            <StatCard value={"3"} label="Listings posted" icon={MdOutlinePlayCircle} />
            <StatCard value={"12"} label="Saved properties" icon={MdStar} />
            <StatCard value={"5"} label="Active chats" icon={MdOutlineAccessTime} />

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
            <Shell className="p-5">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={fullName(user)}
                  className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">{fullName(user)}</span>
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      NewRun Member
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-white/70">{user.email || "—"}</div>
                </div>

                <button
                  onClick={() => setOpenEdit(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:bg-white/[0.07]"
                >
                  <MdEdit className="h-4 w-4" /> Edit
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={MdPlace} text={user.currentLocation || "Location"} />
                <Chip icon={MdSchool} text={user.university || "University"} />
                <Chip icon={MdWorkOutline} text={user.major || "Major"} />
                <Chip icon={MdOutlineAccessTime} text={user.graduationDate || "Graduation"} />
                {user.campusLabel || user.campusDisplayName ? (
                  <Chip icon={MdPlace} text={user.campusLabel || user.campusDisplayName} />
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white/80">
                {user.hometown
                  ? `From ${user.hometown}. Currently at ${user.currentLocation || "—"}.`
                  : "Tell others a bit about you in your profile."}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08]">
                  <FaWhatsapp className="h-4 w-4 text-emerald-300" />
                  Chat with support
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08]">
                  <MdOutlineMail className="h-4 w-4 text-violet-300/90" />
                  Email us
                </button>
              </div>
            </Shell>

            <Shell>
              <SectionLabel icon={MdDesignServices}>Stay connected</SectionLabel>
              <div className="mb-3 text-lg font-semibold">NewRun channels</div>
              <div className="flex flex-wrap gap-2">
                <Chip icon={FaYoutube} text="YouTube" />
                <Chip icon={FaDribbble} text="Product" />
                <Chip icon={FaPinterest} text="Inspo" />
                <Chip icon={FaInstagram} text="Instagram" />
              </div>
            </Shell>
          </section>

          {/* RIGHT COLUMN */}
          <section className="space-y-6 lg:col-span-3">
            <Shell className="p-0">
              <div className="p-4">
                <SectionLabel icon={MdStar}>Tips</SectionLabel>
                <div className="text-lg font-semibold">Get settled faster</div>
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
