/**
 * AI Roommate Insights Component
 * Using housing AI concept as template
 * CEO-level implementation for comprehensive roommate matching
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdPeople, MdPerson, MdGroup, MdChat, MdSearch, MdFavorite,
  MdTrendingUp, MdVisibility, MdMessage, MdAdd, MdArrowForward,
  MdHome, MdMoney, MdSchool, MdDirectionsBus, MdHealthAndSafety,
  MdWork, MdEvent, MdAnalytics, MdInsights, MdRocket,
  MdLightbulb, MdSchedule, MdWarning, MdCheckCircle, MdInfo,
  MdStar, MdThumbUp, MdThumbDown, MdComment, MdReply
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
import axiosInstance from '../../utils/axiosInstance';

/**
 * AI Roommate Insights Component
 * AI-powered roommate matching and compatibility analysis
 */
const AIRoommateInsights = ({ userInfo, dashboardData, onboardingData }) => {
  
  const { 
    loading, 
    error: aiError, 
    generateInsights, 
    generateActions, 
    explainInsight
  } = useNewRunAI();

  // State management for roommate insights
  const [state, setState] = useState({
    aiInsights: [],
    aiActions: [],
    roommateMatches: [],
    compatibilityScores: {},
    isLoading: false,
    isInitialized: false,
    error: null
  });

  const { aiInsights, aiActions, roommateMatches, compatibilityScores, isLoading, isInitialized, error } = state;

  // Drawer state for detailed roommate insights
  const [showInsightDrawer, setShowInsightDrawer] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Helper functions
  const scoreColor = (p) =>
    p === 'high' ? 'bg-red-500/20 text-red-300' :
    p === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
    'bg-green-500/20 text-green-300';

  const compatibilityColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  // Memoized initialization check
  const shouldInitialize = useMemo(() => {
    return userInfo && dashboardData && !isInitialized;
  }, [userInfo, dashboardData, isInitialized]);

  // Initialize AI roommate data
  useEffect(() => {
    if (shouldInitialize) {
      initializeAIRoommateData();
    }
  }, [shouldInitialize]);

  // Request deduplication map
  const requestMap = useRef(new Map());
  
  // AI roommate data initialization
  const initializeAIRoommateData = useCallback(async () => {
    const userId = userInfo?.id || 'anonymous';
    const userData = { userInfo, dashboardData, onboardingData };
    
    // Check smart cache first
    const cachedInsights = getCachedInsights(userId, userData);
    const cachedActions = getCachedActions(userId, userData);
    
    if (cachedInsights && cachedActions) {
      console.log('🎯 Using cached AI roommate data');
      setState(prev => ({ 
        ...prev, 
        aiInsights: cachedInsights,
        aiActions: cachedActions,
        isInitialized: true 
      })); 
      return; 
    }

    // Request deduplication
    const requestKey = `ai-roommate-data-${userId}`;
    if (requestMap.current.has(requestKey)) {
      console.log('🔄 AI roommate request already in progress, waiting...');
      return requestMap.current.get(requestKey);
    }

    const requestPromise = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Call unified roommate matching endpoint
        const response = await axiosInstance.post('/api/ai/roommate/match', {
          userProfile: userInfo,
          onboardingData: onboardingData,
          synapseData: userInfo?.synapse,
          dashboardData: dashboardData
        });

        const { aiInsights: insights, results: specificRecommendations } = response.data;
        
        // Transform insights
        const transformedInsights = transformRoommateInsights(insights);
        const transformedActions = transformRoommateActions(insights);
        
        const newState = {
          aiInsights: transformedInsights,
          aiActions: transformedActions,
          roommateMatches: specificRecommendations?.roommates || [],
          compatibilityScores: specificRecommendations?.compatibilityScores || {},
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
        console.error('AI Roommate Initialization Error:', err);
        const errorState = { 
          isLoading: false, 
          error: `AI Roommate Service Error: ${err.message || 'Unknown error'}`,
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

  // Transform roommate insights
  const transformRoommateInsights = useCallback((rawInsights) => {
    if (!Array.isArray(rawInsights)) return [];
    
    return rawInsights.map(insight => ({
      ...insight,
      id: insight.id || `roommate-${Date.now()}`,
      category: 'roommate',
      icon: 'people',
      priority: insight.priority || 'medium',
      type: insight.type || 'info'
    }));
  }, []);

  // Transform roommate actions
  const transformRoommateActions = useCallback((rawActions) => {
    if (!Array.isArray(rawActions)) return [];
    
    return rawActions.map(action => ({
      ...action,
      id: action.id || `action-${Date.now()}`,
      category: 'roommate',
      icon: 'people',
      priority: action.priority || 'medium'
    }));
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
        console.log('🎯 Using cached AI roommate explanation');
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
      console.error('Failed to get AI roommate explanation:', error);
      const fallbackExplanation = `This roommate recommendation is important for your success. ${insight.title} is a ${insight.priority} priority that will help you find the perfect roommate.`;
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

  // Handle roommate match click
  const handleRoommateMatchClick = useCallback((roommate) => {
    navigate(`/Synapse?match=${roommate.userId}`);
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

  // Handle loading and error states
  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-white/70">NewRun AI is analyzing your roommate compatibility...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3 mb-2">
          <MdWarning className="text-red-400 text-xl" />
          <h3 className="text-lg font-bold text-red-400">AI Roommate Service Error</h3>
        </div>
        <p className="text-red-300 text-sm">{error}</p>
        <button 
          onClick={initializeAIRoommateData}
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
              <MdPeople className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Roommate Matching</h3>
              <p className="text-white/60 text-sm">Finding your perfect roommate matches...</p>
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
      {/* AI Roommate Insights */}
      {aiInsights.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <MdPeople className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Roommate Insights</h3>
              <p className="text-white/60 text-sm">Personalized roommate recommendations powered by AI</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => (
              <motion.div
                key={insight.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleInsightClick(insight)}
                onMouseEnter={() => setHoveredInsight(index)}
                onMouseLeave={() => setHoveredInsight(null)}
                className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all duration-300 cursor-pointer"
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
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <MdPeople className="text-xl text-white" />
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
            ))}
          </div>
        </motion.div>
      )}

      {/* Roommate Matches */}
      {roommateMatches.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
              <MdGroup className="text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Top Roommate Matches</h3>
              <p className="text-white/60 text-sm">AI-powered compatibility analysis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roommateMatches.slice(0, 6).map((roommate, index) => (
              <motion.div
                key={roommate.userId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleRoommateMatchClick(roommate)}
                className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {roommate.firstName?.[0]}{roommate.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">
                      {roommate.firstName} {roommate.lastName}
                    </h4>
                    <p className="text-white/60 text-xs">{roommate.major}</p>
                  </div>
                  <div className={`text-lg font-bold ${compatibilityColor(roommate.totalScore)}`}>
                    {Math.round(roommate.totalScore)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Lifestyle</span>
                    <span className="text-white">{Math.round(roommate.lifestyleMatch)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Budget</span>
                    <span className="text-white">{Math.round(roommate.budgetMatch)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Social</span>
                    <span className="text-white">{Math.round(roommate.socialMatch)}%</span>
                  </div>
                </div>
                
                {roommate.recommendation?.reasons?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60">
                      {roommate.recommendation.reasons.slice(0, 2).join(', ')}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insight Drawer */}
      <NewRunDrawer
        isOpen={showInsightDrawer}
        onClose={handleDrawerClose}
        title="AI Roommate Insight Details"
        size="lg"
      >
        {selectedInsight && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <MdPeople className="text-xl text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                <p className="text-white/60 text-sm">
                  ROOMMATE MATCHING • {selectedInsight.priority?.toUpperCase()} Priority
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

export default memo(AIRoommateInsights);





