import { useCallback, useEffect, useMemo } from 'react';
import { useUnifiedState } from '../context/UnifiedStateContext';

/**
 * Unified Dashboard Hook
 * Provides a clean interface to the unified state management system
 * Handles data synchronization and cache invalidation automatically
 */
export const useUnifiedDashboard = () => {
  const {
    // State
    state,
    isFullyInitialized,
    hasAnyErrors,
    isLoading,
    
    // Data
    userInfo,
    onboardingData,
    dashboardData,
    aiInsights,
    aiActions,
    aiTimeline,
    aiMarketAnalysis,
    aiPredictions,
    
    // Loading states
    loading,
    errors,
    initialized,
    
    // Actions
    refreshAll,
    refreshUserData,
    refreshDashboardData,
    refreshAIData,
    invalidateCache,
    subscribeToCacheInvalidation
  } = useUnifiedState();

  // Auto-refresh when data changes
  useEffect(() => {
    const unsubscribe = subscribeToCacheInvalidation((reason) => {
      console.log(`🔄 Cache invalidation received: ${reason}`);
      
      // Auto-refresh relevant data based on invalidation reason
      if (reason.includes('user') || reason.includes('onboarding')) {
        refreshUserData();
      }
      if (reason.includes('dashboard')) {
        refreshDashboardData();
      }
      if (reason.includes('ai') || reason.includes('cache')) {
        refreshAIData();
      }
    });

    return unsubscribe;
  }, [subscribeToCacheInvalidation, refreshUserData, refreshDashboardData, refreshAIData]);

  // Start data synchronization service
  useEffect(() => {
    dataSyncService.startPeriodicSync(30000); // 30 seconds
    
    return () => {
      dataSyncService.stopPeriodicSync();
    };
  }, []);

  // Memoized analytics calculations
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

  // Memoized personalized insights
  const personalizedInsights = useMemo(() => {
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
          icon: "schedule"
        });
      }
    }

    // Budget-based insights
    if (budgetRange && budgetRange.max) {
      const avgPrice = analytics?.avgPropertyPrice || 0;
      if (avgPrice > budgetRange.max) {
        insights.push({
          type: "warning",
          title: "Budget Alert",
          message: `Average property price ($${avgPrice}) exceeds your budget ($${budgetRange.max})`,
          action: "Consider expanding your search",
          icon: "money"
        });
      }
    }

    return insights;
  }, [onboardingData, analytics]);

  // Memoized personalized actions
  const personalizedActions = useMemo(() => {
    if (!onboardingData) {
      return [
        { label: "List Property", icon: "home", path: "/add-property", color: "blue" },
        { label: "List Item", icon: "shopping", path: "/add-item", color: "green" },
        { label: "Find Roommate", icon: "people", path: "/roommate", color: "purple" },
        { label: "Browse Community", icon: "chat", path: "/community", color: "orange" }
      ];
    }

    const focus = onboardingData.focus;
    const actions = [];

    // Base actions for everyone
    actions.push({ label: "List Property", icon: "home", path: "/add-property", color: "blue" });
    actions.push({ label: "List Item", icon: "shopping", path: "/add-item", color: "green" });

    // Add focus-specific actions
    if (focus === 'Housing' || focus === 'Everything') {
      actions.push({ label: "Browse Properties", icon: "search", path: "/properties", color: "green" });
      actions.push({ label: "Schedule Tours", icon: "schedule", path: "/properties", color: "teal" });
    }

    if (focus === 'Roommate' || focus === 'Everything') {
      actions.push({ label: "Find Roommate", icon: "people", path: "/roommate", color: "purple" });
      actions.push({ label: "Complete Profile", icon: "person", path: "/roommate", color: "pink" });
    }

    if (focus === 'Essentials' || focus === 'Everything') {
      actions.push({ label: "Browse Essentials", icon: "shopping", path: "/marketplace", color: "green" });
      actions.push({ label: "Smart Pack", icon: "lightbulb", path: "/marketplace", color: "yellow" });
    }

    if (focus === 'Community' || focus === 'Everything') {
      actions.push({ label: "Browse Community", icon: "chat", path: "/community", color: "orange" });
      actions.push({ label: "Join Events", icon: "event", path: "/community", color: "red" });
    }

    return actions.slice(0, 6); // Limit to 6 actions
  }, [onboardingData]);

  // Get current actions (AI or fallback)
  const getCurrentActions = useCallback(() => {
    return aiActions.length > 0 ? aiActions : personalizedActions;
  }, [aiActions, personalizedActions]);

  // Get current insights (AI or fallback)
  const getCurrentInsights = useCallback(() => {
    return aiInsights.length > 0 ? aiInsights : personalizedInsights;
  }, [aiInsights, personalizedInsights]);

  // Handle data refresh with proper coordination
  const handleRefresh = useCallback(async () => {
    try {
      await refreshAll();
      dataSyncService.forceSyncAll();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [refreshAll]);

  // Handle property operations with data sync
  const handlePropertyOperation = useCallback(async (operation, propertyId, data = null) => {
    try {
      let response;
      
      switch (operation) {
        case 'delete':
          response = await axiosInstance.delete(`/delete-property/${propertyId}`);
          break;
        case 'update':
          response = await axiosInstance.put(`/update-property/${propertyId}`, data);
          break;
        case 'create':
          response = await axiosInstance.post('/create-property', data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Invalidate cache and refresh data
      invalidateCache('property_operation');
      await refreshDashboardData();
      
      return response.data;
    } catch (error) {
      console.error(`Property ${operation} failed:`, error);
      throw error;
    }
  }, [invalidateCache, refreshDashboardData]);

  // Handle marketplace operations with data sync
  const handleMarketplaceOperation = useCallback(async (operation, itemId, data = null) => {
    try {
      let response;
      
      switch (operation) {
        case 'delete':
          response = await axiosInstance.delete(`/marketplace/item/${itemId}`);
          break;
        case 'update':
          response = await axiosInstance.put(`/marketplace/item/${itemId}`, data);
          break;
        case 'create':
          response = await axiosInstance.post('/marketplace/item', data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Invalidate cache and refresh data
      invalidateCache('marketplace_operation');
      await refreshDashboardData();
      
      return response.data;
    } catch (error) {
      console.error(`Marketplace ${operation} failed:`, error);
      throw error;
    }
  }, [invalidateCache, refreshDashboardData]);

  return {
    // State
    isFullyInitialized,
    hasAnyErrors,
    isLoading,
    
    // Data
    userInfo,
    onboardingData,
    dashboardData,
    analytics,
    
    // AI Data
    aiInsights: getCurrentInsights(),
    aiActions: getCurrentActions(),
    aiTimeline,
    aiMarketAnalysis,
    aiPredictions,
    
    // Loading states
    loading,
    errors,
    initialized,
    
    // Actions
    handleRefresh,
    handlePropertyOperation,
    handleMarketplaceOperation,
    refreshUserData,
    refreshDashboardData,
    refreshAIData,
    invalidateCache
  };
};
