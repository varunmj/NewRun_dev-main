// src/services/NewRunAI.js
import axiosInstance from '../utils/axiosInstance';

/**
 * NewRun AI Service
 * - Calls secure backend AI endpoints
 * - Uses fallbacks only for non-auth failures (e.g., 5xx, 429, network)
 * - Rethrows 401 so global axios interceptor can redirect to login
 */

class NewRunAI {
  constructor() {
    this.axios = axiosInstance;
  }

  // ---------------------------
  // Internal helpers
  // ---------------------------

  /**
   * Unified POST helper that:
   *  - calls the API
   *  - if 401 → rethrow (let global interceptor do logout/redirect)
   *  - for 429/5xx/network → returns { ok:false, recoverable:true }
   *  - for malformed payloads/4xx → returns { ok:false }
   */
  async _post(url, data) {
    try {
      const res = await this.axios.post(url, data);
      return { ok: true, data: res.data, status: res.status };
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || 'Unknown error';

      // Let auth failures bubble up (handled by interceptor -> redirect)
      if (status === 401) {
        // eslint-disable-next-line no-console
        console.warn(`[AI] 401 on ${url} — bubbling to interceptor`);
        throw err;
      }

      // Rate limit / server / network → optionally recoverable with fallback
      const recoverable =
        status === 429 || (status >= 500 || !status /* network */);

      // eslint-disable-next-line no-console
      console.warn(`[AI] POST ${url} failed`, { status, msg, recoverable });

      return { ok: false, status, message: msg, recoverable };
    }
  }

  _validateArray(data, key) {
    return data && Array.isArray(data[key]) ? data[key] : null;
  }

  _validateString(data, key) {
    return data && typeof data[key] === 'string' ? data[key] : null;
  }

  // ---------------------------
  // Public API: Insights
  // ---------------------------

  /**
   * Generate AI-powered personalized insights for dashboard.
   * Returns an array of insight objects OR fallback insights for recoverable failures.
   * Rethrows on 401 to trigger global login redirect.
   */
  async generatePersonalizedInsights(userData, dashboardData) {
    // eslint-disable-next-line no-console
    console.debug('🤖 NewRunAI: generatePersonalizedInsights()');

    const resp = await this._post('/api/ai/insights', { dashboardData });

    if (resp.ok) {
      const insights = this._validateArray(resp.data, 'insights');
      const success = resp.data?.success === true;
      if (success && insights) return insights;

      // eslint-disable-next-line no-console
      console.warn('[AI] Invalid response format from /api/ai/insights', resp.data);
      return this.getFallbackInsights(userData, dashboardData);
    }

    // Non-401 failures:
    if (resp.recoverable) {
      return this.getFallbackInsights(userData, dashboardData);
    }

    // Non-recoverable client errors (other 4xx) → give UX something usable
    return this.getFallbackInsights(userData, dashboardData);
  }

  // ---------------------------
  // Public API: Actions
  // ---------------------------

  async generatePersonalizedActions(userData) {
    // eslint-disable-next-line no-console
    console.debug('🤖 NewRunAI: generatePersonalizedActions()');

    const resp = await this._post('/api/ai/actions', undefined);

    if (resp.ok) {
      const actions = this._validateArray(resp.data, 'actions');
      const success = resp.data?.success === true;
      if (success && actions) return actions;

      // eslint-disable-next-line no-console
      console.warn('[AI] Invalid response format from /api/ai/actions', resp.data);
      return this.getFallbackActions();
    }

    if (resp.recoverable) {
      return this.getFallbackActions();
    }

    return this.getFallbackActions();
  }

  // ---------------------------
  // Public API: Conversational Chat
  // ---------------------------

  async generateConversationalResponse(userMessage, userData, context) {
    try {
      const resp = await this._post('/api/ai/chat', { message: userMessage, context });

      if (resp.ok) {
        const success = resp.data?.success === true;
        const message = this._validateString(resp.data, 'response');
        if (success && message) return message;

        // eslint-disable-next-line no-console
        console.warn('[AI] Invalid response format from /api/ai/chat', resp.data);
        return "I'm having trouble processing that. Please try again in a moment.";
      }

      if (resp.status === 401) throw new Error('Unauthorized');
      return "I'm having trouble processing that. Please try again in a moment.";
    } catch (err) {
      // Bubble 401 (global interceptor will handle redirect)
      if (err?.response?.status === 401) throw err;
      // eslint-disable-next-line no-console
      console.error('NewRun AI Conversation Error:', err?.response?.status, err?.message);
      return "I'm having trouble processing that. Please try again in a moment.";
    }
  }

  // ---------------------------
  // Public API: Explain Insight
  // ---------------------------

  async explainInsight(insight, dashboardData) {
    // eslint-disable-next-line no-console
    console.debug('🤖 NewRunAI: explainInsight()', { id: insight?.id, title: insight?.title });

    const resp = await this._post('/api/ai/explain-insight', { insight, dashboardData });

    if (resp.ok) {
      const success = resp.data?.success === true;
      const explanation = this._validateString(resp.data, 'explanation');

      if (success && explanation) {
        return {
          explanation,
          insight: resp.data?.insight ?? insight,
          aiGenerated: Boolean(resp.data?.aiGenerated),
          fallback: Boolean(resp.data?.fallback),
        };
      }

      // eslint-disable-next-line no-console
      console.warn('[AI] Invalid response format from /api/ai/explain-insight', resp.data);
      return this._fallbackExplanation(insight);
    }

    if (resp.status === 401) {
      // Bubble to global interceptor (redirect)
      const err = new Error('Unauthorized');
      err.response = { status: 401 };
      throw err;
    }

    return this._fallbackExplanation(insight);
  }

  // ---------------------------
  // Optional utility endpoints/derived AI
  // ---------------------------

  async generateArrivalTimeline(userData) {
    try {
      const arrivalDate = userData?.onboardingData?.arrivalDate;
      if (!arrivalDate) return null;

      const daysUntilArrival = Math.ceil(
        (new Date(arrivalDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        timeline: `Arriving in ${daysUntilArrival} days`,
        criticalTasks: ['Secure housing', 'Set up banking', 'Get essentials'],
        recommendations: [
          'Start housing search immediately',
          'Contact university for resources',
        ],
        urgency: daysUntilArrival <= 7 ? 'urgent' : 'important',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('NewRun AI Timeline Error:', error);
      return null;
    }
  }

  async generateMarketAnalysis(/* dashboardData, userData */) {
    try {
      return {
        budgetAnalysis: 'Budget analysis unavailable',
        trends: 'Market trends loading...',
        opportunities: 'Analyzing opportunities...',
        recommendations: 'Generating recommendations...',
        marketScore: 'good',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('NewRun AI Market Analysis Error:', error);
      return null;
    }
  }

  async generateSuccessPredictions(/* userData, dashboardData */) {
    try {
      return {
        overallScore: 'good',
        predictions: 'AI analysis in progress...',
        risks: 'Evaluating potential risks...',
        recommendations: 'Generating personalized recommendations...',
        successFactors: 'Analyzing success factors...',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('NewRun AI Predictions Error:', error);
      return null;
    }
  }

  // ---------------------------
  // Fallbacks
  // ---------------------------

  getFallbackInsights(userData, dashboardData) {
    const fallbackInsights = [];

    // Arrival proximity
    if (userData?.onboardingData?.arrivalDate) {
      const daysUntilArrival = Math.ceil(
        (new Date(userData.onboardingData.arrivalDate) - new Date()) /
          (1000 * 60 * 60 * 24)
      );
      if (Number.isFinite(daysUntilArrival) && daysUntilArrival <= 30) {
        fallbackInsights.push({
          id: 'fallback-arrival',
          type: 'urgent',
          title: 'Arrival Approaching!',
          message: `${daysUntilArrival} days until you arrive in ${
            userData.onboardingData.city || 'your city'
          }`,
          priority: 'high',
          icon: 'schedule',
          cta: { label: 'Complete housing search', route: '/properties' },
        });
      }
    }

    // Budget vs avg price
    const avgPrice = dashboardData?.propertiesStats?.averagePrice;
    const budget = userData?.onboardingData?.budgetRange?.max;
    if (typeof avgPrice === 'number' && typeof budget === 'number' && avgPrice > budget) {
      fallbackInsights.push({
        id: 'fallback-budget',
        type: 'warning',
        title: 'Budget Alert',
        message: `Average property price ($${avgPrice}) exceeds your budget ($${budget})`,
        priority: 'high',
        icon: 'money',
        cta: { label: 'Expand search', route: '/properties' },
      });
    }

    if (fallbackInsights.length === 0) {
      fallbackInsights.push({
        id: 'fallback-service',
        type: 'info',
        title: 'AI Service Unavailable',
        message: 'AI insights are temporarily unavailable. Please try again later.',
        cta: { label: 'Refresh', route: '/dashboard' },
        priority: 'low',
        icon: 'info',
      });
    }

    return fallbackInsights;
  }

  getFallbackActions() {
    return [
      {
        label: 'List Property',
        description: 'Add a new property listing',
        path: '/dashboard',
        icon: 'home',
        color: 'blue',
        priority: 'high',
      },
      {
        label: 'Browse Properties',
        description: 'Find your perfect place',
        path: '/all-properties',
        icon: 'search',
        color: 'green',
        priority: 'high',
      },
      {
        label: 'Find Roommate',
        description: 'Connect with potential roommates',
        path: '/Synapse',
        icon: 'people',
        color: 'purple',
        priority: 'medium',
      },
      {
        label: 'Browse Marketplace',
        description: 'Shop for essentials',
        path: '/marketplace',
        icon: 'shopping',
        color: 'orange',
        priority: 'medium',
      },
    ];
  }

  _fallbackExplanation(insight) {
    return {
      explanation: `This recommendation is important for your success. ${insight?.title || 'This item'} is a ${insight?.priority || 'key'} priority that will help you stay on track with your goals.`,
      insight: insight,
      aiGenerated: false,
      fallback: true,
    };
  }
}

// Export singleton instance
export default new NewRunAI();
