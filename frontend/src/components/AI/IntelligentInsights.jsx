import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdLightbulb, MdSchedule, MdTrendingUp, MdWarning, MdCheckCircle,
  MdInfo, MdMoney, MdHome, MdPeople, MdChat, MdSearch, MdPerson,
  MdShoppingBag, MdEvent, MdAnalytics, MdInsights, MdRocket
} from 'react-icons/md';
import { useNewRunAI } from '../../hooks/useNewRunAI';
import { 
  readCache, 
  writeCache, 
  getCachedInsights, 
  setCachedInsights, 
  getCachedActions, 
  setCachedActions,
  invalidateUserCache 
} from '../../utils/aiCache';
import aiExplanationCache from '../../utils/aiExplanationCache';
import NewRunDrawer from '../ui/NewRunDrawer';
import PropertyGrid from './PropertyGrid';
import CompactPropertyCard from './CompactPropertyCard';
import PropertyTextParser from '../../utils/propertyTextParser';
import axiosInstance from '../../utils/axiosInstance';

/**
 * Intelligent Insights Component
 * AI-powered helper that provides personalized insights, recommendations, and predictions
 * Uses OpenAI GPT-4o intelligence to analyze user data and generate actionable advice
 */
const IntelligentInsights = ({ userInfo, dashboardData, onboardingData }) => {
  const navigate = useNavigate();
  const { 
    loading, 
    error: aiError, 
    generateInsights, 
    generateActions, 
    generateTimeline, 
    generateMarketAnalysis,
    generatePredictions,
    explainInsight
  } = useNewRunAI();

  // Optimized state management
  const [state, setState] = useState({
    aiInsights: [],
    aiActions: [],
    aiTimeline: null,
    aiMarketAnalysis: null,
    aiPredictions: null,
    isLoading: false,
    isInitialized: false,
    error: null
  });

  const { aiInsights, aiActions, aiTimeline, aiMarketAnalysis, aiPredictions, isLoading, isInitialized, error } = state;

  // Drawer state for detailed AI insights
  const [showInsightDrawer, setShowInsightDrawer] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Helper functions for polished UI
  const scoreColor = (p) =>
    p === 'high' ? 'bg-red-500/20 text-red-300' :
    p === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
    'bg-green-500/20 text-green-300';

  const toTasks = (tl) => {
    // Flexible normalizer
    if (!tl) return [];
    if (Array.isArray(tl.items)) return tl.items;
    const list = [];
    if (Array.isArray(tl.criticalTasks)) {
      tl.criticalTasks.forEach(t => list.push({ label: t, priority: 'high' }));
    }
    if (typeof tl.timeline === 'string') {
      // naive split to bullets if the model returned a paragraph
      tl.timeline.split(/[\n•-]+/).map(s => s.trim()).filter(Boolean).forEach(s => {
        if (!list.find(x => x.label === s)) list.push({ label: s, priority: 'medium' });
      });
    }
    return list;
  };

  const pct = (num, den) => (den ? Math.round((num/den)*100) : 0);

  // Memoized initialization check
  const shouldInitialize = useMemo(() => {
    return userInfo && dashboardData && !isInitialized;
  }, [userInfo, dashboardData, isInitialized]);

  // Initialize AI data when component mounts - OPTIMIZED
  useEffect(() => {
    if (shouldInitialize) {
      initializeAIData();
    }
  }, [shouldInitialize]);

  // Request deduplication map
  const requestMap = useRef(new Map());
  
  // OPTIMIZED: Memoized AI data initialization with smart caching, staleness control, and request deduplication
  const initializeAIData = useCallback(async () => {
    const userId = userInfo?.id || 'anonymous';
    const userData = { userInfo, dashboardData, onboardingData };
    
    // Check smart cache first
    const cachedInsights = getCachedInsights(userId, userData);
    const cachedActions = getCachedActions(userId, userData);
    
    if (cachedInsights && cachedActions) {
      console.log('🎯 Using cached AI data for insights and actions');
      setState(prev => ({ 
        ...prev, 
        aiInsights: cachedInsights,
        aiActions: cachedActions,
        isInitialized: true 
      })); 
      return; 
    }

    // Request deduplication - prevent multiple simultaneous calls
    const requestKey = `ai-data-${userId}`;
    if (requestMap.current.has(requestKey)) {
      console.log('🔄 Request already in progress, waiting...');
      return requestMap.current.get(requestKey);
    }

    const requestPromise = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // COMBINE ALL USER DATA for rich AI context
        const enrichedUserData = {
          ...userInfo,
          onboardingData: onboardingData || {},
          dashboardStats: {
            propertiesCount: dashboardData?.propertiesCount || 0,
            marketplaceCount: dashboardData?.marketplaceCount || 0,
            averagePropertyPrice: dashboardData?.propertiesStats?.averagePrice || 0,
            totalViews: dashboardData?.propertiesStats?.totalViews || 0,
            availableProperties: dashboardData?.propertiesStats?.availableProperties || 0,
            marketplaceItems: dashboardData?.marketplaceStats?.totalItems || 0,
            marketplaceViews: dashboardData?.marketplaceStats?.totalViews || 0
          },
          userProperties: dashboardData?.myProperties?.items || [],
          userMarketplaceItems: dashboardData?.myMarketplace?.items || []
        };

        console.log('🤖 Starting AI data generation with enriched data...', { 
          enrichedUserData, 
          originalUserInfo: userInfo,
          onboardingData,
          dashboardData 
        });
        
        // OPTIMIZED: Only call essential AI endpoints, not all 5
        const [insights, actions] = await Promise.allSettled([
          generateInsights(enrichedUserData, dashboardData),
          generateActions(enrichedUserData)
        ]);

        console.log('🤖 AI Results:', { insights, actions });

        // Debug: Log raw AI responses
        if (insights.status === 'fulfilled') {
          console.log('🤖 Raw Insights Response:', insights.value);
        }
        if (actions.status === 'fulfilled') {
          console.log('🤖 Raw Actions Response:', actions.value);
        }

        // Transform data with error handling
        const transformedInsights = transformInsights(
          insights.status === 'fulfilled' ? insights.value : []
        );
        const transformedActions = transformActions(
          actions.status === 'fulfilled' ? actions.value : []
        );

        console.log('🤖 Transformed Data:', { transformedInsights, transformedActions });

        const newState = {
          aiInsights: transformedInsights,
          aiActions: transformedActions,
          aiTimeline: null, // Load on demand
          aiMarketAnalysis: null, // Load on demand
          aiPredictions: null, // Load on demand
          isLoading: false,
          isInitialized: true,
          error: null
        };

        setState(newState);

        // Cache the results with smart cache utility
        setCachedInsights(userId, userData, transformedInsights);
        setCachedActions(userId, userData, transformedActions);

        return newState;
      } catch (err) {
        console.error('AI Initialization Error:', err);
        const errorState = { 
          isLoading: false, 
          error: `AI Service Error: ${err.message || 'Unknown error'}`,
          isInitialized: true 
        };
        setState(prev => ({ ...prev, ...errorState }));
        throw err;
      } finally {
        // Clean up request map
        requestMap.current.delete(requestKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    requestMap.current.set(requestKey, requestPromise);
    return requestPromise;
  }, [userInfo, dashboardData, generateInsights, generateActions]);

  // Helper to extract and normalize JSON from AI responses
  const extractJSONArray = (raw) => {
    if (!raw) return null;

    console.log('🔍 extractJSONArray input:', raw);

    // Already an array?
    if (Array.isArray(raw)) {
      console.log('🔍 Returning array as-is:', raw);
      return raw;
    }

    // If object, try common containers or wrap
    if (typeof raw === 'object') {
      console.log('🔍 Object keys:', Object.keys(raw));
      if (Array.isArray(raw.insights)) {
        console.log('🔍 Found insights array:', raw.insights);
        return raw.insights;
      }
      if (Array.isArray(raw.actions)) {
        console.log('🔍 Found actions array:', raw.actions);
        return raw.actions;
      }
      if (Array.isArray(raw.items)) {
        console.log('🔍 Found items array:', raw.items);
        return raw.items;
      }
      if (Array.isArray(raw.data)) {
        console.log('🔍 Found data array:', raw.data);
        return raw.data;
      }
      console.log('🔍 Wrapping single object in array:', [raw]);
      return [raw];
    }

    // If string, strip code fences and parse
    if (typeof raw === 'string') {
      let text = raw.trim();

      // Grab fenced block if present
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (m) text = m[1].trim();

      // Some LLMs prefix "json" before the payload
      if (/^json\s*[\[\{]/i.test(text)) {
        text = text.replace(/^json\s*/i, '');
      }

      // Try parse
      try {
        const parsed = JSON.parse(text);
        return extractJSONArray(parsed); // recurse to normalize shape
      } catch (e) {
        console.warn('AI JSON parse failed, showing fallback.', e, { text });
        return null;
      }
    }

    return null;
  };

  // OPTIMIZED: Memoized transformation functions
  const transformInsights = useCallback((rawInsights) => {
    const normalized = extractJSONArray(rawInsights) || [];

    if (normalized.length === 0) {
      return [
        {
          type: 'info',
          title: 'Welcome to NewRun!',
          message: 'Complete your onboarding to get personalized AI insights and recommendations.',
          action: 'Complete onboarding',
          priority: 'high',
          icon: 'lightbulb'
        },
        {
          type: 'success',
          title: 'Get Started',
          message: 'List your first property or browse available housing options.',
          action: 'Browse properties',
          priority: 'medium',
          icon: 'home'
        }
      ];
    }

    return normalized.map((insight) => ({
      type: insight.type || 'info',
      title: insight.title || 'AI Insight',
      message: insight.message || 'Personalized recommendation available.',
      action: insight.action || 'Learn more',
      priority: insight.priority || 'medium',
      icon: insight.icon || 'lightbulb',
    }));
  }, []);

  // OPTIMIZED: Memoized actions transformation
  const transformActions = useCallback((rawActions) => {
    const normalized = extractJSONArray(rawActions) || [];

    if (normalized.length === 0) {
      return [
        {
          label: 'List Property',
          description: 'Add a new property listing',
          path: '/dashboard',
          icon: 'home',
          color: 'blue',
          priority: 'high'
        },
        {
          label: 'Browse Properties',
          description: 'Find your perfect place',
          path: '/all-properties',
          icon: 'search',
          color: 'green',
          priority: 'high'
        },
        {
          label: 'Find Roommate',
          description: 'Connect with potential roommates',
          path: '/Synapsematches',
          icon: 'people',
          color: 'purple',
          priority: 'medium'
        },
        {
          label: 'Browse Marketplace',
          description: 'Shop for essentials',
          path: '/marketplace',
          icon: 'shopping',
          color: 'orange',
          priority: 'medium'
        }
      ];
    }

    return normalized.map((a) => ({
      label: a.label || a.title || 'AI Action',
      description: a.description || a.subtitle || a.label || 'Personalized action available',
      path: a.path || a.href || '#',
      icon: a.icon || 'home',
      color: a.color || 'blue',
      priority: a.priority || 'medium',
    }));
  }, []);

  const getIconComponent = (iconName) => {
    const iconMap = {
      schedule: MdSchedule,
      money: MdMoney,
      home: MdHome,
      people: MdPeople,
      lightbulb: MdLightbulb,
      warning: MdWarning,
      check: MdCheckCircle,
      info: MdInfo,
      chat: MdChat,
      search: MdSearch,
      person: MdPerson,
      shopping: MdShoppingBag,
      event: MdEvent,
      analytics: MdAnalytics,
      insights: MdInsights,
      rocket: MdRocket,
      // Add more mappings for common AI responses
      groups: MdPeople,
      shopping_bag: MdShoppingBag,
      home_work: MdHome,
      schedule_send: MdSchedule,
      money_off: MdMoney,
      lightbulb_outline: MdLightbulb,
      warning_amber: MdWarning,
      check_circle: MdCheckCircle,
      info_outline: MdInfo,
      chat_bubble: MdChat,
      search_icon: MdSearch,
      person_outline: MdPerson,
      event_available: MdEvent,
      analytics_outlined: MdAnalytics,
      insights_outlined: MdInsights,
      rocket_launch: MdRocket
    };
    
    
    return iconMap[iconName] || MdLightbulb;
  };

  const getTypeStyles = (type) => {
    const styles = {
      urgent: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
      warning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
      success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
      info: 'border-slate-500/30 bg-slate-500/5 text-slate-300'
    };
    return styles[type] || styles.info;
  };


  // Typewriter effect for AI explanation
  const typewriterEffect = useCallback((text, speed = 15) => {
    if (!text) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, []);

  // Cleanup typewriter effect on unmount
  useEffect(() => {
    return () => {
      // Cleanup any running timers
      setIsTyping(false);
      setDisplayedText('');
    };
  }, []);

  // OPTIMIZED: Robust CTA-based navigation with analytics
  const handleInsightClick = useCallback(async (insight) => {
    // Open drawer for detailed insight view
    setSelectedInsight(insight);
    setShowInsightDrawer(true);
    setIsExplaining(true);
    setAiExplanation(null);
    setDisplayedText('');
    setIsTyping(false);

    try {
      // Check cache first
      const userId = userInfo?.id || 'anonymous';
      const insightId = insight.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
      const userData = { userInfo, dashboardData, onboardingData };
      
      const cachedExplanation = aiExplanationCache.getCachedExplanation(userId, insightId, userData);
      
      if (cachedExplanation) {
        // Use cached explanation
        console.log('🎯 Using cached AI explanation');
        setAiExplanation({
          explanation: cachedExplanation,
          insight: insight,
          aiGenerated: true,
          cached: true
        });
        
        // Start typewriter effect with cached content
        typewriterEffect(cachedExplanation);
        setIsExplaining(false);
        return;
      }

      // Cache miss - make API call
      console.log('❌ Cache miss - making API call');
      const explanation = await explainInsight(insight, dashboardData);
      setAiExplanation(explanation);
      
      // Cache the new explanation
      if (explanation?.explanation) {
        aiExplanationCache.setCachedExplanation(userId, insightId, userData, explanation.explanation);
        
        // Start typewriter effect
        typewriterEffect(explanation.explanation);
      }
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      // Set fallback explanation
      const fallbackExplanation = `This recommendation is important for your success. ${insight.title} is a ${insight.priority} priority that will help you stay on track with your goals.`;
      setAiExplanation({
        explanation: fallbackExplanation,
        insight: insight,
        aiGenerated: false,
        fallback: true
      });
      
      // Start typewriter effect for fallback
      typewriterEffect(fallbackExplanation);
    } finally {
      setIsExplaining(false);
    }
  }, [explainInsight, dashboardData, typewriterEffect, userInfo, onboardingData]);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setShowInsightDrawer(false);
    setSelectedInsight(null);
    setAiExplanation(null);
    setIsExplaining(false);
    setDisplayedText('');
    setIsTyping(false);
  }, []);

  // OPTIMIZED: Memoized action click handler
  const handleActionClick = useCallback((action) => {
    if (action.path && action.path !== '#') {
      navigate(action.path);
    } else {
      const fallbackMap = {
        'List Property': () => navigate('/dashboard'), // Will open property drawer
        'Browse Properties': () => navigate('/all-properties'),
        'Find Roommate': () => navigate('/Synapse'),
        'Browse Marketplace': () => navigate('/marketplace'),
        'AI Action': () => navigate('/dashboard')
      };
      
      const fallback = fallbackMap[action.label] || (() => navigate('/dashboard'));
      fallback();
    }
  }, [navigate]);

  const getPriorityStyles = (priority) => {
    const styles = {
      high: 'ring-2 ring-orange-500/50',
      medium: 'ring-1 ring-blue-500/30',
      low: 'ring-1 ring-gray-500/20'
    };
    return styles[priority] || styles.medium;
  };

  // Handle loading and error states at the end to avoid hooks rule violations

  // OPTIMIZED: Memoized render conditions
  const shouldShowInsights = useMemo(() => aiInsights.length > 0, [aiInsights.length]);
  const shouldShowActions = useMemo(() => aiActions.length > 0, [aiActions.length]);
  
  // OPTIMIZED: Accessibility and motion preferences
  const prefersReducedMotion = useMemo(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  
  const motionProps = useMemo(() => ({
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 20 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    transition: prefersReducedMotion ? {} : { duration: 0.6 },
    whileHover: prefersReducedMotion ? {} : { scale: 1.02, y: -2 },
    whileTap: prefersReducedMotion ? {} : { scale: 0.98 }
  }), [prefersReducedMotion]);

  // Handle error state in render logic instead of early return

  // Handle loading and error states with conditional rendering
  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-white/70">NewRun AI is analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3 mb-2">
          <MdWarning className="text-red-400 text-xl" />
          <h3 className="text-lg font-bold text-red-400">AI Service Error</h3>
        </div>
        <p className="text-red-300 text-sm">{error}</p>
        <button 
          onClick={initializeAIData}
          className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <MdLightbulb className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
              <p className="text-white/60 text-sm">Generating personalized recommendations...</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* AI-Powered Insights */}
        {shouldShowInsights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <MdLightbulb className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
              <p className="text-white/60 text-sm">Personalized recommendations powered by GPT-4o</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => {
              // Safety check - ensure insight is a proper object
              if (!insight || typeof insight !== 'object') {
                console.warn('Invalid insight object:', insight);
                return null;
              }
              
              const IconComponent = getIconComponent(insight.icon);
              return (
                <motion.div
                  key={index}
                        {...motionProps}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                        onClick={() => handleInsightClick(insight)}
                        onMouseEnter={() => setHoveredInsight(index)}
                        onMouseLeave={() => setHoveredInsight(null)}
                        className={`p-5 rounded-xl border transition-all duration-300 ${
                          insight.action === 'Learn more' && insight.type === 'info' 
                            ? 'cursor-default' 
                            : 'cursor-pointer'
                        } ${
                          insight.type === 'urgent' ? 'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10' :
                          insight.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' :
                          insight.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' :
                          'border-slate-500/30 bg-slate-500/5 hover:bg-slate-500/10'
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${insight.title}: ${insight.message}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleInsightClick(insight);
                          }
                        }}
                      >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      insight.type === 'urgent' ? 'bg-orange-500/10' :
                      insight.type === 'warning' ? 'bg-amber-500/10' :
                      insight.type === 'success' ? 'bg-emerald-500/10' :
                      'bg-slate-500/10'
                    }`}>
                      <IconComponent className="text-xl text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-bold text-white text-base" dangerouslySetInnerHTML={{ 
          __html: insight.title?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*Title:\s*"(.*?)"\*/g, '<strong>$1</strong>').replace(/\*Priority:\*\*/g, '').replace(/\*Message:\*\*/g, '').replace(/\*Action:\*\*/g, '') || 'AI Insight'
        }}></h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          insight.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          insight.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {insight.priority?.toUpperCase()}
                        </span>
                      </div>
        <p className="text-white/80 text-sm mb-4 leading-relaxed" dangerouslySetInnerHTML={{ 
          __html: insight.message?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*Title:\s*"(.*?)"\*/g, '<strong>$1</strong>').replace(/\*Priority:\*\*/g, '').replace(/\*Message:\*\*/g, '').replace(/\*Action:\*\*/g, '') || 'Personalized recommendation available.'
        }}></p>
                            <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300">
                              <span>{insight.cta?.label || 'Learn more'}</span>
                              <span>→</span>
                            </div>
                              
                            </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Arrival Timeline */}
      {aiTimeline && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <MdSchedule className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Arrival Checklist</h3>
              <p className="text-white/60 text-sm">Personalized tasks & timing</p>
            </div>
          </div>

          {(() => {
            const tasks = toTasks(aiTimeline).map((t, i) => ({ id: i, done: !!t.done, priority: t.priority || 'medium', dueInDays: t.dueInDays, cta: t.cta, label: t.label || String(t)}));
            const done = tasks.filter(t => t.done).length;
            const progress = pct(done, tasks.length);

            return (
              <>
                {/* progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Progress</span>
                    <span className="text-white/70 text-sm">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* tasks */}
                <ul className="space-y-2">
                  {tasks.map(t => (
                    <li key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] p-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={t.done} readOnly className="accent-blue-500 w-4 h-4" />
                        <span className="text-white/90 text-sm">{t.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${scoreColor(t.priority)}`}>
                          {t.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof t.dueInDays === 'number' && (
                          <span className="text-xs text-white/60">
                            {t.dueInDays <= 0 ? 'Due now' : `Due in ${t.dueInDays}d`}
                          </span>
                        )}
                        {t.cta?.route && (
                          <button onClick={() => handleInsightClick({ cta: t.cta })}
                                  className="text-xs px-2 py-1 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10">
                            {t.cta.label || 'Open'}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* recommendations */}
                {aiTimeline.recommendations && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h4 className="text-blue-300 text-sm font-semibold mb-1">Recommendations</h4>
                    {Array.isArray(aiTimeline.recommendations) ? (
                      <ul className="list-disc list-inside text-blue-200/90 text-xs space-y-1">
                        {aiTimeline.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    ) : (
                      <p className="text-blue-200/90 text-xs">{aiTimeline.recommendations}</p>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* AI-Powered Actions */}
      {shouldShowActions && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
              <MdRocket className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI-Recommended Actions</h3>
              <p className="text-white/60 text-sm">Smart actions tailored to your profile</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiActions.map((action, index) => {
              // Safety check - ensure action is a proper object
              if (!action || typeof action !== 'object') {
                console.warn('Invalid action object:', action);
                return null;
              }
              
              const IconComponent = getIconComponent(action.icon);
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleActionClick(action)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    action.color === 'blue' ? 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20' :
                    action.color === 'green' ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20' :
                    action.color === 'purple' ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20' :
                    action.color === 'orange' ? 'border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20' :
                    'border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    action.color === 'blue' ? 'bg-blue-500/20' :
                    action.color === 'green' ? 'bg-green-500/20' :
                    action.color === 'purple' ? 'bg-purple-500/20' :
                    action.color === 'orange' ? 'bg-orange-500/20' :
                    'bg-gray-500/20'
                  }`}>
                    <IconComponent className="text-xl text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-bold text-base mb-1">{action.label}</h4>
                    <p className="text-white/70 text-sm">{action.description}</p>
                  </div>
                  <div className="text-white/60">
                    →
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI-Powered Timeline */}
      {aiTimeline && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <MdSchedule className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Arrival Timeline</h3>
              <p className="text-white/60 text-sm">Smart timeline based on your profile</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5">
              <h4 className="text-white font-semibold text-sm mb-2">Timeline Overview</h4>
              <p className="text-white/70 text-xs">
                {typeof aiTimeline.timeline === 'string' 
                  ? aiTimeline.timeline 
                  : JSON.stringify(aiTimeline.timeline, null, 2)
                }
              </p>
            </div>
            
            {aiTimeline.criticalTasks && (
              <div className="space-y-2">
                <h4 className="text-white font-semibold text-sm">Critical Tasks</h4>
                {aiTimeline.criticalTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/70 text-xs">
                    <MdCheckCircle className="text-green-400" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            )}
            
            {aiTimeline.recommendations && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <h4 className="text-blue-400 font-semibold text-sm mb-1">AI Recommendations</h4>
                <p className="text-blue-300 text-xs">
                  {typeof aiTimeline.recommendations === 'string' 
                    ? aiTimeline.recommendations 
                    : JSON.stringify(aiTimeline.recommendations, null, 2)
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Market Analysis */}
      {aiMarketAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <MdAnalytics className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Market Analysis</h3>
              <p className="text-white/60 text-sm">Intelligent market insights and trends</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiMarketAnalysis.budgetAnalysis && (
              <div className="p-3 rounded-lg bg-white/5">
                <h4 className="text-white font-semibold text-sm mb-1">Budget Analysis</h4>
                <p className="text-white/70 text-xs">
                  {typeof aiMarketAnalysis.budgetAnalysis === 'string' 
                    ? aiMarketAnalysis.budgetAnalysis 
                    : JSON.stringify(aiMarketAnalysis.budgetAnalysis, null, 2)
                  }
                </p>
              </div>
            )}
            
            {aiMarketAnalysis.trends && (
              <div className="p-3 rounded-lg bg-white/5">
                <h4 className="text-white font-semibold text-sm mb-1">Market Trends</h4>
                <p className="text-white/70 text-xs">
                  {typeof aiMarketAnalysis.trends === 'string' 
                    ? aiMarketAnalysis.trends 
                    : JSON.stringify(aiMarketAnalysis.trends, null, 2)
                  }
                </p>
              </div>
            )}
            
            {aiMarketAnalysis.recommendations && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-green-400 font-semibold text-sm mb-1">AI Recommendations</h4>
                <p className="text-green-300 text-xs">
                  {typeof aiMarketAnalysis.recommendations === 'string' 
                    ? aiMarketAnalysis.recommendations 
                    : JSON.stringify(aiMarketAnalysis.recommendations, null, 2)
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Success Predictions */}
      {aiPredictions && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500">
              <MdInsights className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Success Predictions</h3>
              <p className="text-white/60 text-sm">Predictive analytics for your success</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-white/70 text-sm">Overall Success Score</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                aiPredictions.overallScore === 'excellent' ? 'bg-green-500/20 text-green-400' :
                aiPredictions.overallScore === 'good' ? 'bg-blue-500/20 text-blue-400' :
                aiPredictions.overallScore === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {aiPredictions.overallScore?.toUpperCase() || 'ANALYZING'}
              </span>
            </div>
            
            {aiPredictions.predictions && (
              <div className="p-3 rounded-lg bg-white/5">
                <h4 className="text-white font-semibold text-sm mb-1">Predictions</h4>
                <p className="text-white/70 text-xs">
                  {typeof aiPredictions.predictions === 'string' 
                    ? aiPredictions.predictions 
                    : JSON.stringify(aiPredictions.predictions, null, 2)
                  }
                </p>
              </div>
            )}
            
            {aiPredictions.recommendations && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <h4 className="text-blue-400 font-semibold text-sm mb-1">Success Recommendations</h4>
                <p className="text-blue-300 text-xs">
                  {typeof aiPredictions.recommendations === 'string' 
                    ? aiPredictions.recommendations 
                    : JSON.stringify(aiPredictions.recommendations, null, 2)
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Market Analysis */}
      {aiMarketAnalysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <MdAnalytics className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Market Snapshot</h3>
              <p className="text-white/60 text-sm">Budget fit • Trends • Moves</p>
            </div>
          </div>

          {(() => {
            const m = aiMarketAnalysis;
            const trends = Array.isArray(m.trends) ? m.trends : (typeof m.trends === 'string' ? m.trends.split(/[,•\n]+/).map(s=>s.trim()).filter(Boolean) : []);
            const recs = Array.isArray(m.recommendations) ? m.recommendations : (typeof m.recommendations === 'string' ? [m.recommendations] : []);
            const budgetText = typeof m.budgetAnalysis === 'string' ? m.budgetAnalysis : JSON.stringify(m.budgetAnalysis);
            const score = (m.marketScore || 'good').toUpperCase();
            const scoreClass =
              m.marketScore === 'excellent' ? 'bg-green-500/20 text-green-300' :
              m.marketScore === 'good' ? 'bg-blue-500/20 text-blue-300' :
              m.marketScore === 'fair' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300';

            return (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-white/60 text-xs mb-1">Budget Fit</div>
                    <div className="text-white/90 text-sm">{budgetText}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-white/60 text-xs mb-1">Score</div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${scoreClass}`}>{score}</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-white/60 text-xs mb-1">Best Move</div>
                    <div className="text-white/90 text-sm">{recs[0] || 'Explore listings this week'}</div>
                  </div>
                </div>

                {/* Trends */}
                {trends.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-white font-semibold text-sm mb-2">Trends</h4>
                    <div className="flex flex-wrap gap-2">
                      {trends.slice(0, 8).map((t, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {recs.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <h4 className="text-green-300 text-sm font-semibold mb-1">What to do</h4>
                    <ul className="list-disc list-inside text-green-200/90 text-xs space-y-1">
                      {recs.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Predictions */}
      {aiPredictions && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500">
              <MdInsights className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Success Outlook</h3>
              <p className="text-white/60 text-sm">Predictions • Risks • Tips</p>
            </div>
          </div>

          {(() => {
            const p = aiPredictions;
            const scoreMap = { excellent: 95, good: 75, fair: 55, 'needs-improvement': 35 };
            const sPct = scoreMap[p.overallScore] ?? 50;

            const risks = Array.isArray(p.risks) ? p.risks : (typeof p.risks === 'string' ? p.risks.split(/[,•\n]+/).map(s=>s.trim()).filter(Boolean) : []);
            const succ = Array.isArray(p.successFactors) ? p.successFactors : (typeof p.successFactors === 'string' ? p.successFactors.split(/[,•\n]+/).map(s=>s.trim()).filter(Boolean) : []);
            const recs = Array.isArray(p.recommendations) ? p.recommendations : (typeof p.recommendations === 'string' ? [p.recommendations] : []);

            return (
              <>
                {/* score bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Overall Score: {p.overallScore?.toUpperCase() || '—'}</span>
                    <span className="text-white/70 text-sm">{sPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full">
                    <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${sPct}%` }} />
                  </div>
                </div>

                {/* chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {succ.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                      <div className="text-white/60 text-xs mb-2">Success Factors</div>
                      <div className="flex flex-wrap gap-2">
                        {succ.slice(0,8).map((c,i)=><span key={i} className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px]">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {risks.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                      <div className="text-white/60 text-xs mb-2">Risks</div>
                      <div className="flex flex-wrap gap-2">
                        {risks.slice(0,8).map((c,i)=><span key={i} className="px-2 py-1 rounded-full bg-red-500/10 text-red-300 text-[11px]">{c}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* recommendations */}
                {recs.length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h4 className="text-blue-300 text-sm font-semibold mb-1">Recommendations</h4>
                    <ul className="list-disc list-inside text-blue-200/90 text-xs space-y-1">
                      {recs.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* NewRun Drawer for Detailed AI Insights */}
      <NewRunDrawer
        isOpen={showInsightDrawer}
        onClose={handleDrawerClose}
        title="AI Insight Details"
        width="w-[500px]"
        maxWidth="max-w-xl"
      >
        {selectedInsight && (
          <div className="flex flex-col h-full">
            {/* ChatGPT-style AI Message */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {isExplaining ? (
                  <div className="flex items-center gap-3 py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <span className="text-white/70">AI is analyzing your situation...</span>
                  </div>
                ) : aiExplanation ? (
                  <div className="prose prose-invert max-w-none">
                    {/* AI Message with Smart Property Cards */}
                    <div className="space-y-6">
                      {/* AI Explanation Text - KEEP THE MAIN MESSAGE */}
                      <div 
                        className="whitespace-pre-wrap text-white/90 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{ 
                          __html: (displayedText || '')
                            // Fix all markdown patterns
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*Title:\s*"(.*?)"\*/g, '<strong>$1</strong>')
                            .replace(/\*Priority:\*\*/g, '')
                            .replace(/\*Message:\*\*/g, '')
                            .replace(/\*Action:\*\*/g, '')
                            // Remove S3 URLs and references
                            .replace(/https:\/\/newrun-property-images\.s3\.us-east-1\.amazonaws\.com\/[^\s\)]+/g, '')
                            .replace(/\[Check it out here\.\]/g, '')
                            .replace(/\[See the image\.\]/g, '')
                            .replace(/\[Property Image\]/g, '')
                            // Clean up any remaining markdown artifacts
                            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                            .replace(/\*\*/g, '')
                            .replace(/\*/g, '') + 
                          (isTyping ? '<span class="inline-block w-2 h-5 bg-white/90 ml-1 animate-pulse"></span>' : '')
                        }}
                      ></div>
                      
                      {/* Smart Property Cards - ONLY SHOW AFTER TYPING IS COMPLETE */}
                      {!isTyping && (() => {
                        // Automatically detect properties from AI text
                        const detectedProperties = PropertyTextParser.parsePropertiesFromText(displayedText);
                        
                        if (detectedProperties.length > 0) {
                          return (
                            <div className="mt-6">
                              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                Recommended Properties
                              </h3>
                              {/* VERTICAL STACKING WITH COMPACT CARDS */}
                              <div className="space-y-3">
                                {detectedProperties.map((property, index) => (
                                  <CompactPropertyCard
                                    key={property.id}
                                    property={property}
                                    index={index}
                                    isRecommended={index === 0}
                                    onClick={(property) => {
                                      console.log('Property clicked:', property);
                                      // Handle property click - could open contact form, booking flow, etc.
                                    }}
                                    showContactActions={false}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Next Steps Section - ONLY SHOW AFTER CARDS ARE DISPLAYED */}
                      {!isTyping && (() => {
                        const detectedProperties = PropertyTextParser.parsePropertiesFromText(displayedText);
                        if (detectedProperties.length > 0) {
                          return (
                            <div className="mt-6 p-4 bg-slate-500/5 border border-slate-500/20 rounded-lg">
                              <h4 className="text-white font-semibold text-sm mb-3">For next steps:</h4>
                              <div className="space-y-2 text-white/80 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">•</span>
                                  <span>Decide which property best fits your needs and reach out to schedule a viewing.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">•</span>
                                  <span>Consider who you'd like to share with, as these options are perfect for roommates.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">•</span>
                                  <span>Prepare any questions you have about each property or the leasing process.</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    {/* Show specific recommendations if available */}
                    {selectedInsight?.hasSpecificRecommendations && selectedInsight?.specificRecommendations && (
                      <div className="mt-6 space-y-4">
                        <div className="border-t border-white/10 pt-4">
                          <h3 className="text-lg font-semibold text-white mb-4">🎯 Specific Recommendations Found</h3>
                          
                          {/* Properties - Beautiful Property Cards */}
                          {selectedInsight.specificRecommendations.recommendations?.properties && (
                            <div className="mb-6">
                              <PropertyGrid
                                properties={selectedInsight.specificRecommendations.recommendations.properties}
                                title="🏠 AI-Recommended Properties"
                                subtitle="Properties perfectly matched to your budget and preferences"
                                onPropertyClick={(property) => {
                                  console.log('Property clicked:', property);
                                  // Handle property click - could open property details, contact form, etc.
                                }}
                                maxDisplay={6}
                                showRecommendations={true}
                              />
                            </div>
                          )}
                          
                          {/* Roommates - Enhanced Cards */}
                          {selectedInsight.specificRecommendations.recommendations?.roommates && (
                            <div className="mb-6">
                              <h4 className="text-md font-medium text-purple-300 mb-3">👥 Compatible Roommates ({selectedInsight.specificRecommendations.recommendations.roommates.length})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedInsight.specificRecommendations.recommendations.roommates.slice(0, 4).map((roommate, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-4 hover:border-purple-500/40 transition-all duration-300"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h5 className="font-bold text-white text-lg">{roommate.firstName} {roommate.lastName}</h5>
                                        <p className="text-white/70 text-sm">{roommate.major} • {roommate.university}</p>
                                    </div>
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-purple-400">{roommate.compatibilityScore}%</div>
                                        <div className="text-xs text-white/60">match</div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                      <div className="flex items-center gap-2 text-sm text-white/60">
                                      <span>💰 Budget: ${roommate.onboardingData?.budgetRange?.min}-${roommate.onboardingData?.budgetRange?.max}</span>
                                    </div>
                                      {roommate.languageMatch && (
                                        <div className="flex items-center gap-2 text-sm text-green-400">
                                          <span>🗣️ Same language</span>
                                        </div>
                                    )}
                                  </div>
                                    
                                    {roommate.recommendation && (
                                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                        <p className="text-purple-300 text-sm leading-relaxed">{roommate.recommendation}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Best Matches */}
                          {selectedInsight.specificRecommendations.recommendations?.bestMatches && (
                            <div className="mb-6">
                              <h4 className="text-md font-medium text-green-300 mb-3">✨ Perfect Property + Roommate Pairs</h4>
                              <div className="space-y-3">
                                {selectedInsight.specificRecommendations.recommendations.bestMatches.slice(0, 2).map((match, index) => (
                                  <div key={index} className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-white">{match.property.title} + {match.roommate.firstName}</h5>
                                      <span className="text-green-400 font-semibold">Save ${Math.round(match.savings)}/mo</span>
                                    </div>
                                    <p className="text-white/70 text-sm mb-2">{match.recommendation}</p>
                                    <div className="flex items-center gap-4 text-sm text-white/60">
                                      <span>🏠 {match.property.bedrooms} bed • ${match.property.price}/mo</span>
                                      <span>👥 {match.roommate.firstName} • {match.pairScore}% compatibility</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <p className="text-white/70">Loading AI explanation...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cursor-style Input Box */}
            <div className="border-t border-white/10 bg-[#0f1115]">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-colors">
                    <span className="text-xs">∞</span>
                    <span>Agent AI</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors">
                    <span>Auto</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative">
                  <textarea
                    placeholder="Ask AI about this insight or get more personalized advice..."
                    className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    rows="3"
                    style={{ minHeight: '80px' }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </NewRunDrawer>
    </div>
  );
};

// OPTIMIZED: Memoized component to prevent unnecessary re-renders
export default memo(IntelligentInsights);
