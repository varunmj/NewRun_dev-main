import axiosInstance from '../utils/axiosInstance';

/**
 * NewRun AI Service - Frontend client for AI-powered intelligence
 * Uses secure backend API to provide personalized insights, recommendations, and predictions
 */
class NewRunAI {
  constructor() {
    // Use the main axiosInstance which has proper authentication handling
    this.axiosInstance = axiosInstance;
  }

  /**
   * Generate AI-powered personalized insights for dashboard
   */
  async generatePersonalizedInsights(userData, dashboardData) {
    try {
      console.log('🤖 NewRunAI: Starting generatePersonalizedInsights', { userData, dashboardData });
      
      // Check if AI endpoints are available
      try {
        const response = await this.axiosInstance.post('/api/ai/insights', {
          dashboardData
        });

        console.log('🤖 NewRunAI: API response received', response.data);

        if (response.data.success && response.data.insights) {
          return response.data.insights;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.log('🤖 AI API not available, using fallback insights');
        // AI endpoints not available, use fallback
        return this.getFallbackInsights(userData, dashboardData);
      }
    } catch (error) {
      console.error('🤖 NewRunAI Error:', error);
      console.error('🤖 Error details:', { 
        message: error.message, 
        status: error.response?.status, 
        data: error.response?.data 
      });
      
      // Provide fallback insights based on user data
      return this.getFallbackInsights(userData, dashboardData);
    }
  }

  /**
   * Generate AI-powered personalized quick actions
   */
  async generatePersonalizedActions(userData) {
    try {
      console.log('🤖 NewRunAI: Starting generatePersonalizedActions', { userData });
      
      // Check if AI endpoints are available
      try {
        const response = await this.axiosInstance.post('/api/ai/actions');

        console.log('🤖 NewRunAI: API response received', response.data);

        if (response.data.success && response.data.actions) {
          return response.data.actions;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.log('🤖 AI API not available, using fallback actions');
        // AI endpoints not available, use fallback
        return this.getFallbackActions();
      }
    } catch (error) {
      console.error('🤖 NewRunAI Actions Error:', error);
      console.error('🤖 Actions Error details:', { 
        message: error.message, 
        status: error.response?.status, 
        data: error.response?.data 
      });
      
      // Return fallback actions
      return this.getFallbackActions();
    }
  }

  /**
   * Generate AI-powered arrival timeline insights
   */
  async generateArrivalTimeline(userData) {
    try {
      const arrivalDate = userData.onboardingData?.arrivalDate;
      if (!arrivalDate) return null;

      const daysUntilArrival = Math.ceil((new Date(arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        timeline: `Arriving in ${daysUntilArrival} days`,
        criticalTasks: ['Secure housing', 'Set up banking', 'Get essentials'],
        recommendations: ['Start housing search immediately', 'Contact university for resources'],
        urgency: daysUntilArrival <= 7 ? 'urgent' : 'important'
      };
    } catch (error) {
      console.error('NewRun AI Timeline Error:', error);
      return null;
    }
  }

  /**
   * Generate AI-powered market analysis
   */
  async generateMarketAnalysis(dashboardData, userData) {
    try {
      return {
        budgetAnalysis: 'Budget analysis unavailable',
        trends: 'Market trends loading...',
        opportunities: 'Analyzing opportunities...',
        recommendations: 'Generating recommendations...',
        marketScore: 'good'
      };
    } catch (error) {
      console.error('NewRun AI Market Analysis Error:', error);
      return null;
    }
  }

  /**
   * Generate AI-powered conversational responses
   */
  async generateConversationalResponse(userMessage, userData, context) {
    try {
      const response = await this.axiosInstance.post('/api/ai/chat', {
        message: userMessage,
        context
      });

      if (response.data.success && response.data.response) {
        return response.data.response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('NewRun AI Conversation Error:', error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  /**
   * Generate AI-powered success predictions
   */
  async generateSuccessPredictions(userData, dashboardData) {
    try {
      return {
        overallScore: 'good',
        predictions: 'AI analysis in progress...',
        risks: 'Evaluating potential risks...',
        recommendations: 'Generating personalized recommendations...',
        successFactors: 'Analyzing success factors...'
      };
    } catch (error) {
      console.error('NewRun AI Predictions Error:', error);
      return null;
    }
  }

  // Fallback methods
  getFallbackInsights(userData, dashboardData) {
    const fallbackInsights = [];
    
    if (userData.onboardingData?.arrivalDate) {
      const daysUntilArrival = Math.ceil((new Date(userData.onboardingData.arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilArrival <= 30) {
        fallbackInsights.push({
          id: 'fallback-arrival',
          type: 'urgent',
          title: 'Arrival Approaching!',
          message: `${daysUntilArrival} days until you arrive in ${userData.onboardingData.city || 'your city'}`,
          priority: 'high',
          icon: 'schedule',
          cta: { label: 'Complete housing search', route: '/properties' }
        });
      }
    }
    
    if (userData.onboardingData?.budgetRange?.max && dashboardData?.propertiesStats?.averagePrice) {
      const avgPrice = dashboardData.propertiesStats.averagePrice;
      const budget = userData.onboardingData.budgetRange.max;
      if (avgPrice > budget) {
        fallbackInsights.push({
          id: 'fallback-budget',
          type: 'warning',
          title: 'Budget Alert',
          message: `Average property price ($${avgPrice}) exceeds your budget ($${budget})`,
          priority: 'high',
          icon: 'money',
          cta: { label: 'Expand search', route: '/properties' }
        });
      }
    }
    
    if (fallbackInsights.length === 0) {
      fallbackInsights.push({
        id: 'fallback-service',
        type: 'info',
        title: 'AI Service Unavailable',
        message: 'AI insights are temporarily unavailable. Please try again later.',
        cta: { label: 'Refresh', route: '/dashboard' },
        priority: 'low',
        icon: 'info'
      });
    }
    
    return fallbackInsights;
  }

  getFallbackActions() {
    return [
      { label: 'List Property', description: 'Add a new property listing', path: '/dashboard', icon: 'home', color: 'blue', priority: 'high' }, // Will open property drawer
      { label: 'Browse Properties', description: 'Find your perfect place', path: '/all-properties', icon: 'search', color: 'green', priority: 'high' },
      { label: 'Find Roommate', description: 'Connect with potential roommates', path: '/Synapse', icon: 'people', color: 'purple', priority: 'medium' },
      { label: 'Browse Marketplace', description: 'Shop for essentials', path: '/marketplace', icon: 'shopping', color: 'orange', priority: 'medium' }
    ];
  }
}

// Export singleton instance
export default new NewRunAI();
