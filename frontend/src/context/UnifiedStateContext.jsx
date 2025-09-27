import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { readCache, writeCache, clearCache } from '../utils/aiCache';
import NewRunAI from '../services/NewRunAI';

/**
 * Unified State Management Context
 * Centralizes all application state to prevent fragmentation and ensure data consistency
 * Handles user data, dashboard data, AI insights, and cache invalidation
 */
const UnifiedStateContext = createContext();

export const UnifiedStateProvider = ({ children }) => {
  console.log('UnifiedStateProvider: Initializing...');
  
  // Core state management
  const [state, setState] = useState({
    // User data
    userInfo: null,
    onboardingData: null,
    
    // Dashboard data
    dashboardData: null,
    
    // Conversations data
    conversations: [],
    
    // Synapse profile data
    synapseProfile: null,
    
    // AI insights and actions
    aiInsights: [],
    aiActions: [],
    aiTimeline: null,
    aiMarketAnalysis: null,
    aiPredictions: null,
    
    // Loading states
    loading: {
      user: false,
      dashboard: false,
      ai: false,
      onboarding: false,
      conversations: false,
      synapse: false
    },
    
    // Error states
    errors: {
      user: null,
      dashboard: null,
      ai: null,
      onboarding: null,
      conversations: null,
      synapse: null
    },
    
    // Initialization flags
    initialized: {
      user: false,
      dashboard: false,
      ai: false,
      onboarding: false,
      conversations: false,
      synapse: false
    },
    
    // Cache versioning for invalidation
    cacheVersion: Date.now(),
    
    // Request coordination
    activeRequests: new Set()
  });

  // Request deduplication map
  const requestMap = useRef(new Map());
  
  // Cache invalidation triggers
  const cacheInvalidationTriggers = useRef(new Set());

  // Memoized state getters
  const isFullyInitialized = useMemo(() => {
    return state.initialized.user && state.initialized.dashboard && state.initialized.onboarding;
  }, [state.initialized]);

  const hasAnyErrors = useMemo(() => {
    return Object.values(state.errors).some(error => error !== null);
  }, [state.errors]);

  const isLoading = useMemo(() => {
    return Object.values(state.loading).some(loading => loading);
  }, [state.loading]);

  // Unified state update function
  const updateState = useCallback((updates) => {
    try {
      setState(prev => {
        const newState = { ...prev };
        
        // Deep merge for nested objects
        Object.keys(updates).forEach(key => {
          if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
            newState[key] = { ...prev[key], ...updates[key] };
          } else {
            newState[key] = updates[key];
          }
        });
        
        return newState;
      });
    } catch (error) {
      console.error('Error updating state:', error);
      // Fallback to simple update
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Cache invalidation system
  const invalidateCache = useCallback((reason = 'data_change') => {
    console.log(`🗑️ Cache invalidation triggered: ${reason}`);
    
    // Clear AI cache
    clearCache();
    
    // Update cache version to force refresh
    updateState({ 
      cacheVersion: Date.now(),
      initialized: { ...state.initialized, ai: false }
    });
    
    // Trigger cache invalidation callbacks
    cacheInvalidationTriggers.current.forEach(callback => {
      try {
        callback(reason);
      } catch (error) {
        console.error('Cache invalidation callback error:', error);
      }
    });
  }, [state.initialized, updateState]);

  // Request coordination system
  const executeRequest = useCallback(async (requestKey, requestFn) => {
    // Check if request is already in progress
    if (requestMap.current.has(requestKey)) {
      console.log(`🔄 Request already in progress: ${requestKey}`);
      return requestMap.current.get(requestKey);
    }

    // Create request promise
    const requestPromise = (async () => {
      try {
        return await requestFn();
      } finally {
        // Clean up request map
        requestMap.current.delete(requestKey);
      }
    })();

    // Store request promise
    requestMap.current.set(requestKey, requestPromise);
    return requestPromise;
  }, []);

  // User data management
  const fetchUserData = useCallback(async () => {
    const requestKey = 'fetchUserData';
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping user data fetch');
        updateState({
          userInfo: null,
          initialized: { ...state.initialized, user: true },
          loading: { ...state.loading, user: false },
          errors: { ...state.errors, user: null }
        });
        return null;
      }

      updateState({ loading: { ...state.loading, user: true } });
      
      try {
        const response = await axiosInstance.get('/get-user');
        const userData = response?.data?.user || null;
        
        updateState({
          userInfo: userData,
          initialized: { ...state.initialized, user: true },
          loading: { ...state.loading, user: false },
          errors: { ...state.errors, user: null }
        });
        
        // Invalidate cache when user data changes
        if (userData) {
          invalidateCache('user_data_change');
        }
        
        return userData;
      } catch (error) {
        console.error('User data fetch error:', error);
        updateState({
          loading: { ...state.loading, user: false },
          errors: { ...state.errors, user: error.message }
        });
        throw error;
      }
    });
  }, [state.loading, state.initialized, state.errors, updateState, invalidateCache, executeRequest]);

  // Onboarding data management
  const fetchOnboardingData = useCallback(async () => {
    const requestKey = 'fetchOnboardingData';
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping onboarding data fetch');
        updateState({
          onboardingData: null,
          initialized: { ...state.initialized, onboarding: true },
          loading: { ...state.loading, onboarding: false },
          errors: { ...state.errors, onboarding: null }
        });
        return null;
      }

      updateState({ loading: { ...state.loading, onboarding: true } });
      
      try {
        const response = await axiosInstance.get('/onboarding-data');
        const onboardingData = response.data.error ? null : response.data.onboardingData;
        
        updateState({
          onboardingData,
          initialized: { ...state.initialized, onboarding: true },
          loading: { ...state.loading, onboarding: false },
          errors: { ...state.errors, onboarding: null }
        });
        
        // Invalidate cache when onboarding data changes
        if (onboardingData) {
          invalidateCache('onboarding_data_change');
        }
        
        return onboardingData;
      } catch (error) {
        console.error('Onboarding data fetch error:', error);
        updateState({
          loading: { ...state.loading, onboarding: false },
          errors: { ...state.errors, onboarding: error.message }
        });
        throw error;
      }
    });
  }, [state.loading, state.initialized, state.errors, updateState, invalidateCache, executeRequest]);

  // Dashboard data management
  const fetchDashboardData = useCallback(async () => {
    const requestKey = 'fetchDashboardData';
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping dashboard data fetch');
        updateState({
          dashboardData: null,
          initialized: { ...state.initialized, dashboard: true },
          loading: { ...state.loading, dashboard: false },
          errors: { ...state.errors, dashboard: null }
        });
        return null;
      }

      updateState({ loading: { ...state.loading, dashboard: true } });
      
      try {
        const response = await axiosInstance.get('/dashboard/overview');
        const dashboardData = response.data;
        
        updateState({
          dashboardData,
          initialized: { ...state.initialized, dashboard: true },
          loading: { ...state.loading, dashboard: false },
          errors: { ...state.errors, dashboard: null }
        });
        
        // Invalidate cache when dashboard data changes
        if (dashboardData) {
          invalidateCache('dashboard_data_change');
        }
        
        return dashboardData;
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        updateState({
          loading: { ...state.loading, dashboard: false },
          errors: { ...state.errors, dashboard: error.message }
        });
        throw error;
      }
    });
  }, [state.loading, state.initialized, state.errors, updateState, invalidateCache, executeRequest]);

  // Conversations data management
  const fetchConversations = useCallback(async () => {
    const requestKey = 'fetchConversations';
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping conversations fetch');
        updateState({
          conversations: [],
          initialized: { ...state.initialized, conversations: true },
          loading: { ...state.loading, conversations: false },
          errors: { ...state.errors, conversations: null }
        });
        return [];
      }

      updateState({ loading: { ...state.loading, conversations: true } });
      
      try {
        const response = await axiosInstance.get('/conversations');
        const conversations = response.data.success ? response.data.data : [];
        
        updateState({
          conversations,
          initialized: { ...state.initialized, conversations: true },
          loading: { ...state.loading, conversations: false },
          errors: { ...state.errors, conversations: null }
        });
        
        return conversations;
      } catch (error) {
        console.error('Conversations fetch error:', error);
        updateState({
          loading: { ...state.loading, conversations: false },
          errors: { ...state.errors, conversations: error.message }
        });
        throw error;
      }
    });
  }, [state.loading, state.initialized, state.errors, updateState, executeRequest]);

  // Synapse profile data management
  const fetchSynapseProfile = useCallback(async () => {
    const requestKey = 'fetchSynapseProfile';
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping synapse profile fetch');
        updateState({
          synapseProfile: null,
          initialized: { ...state.initialized, synapse: true },
          loading: { ...state.loading, synapse: false },
          errors: { ...state.errors, synapse: null }
        });
        return null;
      }

      updateState({ loading: { ...state.loading, synapse: true } });
      
      try {
        const response = await axiosInstance.get('/synapse/preferences');
        const synapseProfile = response.data.preferences || {};
        
        updateState({
          synapseProfile,
          initialized: { ...state.initialized, synapse: true },
          loading: { ...state.loading, synapse: false },
          errors: { ...state.errors, synapse: null }
        });
        
        return synapseProfile;
      } catch (error) {
        console.error('Synapse profile fetch error:', error);
        updateState({
          loading: { ...state.loading, synapse: false },
          errors: { ...state.errors, synapse: error.message }
        });
        throw error;
      }
    });
  }, [state.loading, state.initialized, state.errors, updateState, executeRequest]);

  // Calculate synapse profile completion percentage
  const calculateProfileCompletion = useCallback((synapseProfile) => {
    if (!synapseProfile || typeof synapseProfile !== 'object') return 0;
    
    const sections = [
      // Culture section (25% weight)
      {
        weight: 25,
        fields: [
          'culture.primaryLanguage',
          'culture.home.country',
          'culture.home.region',
          'culture.home.city'
        ]
      },
      // Logistics section (20% weight)
      {
        weight: 20,
        fields: [
          'logistics.moveInMonth',
          'logistics.budgetMax',
          'logistics.commuteMode'
        ]
      },
      // Lifestyle section (25% weight)
      {
        weight: 25,
        fields: [
          'lifestyle.sleepPattern',
          'lifestyle.cleanliness',
          'lifestyle.quietAfter',
          'lifestyle.quietUntil'
        ]
      },
      // Habits section (20% weight)
      {
        weight: 20,
        fields: [
          'habits.diet',
          'habits.cookingFreq',
          'habits.smoking',
          'habits.drinking',
          'habits.partying'
        ]
      },
      // Pets section (10% weight)
      {
        weight: 10,
        fields: [
          'pets.hasPets',
          'pets.okWithPets'
        ]
      }
    ];

    let totalScore = 0;
    
    sections.forEach(section => {
      let sectionScore = 0;
      let completedFields = 0;
      
      section.fields.forEach(fieldPath => {
        const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], synapseProfile);
        if (value !== null && value !== undefined && value !== '' && 
            !(Array.isArray(value) && value.length === 0)) {
          completedFields++;
        }
      });
      
      sectionScore = (completedFields / section.fields.length) * section.weight;
      totalScore += sectionScore;
    });
    
    return Math.round(totalScore);
  }, []);

  // AI data management with smart caching
  const fetchAIData = useCallback(async () => {
    const requestKey = `fetchAIData_${state.cacheVersion}`;
    
    return executeRequest(requestKey, async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping AI data fetch');
        updateState({
          aiInsights: [],
          aiActions: [],
          aiTimeline: null,
          aiMarketAnalysis: null,
          aiPredictions: null,
          initialized: { ...state.initialized, ai: true },
          loading: { ...state.loading, ai: false },
          errors: { ...state.errors, ai: null }
        });
        return null;
      }

      // Check if we have all required data
      if (!state.userInfo || !state.dashboardData || !state.onboardingData) {
        console.log('🤖 AI data fetch skipped: missing required data');
        return null;
      }

      updateState({ loading: { ...state.loading, ai: true } });
      
      try {
        // Check cache first
        const cacheKey = `ai-data-${state.userInfo.id || 'anon'}`;
        const obVer = state.onboardingData?.updatedAt || JSON.stringify(state.onboardingData || {});
        const cached = readCache(cacheKey, { maxAgeMs: 6*60*60*1000, obVer });
        
        if (cached) {
          console.log('🤖 Using cached AI data');
          updateState({
            ...cached,
            initialized: { ...state.initialized, ai: true },
            loading: { ...state.loading, ai: false },
            errors: { ...state.errors, ai: null }
          });
          return cached;
        }

        // Prepare enriched user data
        const enrichedUserData = {
          ...state.userInfo,
          onboardingData: state.onboardingData,
          dashboardStats: {
            propertiesCount: state.dashboardData?.propertiesCount || 0,
            marketplaceCount: state.dashboardData?.marketplaceCount || 0,
            averagePropertyPrice: state.dashboardData?.propertiesStats?.averagePrice || 0,
            totalViews: state.dashboardData?.propertiesStats?.totalViews || 0,
            availableProperties: state.dashboardData?.propertiesStats?.availableProperties || 0,
            marketplaceItems: state.dashboardData?.marketplaceStats?.totalItems || 0,
            marketplaceViews: state.dashboardData?.marketplaceStats?.totalViews || 0
          },
          userProperties: state.dashboardData?.myProperties?.items || [],
          userMarketplaceItems: state.dashboardData?.myMarketplace?.items || []
        };

        // Generate AI insights and actions in parallel
        const [insightsResult, actionsResult] = await Promise.allSettled([
          NewRunAI.generatePersonalizedInsights(enrichedUserData, state.dashboardData),
          NewRunAI.generatePersonalizedActions(enrichedUserData)
        ]);

        // Transform and validate results
        const aiInsights = insightsResult.status === 'fulfilled' ? insightsResult.value || [] : [];
        const aiActions = actionsResult.status === 'fulfilled' ? actionsResult.value || [] : [];

        const aiData = {
          aiInsights,
          aiActions,
          aiTimeline: null, // Load on demand
          aiMarketAnalysis: null, // Load on demand
          aiPredictions: null, // Load on demand
          initialized: { ...state.initialized, ai: true },
          loading: { ...state.loading, ai: false },
          errors: { ...state.errors, ai: null }
        };

        updateState(aiData);

        // Cache the results
        writeCache(cacheKey, {
          aiInsights,
          aiActions
        }, { obVer, ver: "unified-v1" });

        return aiData;
      } catch (error) {
        console.error('AI data fetch error:', error);
        updateState({
          loading: { ...state.loading, ai: false },
          errors: { ...state.errors, ai: error.message }
        });
        throw error;
      }
    });
  }, [state.userInfo, state.dashboardData, state.onboardingData, state.cacheVersion, state.loading, state.initialized, state.errors, updateState, executeRequest]);

  // Coordinated initialization
  const initializeAll = useCallback(async () => {
    console.log('🚀 Starting coordinated initialization...');
    
    try {
      // Fetch user and onboarding data in parallel
      const [userData, onboardingData] = await Promise.allSettled([
        fetchUserData(),
        fetchOnboardingData()
      ]);

      // Fetch dashboard, conversations, and synapse profile data in parallel
      const [dashboardData, conversationsData, synapseData] = await Promise.allSettled([
        fetchDashboardData(),
        fetchConversations(),
        fetchSynapseProfile()
      ]);

      // Fetch AI data if all required data is available
      if (userData.status === 'fulfilled' && onboardingData.status === 'fulfilled' && dashboardData.status === 'fulfilled') {
        await fetchAIData();
      }

      console.log('✅ Coordinated initialization complete');
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  }, [fetchUserData, fetchOnboardingData, fetchDashboardData, fetchConversations, fetchAIData]);

  // Data refresh with cache invalidation
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all data...');
    invalidateCache('manual_refresh');
    await initializeAll();
  }, [invalidateCache, initializeAll]);

  // Specific data refresh
  const refreshUserData = useCallback(async () => {
    invalidateCache('user_refresh');
    await fetchUserData();
  }, [invalidateCache, fetchUserData]);

  const refreshDashboardData = useCallback(async () => {
    invalidateCache('dashboard_refresh');
    await fetchDashboardData();
  }, [invalidateCache, fetchDashboardData]);

  const refreshAIData = useCallback(async () => {
    invalidateCache('ai_refresh');
    await fetchAIData();
  }, [invalidateCache, fetchAIData]);

  const refreshConversations = useCallback(async () => {
    invalidateCache('conversations_refresh');
    await fetchConversations();
  }, [invalidateCache, fetchConversations]);

  const refreshSynapseProfile = useCallback(async () => {
    invalidateCache('synapse_refresh');
    await fetchSynapseProfile();
  }, [invalidateCache, fetchSynapseProfile]);

  // Cache invalidation subscription
  const subscribeToCacheInvalidation = useCallback((callback) => {
    cacheInvalidationTriggers.current.add(callback);
    return () => cacheInvalidationTriggers.current.delete(callback);
  }, []);

  // Auto-initialization on mount - only run once
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeAll();
    }
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'token' || e.key === 'userToken') {
        if (!e.newValue) {
          // Token was removed, reset initialization flag and clear state
          hasInitialized.current = false;
          updateState({
            userInfo: null,
            onboardingData: null,
            dashboardData: null,
            conversations: [],
            synapseProfile: null,
            aiInsights: [],
            aiActions: [],
            aiTimeline: null,
            aiMarketAnalysis: null,
            aiPredictions: null,
            initialized: {
              user: false,
              dashboard: false,
              ai: false,
              onboarding: false,
              conversations: false,
              synapse: false
            },
            loading: {
              user: false,
              dashboard: false,
              ai: false,
              onboarding: false,
              conversations: false,
              synapse: false
            },
            errors: {
              user: null,
              dashboard: null,
              ai: null,
              onboarding: null,
              conversations: null,
              synapse: null
            }
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateState]);

  // Auto-refresh when data changes
  useEffect(() => {
    if (isFullyInitialized) {
      const interval = setInterval(() => {
        // Only refresh if no active requests
        if (requestMap.current.size === 0) {
          refreshDashboardData();
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isFullyInitialized, refreshDashboardData]);

  const value = {
    // State
    state,
    isFullyInitialized,
    hasAnyErrors,
    isLoading,
    
    // Data getters
    userInfo: state.userInfo,
    onboardingData: state.onboardingData,
    dashboardData: state.dashboardData,
    conversations: state.conversations,
    synapseProfile: state.synapseProfile,
    aiInsights: state.aiInsights,
    aiActions: state.aiActions,
    aiTimeline: state.aiTimeline,
    aiMarketAnalysis: state.aiMarketAnalysis,
    aiPredictions: state.aiPredictions,
    
    // Loading states
    loading: state.loading,
    errors: state.errors,
    initialized: state.initialized,
    
    // Actions
    fetchUserData,
    fetchOnboardingData,
    fetchDashboardData,
    fetchConversations,
    fetchSynapseProfile,
    fetchAIData,
    initializeAll,
    refreshAll,
    refreshUserData,
    refreshDashboardData,
    refreshConversations,
    refreshSynapseProfile,
    refreshAIData,
    invalidateCache,
    subscribeToCacheInvalidation,
    updateState,
    calculateProfileCompletion
  };

  return (
    <UnifiedStateContext.Provider value={value}>
      {children}
    </UnifiedStateContext.Provider>
  );
};

export const useUnifiedState = () => {
  const context = useContext(UnifiedStateContext);
  if (!context) {
    throw new Error('useUnifiedState must be used within a UnifiedStateProvider');
  }
  return context;
};