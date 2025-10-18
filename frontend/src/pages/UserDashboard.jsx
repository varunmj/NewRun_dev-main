import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
    MdBed, MdBathtub, MdSend, MdUpload, MdArrowDropDown, MdEvent
} from "react-icons/md";

import Navbar from "../components/Navbar/Navbar";
import PropertyDrawer from "../components/Property/PropertyDrawer";
import ListingDrawer from "../components/marketplace/ListingDrawer";
import { useUnifiedState } from "../context/UnifiedStateContext";
import IntelligentInsights from "../components/AI/IntelligentInsights";
import AIRoommateInsights from "../components/AI/AIRoommateInsights";
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
  
  // Use unified state management
  const {
    userInfo,
    dashboardData,
    onboardingData,
    conversations,
    synapseProfile,
    aiInsights,
    aiActions,
    aiTimeline,
    aiMarketAnalysis,
    aiPredictions,
    loading,
    errors,
    isFullyInitialized,
    hasAnyErrors,
    isLoading,
    refreshAll,
    refreshUserData,
    refreshDashboardData,
    refreshConversations,
    refreshSynapseProfile,
    refreshAIData,
    invalidateCache,
    calculateProfileCompletion
  } = useUnifiedState();

  // Debug logging
  console.log('UserDashboard: useUnifiedState result:', {
    userInfo: !!userInfo,
    dashboardData: !!dashboardData,
    onboardingData: !!onboardingData,
    aiInsights: !!aiInsights,
    aiActions: !!aiActions,
    loading,
    errors,
    isFullyInitialized,
    isLoading
  });

  // Local UI state
  const [localState, setLocalState] = useState({
    notifications: [],
    showNotifications: false,
    refreshing: false,
    showPropertyManager: false,
    showMarketplaceManager: false,
    editingProperty: null,
    editingItem: null,
    showPropertyDrawer: false,
    showMarketplaceDrawer: false,
    agentMode: false,
    prompt: "",
    debugMode: localStorage.getItem('debug_mode') === 'true'
  });

  // Destructure local state
  const {
    notifications, showNotifications, refreshing,
    showPropertyManager, showMarketplaceManager, editingProperty, editingItem,
    showPropertyDrawer, showMarketplaceDrawer, agentMode, prompt, debugMode
  } = localState;

  // Update local state
  const updateLocalState = useCallback((updates) => {
    setLocalState(prev => ({ ...prev, ...updates }));
  }, []);

  // Get AI actions from unified state
  const actionsLoading = loading.ai;

  // Get current actions (AI or fallback)
  const getCurrentActions = useCallback(() => {
    return (aiActions && aiActions.length > 0) ? aiActions : getStaticActions();
  }, [aiActions]);

  // Get current insights (AI or fallback)
  const getCurrentInsights = useCallback(() => {
    return (aiInsights && aiInsights.length > 0) ? aiInsights : getPersonalizedInsights();
  }, [aiInsights]);


  // Enhanced static fallback actions with specific descriptions
  const getStaticActions = () => {
    if (!onboardingData) {
      return [
        { 
          label: "Verify Email for Access", 
          icon: MdCheckCircle, 
          path: "/dashboard", 
          color: "from-blue-500 to-cyan-500",
          description: "Complete email verification to unlock all NewRun features and personalized recommendations."
        },
        { 
          label: "Explore Housing Options", 
          icon: MdHome, 
          path: "/all-properties", 
          color: "from-indigo-500 to-blue-500",
          description: "Browse AI-recommended properties based on your budget and location preferences."
        },
        { 
          label: "Connect with Roommates", 
          icon: MdGroups, 
          path: "/Synapse", 
          color: "from-purple-500 to-pink-500",
          description: "Complete your Synapse profile to find compatible roommates and potential housing partners."
        },
        { 
          label: "Browse Community", 
          icon: MdChat, 
          path: "/community", 
          color: "from-orange-500 to-red-500",
          description: "Join university community discussions and connect with fellow students."
        }
      ];
    }

    const focus = onboardingData.focus;
    const arrivalDate = onboardingData.arrivalDate;
    const budgetRange = onboardingData.budgetRange;
    const actions = [];

    // Calculate days until arrival for personalized messaging
    let daysUntilArrival = null;
    if (arrivalDate) {
      daysUntilArrival = Math.ceil((new Date(arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
    }

    // Priority actions based on timing and focus
    if (daysUntilArrival && daysUntilArrival <= 30) {
      actions.push({ 
        label: "Secure Housing Immediately", 
        icon: MdHome, 
        path: "/all-properties", 
        color: "from-red-500 to-orange-500",
        description: `Only ${daysUntilArrival} days until arrival! Browse available properties and secure housing quickly.`
      });
    }

    if (focus === 'Housing' || focus === 'Everything') {
      actions.push({ 
        label: "Find Your Perfect Home", 
        icon: MdSearch, 
        path: "/all-properties", 
        color: "from-indigo-500 to-blue-500",
        description: `Browse ${budgetRange ? `properties within $${budgetRange.min}-$${budgetRange.max}` : 'available properties'} near your university.`
      });
      
      actions.push({ 
        label: "Connect with Roommates", 
        icon: MdGroups, 
        path: "/Synapse", 
        color: "from-purple-500 to-pink-500",
        description: "Complete your Synapse profile to find compatible roommates and split housing costs."
      });
    }

    if (focus === 'Roommate' || focus === 'Everything') {
      actions.push({ 
        label: "Complete Synapse Profile", 
        icon: MdPerson, 
        path: "/Synapse", 
        color: "from-rose-500 to-pink-500",
        description: "Complete your detailed profile to unlock AI-powered roommate matching and personalized recommendations."
      });
    }

    if (focus === 'Essentials' || focus === 'Everything') {
      actions.push({ 
        label: "Prepare for Essentials", 
        icon: MdShoppingBag, 
        path: "/marketplace", 
        color: "from-green-500 to-emerald-500",
        description: "Create a checklist of essential items you'll need for your university transition and campus life."
      });
    }

    if (focus === 'Community' || focus === 'Everything') {
      actions.push({ 
        label: "Join University Community", 
        icon: MdChat, 
        path: "/community", 
        color: "from-orange-500 to-red-500",
        description: "Connect with fellow students, ask questions, and get advice from the university community."
      });
    }

    // Add essential actions
    actions.push({ 
      label: "Establish Bank Account", 
      icon: MdAttachMoney, 
      path: "/dashboard", 
      color: "from-emerald-500 to-green-500",
      description: "Set up a local bank account for easy financial management during your studies."
    });

    return actions.slice(0, 6); // Limit to 6 actions
  };

  // AI actions are automatically managed by unified state

  // Get current actions (AI or fallback) - now handled by getCurrentActions

  // Generate personalized insights based on user data
  const getPersonalizedInsights = () => {
    if (!onboardingData) return [];

    const insights = [];
    const focus = onboardingData.focus;
    const arrivalDate = onboardingData.arrivalDate;
    const budgetRange = onboardingData.budgetRange;

    // Time-based insights
    if (arrivalDate) {
      const daysUntilArrival = Math.ceil((new Date(arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilArrival > 0 && daysUntilArrival <= 30) {
        insights.push({
          type: "urgent",
          title: "Arrival Approaching!",
          message: `${daysUntilArrival} days until you arrive in ${onboardingData.city || 'your city'}`,
          action: "Complete your housing search",
          icon: MdSchedule
        });
      }
    }

    // Budget-based insights
    if (budgetRange && budgetRange.max) {
      const avgPrice = dashboardData?.propertiesStats?.averagePrice || 0;
      if (avgPrice > budgetRange.max) {
        insights.push({
          type: "warning",
          title: "Budget Alert",
          message: `Average property price ($${avgPrice}) exceeds your budget ($${budgetRange.max})`,
          action: "Consider expanding your search",
          icon: MdWarning
        });
      }
    }

    // Focus-based insights
    if (focus === 'Housing') {
      insights.push({
        type: "success",
        title: "Housing Focus",
        message: "We're prioritizing your housing search",
        action: "View recommended properties",
        icon: MdHome
      });
    }

    return insights;
  };

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
  const loadDashboard = useCallback(async () => {
    console.log('🔄 Loading dashboard data...');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log('❌ No authentication token found, redirecting to login');
        navigate("/login");
        return;
      }

      console.log('✅ Authentication token found');

      // Check backend health
      try {
        const healthCheck = await axiosInstance.get("/");
        console.log('✅ Backend health check passed:', healthCheck.data);
      } catch (error) {
        console.error("❌ Backend health check failed:", error);
        // Don't return here, continue with dashboard loading
      }

      console.log('📊 Fetching dashboard data...');
      const [user, data] = await Promise.all([fetchUser(), fetchDashboardData()]);
      
      console.log('👤 User data:', user);
      console.log('📊 Dashboard data:', data);

      if (data && !data.error) {
        console.log('✅ Dashboard data loaded successfully');
      } else {
        console.log('⚠️ Dashboard data has errors or is empty');
      }

    } catch (error) {
      console.error("❌ loadDashboard failed:", error);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Listen for authentication changes and refresh data
  useEffect(() => {
    const handleAuthChange = (event) => {
      if (event.detail?.type === 'login') {
        console.log('🔄 Dashboard: Login detected, refreshing data...');
        // Small delay to ensure token is available
        setTimeout(() => {
          refreshAll();
        }, 200);
      }
    };

    window.addEventListener('authStateChange', handleAuthChange);
    return () => window.removeEventListener('authStateChange', handleAuthChange);
  }, [refreshAll]);

  // Auto-refresh every 30 seconds with proper cleanup
  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const refreshData = async () => {
      if (document.visibilityState !== "visible") return;
      if (refreshing) return;
      
      updateLocalState({ refreshing: true });
      try {
        const data = await fetchDashboardData();
        if (data && !data.error && isMounted) {
          updateLocalState({ dashboardData: data });
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      } finally {
        if (isMounted) {
          updateLocalState({ refreshing: false });
        }
      }
    };

    intervalId = setInterval(refreshData, 30000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshing, updateLocalState]);

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
  const handleEditProperty = useCallback((property) => {
    updateLocalState({ editingProperty: property, showPropertyDrawer: true });
  }, [updateLocalState]);

  const handleDeleteProperty = useCallback(async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axiosInstance.delete(`/delete-property/${propertyId}`);
        // Refresh dashboard data using unified state
        await refreshDashboardData();
        // Invalidate cache
        invalidateCache('property_deleted');
      } catch (error) {
        console.error('Failed to delete property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  }, [refreshDashboardData, invalidateCache]);

  // Marketplace item management functions
  const handleEditItem = useCallback((item) => {
    updateLocalState({ editingItem: item, showMarketplaceDrawer: true });
  }, [updateLocalState]);

  const handleDeleteItem = useCallback(async (itemId) => {
    if (window.confirm('Are you sure you want to delete this marketplace item?')) {
      try {
        await axiosInstance.delete(`/marketplace/item/${itemId}`);
        // Refresh dashboard data using unified state
        await refreshDashboardData();
        // Invalidate cache
        invalidateCache('marketplace_item_deleted');
      } catch (error) {
        console.error('Failed to delete marketplace item:', error);
        alert('Failed to delete marketplace item. Please try again.');
      }
    }
  }, [refreshDashboardData, invalidateCache]);

  // Force refresh if user data is missing but we have a token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !userInfo && !loading.user && !isLoading) {
      console.log('🔄 Dashboard: Token found but no user data, forcing refresh...');
      refreshUserData();
    }
  }, [userInfo, loading.user, isLoading, refreshUserData]);

  // Safety check for loading state - moved to end to fix hooks order violation
  if (isLoading && !isFullyInitialized) {
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
                           <p className="text-white/60 text-xs">
                             {loading.conversations 
                               ? 'Loading...' 
                               : conversations && conversations.length > 0 
                                 ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
                                 : 'No conversations yet'
                             }
                           </p>
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
                {loading.conversations ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-white/60 text-xs ml-2">Loading conversations...</span>
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  conversations.slice(0, 4).map((conversation, index) => {
                    // Get other participants (excluding current user)
                    const otherParticipants = conversation.participants?.filter(p => p._id !== userInfo?._id) || [];
                    const participantName = otherParticipants.length > 0 
                      ? `${otherParticipants[0].firstName} ${otherParticipants[0].lastName}`
                      : 'Unknown User';
                    
                    // Get last message info
                    const lastMessage = conversation.lastMessage;
                    const messagePreview = lastMessage?.content || 'No messages yet';
                    const messageTime = lastMessage?.timestamp 
                      ? new Date(lastMessage.timestamp).toLocaleDateString()
                      : new Date(conversation.lastUpdated).toLocaleDateString();
                    
                    return (
                      <motion.div 
                        key={conversation._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => navigate(`/messaging?conversation=${conversation._id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group/item cursor-pointer"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs">
                            {participantName.charAt(0)}
                          </div>
                          {lastMessage && !lastMessage.isRead && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white/90 text-sm font-medium truncate">{participantName}</div>
                          <div className="text-white/60 text-xs truncate">{messagePreview}</div>
                          <div className="text-white/50 text-xs">{messageTime}</div>
                        </div>
                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <MdArrowForward className="text-blue-400 text-xs" />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <MdChat className="text-2xl text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-xs">No conversations yet</p>
                    <p className="text-white/40 text-xs mt-1">Start a conversation with someone!</p>
                    <button
                      onClick={() => navigate("/messaging")}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-200 text-xs font-medium"
                    >
                      Start Chatting
                    </button>
                  </div>
                )}
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
                      {userInfo?.firstName}!
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


                {/* Debug Mode Toggle (Hidden) */}
                {!debugMode && (
                  <div className="mx-auto mt-4 w-full max-w-4xl text-center">
                    <button
                      onClick={() => {
                        localStorage.setItem('debug_mode', 'true');
                        updateLocalState({ debugMode: true });
                      }}
                      className="text-white/20 hover:text-white/40 text-xs transition-colors"
                      title="Enable debug mode"
                    >
                      🔧
                    </button>
                  </div>
                )}


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
                        onChange={e => updateLocalState({ prompt: e.target.value })}
                        placeholder="Ask AI anything..."
                        rows={2}
                        className="w-full resize-none bg-transparent text-white/80 placeholder-white/60 text-sm leading-relaxed outline-none p-5 pr-40"
                      />
                      
                      {/* Agent Mode in top-right of inner box */}
                      <button
                        onClick={() => updateLocalState({ agentMode: !agentMode })}
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
                          onClick={() => updateLocalState({ agentMode: !agentMode })}
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
                      {loading.synapse ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <span className="text-white/60 text-sm ml-2">Loading profile...</span>
                        </div>
                      ) : (
                        <>
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 mx-auto mb-4 flex items-center justify-center text-blue-400 font-bold text-2xl overflow-hidden"
                          >
                            {userInfo?.avatar ? (
                              <img
                                src={userInfo.avatar}
                                alt={`${userInfo?.firstName || 'User'} avatar`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full flex items-center justify-center ${
                                userInfo?.avatar ? 'hidden' : 'flex'
                              }`}
                            >
                              {userInfo?.firstName?.charAt(0) || 'U'}
                            </div>
                          </motion.div>
                          <h4 className="font-semibold text-white text-lg mb-3">{userInfo?.firstName || 'User'}</h4>
                          
                          {(() => {
                            const completionPercentage = calculateProfileCompletion(synapseProfile);
                            return (
                              <>
                                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercentage}%` }}
                                    transition={{ duration: 2, delay: 1 }}
                                    className="bg-blue-500 h-2 rounded-full"
                                  />
                                </div>
                                <p className="text-white/70 text-sm mb-2">
                                  Profile {completionPercentage}% complete
                                </p>
                                
                                {completionPercentage < 100 && (
                                  <div className="text-xs text-white/50 mb-4">
                                    {completionPercentage === 0 && "Start by adding your preferences"}
                                    {completionPercentage > 0 && completionPercentage < 50 && "Add more details to find better matches"}
                                    {completionPercentage >= 50 && completionPercentage < 100 && "Almost there! Complete a few more sections"}
                                  </div>
                                )}
                                
                                {completionPercentage < 100 ? (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate("/Synapse")}
                                    className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-bold text-black shadow-[0_12px_32px_rgba(255,153,0,.4)] hover:shadow-[0_16px_40px_rgba(255,153,0,.5)] hover:scale-105 transition-all duration-300 hover:from-orange-400 hover:to-orange-500 w-full justify-center"
                                  >
                                    <span>{completionPercentage === 0 ? 'Start Profile' : 'Complete Profile'}</span>
                                    <div className="w-3 h-3 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                                  </motion.button>
                                ) : (
                                  <div className="space-y-2">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => navigate("/Synapse")}
                                      className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-bold text-black shadow-[0_12px_32px_rgba(255,153,0,.4)] hover:shadow-[0_16px_40px_rgba(255,153,0,.5)] hover:scale-105 transition-all duration-300 hover:from-orange-400 hover:to-orange-500 w-full justify-center"
                                    >
                                      <span>View Profile</span>
                                      <div className="w-3 h-3 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                      </div>
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => navigate("/roommate-matches")}
                                      className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200 w-full justify-center"
                                    >
                                      <span className="text-base">+</span>
                                      Find Matches
                                    </motion.button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Powered Dashboard Section */}
        {onboardingData && (
          <section className="mx-auto max-w-7xl px-4 py-8">
            <IntelligentInsights 
              userInfo={userInfo} 
              dashboardData={dashboardData} 
              onboardingData={onboardingData}
            />
          </section>
        )}

        {/* AI Roommate Matching Section */}
        {onboardingData && userInfo?.synapse && (
          <section className="mx-auto max-w-7xl px-4 py-8">
            <AIRoommateInsights 
              userInfo={userInfo} 
              dashboardData={dashboardData} 
              onboardingData={onboardingData}
            />
          </section>
        )}

        {/* Debug Panel */}
        {debugMode && (
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <MdSettings className="text-xl text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400">Debug Mode</h3>
                    <p className="text-yellow-300/70 text-sm">Developer tools and testing utilities</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('debug_mode', 'false');
                      updateLocalState({ debugMode: false });
                    }}
                    className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg font-medium hover:bg-yellow-500/30 transition-colors text-sm"
                  >
                    Disable Debug
                  </button>
                  <button
                    onClick={() => navigate('/onboarding?force=true')}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    Test Onboarding
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      onClick={() => updateLocalState({ showPropertyManager: !showPropertyManager })}
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
                    onClick={() => updateLocalState({ showNotifications: !showNotifications })}
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

              {/* AI-Powered Quick Actions */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MdRocket className="text-xl text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">AI-Recommended Actions</h3>
                      <p className="text-xs text-white/60">Smart actions tailored to your profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {actionsLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    )}
                    {onboardingData && (
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                        {aiActions.length > 0 ? 'AI-Powered' : `Personalized for ${onboardingData.focus}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {actionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="text-white/70 text-sm">AI is generating personalized actions...</span>
                      </div>
                    </div>
                  ) : (
                    getCurrentActions().map((action, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (action.label === "List Property" || action.path === "/dashboard") {
                            updateLocalState({ showPropertyDrawer: true });
                          } else if (action.label === "List Item" || action.path === "/add-item") {
                            updateLocalState({ showMarketplaceDrawer: true });
                          } else {
                            navigate(action.path);
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-gradient-to-r ${action.color} hover:bg-white/10 transition-all duration-300`}
                      >
                        <action.icon className="text-white" />
                        <div className="flex-1 text-left">
                          <span className="text-white text-sm font-medium">{action.label}</span>
                          {action.description && (
                            <p className="text-white/70 text-xs">{action.description}</p>
                          )}
                        </div>
                      </motion.button>
                    ))
                  )}
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
                      onClick={() => updateLocalState({ showMarketplaceManager: !showMarketplaceManager })}
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
            updateLocalState({ showPropertyDrawer: false, editingProperty: null });
          }}
          propertyData={editingProperty}
          onPropertyCreated={() => {
            updateLocalState({ showPropertyDrawer: false });
            loadDashboard();
          }}
          onPropertyUpdated={() => {
            updateLocalState({ showPropertyDrawer: false, editingProperty: null });
            loadDashboard();
          }}
        />

        <ListingDrawer
          isOpen={showMarketplaceDrawer}
          onClose={() => {
            updateLocalState({ showMarketplaceDrawer: false, editingItem: null });
          }}
          itemData={editingItem}
          onItemCreated={() => {
            updateLocalState({ showMarketplaceDrawer: false });
            loadDashboard();
          }}
          onItemUpdated={() => {
            updateLocalState({ showMarketplaceDrawer: false, editingItem: null });
            loadDashboard();
          }}
        />
      </div>

    </div>
  );
}