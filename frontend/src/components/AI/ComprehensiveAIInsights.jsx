/**
 * Comprehensive AI Insights Component
 * Complete AI-powered student life management
 * CEO-level implementation with all student life aspects
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdHome, MdMoney, MdSchool, MdDirectionsBus, MdHealthAndSafety,
  MdWork, MdPeople, MdEvent, MdLightbulb, MdSchedule, MdTrendingUp,
  MdWarning, MdCheckCircle, MdInfo, MdChat, MdSearch, MdPerson,
  MdShoppingBag, MdAnalytics, MdInsights, MdRocket, MdLibraryBooks,
  MdFavorite, MdEventAvailable, MdLocalLibrary, MdFitnessCenter,
  MdRestaurant, MdDirectionsCar, MdPublic, MdGroup, MdStar
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
import axiosInstance from '../../utils/axiosInstance';

/**
 * Comprehensive AI Insights Component
 * AI-powered helper covering all aspects of student life
 */
const ComprehensiveAIInsights = ({ userInfo, dashboardData, onboardingData }) => {
  
  const { 
    loading, 
    error: aiError, 
    generateInsights, 
    generateActions, 
    explainInsight
  } = useNewRunAI();

  // Enhanced state management for comprehensive insights
  const [state, setState] = useState({
    aiInsights: [],
    aiActions: [],
    isLoading: false,
    isInitialized: false,
    error: null,
    categories: {
      housing: [],
      financial: [],
      academic: [],
      transportation: [],
      wellness: [],
      career: [],
      social: [],
      campusLife: []
    }
  });

  const { aiInsights, aiActions, isLoading, isInitialized, error, categories } = state;

  // Drawer state for detailed AI insights
  const [showInsightDrawer, setShowInsightDrawer] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Category icons mapping
  const categoryIcons = {
    housing: MdHome,
    financial: MdMoney,
    academic: MdSchool,
    transportation: MdDirectionsBus,
    wellness: MdHealthAndSafety,
    career: MdWork,
    social: MdPeople,
    campusLife: MdEvent
  };

  // Category colors mapping
  const categoryColors = {
    housing: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
    financial: 'border-green-500/30 bg-green-500/5 text-green-300',
    academic: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
    transportation: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
    wellness: 'border-pink-500/30 bg-pink-500/5 text-pink-300',
    career: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300',
    social: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300',
    campusLife: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300'
  };

  // Helper functions
  const scoreColor = (p) =>
    p === 'high' ? 'bg-red-500/20 text-red-300' :
    p === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
    'bg-green-500/20 text-green-300';

  // Memoized initialization check
  const shouldInitialize = useMemo(() => {
    return userInfo && dashboardData && !isInitialized;
  }, [userInfo, dashboardData, isInitialized]);

  // Initialize comprehensive AI data
  useEffect(() => {
    if (shouldInitialize) {
      initializeComprehensiveAIData();
    }
  }, [shouldInitialize]);

  // Request deduplication map
  const requestMap = useRef(new Map());
  
  // Comprehensive AI data initialization
  const initializeComprehensiveAIData = useCallback(async () => {
    const userId = userInfo?.id || 'anonymous';
    const userData = { userInfo, dashboardData, onboardingData };
    
    // Check smart cache first
    const cachedInsights = getCachedInsights(userId, userData);
    const cachedActions = getCachedActions(userId, userData);
    
    if (cachedInsights && cachedActions) {
      console.log('🎯 Using cached comprehensive AI data');
      setState(prev => ({ 
        ...prev, 
        aiInsights: cachedInsights,
        aiActions: cachedActions,
        isInitialized: true 
      })); 
      return; 
    }

    // Request deduplication
    const requestKey = `comprehensive-ai-data-${userId}`;
    if (requestMap.current.has(requestKey)) {
      console.log('🔄 Comprehensive AI request already in progress, waiting...');
      return requestMap.current.get(requestKey);
    }

    const requestPromise = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Call comprehensive AI insights endpoint
        const response = await axiosInstance.post('/api/ai/comprehensive-insights', {
          userData,
          dashboardData
        });

        const { insights, actions, categories: responseCategories } = response.data;
        
        // Transform and categorize insights
        const transformedInsights = transformComprehensiveInsights(insights);
        const transformedActions = transformComprehensiveActions(actions);
        
        // Categorize insights
        const categorizedInsights = categorizeInsights(transformedInsights);
        
        const newState = {
          aiInsights: transformedInsights,
          aiActions: transformedActions,
          categories: categorizedInsights,
          isLoading: false,
          isInitialized: true,
          error: null
        };
        
        setState(prev => ({ ...prev, ...newState }));
        
        // Cache the results
        setCachedInsights(userId, userData, transformedInsights);
        setCachedActions(userId, userData, transformedActions);
        
        return newState;
      } catch (err) {
        console.error('Comprehensive AI Initialization Error:', err);
        const errorState = { 
          isLoading: false, 
          error: `AI Service Error: ${err.message || 'Unknown error'}`,
          isInitialized: true 
        };
        setState(prev => ({ ...prev, ...errorState }));
        throw err;
      } finally {
        requestMap.current.delete(requestKey);
      }
    })();

    requestMap.current.set(requestKey, requestPromise);
    return requestPromise;
  }, [userInfo, dashboardData, generateInsights, generateActions]);

  // Transform comprehensive insights
  const transformComprehensiveInsights = useCallback((rawInsights) => {
    if (!Array.isArray(rawInsights)) return [];
    
    return rawInsights.map(insight => ({
      ...insight,
      id: insight.id || `${insight.category}-${Date.now()}`,
      category: insight.category || 'general',
      icon: insight.icon || getCategoryIcon(insight.category),
      priority: insight.priority || 'medium',
      type: insight.type || 'info'
    }));
  }, []);

  // Transform comprehensive actions
  const transformComprehensiveActions = useCallback((rawActions) => {
    if (!Array.isArray(rawActions)) return [];
    
    return rawActions.map(action => ({
      ...action,
      id: action.id || `action-${Date.now()}`,
      category: action.category || 'general',
      icon: action.icon || getCategoryIcon(action.category),
      priority: action.priority || 'medium'
    }));
  }, []);

  // Categorize insights by category
  const categorizeInsights = useCallback((insights) => {
    const categorized = {
      housing: [],
      financial: [],
      academic: [],
      transportation: [],
      wellness: [],
      career: [],
      social: [],
      campusLife: []
    };
    
    insights.forEach(insight => {
      const category = insight.category || 'general';
      if (categorized[category]) {
        categorized[category].push(insight);
      }
    });
    
    return categorized;
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((category) => {
    return categoryIcons[category] || MdLightbulb;
  }, []);

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

  // Handle insight click
  const handleInsightClick = useCallback(async (insight) => {
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
        console.log('🎯 Using cached AI explanation');
        setAiExplanation({
          explanation: cachedExplanation,
          insight: insight,
          aiGenerated: true,
          cached: true
        });
        
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
        typewriterEffect(explanation.explanation);
      }
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      const fallbackExplanation = `This recommendation is important for your success. ${insight.title} is a ${insight.priority} priority that will help you stay on track with your goals.`;
      setAiExplanation({
        explanation: fallbackExplanation,
        insight: insight,
        aiGenerated: false,
        fallback: true
      });
      
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

  // Handle action click
  const handleActionClick = useCallback((action) => {
    if (action.path && action.path !== '#') {
      navigate(action.path);
    } else {
      const fallbackMap = {
        'Housing': () => navigate('/all-properties'),
        'Finance': () => navigate('/finance'),
        'Academic': () => navigate('/academic'),
        'Transportation': () => navigate('/transport'),
        'Wellness': () => navigate('/wellness'),
        'Career': () => navigate('/career'),
        'Social': () => navigate('/community'),
        'Campus Life': () => navigate('/campus-life')
      };
      
      const fallback = fallbackMap[action.label] || (() => navigate('/dashboard'));
      fallback();
    }
  }, [navigate]);

  // Get priority styles
  const getPriorityStyles = (priority) => {
    const styles = {
      high: 'ring-2 ring-orange-500/50',
      medium: 'ring-1 ring-blue-500/30',
      low: 'ring-1 ring-gray-500/20'
    };
    return styles[priority] || styles.medium;
  };

  // Render category section
  const renderCategorySection = (category, insights, title, description) => {
    if (insights.length === 0) return null;
    
    const IconComponent = categoryIcons[category] || MdLightbulb;
    const colorClass = categoryColors[category] || 'border-slate-500/30 bg-slate-500/5 text-slate-300';
    
    return (
      <motion.div 
        key={category}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <IconComponent className="text-xl text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-white/60 text-sm">{description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const InsightIcon = getCategoryIcon(insight.category);
            return (
              <motion.div
                key={insight.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleInsightClick(insight)}
                onMouseEnter={() => setHoveredInsight(index)}
                onMouseLeave={() => setHoveredInsight(null)}
                className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  colorClass
                } hover:bg-white/10`}
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
                    colorClass.replace('border-', 'bg-').replace('/30', '/10')
                  }`}>
                    <InsightIcon className="text-xl text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-bold text-white text-base">{insight.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        insight.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        insight.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {insight.priority?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mb-4 leading-relaxed">
                      {insight.message}
                    </p>
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
    );
  };

  // Handle loading and error states
  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-white/70">NewRun AI is analyzing your complete student life...</span>
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
          onClick={initializeComprehensiveAIData}
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
              <h3 className="text-lg font-bold text-white">Comprehensive AI Insights</h3>
              <p className="text-white/60 text-sm">Generating personalized recommendations for all aspects of your student life...</p>
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
      {/* Comprehensive AI Insights */}
      {Object.entries(categories).map(([category, insights]) => {
        if (insights.length === 0) return null;
        
        const categoryTitles = {
          housing: 'Housing & Living',
          financial: 'Financial Planning',
          academic: 'Academic Success',
          transportation: 'Transportation',
          wellness: 'Health & Wellness',
          career: 'Career Development',
          social: 'Social Life',
          campusLife: 'Campus Life'
        };
        
        const categoryDescriptions = {
          housing: 'AI-powered housing recommendations and roommate matching',
          financial: 'Smart budgeting and financial optimization',
          academic: 'Course planning and academic success strategies',
          transportation: 'Route optimization and transportation planning',
          wellness: 'Health tracking and wellness recommendations',
          career: 'Career planning and professional development',
          social: 'Social connections and community building',
          campusLife: 'Campus involvement and university life'
        };
        
        return renderCategorySection(
          category,
          insights,
          categoryTitles[category] || category,
          categoryDescriptions[category] || 'AI-powered recommendations'
        );
      })}

      {/* AI Insight Drawer */}
      <NewRunDrawer
        isOpen={showInsightDrawer}
        onClose={handleDrawerClose}
        title="AI Insight Details"
        size="lg"
      >
        {selectedInsight && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                {React.createElement(getCategoryIcon(selectedInsight.category), { 
                  className: "text-xl text-white" 
                })}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                <p className="text-white/60 text-sm">
                  {selectedInsight.category?.toUpperCase()} • {selectedInsight.priority?.toUpperCase()} Priority
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Recommendation</h4>
                <p className="text-white/80 leading-relaxed">{selectedInsight.message}</p>
              </div>
              
              {aiExplanation && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">AI Explanation</h4>
                  <div className="bg-white/5 rounded-lg p-4">
                    {isExplaining ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-white/70">AI is analyzing...</span>
                      </div>
                    ) : (
                      <div className="text-white/80 leading-relaxed">
                        {displayedText}
                        {isTyping && <span className="animate-pulse">|</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedInsight.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                    selectedInsight.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {selectedInsight.priority?.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleDrawerClose}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </NewRunDrawer>
    </div>
  );
};

export default memo(ComprehensiveAIInsights);

