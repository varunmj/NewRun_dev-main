// src/pages/UserProfile.jsx
import React from "react";
import Navbar from "../components/Navbar/Navbar";
import {
  MdWeb,
  MdBrush,
  MdShoppingBag,
  MdDesignServices,
  MdSchool,
  MdWorkOutline,
  MdCheckCircle,
  MdStar,
  MdPublic,
  MdLanguage,
  MdOutlineAccessTime,
  MdPlace,
  MdOutlineMail,
  MdSchedule,
  MdOutlinePlayCircle,
  MdOutlineBolt,
} from "react-icons/md";
import {
  FaFigma,
  FaShopify,
  FaTelegramPlane,
  FaWhatsapp,
  FaXTwitter,
  FaInstagram,
  FaYoutube,
  FaDribbble,
  FaPinterestP,
} from "react-icons/fa6";

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
    <span>{text}</span>
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

/* --------------------------------- page --------------------------------- */
export default function UserProfile() {
  const user = {
    name: "Pragadeswaran",
    email: "praha@newrun.ai",
    bio: "I’m a Designer / Software Engineer crafting slick, high-performing product experiences.",
    university: "MIT University",
    major: "Software Engineering",
    graduation: "2025",
    location: "India",
    languages: "English & Tamil",
    years: 6,
    followers: 12_000,
    following: 1_100,
    tasksCompleted: 42,
    avatar:
      "https://images.unsplash.com/photo-1628157588553-5eeea00dbf54?q=80&w=200&h=200&fit=crop&auto=format",
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl gap-6 px-4 py-8 lg:grid lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <section className="space-y-6 lg:col-span-4">
          <Shell>
            <SectionLabel icon={MdOutlineBolt}>My Stacks</SectionLabel>
            <div className="mb-3 text-lg font-semibold">Tech Arsenal</div>
            <div className="grid grid-cols-2 gap-3">
              <Chip icon={MdWeb} text="Framer" />
              <Chip icon={MdBrush} text="Webflow" />
              <Chip icon={FaFigma} text="Figma" />
              <Chip icon={FaShopify} text="Shopify" />
            </div>
          </Shell>

          <StatCard value={"56+"} label="Projects" icon={MdOutlinePlayCircle} />
          <StatCard value={"23+"} label="Happy Clients" icon={MdStar} />
          <StatCard value={"06+"} label="Year Expertise" icon={MdOutlineAccessTime} />

          <Shell>
            <SectionLabel icon={MdOutlinePlayCircle}>Projects</SectionLabel>
            <div className="mb-3 text-lg font-semibold">Works Gallery</div>

            {/* gallery thumbnails */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,#6e46ff22,transparent_60%),linear-gradient(180deg,#0f1117,#0b0c0f)]"
                >
                  <div className="h-full w-full animate-pulse bg-white/5" />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button className="rounded-xl bg-violet-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
                View Works
              </button>
            </div>
          </Shell>

          <Shell>
            <SectionLabel icon={MdDesignServices}>Services</SectionLabel>
            <div className="mb-3 text-lg font-semibold">Solutions Suite</div>
            <div className="flex flex-wrap gap-2">
              <Chip icon={MdWeb} text="Web Design" />
              <Chip icon={MdShoppingBag} text="E-commerce" />
              <Chip icon={MdDesignServices} text="Brand/UI" />
              <Chip icon={MdOutlinePlayCircle} text="Motion/Framer" />
            </div>
            <div className="mt-4">
              <button className="rounded-xl bg-violet-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
                View All Services
              </button>
            </div>
          </Shell>
        </section>

        {/* CENTER COLUMN */}
        <section className="space-y-6 lg:col-span-5">
          {/* Profile main card */}
          <Shell className="p-5">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">{user.name}</span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Available To Work
                  </span>
                </div>
                <div className="mt-1 text-sm text-white/70">
                  I’m a <span className="text-violet-300/90">Designer</span>
                </div>
              </div>

              <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:bg-white/[0.07]">
                Resume
              </button>
            </div>

            {/* profile meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip icon={MdPlace} text={user.location} />
              <Chip icon={MdLanguage} text={user.languages} />
              <Chip icon={MdWorkOutline} text="Software Engineer" />
              <Chip icon={MdPublic} text="IST" />
              <Chip icon={MdSchool} text={user.university} />
              <Chip icon={MdCheckCircle} text="Good Boy" />
            </div>

            {/* bio */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white/80">
              {user.bio}
            </div>

            {/* quick contact */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08]">
                <FaTelegramPlane className="h-4 w-4 text-sky-300" />
                Telegram Me
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08]">
                <FaWhatsapp className="h-4 w-4 text-emerald-300" />
                WhatsApp Me
              </button>
            </div>
          </Shell>

          {/* Social badges row */}
          <Shell>
            <SectionLabel icon={MdDesignServices}>My Clients</SectionLabel>
            <div className="mb-3 text-lg font-semibold">Satisfied Partners</div>
            <div className="flex flex-wrap gap-2">
              <Chip icon={FaYoutube} text="YouTube" />
              <Chip icon={FaXTwitter} text="Twitter / X" />
              <Chip icon={FaDribbble} text="Dribbble" />
              <Chip icon={FaPinterestP} text="Pinterest" />
              <Chip icon={FaInstagram} text="Instagram" />
            </div>
          </Shell>
        </section>

        {/* RIGHT COLUMN */}
        <section className="space-y-6 lg:col-span-3">
          {/* Testimonials */}
          <Shell className="p-0">
            <div className="p-4">
              <SectionLabel icon={MdStar}>Testimonials</SectionLabel>
              <div className="text-lg font-semibold">Rave Reviews Showcase</div>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto px-4 pb-4">
              {[
                {
                  name: "Emily Chen",
                  place: "Sydney, Australia",
                  text:
                    "Working with Pragadesh was a breeze. He not only delivered a sleek and functional website but also provided excellent support throughout the process.",
                },
                {
                  name: "David Patel",
                  place: "London, UK",
                  text:
                    "Exceeded my expectations with attention to detail and creativity. Thrilled with the site he built for my business.",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/80"
                >
                  <div className="mb-1 text-white/95">{t.name}</div>
                  <div className="mb-2 text-xs text-white/50">{t.place}</div>
                  <div>{t.text}</div>
                </div>
              ))}
            </div>
          </Shell>

          {/* Work process */}
          <Shell>
            <SectionLabel icon={MdDesignServices}>Work Process</SectionLabel>
            <div className="text-lg font-semibold">Workflow Highlights</div>
            <div className="mt-3 space-y-2">
              {[
                "Goals & Objectives",
                "Research",
                "Wireframe",
                "Prototyping",
                "Finalize Design",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  <span className="text-white/85">{step}</span>
                  <MdCheckCircle className="h-5 w-5 text-emerald-300" />
                </div>
              ))}
            </div>
          </Shell>

          {/* Online presence */}
          <Shell>
            <SectionLabel icon={FaXTwitter}>Follow Me</SectionLabel>
            <div className="text-lg font-semibold">Online Presence</div>
            <div className="mt-3 space-y-2">
              {[
                { icon: FaXTwitter, handle: "@praha37v" },
                { icon: FaInstagram, handle: "@praha37v" },
                { icon: FaDribbble, handle: "@praha37v" },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <row.icon className="h-4 w-4 text-violet-300/90" />
                    <span className="text-white/85">{row.handle}</span>
                  </div>
                  <MdOutlinePlayCircle className="h-5 w-5 text-white/50" />
                </div>
              ))}
            </div>
          </Shell>

          {/* CTA */}
          <Shell>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/20 text-violet-200">
                <MdStar className="h-4 w-4" />
              </div>
              <span className="font-semibold">Let’s Work Together</span>
            </div>
            <div className="text-sm text-white/70">
              Let’s make magic happen together!
            </div>

            <div className="mt-3 space-y-2">
              <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.07]">
                <span className="inline-flex items-center gap-2">
                  <MdOutlineMail className="h-4 w-4 text-violet-300/90" />
                  Email Me
                </span>
                <MdOutlinePlayCircle className="h-5 w-5 text-white/50" />
              </button>

              <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.07]">
                <span className="inline-flex items-center gap-2">
                  <MdSchedule className="h-4 w-4 text-violet-300/90" />
                  Schedule a Call
                </span>
                <MdOutlinePlayCircle className="h-5 w-5 text-white/50" />
              </button>
            </div>
          </Shell>
        </section>
      </main>
    </div>
  );
}
