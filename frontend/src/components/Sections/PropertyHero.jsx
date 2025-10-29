import React, { useState, useEffect } from "react";

/**
 * Enhanced NewRun Property Hero — Framer-style with animations and interactive elements.
 * No external icon libs. Pure Tailwind + tiny CSS utilities.
 */
export default function PropertyHero({ onListProperty }) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activePropertiesCount, setActivePropertiesCount] = useState(0);
  const [isCountUpVisible, setIsCountUpVisible] = useState(false);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const searchSuggestions = [
    "studio apartment",
    "2 bedroom", 
    "near campus",
    "furnished",
    "pet friendly",
    "utilities included"
  ];

  const rotatingTaglines = [
    { text: "Safe, local, student-first.", color: "#10b981", glow: "0 0 6px #10b981, 0 0 12px #10b981" },
    { text: "Trusted by students worldwide.", color: "#3b82f6", glow: "0 0 6px #3b82f6, 0 0 12px #3b82f6" },
    { text: "Your campus housing marketplace.", color: "#8b5cf6", glow: "0 0 6px #8b5cf6, 0 0 12px #8b5cf6" },
    { text: "Find and list with confidence.", color: "#f97316", glow: "0 0 6px #f97316, 0 0 12px #f97316" },
    { text: "Connecting students everywhere.", color: "#eab308", glow: "0 0 6px #eab308, 0 0 12px #eab308" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const searchInterval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(searchInterval);
  }, []);

  // Letter-by-letter typing animation
  useEffect(() => {
    const currentTagline = rotatingTaglines[currentTaglineIndex];
    const text = currentTagline.text;
    let currentIndex = 0;
    setDisplayedText("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
        
        // Pause for 5 seconds after typing is complete before moving to next
        setTimeout(() => {
          setCurrentTaglineIndex((prev) => (prev + 1) % rotatingTaglines.length);
        }, 5000);
      }
    }, 80); // Speed of typing (80ms per character)

    return () => clearInterval(typeInterval);
  }, [currentTaglineIndex]);

  // Progress dots animation (like RoommateMatches)
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, 4)), 1000);
    return () => clearInterval(id);
  }, []);

  // Count-up animation for active properties
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsCountUpVisible(true);
        animateCountUp();
      }, 1000); // Start after 1 second delay
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animateCountUp = () => {
    const targetCount = 500;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutCubic * targetCount);
      
      setActivePropertiesCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to properties with search query
      const propertiesGrid = document.getElementById('properties-grid');
      if (propertiesGrid) {
        propertiesGrid.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        // Dispatch custom event for search
        window.dispatchEvent(new CustomEvent('propertySearch', { 
          detail: { query: searchQuery.trim() } 
        }));
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setIsSearchFocused(false);
  };

  return (
    <div className="w-full pt-24">
      <div className="mx-auto w-full max-w-[110rem] px-4 py-14 relative z-10">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
        <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl" />
        {/* Simple, clean badges */}
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              Student-only housing
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              Verified .edu accounts
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              Safe transactions
            </span>
          </div>
        </div>

        {/* Enhanced headline with better typography and animations */}
        <div className={`text-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">
            Find & list{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent animate-pulse">
              student housing
            </span>{" "}
            in minutes.
            <br className="hidden md:block" />
            <div className="block mt-2 text-2xl md:text-3xl lg:text-4xl h-12 flex items-center justify-center">
              <div 
                key={currentTaglineIndex}
                className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-xl font-semibold rotating-text-glow"
                style={{
                  animation: 'fadeInUp 0.6s ease-in-out',
                  color: rotatingTaglines[currentTaglineIndex].color,
                  textShadow: rotatingTaglines[currentTaglineIndex].glow,
                  letterSpacing: '-0.5px'
                }}
              >
                {displayedText.split('').map((char, index) => (
                  <span
                    key={index}
                    className={`typing-letter inline-block ${
                      isTyping && index === displayedText.length - 1 
                        ? 'animate-pulse' 
                        : ''
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      color: rotatingTaglines[currentTaglineIndex].color,
                      textShadow: rotatingTaglines[currentTaglineIndex].glow,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </div>
          </h1>
        </div>

        {/* Enhanced functional search bar */}
        <div className={`mx-auto mt-8 max-w-3xl transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <form onSubmit={handleSearchSubmit}>
            <div className="rounded-2xl border border-white/10 bg-white/5/50 p-3 backdrop-blur-md hover:bg-white/8/50 transition-all duration-300">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101215] px-4 py-3 hover:border-white/20 focus-within:border-amber-400/50 transition-all duration-200">
                <span className="text-white/50 text-lg">⌕</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    placeholder={isSearchFocused ? "Search for properties..." : `Try: ${searchSuggestions[searchIndex]}`}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none transition-all duration-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-black hover:from-amber-400 hover:to-orange-400 transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search suggestions dropdown - positioned outside search bar container */}
        {isSearchFocused && (
          <div className="mx-auto mt-2 max-w-3xl relative">
            <div className="rounded-xl border border-white/10 bg-[#0f1115] backdrop-blur-xl shadow-2xl z-[9999] max-h-48 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-white/60 px-3 py-2 border-b border-white/10 mb-2">
                  Popular searches
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-amber-400">⌕</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced CTA section with RoommateMatches styling */}
        <div className={`mt-8 text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => {
                const propertiesGrid = document.getElementById('properties-grid');
                if (propertiesGrid) {
                  propertiesGrid.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
              className="hero-cta-button group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-bold text-black shadow-[0_12px_32px_rgba(255,153,0,.4)] hover:shadow-[0_16px_40px_rgba(255,153,0,.5)] hover:scale-105 transition-all duration-300 hover:from-orange-400 hover:to-orange-500" 
              type="button"
            >
              <span>Explore properties</span>
              <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
            </button>
            
            <button
              onClick={onListProperty}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <span className="text-lg">+</span>
              List your property
            </button>
          </div>
        </div>

        {/* Active Properties Capsule */}
        <div className={`mx-auto mt-8 flex justify-center transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/80">
              <span className="font-bold text-amber-400">
                {isCountUpVisible ? `${activePropertiesCount}+` : '0+'}
              </span>
              <span className="ml-1">Active Properties</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
