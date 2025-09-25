import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdLightbulb, MdSchedule, MdTrendingUp, MdWarning, MdCheckCircle,
  MdInfo, MdMoney, MdHome, MdPeople, MdChat, MdSearch, MdPerson,
  MdShoppingBag, MdEvent, MdAnalytics, MdInsights, MdRocket
} from 'react-icons/md';
import { useNewRunAI } from '../../hooks/useNewRunAI';
import { readCache, writeCache } from '../../utils/aiCache';
import NewRunDrawer from '../ui/NewRunDrawer';
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
    generatePredictions 
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
      // Clear cache for testing - remove this in production
      const cacheKey = `insights-${userInfo?.id || 'anon'}`;
      localStorage.removeItem(`ai-cache-${cacheKey}`);
      console.log('🧹 Cleared AI cache for fresh data');
      
      initializeAIData();
    }
  }, [shouldInitialize]);

  // Request deduplication map
  const requestMap = useRef(new Map());
  
  // OPTIMIZED: Memoized AI data initialization with smart caching, staleness control, and request deduplication
  const initializeAIData = useCallback(async () => {
    // Check cache with TTL and onboarding version
    const cacheKey = `insights-${userInfo?.id || 'anon'}`;
    const obVer = onboardingData?.updatedAt || JSON.stringify(onboardingData || {});
    const cached = readCache(cacheKey, { maxAgeMs: 5*60*1000, obVer }); // 5min TTL for testing
    
    if (cached) { 
      setState(prev => ({ ...prev, ...cached, isInitialized: true })); 
      return; 
    }

    // Request deduplication - prevent multiple simultaneous calls
    if (requestMap.current.has(cacheKey)) {
      console.log('🔄 Request already in progress, waiting...');
      return requestMap.current.get(cacheKey);
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
        writeCache(cacheKey, {
          aiInsights: transformedInsights,
          aiActions: transformedActions
        }, { obVer, ver: "insights-v3" });

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
        requestMap.current.delete(cacheKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    requestMap.current.set(cacheKey, requestPromise);
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
          path: '/Synapse',
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
      urgent: 'border-red-500/50 bg-red-500/10 text-red-400',
      warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
      success: 'border-green-500/50 bg-green-500/10 text-green-400',
      info: 'border-blue-500/50 bg-blue-500/10 text-blue-400'
    };
    return styles[type] || styles.info;
  };


  // OPTIMIZED: Robust CTA-based navigation with analytics
  const handleInsightClick = useCallback((insight) => {
    // Open drawer for detailed insight view
    setSelectedInsight(insight);
    setShowInsightDrawer(true);
  }, []);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setShowInsightDrawer(false);
    setSelectedInsight(null);
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
                        className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                          insight.action === 'Learn more' && insight.type === 'info' 
                            ? 'cursor-default' 
                            : 'cursor-pointer'
                        } ${
                          insight.type === 'urgent' ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20' :
                          insight.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20' :
                          insight.type === 'success' ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20' :
                          'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
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
                      insight.type === 'urgent' ? 'bg-red-500/20' :
                      insight.type === 'warning' ? 'bg-yellow-500/20' :
                      insight.type === 'success' ? 'bg-green-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <IconComponent className="text-xl text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-bold text-white text-base">{insight.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {insight.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-4 leading-relaxed">{insight.message}</p>
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
        size="lg"
      >
        {selectedInsight && (
          <div className="space-y-6">
            {/* Insight Header */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedInsight.type === 'urgent' ? 'bg-red-500/20' :
                selectedInsight.type === 'warning' ? 'bg-yellow-500/20' :
                selectedInsight.type === 'success' ? 'bg-green-500/20' :
                'bg-blue-500/20'
              }`}>
                {(() => {
                  const IconComponent = getIconComponent(selectedInsight.icon);
                  return <IconComponent className="text-2xl text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedInsight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    selectedInsight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {selectedInsight.priority?.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedInsight.type === 'urgent' ? 'bg-red-500/20 text-red-300' :
                    selectedInsight.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                    selectedInsight.type === 'success' ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {selectedInsight.type?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">{selectedInsight.message}</p>
              </div>
            </div>

            {/* Rationale Section */}
            {selectedInsight.rationale && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-2">Why you're seeing this</h4>
                <p className="text-white/70 text-sm">{selectedInsight.rationale}</p>
              </div>
            )}

            {/* CTA Section */}
            {selectedInsight.cta && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-3">Recommended Action</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const route = selectedInsight.cta?.route;
                      if (route) {
                        const search = selectedInsight.cta?.params ? `?${new URLSearchParams(selectedInsight.cta.params)}` : '';
                        navigate(`${route}${search}`);
                        handleDrawerClose();
                      }
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    {selectedInsight.cta.label || 'Take Action'}
                  </button>
                  <span className="text-white/60 text-sm">
                    {selectedInsight.cta.route || 'Dashboard'}
                  </span>
                </div>
              </div>
            )}

            {/* Expiration Info */}
            {selectedInsight.expiresAt && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm">
                  ⏰ This insight expires on {new Date(selectedInsight.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}

          </div>
        )}
      </NewRunDrawer>
    </div>
  );
};

// OPTIMIZED: Memoized component to prevent unnecessary re-renders
export default memo(IntelligentInsights);
