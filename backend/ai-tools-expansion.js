/**
 * AI Tools Expansion for NewRun
 * Complete AI ecosystem for student life management
 * CEO-level implementation strategy
 */

// =====================
// FINANCIAL AI TOOLS
// =====================

/**
 * Get AI-powered budget analysis and recommendations
 */
async function getBudgetAnalysis(user, financialData) {
  try {
    const systemPrompt = `You are a financial advisor AI specializing in student budgets. 
    
    Analyze the student's financial situation and provide:
    1. Budget optimization recommendations
    2. Expense categorization and insights
    3. Savings strategies
    4. Cost-cutting opportunities
    5. Financial goal tracking
    
    Focus on student-specific financial challenges and opportunities.`;

    const userPrompt = `Student Financial Profile:
    - Monthly Income: $${financialData.monthlyIncome || 0}
    - Monthly Expenses: $${financialData.monthlyExpenses || 0}
    - Savings Goal: $${financialData.savingsGoal || 0}
    - Current Savings: $${financialData.currentSavings || 0}
    - Major Expenses: ${JSON.stringify(financialData.expenseCategories || {})}
    - University: ${user.university}
    - Living Situation: ${user.onboardingData?.livingSituation || 'Unknown'}
    
    Provide specific, actionable financial recommendations.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseFinancialInsights(aiResponse);
  } catch (error) {
    console.error('Budget Analysis Error:', error);
    return generateFallbackFinancialInsights(user, financialData);
  }
}

/**
 * Get AI-powered expense insights and optimization
 */
async function getExpenseInsights(user, expenseData) {
  try {
    const systemPrompt = `You are an expense optimization AI for students.
    
    Analyze spending patterns and provide:
    1. Spending category analysis
    2. Unnecessary expense identification
    3. Cost-saving opportunities
    4. Budget allocation recommendations
    5. Expense tracking strategies`;

    const userPrompt = `Student Expense Data:
    - Total Monthly Spending: $${expenseData.totalSpending || 0}
    - Category Breakdown: ${JSON.stringify(expenseData.categories || {})}
    - Spending Trends: ${JSON.stringify(expenseData.trends || {})}
    - Budget vs Actual: ${JSON.stringify(expenseData.budgetComparison || {})}
    
    Provide specific expense optimization recommendations.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseExpenseInsights(aiResponse);
  } catch (error) {
    console.error('Expense Insights Error:', error);
    return generateFallbackExpenseInsights(user, expenseData);
  }
}

// =====================
// ACADEMIC AI TOOLS
// =====================

/**
 * Get AI-powered course recommendations
 */
async function getCourseRecommendations(user, academicData) {
  try {
    const systemPrompt = `You are an academic advisor AI specializing in course selection.
    
    Analyze the student's academic profile and provide:
    1. Course recommendations based on major and interests
    2. Prerequisite planning
    3. Graduation timeline optimization
    4. GPA improvement strategies
    5. Academic goal tracking`;

    const userPrompt = `Student Academic Profile:
    - Major: ${user.major}
    - Current GPA: ${academicData.currentGPA || 'Not provided'}
    - Credits Completed: ${academicData.creditsCompleted || 0}
    - Credits Required: ${academicData.creditsRequired || 0}
    - Graduation Target: ${academicData.graduationTarget || 'Not set'}
    - Interests: ${JSON.stringify(academicData.interests || [])}
    - Career Goals: ${academicData.careerGoals || 'Not specified'}
    
    Provide specific course recommendations and academic planning.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseAcademicInsights(aiResponse);
  } catch (error) {
    console.error('Course Recommendations Error:', error);
    return generateFallbackAcademicInsights(user, academicData);
  }
}

/**
 * Get AI-powered study schedule optimization
 */
async function getStudySchedule(user, scheduleData) {
  try {
    const systemPrompt = `You are a study optimization AI for students.
    
    Create an optimal study schedule considering:
    1. Course workload and difficulty
    2. Personal preferences and habits
    3. Available time slots
    4. Study method effectiveness
    5. Exam preparation strategies`;

    const userPrompt = `Student Schedule Data:
    - Current Courses: ${JSON.stringify(scheduleData.courses || [])}
    - Available Time: ${JSON.stringify(scheduleData.availableTime || {})}
    - Study Preferences: ${JSON.stringify(scheduleData.preferences || {})}
    - Upcoming Exams: ${JSON.stringify(scheduleData.exams || [])}
    - Study Goals: ${scheduleData.studyGoals || 'Not specified'}
    
    Provide a detailed study schedule and optimization recommendations.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseStudySchedule(aiResponse);
  } catch (error) {
    console.error('Study Schedule Error:', error);
    return generateFallbackStudySchedule(user, scheduleData);
  }
}

// =====================
// TRANSPORTATION AI TOOLS
// =====================

/**
 * Get AI-powered route optimization
 */
async function getRouteOptimization(user, locationData) {
  try {
    const systemPrompt = `You are a transportation optimization AI for students.
    
    Analyze transportation needs and provide:
    1. Optimal route planning
    2. Cost-effective transportation options
    3. Time optimization strategies
    4. Carpool matching opportunities
    5. Public transit optimization`;

    const userPrompt = `Student Transportation Profile:
    - Home Address: ${locationData.homeAddress || 'Not provided'}
    - University: ${user.university}
    - Campus Location: ${locationData.campusLocation || 'Not provided'}
    - Transportation Preferences: ${JSON.stringify(locationData.preferences || {})}
    - Budget: $${locationData.transportationBudget || 0}
    - Schedule: ${JSON.stringify(locationData.schedule || {})}
    
    Provide specific transportation optimization recommendations.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseTransportationInsights(aiResponse);
  } catch (error) {
    console.error('Route Optimization Error:', error);
    return generateFallbackTransportationInsights(user, locationData);
  }
}

// =====================
// WELLNESS AI TOOLS
// =====================

/**
 * Get AI-powered health and wellness insights
 */
async function getWellnessInsights(user, healthData) {
  try {
    const systemPrompt = `You are a wellness advisor AI for students.
    
    Analyze health and wellness data and provide:
    1. Health tracking insights
    2. Fitness recommendations
    3. Mental health support
    4. Sleep optimization
    5. Nutrition guidance`;

    const userPrompt = `Student Wellness Profile:
    - Health Goals: ${JSON.stringify(healthData.goals || [])}
    - Current Fitness Level: ${healthData.fitnessLevel || 'Not assessed'}
    - Sleep Schedule: ${JSON.stringify(healthData.sleepSchedule || {})}
    - Dietary Preferences: ${JSON.stringify(healthData.dietaryPreferences || {})}
    - Stress Levels: ${healthData.stressLevel || 'Not assessed'}
    - Mental Health Concerns: ${healthData.mentalHealthConcerns || 'None reported'}
    
    Provide specific wellness recommendations and tracking strategies.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseWellnessInsights(aiResponse);
  } catch (error) {
    console.error('Wellness Insights Error:', error);
    return generateFallbackWellnessInsights(user, healthData);
  }
}

// =====================
// CAREER AI TOOLS
// =====================

/**
 * Get AI-powered career planning and job matching
 */
async function getCareerInsights(user, careerData) {
  try {
    const systemPrompt = `You are a career advisor AI for students.
    
    Analyze career goals and provide:
    1. Career path recommendations
    2. Skill development planning
    3. Job market insights
    4. Networking strategies
    5. Professional development opportunities`;

    const userPrompt = `Student Career Profile:
    - Major: ${user.major}
    - Career Interests: ${JSON.stringify(careerData.interests || [])}
    - Skills: ${JSON.stringify(careerData.skills || [])}
    - Experience Level: ${careerData.experienceLevel || 'Entry level'}
    - Career Goals: ${careerData.careerGoals || 'Not specified'}
    - Target Industries: ${JSON.stringify(careerData.targetIndustries || [])}
    - Location Preferences: ${JSON.stringify(careerData.locationPreferences || {})}
    
    Provide specific career planning and development recommendations.`;

    const aiResponse = await callOpenAI(systemPrompt, userPrompt);
    return parseCareerInsights(aiResponse);
  } catch (error) {
    console.error('Career Insights Error:', error);
    return generateFallbackCareerInsights(user, careerData);
  }
}

// =====================
// HELPER FUNCTIONS
// =====================

async function callOpenAI(systemPrompt, userPrompt) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return response?.data?.choices?.[0]?.message?.content || '';
}

// Parse functions for each AI tool type
function parseFinancialInsights(content) {
  // Parse AI response into structured financial insights
  return {
    type: 'financial',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseExpenseInsights(content) {
  return {
    type: 'expense',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseAcademicInsights(content) {
  return {
    type: 'academic',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseStudySchedule(content) {
  return {
    type: 'study_schedule',
    schedule: extractScheduleFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseTransportationInsights(content) {
  return {
    type: 'transportation',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseWellnessInsights(content) {
  return {
    type: 'wellness',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

function parseCareerInsights(content) {
  return {
    type: 'career',
    insights: extractInsightsFromContent(content),
    recommendations: extractRecommendationsFromContent(content),
    aiGenerated: true
  };
}

// Fallback functions for when AI fails
function generateFallbackFinancialInsights(user, financialData) {
  return {
    type: 'financial',
    insights: [
      {
        title: 'Budget Planning',
        message: 'Start tracking your expenses to understand your spending patterns.',
        priority: 'high',
        action: 'Set up expense tracking'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

function generateFallbackExpenseInsights(user, expenseData) {
  return {
    type: 'expense',
    insights: [
      {
        title: 'Expense Tracking',
        message: 'Monitor your spending to identify areas for improvement.',
        priority: 'medium',
        action: 'Review monthly expenses'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

function generateFallbackAcademicInsights(user, academicData) {
  return {
    type: 'academic',
    insights: [
      {
        title: 'Academic Planning',
        message: 'Plan your course schedule to stay on track for graduation.',
        priority: 'high',
        action: 'Review degree requirements'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

function generateFallbackStudySchedule(user, scheduleData) {
  return {
    type: 'study_schedule',
    schedule: {
      recommendations: ['Create a consistent study routine', 'Set aside dedicated study time']
    },
    recommendations: [],
    fallback: true
  };
}

function generateFallbackTransportationInsights(user, locationData) {
  return {
    type: 'transportation',
    insights: [
      {
        title: 'Transportation Planning',
        message: 'Plan your daily commute to optimize time and cost.',
        priority: 'medium',
        action: 'Explore transportation options'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

function generateFallbackWellnessInsights(user, healthData) {
  return {
    type: 'wellness',
    insights: [
      {
        title: 'Health & Wellness',
        message: 'Maintain a healthy lifestyle to support your academic success.',
        priority: 'medium',
        action: 'Set wellness goals'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

function generateFallbackCareerInsights(user, careerData) {
  return {
    type: 'career',
    insights: [
      {
        title: 'Career Planning',
        message: 'Start planning your career path early to maximize opportunities.',
        priority: 'medium',
        action: 'Explore career options'
      }
    ],
    recommendations: [],
    fallback: true
  };
}

// Content parsing helper functions
function extractInsightsFromContent(content) {
  // Parse AI content into structured insights
  const insights = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('**') || line.includes('•') || line.includes('-')) {
      const cleanLine = line.replace(/[*•-]/g, '').trim();
      if (cleanLine.length > 10) {
        insights.push({
          title: cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : ''),
          message: cleanLine,
          priority: 'medium',
          action: 'Learn more'
        });
      }
    }
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
}

function extractRecommendationsFromContent(content) {
  // Extract actionable recommendations from AI content
  const recommendations = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest')) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

function extractScheduleFromContent(content) {
  // Extract schedule information from AI content
  return {
    recommendations: extractRecommendationsFromContent(content),
    schedule: 'AI-generated schedule recommendations'
  };
}

module.exports = {
  // Financial AI Tools
  getBudgetAnalysis,
  getExpenseInsights,
  
  // Academic AI Tools
  getCourseRecommendations,
  getStudySchedule,
  
  // Transportation AI Tools
  getRouteOptimization,
  
  // Wellness AI Tools
  getWellnessInsights,
  
  // Career AI Tools
  getCareerInsights,
  
  // Helper functions
  callOpenAI,
  parseFinancialInsights,
  parseExpenseInsights,
  parseAcademicInsights,
  parseStudySchedule,
  parseTransportationInsights,
  parseWellnessInsights,
  parseCareerInsights
};



