/**
 * AI Data Validator
 * Prevents duplicate content in AI responses
 * Ensures title/message and label/description are different
 */

class AIDataValidator {
  /**
   * Validate and fix insight data
   */
  static validateInsight(insight) {
    if (!insight || typeof insight !== 'object') {
      return insight;
    }

    const { title, message, ...rest } = insight;

    // Check if title and message are the same (after cleaning)
    const cleanTitle = this.cleanText(title);
    const cleanMessage = this.cleanText(message);

    if (cleanTitle === cleanMessage && cleanTitle.length > 0) {
      console.log('🔧 Fixing duplicate insight content:', { title, message });
      
      // Generate a proper message based on the title
      const enhancedMessage = this.generateEnhancedMessage(title, insight);
      
      return {
        ...insight,
        message: enhancedMessage
      };
    }

    return insight;
  }

  /**
   * Validate and fix action data
   */
  static validateAction(action) {
    if (!action || typeof action !== 'object') {
      return action;
    }

    const { label, description, ...rest } = action;

    // Check if label and description are the same (after cleaning)
    const cleanLabel = this.cleanText(label);
    const cleanDescription = this.cleanText(description);

    if (cleanLabel === cleanDescription && cleanLabel.length > 0) {
      console.log('🔧 Fixing duplicate action content:', { label, description });
      
      // Generate a proper description based on the label
      const enhancedDescription = this.generateEnhancedDescription(label, action);
      
      return {
        ...action,
        description: enhancedDescription
      };
    }

    return action;
  }

  /**
   * Clean text for comparison
   */
  static cleanText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate enhanced message for insights
   */
  static generateEnhancedMessage(title, insight) {
    const titleLower = title?.toLowerCase() || '';
    
    // Housing-related insights
    if (titleLower.includes('housing') || titleLower.includes('property')) {
      return `Based on your budget and preferences, I've found specific properties that match your needs. These options are within your price range and close to campus, ensuring convenience and financial stability for your academic journey.`;
    }
    
    // Schedule-related insights
    if (titleLower.includes('schedule') || titleLower.includes('visit')) {
      return `I've identified specific properties with contact information. Reach out to the property managers this week to schedule viewings and secure your housing before your arrival date.`;
    }
    
    // Budget-related insights
    if (titleLower.includes('budget') || titleLower.includes('cost')) {
      return `Your current budget range aligns well with available options. I've found properties that offer good value while staying within your financial limits, helping you maintain financial stability during your studies.`;
    }
    
    // General fallback
    return `This is an important step for your university transition. Taking action on this recommendation will help you stay on track with your goals and ensure a smooth start to your academic journey.`;
  }

  /**
   * Generate enhanced description for actions
   */
  static generateEnhancedDescription(label, action) {
    const labelLower = label?.toLowerCase() || '';
    
    // Property-related actions
    if (labelLower.includes('property') || labelLower.includes('housing')) {
      return `Browse through the AI-recommended properties I've found for you. Each option has been carefully selected based on your budget, location preferences, and arrival timeline. Contact the property managers to schedule viewings.`;
    }
    
    // Schedule-related actions
    if (labelLower.includes('schedule') || labelLower.includes('visit')) {
      return `Contact the property managers directly using the provided phone numbers and email addresses. Schedule visits for this week to secure your housing before your arrival date.`;
    }
    
    // Onboarding actions
    if (labelLower.includes('onboarding') || labelLower.includes('profile')) {
      return `Complete your profile setup to unlock personalized recommendations. Add your budget range, arrival date, and housing preferences to get AI-powered property matches and roommate suggestions.`;
    }
    
    // General fallback
    return `This action will help you make progress on your university transition. Follow the specific steps provided to achieve your goals and ensure a successful start to your academic journey.`;
  }

  /**
   * Validate array of insights
   */
  static validateInsights(insights) {
    if (!Array.isArray(insights)) return insights;
    
    return insights.map(insight => this.validateInsight(insight));
  }

  /**
   * Validate array of actions
   */
  static validateActions(actions) {
    if (!Array.isArray(actions)) return actions;
    
    return actions.map(action => this.validateAction(action));
  }
}

module.exports = AIDataValidator;
