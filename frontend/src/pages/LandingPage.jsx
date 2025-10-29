import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "@studio-freight/lenis";


import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
const LazySplineGlobe = React.lazy(() => import("../components/Globe/SplineGlobe"));
import ProcessSection from "../components/Sections/ProcessSection";
import AnimatedFeatureGrid from "../components/Showcase/AnimatedFeatureGrid";
import NewRunServices from "../components/Process/NewRunServices";
import UniversityFinder from "../components/UniversityFinder";



import meshHero from "../assets/Graphics/mesh-hero.png";
import heroVideo from "../assets/Videos/hero/campus-arrival.mp4";
import imgRoommates from "../assets/Images/landing/roommates-study.jpg";
import imgMarketplace from "../assets/Images/landing/marketplace-moveout.jpg";
import imgCommunity from "../assets/Images/landing/community-events.jpg";

export default function LandingPage() {
  const navigate = useNavigate();

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Smooth scroll with proper cleanup and reduced-motion guard
  useEffect(() => {
    if (prefersReducedMotion) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let rafId;
    const raf = (t) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { if (rafId) cancelAnimationFrame(rafId); lenis.destroy(); };
  }, [prefersReducedMotion]);

  // Parallax hero copy
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, prefersReducedMotion ? 1 : 0.5]);

  const fadeUp = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 28 },
    show: (i = 0) => ({
      opacity: 1,
      y: prefersReducedMotion ? 0 : 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.65, ease: "easeOut", delay: i * 0.08 }
    }),
  };

  // Intersection for globe and services
  const heroInViewRef = useRef(null);
  const [heroInView, setHeroInView] = useState(false);
  useEffect(() => {
    const el = heroInViewRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div 
      className="body-obsidian min-h-screen relative"
      style={{
        backgroundImage: 'url("/assets/gradient-BZl8jpii.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
      >
      {/* HERO - starts from absolute top */}
      <section 
        ref={heroRef} 
        className="relative min-h-screen w-full overflow-hidden pt-0" 
        style={{ 
          willChange: prefersReducedMotion ? 'auto' : 'transform',
        }}
      >
        {/* Navbar overlay on top of hero */}
        <div className="relative z-20">
          <Navbar />
        </div>
        
        {/* Texture + globe */}
        {/* <img src={meshHero} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0" /> */}
        <div ref={heroInViewRef} className="absolute inset-0 -z-0 opacity-[0.26]" aria-hidden="true">
          {!prefersReducedMotion && heroInView && (
            <Suspense fallback={null}>
              <LazySplineGlobe />
            </Suspense>
          )}
        </div>
        {/* subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center pt-24"
        >
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-balance text-5xl font-extrabold leading-tight tracking-[-0.01em] md:text-7xl"
          >
            Your Campus.
            <br className="hidden md:block" />
            Your People.
            <br className="hidden md:block" />
            Your Start in the U.S.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 max-w-2xl text-xl leading-relaxed text-white/70 md:text-2xl"
          >
            Connect with students, find verified housing, explore the campus, and build friendships. All in one place.
          </motion.p>

          {/* CTA Buttons - ADDED */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Link
              to="/signup"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Log In
            </Link>
          </motion.div>

          {/* micro-stats */}
          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3"
          >
            {[
              ["Verified", "University-only network"],
              ["Built-in", "Messaging & P2P Market"],
              ["AI", "Roommate matching"],
            ].map(([k, v], i) => (
              <div key={i} className="edge-panel px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-[var(--text-mid)]">{k}</div>
                <div className="text-base font-medium">{v}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute -bottom-1 left-0 h-24 w-full bg-gradient-to-b from-transparent to-[#0B0B0C]/70" />
      </section>

      {/* Content wrapper for all sections below hero */}
      <div className="relative z-10">
      {/* HOW IT WORKS */}
      {/* <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-4xl font-bold"
        >
          How NewRun Works
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Join", desc: "Create your profile and verify your university." },
            { title: "Set Up", desc: "Get housing, essentials, and connections tailored to you." },
            { title: "Thrive", desc: "Meet people, join events, and feel at home from day one." },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="edge-panel p-6"
            >
              <p className="edge-accent text-[11px] uppercase tracking-widest text-[var(--text-mid)]">Step {i + 1}</p>
              <div className="mt-2 text-2xl font-semibold">{card.title}</div>
              <div className="mt-3 text-[var(--text-mid)]">{card.desc}</div>
            </motion.div>
          ))}
        </div>
      </section> */}
      {/* <ProcessSection /> */}
      {/* <AnimatedFeatureGrid /> */}
      <NewRunServices />

      
      {/* FEATURES */}
      <section id="features" className="w-full">
        {[
          {
            title: "AI Roommate Matching",
            desc: "Go beyond filters. NewRun considers sleep patterns, study habits, cultural fit, and budget to match you with someone you'd actually live with.",
            img: imgRoommates,
            cta: () => navigate("/signup"),
            ctaText: "Find My Match",
          },
          {
            title: "Verified Housing & P2P Marketplace",
            desc: "University-gated listings only. Rent safely, sublet easily, and buy/sell essentials with verified students on your campus.",
            img: imgMarketplace,
            cta: () => navigate("/marketplace"),
            ctaText: "Explore Listings",
          },
          {
            title: "Community & Events",
            desc: "From airport pickups to career meetups—discover student clubs, events, and groups that make a new city feel like home.",
            img: imgCommunity,
            cta: () => navigate("/community"),
            ctaText: "See What’s On",
          },
        ].map((f, i) => (
          <div
            key={f.title}
            className={`relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
              whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <h3 className="text-pretty text-3xl font-bold md:text-4xl">{f.title}</h3>
              <p className="text-[var(--text-mid)] md:text-lg">{f.desc}</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={f.cta} className="btn-metal">
                  {f.ctaText}
                </button>
                <button onClick={() => navigate("/onboarding")} className="btn-ghost">
                  Chat with Us
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6 }}
              className="edge-panel relative bg-[var(--bg-carbon)] p-3"
            >
              <img src={f.img} alt={f.title} className="rounded-[16px] object-cover" loading="lazy" decoding="async" />
              <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10" />
            </motion.div>
          </div>
        ))}
      </section>

      {/* UNIVERSITY FINDER moved into cinematic section */}

      {/* CINEMATIC FINDER - video background with University Finder overlay */}
      <section className="relative h-[68vh] w-full overflow-visible">
        {prefersReducedMotion ? (
          <img src={meshHero} alt="NewRun campus life" className="absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" decoding="async" />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            src={heroVideo}
            autoPlay muted loop playsInline preload="metadata"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-[#0b0c0f]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0f] via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center"
        >
          <h3 className="text-balance text-4xl font-bold md:text-5xl mb-2">
            Start your journey now — it’s free.
          </h3>
          <p className="max-w-2xl text-white/80 mb-6">
            Join a verified, university-only community. Pick your campus to get a personalized start.
          </p>
          <div className="w-full">
            <UniversityFinder />
          </div>
        </motion.div>
      </section>

        <Footer />
      </div>
    </div>
  );
}
