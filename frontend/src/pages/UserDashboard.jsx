import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdHome, MdShoppingBag, MdGroups, MdChat, MdSearch, MdFavorite,
  MdTrendingUp, MdVisibility, MdMessage, MdAdd, MdArrowForward,
  MdPerson, MdSettings, MdNotifications, MdHistory, MdStar,
  MdTrendingDown, MdTrendingFlat, MdMoreVert, MdRefresh,
  MdAnalytics, MdInsights, MdRecommend, MdSchedule, MdLocationOn,
  MdPhone, MdEmail, MdShare, MdBookmark, MdBookmarkBorder,
  MdThumbUp, MdThumbDown, MdComment, MdReply, MdEdit,
  MdDelete, MdWarning, MdCheckCircle, MdCancel, MdPending,
    MdAttachMoney, MdShowChart, MdTimeline, MdCompare,
  MdDashboard, MdSecurity, MdSpeed, MdLightbulb, MdRocket,
    MdBed, MdBathtub, MdSend, MdUpload, MdArrowDropDown
} from "react-icons/md";

import Navbar from "../components/Navbar/Navbar";
import PropertyDrawer from "../components/Property/PropertyDrawer";
import ListingDrawer from "../components/marketplace/ListingDrawer";
import axiosInstance from "../utils/axiosInstance";
import "../styles/newrun-hero.css";

// Multi-language Welcome Component with Typewriter Effect
const TypewriterWelcome = () => {
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const languages = [
    { text: 'Welcome', lang: 'English' },
    { text: 'स्वागतम', lang: 'Hindi' },
    { text: '欢迎', lang: 'Chinese' },
    {text: 'സ്വാഗതം',lang: 'Malayalam'},
    { text: 'مرحبا', lang: 'Arabic' },
    { text: 'Bienvenue', lang: 'French' },
    { text: 'வணக்கம்', lang: 'Tamil' },
    { text: 'స్వాగతం', lang: 'Telugu' },
    { text: 'Bienvenido', lang: 'Spanish' },
    { text: 'Willkommen', lang: 'German' },
    { text: 'ยินดีต้อนรับ', lang: 'Thai' },
    { text: 'ಸ್ವಾಗತ', lang: 'Kannada' },
    { text: 'ようこそ', lang: 'Japanese' },
    { text: '환영합니다', lang: 'Korean' }
  ];

  useEffect(() => {
    const currentLang = languages[currentLanguageIndex];
    const targetText = currentLang.text;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < targetText.length) {
          setDisplayText(targetText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000); // Wait 2 seconds before deleting
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentLanguageIndex((prev) => (prev + 1) % languages.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentLanguageIndex, languages]);

  return (
    <span 
      className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-blue-500"
      style={{ minWidth: '200px', display: 'inline-block' }}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="text-blue-400"
      >
        |
      </motion.span>
        </span>
  );
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPropertyManager, setShowPropertyManager] = useState(false);
  const [showMarketplaceManager, setShowMarketplaceManager] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
        const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
        const [showMarketplaceDrawer, setShowMarketplaceDrawer] = useState(false);
        const [agentMode, setAgentMode] = useState(false);
        const [prompt, setPrompt] = useState("");

  // Fetch user data
  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      return response?.data?.user || null;
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      return null;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get("/dashboard/overview");
      console.log("Dashboard API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Dashboard fetch failed:", error?.response?.data || error.message);
      return null;
    }
  };

  // Load dashboard data
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Check backend health
      try {
        await axiosInstance.get("/");
      } catch (error) {
        console.log("Backend health check failed:", error);
      }

      const [user, data] = await Promise.all([fetchUser(), fetchDashboardData()]);
      setUserInfo(user);

      if (data && !data.error) {
        setDashboardData(data);
      } else {
        // Set empty state if no data
        setDashboardData({
          myProperties: { 
            items: [], 
            statistics: { 
              totalProperties: 0, 
              totalViews: 0, 
              averagePrice: 0, 
              availableProperties: 0, 
              rentedProperties: 0 
            } 
          },
          myMarketplace: { 
            items: [], 
            statistics: { 
              totalItems: 0, 
              totalViews: 0, 
              totalFavorites: 0, 
              averagePrice: 0, 
              activeItems: 0, 
              soldItems: 0 
            } 
          },
          userSummary: { 
            firstName: user?.firstName || "User", 
            university: user?.university || "", 
            digest: "Welcome to your NewRun dashboard!" 
          }
        });
      }

        setNotifications([
          { id: 1, type: 'message', title: 'New message from John', time: '2 min ago', read: false },
          { id: 2, type: 'view', title: 'Your property got 5 new views', time: '1 hour ago', read: false },
          { id: 3, type: 'like', title: 'Someone liked your marketplace item', time: '3 hours ago', read: true },
          { id: 4, type: 'system', title: 'Welcome to NewRun!', time: '1 day ago', read: true }
        ]);
      } catch (error) {
      console.error("loadDashboard failed:", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (refreshing) return;
      
        setRefreshing(true);
        try {
          const data = await fetchDashboardData();
        if (data && !data.error) {
          setDashboardData(data);
        }
        } catch (error) {
          console.error("Auto-refresh failed:", error);
        } finally {
          setRefreshing(false);
        }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshing]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!dashboardData) return null;

    const properties = dashboardData.myProperties?.items || [];
    const marketplace = dashboardData.myMarketplace?.items || [];
    const pStats = dashboardData.myProperties?.statistics || {};
    const mStats = dashboardData.myMarketplace?.statistics || {};

    const totalRevenue = 
      properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0) +
      marketplace.reduce((sum, m) => sum + (Number(m.price) || 0), 0);

    const avgPropertyPrice = pStats.averagePrice || 
      (properties.length ? Math.round(properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / properties.length) : 0);

    const avgItemPrice = mStats.averagePrice || 
      (marketplace.length ? Math.round(marketplace.reduce((sum, m) => sum + (Number(m.price) || 0), 0) / marketplace.length) : 0);

    const totalViews = (Number(pStats.totalViews) || 0) + (Number(mStats.totalViews) || 0);

    return {
      totalRevenue,
      avgPropertyPrice,
      avgItemPrice,
      totalListings: (pStats.totalProperties || 0) + (mStats.totalItems || 0),
      activeListings: (pStats.availableProperties || 0) + (mStats.activeItems || 0),
      totalViews,
    };
  }, [dashboardData]);

  // Property management functions
  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyDrawer(true);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axiosInstance.delete(`/delete-property/${propertyId}`);
        // Refresh dashboard data
        const data = await fetchDashboardData();
        if (data) {
        setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to delete property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  // Marketplace item management functions
  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowMarketplaceDrawer(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this marketplace item?')) {
      try {
        await axiosInstance.delete(`/marketplace/item/${itemId}`);
        // Refresh dashboard data
        const data = await fetchDashboardData();
        if (data) {
        setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to delete marketplace item:', error);
        alert('Failed to delete marketplace item. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        </div>
        
        <Navbar />
        
        <div className="flex items-center justify-center min-h-[60vh] relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-center"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-8" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}} />
          </div>
            <p className="text-white/80 text-xl">Initializing your NewRun experience...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      </div>
      
      <Navbar />
      
      <div className="relative z-10">
        {/* Hero Section - Ultra Creative with Floating Elements */}
        <section className="nr-hero-bg nr-hero-starry relative flex min-h-[80vh] items-center overflow-hidden">
          {/* Enhanced Animated Background */}
          <div className="absolute inset-0">
            <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
            <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}} />
            <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-pink-500/8 to-rose-500/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '6s'}} />
            </div>

          <div className="mx-auto w-full max-w-[110rem] px-4 py-14 relative z-10">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
              
              {/* Left Side - Floating Conversations Widget */}
              <div className="xl:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, x: -50, rotateY: -15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  className="relative group"
                >
                  {/* Floating particles around the widget */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
                  
                   <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-all duration-300">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                         <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                           <MdChat className="text-lg text-blue-400" />
                         </div>
            <div>
                           <h3 className="text-base font-semibold text-white">My Conversations</h3>
                           <p className="text-white/60 text-xs">Recent activity</p>
            </div>
                       </div>
              <button
                         onClick={() => navigate("/messaging")}
                         className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 text-xs font-medium"
              >
                         View All
              </button>
            </div>
              <div className="space-y-2">
                       {notifications.slice(0, 3).map((n, index) => (
                         <motion.div 
                           key={n.id}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.4, delay: index * 0.1 }}
                           whileHover={{ scale: 1.01 }}
                           className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group/item"
                         >
                           <div className="relative">
                             <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs">
                               {n.title.charAt(0)}
                      </div>
                             {!n.read && (
                               <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center">
                                 <div className="w-1 h-1 bg-white rounded-full"></div>
                               </div>
                      )}
                    </div>
                           <div className="flex-1 min-w-0">
                             <div className="text-white/90 text-sm font-medium truncate">{n.title}</div>
                             <div className="text-white/60 text-xs">{n.time}</div>
                  </div>
                           <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                             <MdArrowForward className="text-blue-400 text-xs" />
                           </div>
                         </motion.div>
                ))}
              </div>
            </div>
                </motion.div>
        </div>

              {/* Center - Dynamic Hero Content */}
              <div className="xl:col-span-6">
                {/* Welcome Message */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <div className="inline-flex items-center gap-2">
                    <TypewriterWelcome />
                    <span className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white">
                      {userInfo?.firstName || "User"}!
                    </span>
        </div>
                </motion.div>

                {/* Main Headline */}
                <motion.div 
                  initial={{ opacity: 0, y: 50, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 1, delay: 0.3, type: "spring", stiffness: 100 }}
                  className="text-center mb-12"
                >
                  <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl leading-tight">
                    Manage your{" "}
                    <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                      NewRun ecosystem
                    </span>{" "}
                    from here.
                    <br className="hidden md:block" />
                    <div className="block mt-2 text-2xl md:text-3xl lg:text-4xl h-12 flex items-center justify-center">
                      <div className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-xl font-semibold">
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          Properties • Marketplace • Community
                        </span>
                </div>
                </div>
                  </h1>
                </motion.div>


                {/* Chat Input Box - Box inside box design */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mx-auto mt-12 w-full max-w-4xl"
                >
                  {/* Outer box */}
                  <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.35)] p-4">
                    {/* Inner box with textarea */}
                    <div className="relative rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm">
                      <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ask AI anything..."
                        rows={2}
                        className="w-full resize-none bg-transparent text-white/80 placeholder-white/60 text-sm leading-relaxed outline-none p-5 pr-40"
                      />
                      
                      {/* Agent Mode in top-right of inner box */}
                      <button
                        onClick={() => setAgentMode(v => !v)}
                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-white/70 hover:bg-black/60"
                      >
                        <span className="text-[7px]">⚙</span>
                        AGENT MODE
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[8px] border ${agentMode ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-white/25 text-white/60'}`}>
                          {agentMode ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Bottom controls inside inner box */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button className="inline-flex items-center justify-center rounded border border-white/25 bg-black/40 p-1.5 text-white/70 hover:bg-black/60">
                          <MdUpload className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {/* send stub */}}
                          className="inline-flex items-center gap-1 rounded border border-white/25 bg-black/40 px-2 py-1.5 text-[10px] text-white/80 hover:bg-black/60"
                        >
                          start
                          <MdArrowDropDown className="w-3 h-3" />
                        </button>
                </div>
                </div>

                    {/* Bottom toolbar outside inner box */}
                    <div className="flex items-center justify-between mt-3 px-2">
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[9px] text-white/70 hover:bg-black/60">
                          <span className="text-[7px]">◆</span>
                          Regular
                          <MdArrowDropDown className="w-3 h-3" />
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[9px] text-white/70 hover:bg-black/60">
                          <span className="text-[7px]">🧠</span>
                          GPT 4.1
                          <MdArrowDropDown className="w-3 h-3" />
                        </button>
              </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/60">Knowledge Base</span>
                        <button
                          onClick={() => setAgentMode(v => !v)}
                          className={`relative h-4 w-7 rounded-full transition-colors duration-200 ${agentMode ? 'bg-blue-500' : 'bg-white/20'}`}
                        >
                          <span
                            className={`absolute top-0.5 ${agentMode ? 'right-0.5' : 'left-0.5'} h-3 w-3 rounded-full bg-white transition-all`}
                          />
                        </button>
            </div>
          </div>
                  </div>

                </motion.div>

                {/* Floating Stats with 3D Cards */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="mx-auto mt-10 flex justify-center"
                >
                  <div className="flex items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 backdrop-blur-xl shadow-2xl">
                    <motion.div 
                      whileHover={{ scale: 1.1, y: -5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="text-sm text-white/90">
                        <span className="font-bold text-green-400 text-lg">{analytics?.totalListings || 0}</span>
                        <span className="ml-2">Listings</span>
                      </span>
                    </motion.div>
                    <div className="w-px h-6 bg-white/30"></div>
                    <motion.div 
                      whileHover={{ scale: 1.1, y: -5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                      <span className="text-sm text-white/90">
                        <span className="font-bold text-blue-400 text-lg">{analytics?.totalViews || 0}</span>
                        <span className="ml-2">Views</span>
                      </span>
                    </motion.div>
                    <div className="w-px h-6 bg-white/30"></div>
                    <motion.div 
                      whileHover={{ scale: 1.1, y: -5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                      <span className="text-sm text-white/90">
                        <span className="font-bold text-orange-400 text-lg">{analytics?.activeListings || 0}</span>
                        <span className="ml-2">Active</span>
                      </span>
                    </motion.div>
            </div>
                </motion.div>
            </div>

              {/* Right Side - Floating Profile Widget */}
              <div className="xl:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, x: 50, rotateY: 15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, rotateY: -5 }}
                  className="relative group"
                >
                  {/* Floating particles around the widget */}
                  <div className="absolute -top-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-40" style={{animationDelay: '2s'}}></div>
                  
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <MdPerson className="text-xl text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Roommate Profile</h3>
                        <p className="text-white/70 text-sm">Your Synapse profile</p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="relative w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mx-auto mb-4 flex items-center justify-center text-blue-400 font-bold text-xl"
                      >
                        {userInfo?.firstName?.charAt(0) || 'U'}
                      </motion.div>
                      <h4 className="font-semibold text-white text-lg mb-3">{userInfo?.firstName || 'User'}</h4>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 2, delay: 1 }}
                          className="bg-blue-500 h-2 rounded-full"
            />
          </div>
                      <p className="text-white/70 text-sm mb-4">Profile 75% complete</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/Synapse")}
                        className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 rounded-xl font-semibold"
                      >
                        Complete Profile
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content - Hero with Side Data Boxes */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Side - Properties */}
            <div className="xl:col-span-1">
              {dashboardData?.myProperties?.items?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 h-fit"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <MdHome className="text-xl text-green-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Your Properties</h2>
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                        {dashboardData.myProperties.items.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowPropertyManager(s => !s)}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-colors text-sm"
                    >
                      {showPropertyManager ? 'Hide' : 'Manage'}
                    </button>
                  </div>

                  {showPropertyManager && (
              <div className="space-y-4">
                      {dashboardData.myProperties.items.map((property, index) => (
                        <motion.div
                    key={property._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group relative rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{property.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MdBed className="text-green-400" />
                                  {property.bedrooms}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MdBathtub className="text-green-400" />
                                  {property.bathrooms}
                                </span>
                                <span className="text-green-400 font-medium">${Number(property.price || 0)}</span>
              </div>
                            </div>
                            <div className="flex gap-1">
                <button
                                onClick={() => handleEditProperty(property)}
                                className="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                              >
                                <MdEdit className="text-xs" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProperty(property._id)}
                                className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                <MdDelete className="text-xs" />
                </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              property.availabilityStatus === 'available' ? 'bg-green-500/20 text-green-400'
                              : property.availabilityStatus === 'rented' ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {property.availabilityStatus || 'unknown'}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </motion.div>
                      ))}
              </div>
            )}
                </motion.div>
              )}
            </div>

            {/* Center - Quick Stats & Actions */}
            <div className="xl:col-span-1 space-y-6">
              {/* Notifications */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(s => !s)}
                    className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    <MdNotifications className="text-xl text-white/80" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map(n => (
                    <div key={n.id} className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                      <div className="text-white/90 text-sm">{n.title}</div>
                      <div className="text-white/50 text-xs">{n.time}</div>
                    </div>
                ))}
              </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <MdHome className="text-lg text-green-400" />
                      </div>
                      <span className="text-white/70 text-sm">Properties</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {dashboardData?.myProperties?.statistics?.totalProperties || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <MdShoppingBag className="text-lg text-purple-400" />
                      </div>
                      <span className="text-white/70 text-sm">Marketplace Items</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {dashboardData?.myMarketplace?.statistics?.totalItems || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <MdVisibility className="text-lg text-cyan-400" />
                      </div>
                      <span className="text-white/70 text-sm">Total Views</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {(analytics?.totalViews || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                <button
                    onClick={() => setShowPropertyDrawer(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdHome className="text-blue-400" />
                    <span className="text-white text-sm">List Property</span>
                  </button>
                  
                  <button
                    onClick={() => setShowMarketplaceDrawer(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdShoppingBag className="text-purple-400" />
                    <span className="text-white text-sm">Sell Item</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/Synapse")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdGroups className="text-green-400" />
                    <span className="text-white text-sm">Find Roommate</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/solve-threads")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdSearch className="text-orange-400" />
                    <span className="text-white text-sm">Solve Threads</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/blogs")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdComment className="text-cyan-400" />
                    <span className="text-white text-sm">Write Blog</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/community")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <MdGroups className="text-pink-400" />
                    <span className="text-white text-sm">Create Thread</span>
                </button>
              </div>
        </div>
          </div>

            {/* Right Side - Marketplace */}
            <div className="xl:col-span-1">
              {dashboardData?.myMarketplace?.items?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 h-fit"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <MdShoppingBag className="text-xl text-purple-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Your Marketplace Items</h2>
                      <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                        {dashboardData.myMarketplace.items.length}
                      </span>
                  </div>
                    <button
                      onClick={() => setShowMarketplaceManager(s => !s)}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm"
                    >
                      {showMarketplaceManager ? 'Hide' : 'Manage'}
                    </button>
                </div>

                  {showMarketplaceManager && (
                    <div className="space-y-4">
                      {dashboardData.myMarketplace.items.map((item, index) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group relative rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{item.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="text-purple-400 font-medium">${Number(item.price || 0)}</span>
                                <span className="text-gray-400">{item.category}</span>
                                <span className="text-gray-400">{item.condition}</span>
                      </div>
                  </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleEditItem(item)}
                                className="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                              >
                                <MdEdit className="text-xs" />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item._id)}
                                className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                <MdDelete className="text-xs" />
                              </button>
                </div>
            </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.status === 'active' ? 'bg-green-500/20 text-green-400'
                              : item.status === 'sold' ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {item.status || 'unknown'}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <MdVisibility className="text-purple-400" />
                                {item.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MdFavorite className="text-red-400" />
                                {item.favorites || 0}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Drawers */}
        <PropertyDrawer
          isOpen={showPropertyDrawer}
          onClose={() => {
            setShowPropertyDrawer(false);
            setEditingProperty(null);
          }}
          propertyData={editingProperty}
          onPropertyCreated={() => {
            setShowPropertyDrawer(false);
            loadDashboard();
          }}
          onPropertyUpdated={() => {
            setShowPropertyDrawer(false);
            setEditingProperty(null);
            loadDashboard();
          }}
        />

        <ListingDrawer
          isOpen={showMarketplaceDrawer}
          onClose={() => {
            setShowMarketplaceDrawer(false);
            setEditingItem(null);
          }}
          itemData={editingItem}
          onItemCreated={() => {
            setShowMarketplaceDrawer(false);
            loadDashboard();
          }}
          onItemUpdated={() => {
            setShowMarketplaceDrawer(false);
            setEditingItem(null);
            loadDashboard();
          }}
        />
      </div>
    </div>
  );
}