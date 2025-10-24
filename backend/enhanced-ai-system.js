/**
 * Enhanced AI System for NewRun
 * Complete AI ecosystem integration
 * CEO-level implementation with comprehensive student life support
 */

const aiToolsExpansion = require('./ai-tools-expansion');

// =====================
// ENHANCED AI INSIGHTS SYSTEM
// =====================

/**
 * Comprehensive AI insights covering all aspects of student life
 */
async function generateComprehensiveInsights(user, dashboardData) {
  try {
    const insights = [];
    
    // 1. HOUSING INSIGHTS (Existing - Enhanced)
    const housingInsights = await generateHousingInsights(user, dashboardData);
    insights.push(...housingInsights);
    
    // 2. FINANCIAL INSIGHTS (New)
    const financialInsights = await generateFinancialInsights(user, dashboardData);
    insights.push(...financialInsights);
    
    // 3. ACADEMIC INSIGHTS (New)
    const academicInsights = await generateAcademicInsights(user, dashboardData);
    insights.push(...academicInsights);
    
    // 4. TRANSPORTATION INSIGHTS (New)
    const transportationInsights = await generateTransportationInsights(user, dashboardData);
    insights.push(...transportationInsights);
    
    // 5. WELLNESS INSIGHTS (New)
    const wellnessInsights = await generateWellnessInsights(user, dashboardData);
    insights.push(...wellnessInsights);
    
    // 6. CAREER INSIGHTS (New)
    const careerInsights = await generateCareerInsights(user, dashboardData);
    insights.push(...careerInsights);
    
    // 7. SOCIAL INSIGHTS (New)
    const socialInsights = await generateSocialInsights(user, dashboardData);
    insights.push(...socialInsights);
    
    // 8. CAMPUS LIFE INSIGHTS (New)
    const campusLifeInsights = await generateCampusLifeInsights(user, dashboardData);
    insights.push(...campusLifeInsights);
    
    return {
      success: true,
      insights: insights,
      categories: {
        housing: housingInsights.length,
        financial: financialInsights.length,
        academic: academicInsights.length,
        transportation: transportationInsights.length,
        wellness: wellnessInsights.length,
        career: careerInsights.length,
        social: socialInsights.length,
        campusLife: campusLifeInsights.length
      },
      aiGenerated: true,
      comprehensive: true
    };
    
  } catch (error) {
    console.error('Comprehensive AI Insights Error:', error);
    return generateFallbackComprehensiveInsights(user, dashboardData);
  }
}

// =====================
// INDIVIDUAL INSIGHT GENERATORS
// =====================

/**
 * Generate housing insights (Enhanced existing)
 */
async function generateHousingInsights(user, dashboardData) {
  try {
    // Use existing housing AI tools
    const housingData = {
      budgetRange: user.onboardingData?.budgetRange,
      livingSituation: user.onboardingData?.livingSituation,
      preferences: user.onboardingData?.housingPreferences,
      arrivalDate: user.onboardingData?.arrivalDate
    };
    
    const insights = await aiToolsExpansion.getHousingRecommendations(user, housingData);
    return insights.map(insight => ({
      ...insight,
      category: 'housing',
      icon: 'home',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Housing Insights Error:', error);
    return [{
      category: 'housing',
      title: 'Housing Planning',
      message: 'Complete your housing preferences to get personalized recommendations.',
      priority: 'high',
      action: 'Update housing preferences',
      icon: 'home'
    }];
  }
}

/**
 * Generate financial insights
 */
async function generateFinancialInsights(user, dashboardData) {
  try {
    const financialData = {
      monthlyIncome: user.financialData?.monthlyIncome || 0,
      monthlyExpenses: user.financialData?.monthlyExpenses || 0,
      savingsGoal: user.financialData?.savingsGoal || 0,
      currentSavings: user.financialData?.currentSavings || 0,
      expenseCategories: user.financialData?.expenseCategories || {}
    };
    
    const insights = await aiToolsExpansion.getBudgetAnalysis(user, financialData);
    return insights.insights.map(insight => ({
      ...insight,
      category: 'financial',
      icon: 'money',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Financial Insights Error:', error);
    return [{
      category: 'financial',
      title: 'Budget Planning',
      message: 'Set up your financial tracking to get personalized budget insights.',
      priority: 'high',
      action: 'Set up budget tracking',
      icon: 'money'
    }];
  }
}

/**
 * Generate academic insights
 */
async function generateAcademicInsights(user, dashboardData) {
  try {
    const academicData = {
      currentGPA: user.academicData?.currentGPA,
      creditsCompleted: user.academicData?.creditsCompleted || 0,
      creditsRequired: user.academicData?.creditsRequired || 0,
      graduationTarget: user.academicData?.graduationTarget,
      interests: user.academicData?.interests || [],
      careerGoals: user.academicData?.careerGoals
    };
    
    const insights = await aiToolsExpansion.getCourseRecommendations(user, academicData);
    return insights.insights.map(insight => ({
      ...insight,
      category: 'academic',
      icon: 'school',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Academic Insights Error:', error);
    return [{
      category: 'academic',
      title: 'Academic Planning',
      message: 'Plan your course schedule to stay on track for graduation.',
      priority: 'high',
      action: 'Review degree requirements',
      icon: 'school'
    }];
  }
}

/**
 * Generate transportation insights
 */
async function generateTransportationInsights(user, dashboardData) {
  try {
    const locationData = {
      homeAddress: user.locationData?.homeAddress,
      campusLocation: user.locationData?.campusLocation,
      preferences: user.locationData?.preferences || {},
      transportationBudget: user.locationData?.transportationBudget || 0,
      schedule: user.locationData?.schedule || {}
    };
    
    const insights = await aiToolsExpansion.getRouteOptimization(user, locationData);
    return insights.insights.map(insight => ({
      ...insight,
      category: 'transportation',
      icon: 'directions_bus',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Transportation Insights Error:', error);
    return [{
      category: 'transportation',
      title: 'Transportation Planning',
      message: 'Plan your daily commute to optimize time and cost.',
      priority: 'medium',
      action: 'Explore transportation options',
      icon: 'directions_bus'
    }];
  }
}

/**
 * Generate wellness insights
 */
async function generateWellnessInsights(user, dashboardData) {
  try {
    const healthData = {
      goals: user.healthData?.goals || [],
      fitnessLevel: user.healthData?.fitnessLevel,
      sleepSchedule: user.healthData?.sleepSchedule || {},
      dietaryPreferences: user.healthData?.dietaryPreferences || {},
      stressLevel: user.healthData?.stressLevel,
      mentalHealthConcerns: user.healthData?.mentalHealthConcerns
    };
    
    const insights = await aiToolsExpansion.getWellnessInsights(user, healthData);
    return insights.insights.map(insight => ({
      ...insight,
      category: 'wellness',
      icon: 'health_and_safety',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Wellness Insights Error:', error);
    return [{
      category: 'wellness',
      title: 'Health & Wellness',
      message: 'Maintain a healthy lifestyle to support your academic success.',
      priority: 'medium',
      action: 'Set wellness goals',
      icon: 'health_and_safety'
    }];
  }
}

/**
 * Generate career insights
 */
async function generateCareerInsights(user, dashboardData) {
  try {
    const careerData = {
      interests: user.careerData?.interests || [],
      skills: user.careerData?.skills || [],
      experienceLevel: user.careerData?.experienceLevel,
      careerGoals: user.careerData?.careerGoals,
      targetIndustries: user.careerData?.targetIndustries || [],
      locationPreferences: user.careerData?.locationPreferences || {}
    };
    
    const insights = await aiToolsExpansion.getCareerInsights(user, careerData);
    return insights.insights.map(insight => ({
      ...insight,
      category: 'career',
      icon: 'work',
      priority: insight.priority || 'medium'
    }));
  } catch (error) {
    console.error('Career Insights Error:', error);
    return [{
      category: 'career',
      title: 'Career Planning',
      message: 'Start planning your career path early to maximize opportunities.',
      priority: 'medium',
      action: 'Explore career options',
      icon: 'work'
    }];
  }
}

/**
 * Generate social insights
 */
async function generateSocialInsights(user, dashboardData) {
  try {
    const socialData = {
      interests: user.socialData?.interests || [],
      hobbies: user.socialData?.hobbies || [],
      socialGoals: user.socialData?.socialGoals,
      preferredActivities: user.socialData?.preferredActivities || [],
      socialPreferences: user.socialData?.socialPreferences || {}
    };
    
    // Generate social insights based on user data
    const insights = [];
    
    if (user.socialData?.interests?.length === 0) {
      insights.push({
        category: 'social',
        title: 'Social Connections',
        message: 'Join clubs and activities to build your social network on campus.',
        priority: 'medium',
        action: 'Explore campus activities',
        icon: 'people'
      });
    }
    
    if (user.socialData?.hobbies?.length === 0) {
      insights.push({
        category: 'social',
        title: 'Hobby Development',
        message: 'Explore new hobbies and interests to enrich your college experience.',
        priority: 'low',
        action: 'Discover new hobbies',
        icon: 'favorite'
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Social Insights Error:', error);
    return [{
      category: 'social',
      title: 'Social Life',
      message: 'Build meaningful connections and friendships during your college years.',
      priority: 'medium',
      action: 'Join campus communities',
      icon: 'people'
    }];
  }
}

/**
 * Generate campus life insights
 */
async function generateCampusLifeInsights(user, dashboardData) {
  try {
    const campusLifeData = {
      university: user.university,
      campusInvolvement: user.campusLifeData?.campusInvolvement || [],
      eventPreferences: user.campusLifeData?.eventPreferences || [],
      campusResources: user.campusLifeData?.campusResources || [],
      involvementGoals: user.campusLifeData?.involvementGoals
    };
    
    // Generate campus life insights
    const insights = [];
    
    if (user.campusLifeData?.campusInvolvement?.length === 0) {
      insights.push({
        category: 'campusLife',
        title: 'Campus Involvement',
        message: 'Get involved in campus activities to enhance your college experience.',
        priority: 'medium',
        action: 'Explore campus organizations',
        icon: 'event'
      });
    }
    
    if (user.campusLifeData?.campusResources?.length === 0) {
      insights.push({
        category: 'campusLife',
        title: 'Campus Resources',
        message: 'Utilize campus resources like libraries, labs, and study spaces.',
        priority: 'low',
        action: 'Discover campus resources',
        icon: 'library_books'
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Campus Life Insights Error:', error);
    return [{
      category: 'campusLife',
      title: 'Campus Life',
      message: 'Make the most of your campus experience and available resources.',
      priority: 'medium',
      action: 'Explore campus opportunities',
      icon: 'event'
    }];
  }
}

// =====================
// FALLBACK FUNCTIONS
// =====================

function generateFallbackComprehensiveInsights(user, dashboardData) {
  return {
    success: true,
    insights: [
      {
        category: 'housing',
        title: 'Complete Your Profile',
        message: 'Complete your onboarding to get personalized AI insights.',
        priority: 'high',
        action: 'Complete onboarding',
        icon: 'home'
      },
      {
        category: 'financial',
        title: 'Set Up Budget Tracking',
        message: 'Track your expenses to get financial insights and recommendations.',
        priority: 'medium',
        action: 'Set up budget tracking',
        icon: 'money'
      },
      {
        category: 'academic',
        title: 'Academic Planning',
        message: 'Plan your academic journey for success.',
        priority: 'high',
        action: 'Review academic goals',
        icon: 'school'
      }
    ],
    categories: {
      housing: 1,
      financial: 1,
      academic: 1,
      transportation: 0,
      wellness: 0,
      career: 0,
      social: 0,
      campusLife: 0
    },
    fallback: true
  };
}

// =====================
// AI TOOL INTEGRATION
// =====================

/**
 * Enhanced AI tool calling system
 */
async function callAITool(toolName, user, data) {
  try {
    const toolMap = {
      'get_budget_analysis': aiToolsExpansion.getBudgetAnalysis,
      'get_expense_insights': aiToolsExpansion.getExpenseInsights,
      'get_course_recommendations': aiToolsExpansion.getCourseRecommendations,
      'get_study_schedule': aiToolsExpansion.getStudySchedule,
      'get_route_optimization': aiToolsExpansion.getRouteOptimization,
      'get_wellness_insights': aiToolsExpansion.getWellnessInsights,
      'get_career_insights': aiToolsExpansion.getCareerInsights
    };
    
    const toolFunction = toolMap[toolName];
    if (!toolFunction) {
      throw new Error(`Unknown AI tool: ${toolName}`);
    }
    
    return await toolFunction(user, data);
  } catch (error) {
    console.error(`AI Tool ${toolName} Error:`, error);
    throw error;
  }
}

module.exports = {
  // Main comprehensive insights
  generateComprehensiveInsights,
  
  // Individual insight generators
  generateHousingInsights,
  generateFinancialInsights,
  generateAcademicInsights,
  generateTransportationInsights,
  generateWellnessInsights,
  generateCareerInsights,
  generateSocialInsights,
  generateCampusLifeInsights,
  
  // AI tool integration
  callAITool,
  
  // Fallback functions
  generateFallbackComprehensiveInsights
};






