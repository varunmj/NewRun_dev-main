/**
 * Enhanced Personalization Engine for NewRun
 * Transforms onboarding data into actionable, contextual recommendations
 */

// Time-based personalization
export const getArrivalTimeline = (onboardingData) => {
  if (!onboardingData?.arrivalDate) return null;
  
  const arrivalDate = new Date(onboardingData.arrivalDate);
  const now = new Date();
  const daysUntilArrival = Math.ceil((arrivalDate - now) / (1000 * 60 * 60 * 24));
  
  const timeline = {
    daysUntilArrival,
    phase: getArrivalPhase(daysUntilArrival),
    recommendations: []
  };

  // 30+ days: Housing finalization
  if (daysUntilArrival > 30) {
    timeline.recommendations.push({
      type: 'housing',
      priority: 'high',
      title: 'Secure Your Housing',
      message: 'Best properties get taken early. Start your search now.',
      actions: [
        'Browse available properties',
        'Schedule virtual tours',
        'Submit applications'
      ],
      urgency: 'medium'
    });
  }

  // 14-30 days: Essentials preparation
  if (daysUntilArrival <= 30 && daysUntilArrival > 14) {
    timeline.recommendations.push({
      type: 'essentials',
      priority: 'medium',
      title: 'Prepare Your Essentials Pack',
      message: 'Get everything you need for Day 1.',
      actions: onboardingData.essentials?.map(essential => `Order ${essential}`) || [],
      urgency: 'low'
    });
  }

  // 7-14 days: Final preparations
  if (daysUntilArrival <= 14 && daysUntilArrival > 7) {
    timeline.recommendations.push({
      type: 'final_prep',
      priority: 'high',
      title: 'Final Arrival Preparations',
      message: 'Last-minute checklist to ensure smooth arrival.',
      actions: [
        'Confirm transportation',
        'Pack essentials',
        'Connect with roommates',
        'Check university requirements'
      ],
      urgency: 'high'
    });
  }

  // 0-7 days: Arrival support
  if (daysUntilArrival <= 7 && daysUntilArrival >= 0) {
    timeline.recommendations.push({
      type: 'arrival_support',
      priority: 'critical',
      title: 'Arrival Support',
      message: 'We\'re here to help with your transition.',
      actions: [
        'Airport pickup coordination',
        'Campus orientation',
        'Emergency contacts',
        'First week survival guide'
      ],
      urgency: 'critical'
    });
  }

  return timeline;
};

const getArrivalPhase = (daysUntilArrival) => {
  if (daysUntilArrival > 30) return 'planning';
  if (daysUntilArrival > 14) return 'preparation';
  if (daysUntilArrival > 7) return 'final_prep';
  if (daysUntilArrival >= 0) return 'arrival';
  return 'settled';
};

// Contextual recommendations based on user data
export const getContextualRecommendations = (userData, currentContext = {}) => {
  const { onboardingData, synapse, university, currentLocation } = userData;
  const { timeOfDay, dayOfWeek, currentPage } = currentContext;
  
  const recommendations = {
    timeBased: getTimeBasedRecommendations(timeOfDay, dayOfWeek),
    locationBased: getLocationBasedRecommendations(currentLocation, university),
    academicBased: getAcademicBasedRecommendations(university, onboardingData),
    socialBased: getSocialBasedRecommendations(onboardingData, synapse),
    financialBased: getFinancialBasedRecommendations(onboardingData)
  };

  return recommendations;
};

const getTimeBasedRecommendations = (timeOfDay, dayOfWeek) => {
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
  const isMorning = timeOfDay === 'morning';
  const isEvening = timeOfDay === 'evening';

  if (isWeekend) {
    return [
      'Explore campus events',
      'Connect with roommates',
      'Browse marketplace for weekend deals',
      'Join study groups'
    ];
  }

  if (isMorning) {
    return [
      'Check today\'s campus events',
      'Review study group schedules',
      'Plan your day',
      'Check for new property listings'
    ];
  }

  if (isEvening) {
    return [
      'Join evening social events',
      'Connect with study partners',
      'Review tomorrow\'s schedule',
      'Browse community discussions'
    ];
  }

  return ['Check your personalized dashboard', 'Explore new opportunities'];
};

const getLocationBasedRecommendations = (currentLocation, university) => {
  const isOnCampus = currentLocation?.toLowerCase().includes('campus') || 
                     currentLocation?.toLowerCase().includes(university?.toLowerCase());
  
  if (isOnCampus) {
    return [
      'Find nearby study spots',
      'Check library resources',
      'Join campus events',
      'Explore dining options'
    ];
  }

  return [
    'Find transportation to campus',
    'Check local amenities',
    'Explore neighborhood',
    'Connect with nearby students'
  ];
};

const getAcademicBasedRecommendations = (university, onboardingData) => {
  const recommendations = [];
  
  if (university) {
    recommendations.push({
      type: 'academic',
      title: `${university} Resources`,
      message: 'Access university-specific resources and support',
      actions: [
        'Academic calendar integration',
        'Study group matching',
        'Library access',
        'Tutoring services'
      ]
    });
  }

  if (onboardingData?.major) {
    recommendations.push({
      type: 'major_specific',
      title: `${onboardingData.major} Community`,
      message: 'Connect with students in your major',
      actions: [
        'Join major-specific groups',
        'Find study partners',
        'Access major resources',
        'Career guidance'
      ]
    });
  }

  return recommendations;
};

const getSocialBasedRecommendations = (onboardingData, synapse) => {
  const recommendations = [];
  
  if (onboardingData?.roommateInterest) {
    recommendations.push({
      type: 'social',
      title: 'Roommate Matching',
      message: 'Find compatible roommates based on your preferences',
      compatibility: synapse ? 'high' : 'medium',
      actions: [
        'Complete roommate quiz',
        'View compatible matches',
        'Start conversations',
        'Plan meetups'
      ]
    });
  }

  if (onboardingData?.focus === 'Community' || onboardingData?.focus === 'Everything') {
    recommendations.push({
      type: 'community',
      title: 'Community Engagement',
      message: 'Join clubs and events that match your interests',
      actions: [
        'Browse campus clubs',
        'Join interest groups',
        'Attend events',
        'Create your own group'
      ]
    });
  }

  return recommendations;
};

const getFinancialBasedRecommendations = (onboardingData) => {
  const recommendations = [];
  
  if (onboardingData?.budgetRange) {
    const { min, max } = onboardingData.budgetRange;
    const avgBudget = (min + max) / 2;
    
    recommendations.push({
      type: 'financial',
      title: 'Budget-Conscious Recommendations',
      message: `Find options within your budget of $${min}-$${max}`,
      actions: [
        'Browse budget-friendly properties',
        'Find affordable essentials',
        'Join money-saving groups',
        'Access financial resources'
      ]
    });
  }

  return recommendations;
};

// Predictive analytics for student success
export const predictStudentNeeds = (userData, activityData = {}) => {
  const riskFactors = [];
  const opportunities = [];
  const insights = [];

  // Academic success indicators
  if (userData.major && !activityData.studyGroups) {
    riskFactors.push({
      type: 'academic_isolation',
      severity: 'medium',
      title: 'Academic Support Needed',
      message: 'Connect with study groups in your major for better academic performance',
      intervention: 'Join study groups',
      action: 'Find study partners',
      priority: 'medium'
    });
  }

  // Social integration indicators
  if (userData.roommateInterest && !activityData.roommateConnections) {
    opportunities.push({
      type: 'social_connection',
      potential: 'high',
      title: 'Social Integration Opportunity',
      message: 'Find compatible roommates to build lasting friendships',
      action: 'Start roommate matching',
      priority: 'high'
    });
  }

  // Financial wellness indicators
  if (userData.budgetRange && activityData.spendingPattern) {
    const budgetUtilization = activityData.spendingPattern / userData.budgetRange.max;
    if (budgetUtilization > 0.8) {
      riskFactors.push({
        type: 'budget_stress',
        severity: 'high',
        title: 'Budget Management Alert',
        message: 'Your spending is approaching your budget limit',
        intervention: 'Budget management resources and part-time opportunities',
        action: 'Review budget planning',
        priority: 'high'
      });
    }
  }

  // Housing urgency
  if (userData.arrivalDate && !activityData.housingSecured) {
    const daysUntilArrival = Math.ceil((new Date(userData.arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilArrival < 30) {
      riskFactors.push({
        type: 'housing_urgency',
        severity: 'high',
        title: 'Housing Urgency',
        message: `${daysUntilArrival} days until arrival - secure housing now`,
        intervention: 'Priority housing assistance',
        action: 'Browse available properties',
        priority: 'critical'
      });
    }
  }

  return { riskFactors, opportunities, insights };
};

// Smart dashboard customization
export const getPersonalizedDashboard = (onboardingData, userActivity = {}) => {
  const focus = onboardingData?.focus || 'Everything';
  
  const dashboard = {
    primaryWidget: getPrimaryWidget(focus),
    secondaryWidgets: getSecondaryWidgets(onboardingData, userActivity),
    quickActions: getContextualQuickActions(onboardingData, userActivity),
    notifications: getPersonalizedNotifications(onboardingData, userActivity)
  };

  return dashboard;
};

const getPrimaryWidget = (focus) => {
  const widgetMap = {
    'Housing': 'PropertyRecommendations',
    'Roommate': 'RoommateMatches',
    'Essentials': 'MarketplaceEssentials',
    'Community': 'CommunityEvents',
    'Everything': 'ComprehensiveOverview'
  };
  
  return widgetMap[focus] || 'ComprehensiveOverview';
};

const getSecondaryWidgets = (onboardingData, userActivity) => {
  const widgets = [];
  
  // Always show user's own content
  widgets.push('MyProperties', 'MyMarketplace');
  
  // Add based on focus and activity
  if (onboardingData?.focus === 'Housing' || onboardingData?.focus === 'Everything') {
    widgets.push('PropertyRecommendations');
  }
  
  if (onboardingData?.focus === 'Roommate' || onboardingData?.focus === 'Everything') {
    widgets.push('RoommateMatches');
  }
  
  if (onboardingData?.focus === 'Essentials' || onboardingData?.focus === 'Everything') {
    widgets.push('MarketplaceEssentials');
  }
  
  if (onboardingData?.focus === 'Community' || onboardingData?.focus === 'Everything') {
    widgets.push('CommunityEvents');
  }
  
  return widgets;
};

const getContextualQuickActions = (onboardingData, userActivity) => {
  const actions = [];
  
  // Based on focus
  if (onboardingData?.focus === 'Housing' || onboardingData?.focus === 'Everything') {
    actions.push({
      title: 'Find Housing',
      icon: 'Home',
      action: 'browse_properties',
      priority: 'high'
    });
  }
  
  if (onboardingData?.focus === 'Roommate' || onboardingData?.focus === 'Everything') {
    actions.push({
      title: 'Find Roommates',
      icon: 'Users',
      action: 'start_roommate_matching',
      priority: 'high'
    });
  }
  
  if (onboardingData?.focus === 'Essentials' || onboardingData?.focus === 'Everything') {
    actions.push({
      title: 'Get Essentials',
      icon: 'ShoppingBag',
      action: 'browse_marketplace',
      priority: 'medium'
    });
  }
  
  if (onboardingData?.focus === 'Community' || onboardingData?.focus === 'Everything') {
    actions.push({
      title: 'Join Community',
      icon: 'MessageCircle',
      action: 'explore_community',
      priority: 'medium'
    });
  }
  
  return actions;
};

const getPersonalizedNotifications = (onboardingData, userActivity) => {
  const notifications = [];
  
  // Housing urgency
  if (onboardingData?.arrivalDate && !userActivity.housingSecured) {
    const daysUntilArrival = Math.ceil((new Date(onboardingData.arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilArrival < 30) {
      notifications.push({
        type: 'urgent',
        title: 'Housing Alert',
        message: `Only ${daysUntilArrival} days until arrival - secure your housing now`,
        action: 'View available properties',
        priority: 'high'
      });
    }
  }
  
  // Budget-aware recommendations
  if (onboardingData?.budgetRange && onboardingData?.essentials) {
    notifications.push({
      type: 'recommendation',
      title: 'Budget-Friendly Essentials',
      message: `Found ${onboardingData.essentials.length} essentials within your budget`,
      action: 'View recommendations',
      priority: 'medium'
    });
  }
  
  // Community opportunities
  if (onboardingData?.university) {
    notifications.push({
      type: 'opportunity',
      title: 'Community Opportunity',
      message: `Connect with ${onboardingData.university} students`,
      action: 'Join community',
      priority: 'low'
    });
  }
  
  return notifications;
};

// Export all functions
export default {
  getArrivalTimeline,
  getContextualRecommendations,
  predictStudentNeeds,
  getPersonalizedDashboard
};

