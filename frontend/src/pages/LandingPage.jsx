import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "@studio-freight/lenis";


import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import SplineGlobe from "../components/Globe/SplineGlobe";
import ProcessSection from "../components/Sections/ProcessSection";
import AnimatedFeatureGrid from "../components/Showcase/AnimatedFeatureGrid";


import meshHero from "../assets/Graphics/mesh-hero.png";
import heroVideo from "../assets/Videos/hero/campus-arrival.mp4";
import imgRoommates from "../assets/Images/landing/roommates-study.jpg";
import imgMarketplace from "../assets/Images/landing/marketplace-moveout.jpg";
import imgCommunity from "../assets/Images/landing/community-events.jpg";

export default function LandingPage() {
  const navigate = useNavigate();

  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Parallax hero copy
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut", delay: i * 0.08 } }),
  };

  return (
    <div className="body-obsidian min-h-screen">
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[92vh] w-full overflow-hidden">
        {/* Texture + globe */}
        <img src={meshHero} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-0 opacity-[0.26]">
          <SplineGlobe />
        </div>
        {/* subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-6 text-center"
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
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-2xl text-lg text-[var(--text-mid)] md:text-xl"
          >
            Housing, essentials, and community — all in one place, curated for your university only.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <button onClick={() => navigate("/chatbot")} className="btn-metal">
              Get Started
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="btn-ghost"
            >
              Explore NewRun
            </button>
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
      <AnimatedFeatureGrid />

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
              initial={{ opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
              whileInView={{ opacity: 1, x: 0 }}
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
                <button onClick={() => navigate("/chatbot")} className="btn-ghost">
                  Chat with Us
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6 }}
              className="edge-panel relative bg-[var(--bg-carbon)] p-3"
            >
              <img src={f.img} alt={f.title} className="rounded-[16px] object-cover" />
              <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10" />
            </motion.div>
          </div>
        ))}
      </section>

      {/* UNIVERSITY FINDER */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="edge-panel p-8 text-center"
        >
          <h4 className="text-3xl font-bold">Find Your University</h4>
          <p className="mt-2 text-[var(--text-mid)]">
            NewRun is built for campus-specific communities. Start by searching your school.
          </p>
          <div className="mx-auto mt-6 flex max-w-2xl gap-3">
            <input
              type="text"
              placeholder="Search university…"
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[#0E0F12] px-5 py-3 text-white placeholder-[var(--text-mid)] outline-none focus:border-[var(--edge-cyan)]"
            />
            <button onClick={() => navigate("/signup")} className="btn-metal">
              Continue
            </button>
          </div>
        </motion.div>
      </section>

      {/* CINEMATIC CTA */}
      <section className="relative h-[56vh] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src={heroVideo}
          autoPlay muted loop playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111215] via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center"
        >
          <h3 className="text-balance text-4xl font-bold md:text-5xl">
            Start your journey now — it’s free.
          </h3>
          <p className="mt-3 max-w-2xl text-[var(--text-mid)]">
            Join a verified, university-only community designed to make your first months in the U.S. effortless.
          </p>
          <div className="mt-8">
            <button onClick={() => navigate("/chatbot")} className="btn-metal">
              Get Started
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
