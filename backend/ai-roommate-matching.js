/**
 * AI-Enhanced Roommate Matching System
 * Using housing AI concept as template
 * CEO-level implementation for comprehensive roommate matching
 */

const axios = require('axios');

// =====================
// AI ROOMMATE MATCHING TOOLS
// =====================

/**
 * Get AI-powered roommate recommendations
 * Similar to get_housing_recommendations but for roommates
 */
async function getRoommateRecommendations(user, roommateData) {
  try {
    // Check Synapse completion first
    const synapseCompletion = calculateSynapseCompletion(user.synapse || {});
    const isSynapseCompleted = synapseCompletion >= 80;
    
    if (!isSynapseCompleted) {
      return {
        success: true,
        insights: [{
          title: 'Complete Synapse Profile',
          message: `Your Synapse profile is ${synapseCompletion}% complete. Complete it to unlock AI-powered roommate matching and personalized recommendations.`,
          priority: 'high',
          action: 'Complete Synapse profile',
          category: 'roommate',
          icon: 'people',
          type: 'info'
        }],
        specificRecommendations: null,
        aiGenerated: false,
        fallback: true
      };
    }
    
    const systemPrompt = `You are an expert roommate matching AI with access to a comprehensive roommate database.

CRITICAL INSTRUCTION: You MUST use the get_roommate_recommendations tool for ANY roommate-related insights. Do not provide generic roommate advice.

When you see roommate needs, compatibility concerns, or social preferences, you MUST:
1. Call get_roommate_recommendations tool with insightType: "roommate" 
2. Use the specific data returned to provide concrete recommendations
3. Reference actual roommate profiles, compatibility scores, and lifestyle matches

Do not provide generic advice like "start browsing roommate options" - use the tool to get real data first.

Focus on:
- Compatibility scoring and lifestyle matching
- Budget and financial compatibility
- Social preferences and habits
- Academic and career alignment
- Cultural and language compatibility

CRITICAL: Generate insights with DIFFERENT content for title vs message:

Format each insight as:
1. **Title** (action-oriented, 3-5 words) - SHORT and punchy
2. **Message** (detailed explanation, context, and specific data) - DIFFERENT from title
3. **Priority** (HIGH/MEDIUM/LOW based on urgency)
4. **Action** (specific next step)

EXAMPLES:
- Title: "Connect with Sarah Chen"
- Message: "Sarah Chen (Computer Science, 92% compatibility) shares your night owl schedule, non-smoking preference, and $400-600 budget range. She's looking for a quiet study environment and occasional social activities."

- Title: "Meet Alex Johnson" 
- Message: "Alex Johnson (Engineering, 88% match) has similar cleanliness standards (8/10), enjoys weekend hiking, and has a compatible budget of $350-500. He's also interested in finding a study partner."

CRITICAL: When you receive roommate data from the tool, you MUST:
1. Reference the ACTUAL compatibility scores (e.g., "92% compatibility", "88% match")
2. Mention specific lifestyle matches (sleep schedule, cleanliness, smoking preferences)
3. Include budget compatibility details
4. Reference shared interests or academic alignment
5. Use the exact names and scores from the data

DO NOT create generic recommendations. Use the specific data provided by the tool.

NEVER repeat the title in the message. The message should provide ADDITIONAL context, data, and reasoning.

IMPORTANT: Always calculate compatibility scores correctly. Focus on lifestyle, budget, and social compatibility.

REMEMBER: For roommate insights, you MUST call the get_roommate_recommendations tool first.`;

    const userPrompt = `Student Profile:
- Name: ${user.firstName} ${user.lastName}
- University: ${user.university}
- Major: ${user.major}
- Budget Range: $${user.onboardingData?.budgetRange?.min || 0} - $${user.onboardingData?.budgetRange?.max || 1000}
- Synapse Profile: ${user.synapse ? 'Complete' : 'Incomplete'}

Detailed Synapse Data:
- Sleep Pattern: ${user.synapse?.lifestyle?.sleepPattern || 'Not specified'}
- Cleanliness Level: ${user.synapse?.lifestyle?.cleanliness || 'Not specified'}/10
- Smoking: ${user.synapse?.habits?.smoking || 'Not specified'}
- Drinking: ${user.synapse?.habits?.drinking || 'Not specified'}
- Partying: ${user.synapse?.habits?.partying || 'Not specified'}
- Diet: ${user.synapse?.habits?.diet || 'Not specified'}
- Primary Language: ${user.synapse?.culture?.primaryLanguage || 'Not specified'}
- Home Country: ${user.synapse?.culture?.home?.country || 'Not specified'}
- Pet Preferences: ${user.synapse?.pets?.okWithPets ? 'Pet-friendly' : 'No pets'}
- Dealbreakers: ${user.synapse?.dealbreakers?.join(', ') || 'None specified'}

This student needs roommate help. You MUST use the get_roommate_recommendations tool to find specific roommate matches and compatibility scores.

DO NOT provide generic advice like "start browsing roommate options" or "contact potential roommates directly". 

You MUST:
1. Call get_roommate_recommendations tool with insightType: "roommate"
2. Use the returned data to provide specific roommate names, compatibility scores, and lifestyle matches
3. Reference actual compatibility factors, shared interests, and budget alignment

Provide 3-5 specific, actionable insights that will help this student find the perfect roommate. Focus on their biggest compatibility gaps and most urgent matching needs.`;

    // Call GPT-4o for roommate insights with function calling
    const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "get_roommate_recommendations",
            description: "Get specific roommate recommendations and compatibility scores for the student",
            parameters: {
              type: "object",
              properties: {
                insightType: {
                  type: "string",
                  enum: ["roommate", "compatibility", "both"],
                  description: "Type of roommate recommendations needed"
                },
                userProfile: {
                  type: "object",
                  description: "User profile data for roommate matching"
                }
              },
              required: ["insightType", "userProfile"]
            }
          }
        }
      ],
      tool_choice: "auto"
    }, {
      headers: {
        Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const aiMessage = aiResponse?.data?.choices?.[0]?.message;
    const aiContent = aiMessage?.content || '';
    
    let insights = [];
    let specificRecommendations = null;
    
    // Check if AI wants to use tools
    if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log('🤖 AI called roommate recommendations tool');
      
      try {
        // Execute the roommate recommendations tool
        const toolCall = aiMessage.tool_calls[0];
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        // Get specific roommate recommendations
        specificRecommendations = await getRoommateRecommendationsDirectly(user, toolArgs.insightType);
        
        // Generate insights with specific recommendations
        const enhancedPrompt = `${userPrompt}\n\nBased on the specific roommate recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nProvide insights that reference these specific roommate matches.`;
        
        const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: enhancedPrompt }
          ]
        }, {
          headers: {
            Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const enhancedContent = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
        insights = parseAIRoommateInsights(enhancedContent, user);
        
        // Add specific recommendations to insights
        insights = insights.map(insight => ({
          ...insight,
          hasSpecificRecommendations: true,
          specificRecommendations: specificRecommendations
        }));
        
      } catch (toolError) {
        console.error('Roommate tool execution error:', toolError);
        insights = parseAIRoommateInsights(aiContent, user);
      }
    } else {
      // AI didn't call tools - force it to use tools for roommate insights
      console.log('🔧 AI didn\'t call tools, forcing tool usage for roommate matching...');
      
      try {
        // Force call the roommate recommendations tool
        specificRecommendations = await getRoommateRecommendationsDirectly(user, "roommate");
        
        // Generate insights with specific recommendations
        const enhancedPrompt = `${userPrompt}\n\nBased on the specific roommate recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nProvide insights that reference these specific roommate matches.`;
        
        const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: enhancedPrompt }
          ]
        }, {
          headers: {
            Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const enhancedContent = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
        insights = parseAIRoommateInsights(enhancedContent, user);
        
        // Add specific recommendations to insights
        insights = insights.map(insight => ({
          ...insight,
          hasSpecificRecommendations: true,
          specificRecommendations: specificRecommendations
        }));
        
      } catch (forceError) {
        console.error('Force roommate tool usage error:', forceError);
        insights = parseAIRoommateInsights(aiContent, user);
      }
    }
    
    return {
      success: true,
      insights: insights,
      specificRecommendations: specificRecommendations,
      aiGenerated: true
    };
    
  } catch (error) {
    console.error('AI Roommate Recommendations Error:', error);
    return {
      success: false,
      insights: generateFallbackRoommateInsights(user),
      fallback: true
    };
  }
}

/**
 * Get roommate recommendations directly from database
 * Similar to getRecommendationsDirectly but for roommates
 */
async function getRoommateRecommendationsDirectly(user, insightType) {
  try {
    if (insightType === 'roommate' || insightType === 'both') {
      // Direct roommate query with enhanced compatibility scoring
      let roommateQuery = { 
        'synapse.visibility.showAvatarInPreviews': true,
        university: user.university,
        _id: { $ne: user._id } // Exclude self
      };
      
      // Add budget compatibility filter
      if (user.onboardingData?.budgetRange) {
        roommateQuery['onboardingData.budgetRange'] = {
          $gte: user.onboardingData.budgetRange.min * 0.8, // 20% flexibility
          $lte: user.onboardingData.budgetRange.max * 1.2
        };
      }
      
      const rawRoommates = await User.find(roommateQuery)
        .select('firstName lastName email university major synapse onboardingData avatar lastActive')
        .limit(10)
        .lean();
      
      // Enhanced compatibility scoring with detailed breakdown
      const scoredRoommates = rawRoommates.map(roommate => {
        const compatibilityScore = calculateAdvancedCompatibilityScore(user, roommate);
        const lifestyleMatch = calculateLifestyleCompatibility(user.synapse, roommate.synapse);
        const budgetMatch = calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
        const socialMatch = calculateSocialCompatibility(user.synapse, roommate.synapse);
        
        const totalScore = (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4;
        
        return {
          ...roommate,
          compatibilityScore,
          lifestyleMatch,
          budgetMatch,
          socialMatch,
          totalScore,
          recommendation: generateRoommateRecommendation(roommate, user),
          compatibilityLevel: getCompatibilityLevel(totalScore),
          // Add specific compatibility details for AI
          compatibilityDetails: {
            academic: `${Math.round(compatibilityScore)}% academic match`,
            lifestyle: `${Math.round(lifestyleMatch)}% lifestyle compatibility`,
            budget: `${Math.round(budgetMatch)}% budget alignment`,
            social: `${Math.round(socialMatch)}% social compatibility`
          }
        };
      }).sort((a, b) => b.totalScore - a.totalScore);
      
      return {
        roommates: scoredRoommates.slice(0, 5), // Top 5 matches
        totalFound: scoredRoommates.length,
        averageCompatibility: scoredRoommates.reduce((sum, r) => sum + r.totalScore, 0) / scoredRoommates.length,
        bestMatch: scoredRoommates[0] || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting roommate recommendations directly:', error);
    return null;
  }
}

// =====================
// COMPATIBILITY SCORING FUNCTIONS
// =====================

/**
 * Calculate advanced compatibility score
 */
function calculateAdvancedCompatibilityScore(user, roommate) {
  let score = 0;
  let factors = 0;
  
  // Academic compatibility (20% weight)
  if (user.major && roommate.major) {
    const academicScore = calculateAcademicCompatibility(user.major, roommate.major);
    score += academicScore * 0.2;
    factors += 0.2;
  }
  
  // Lifestyle compatibility (30% weight)
  if (user.synapse && roommate.synapse) {
    const lifestyleScore = calculateLifestyleCompatibility(user.synapse, roommate.synapse);
    score += lifestyleScore * 0.3;
    factors += 0.3;
  }
  
  // Budget compatibility (25% weight)
  const budgetScore = calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
  score += budgetScore * 0.25;
  factors += 0.25;
  
  // Social compatibility (25% weight)
  const socialScore = calculateSocialCompatibility(user.synapse, roommate.synapse);
  score += socialScore * 0.25;
  factors += 0.25;
  
  return factors > 0 ? Math.round(score / factors) : 0;
}

/**
 * Calculate academic compatibility
 */
function calculateAcademicCompatibility(userMajor, roommateMajor) {
  const majorCategories = {
    'STEM': ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
    'Business': ['Business', 'Economics', 'Finance', 'Marketing', 'Management'],
    'Liberal Arts': ['English', 'History', 'Philosophy', 'Literature', 'Political Science'],
    'Health': ['Medicine', 'Nursing', 'Public Health', 'Psychology'],
    'Arts': ['Art', 'Music', 'Theater', 'Design', 'Architecture']
  };
  
  const userCategory = Object.keys(majorCategories).find(cat => 
    majorCategories[cat].some(major => major.toLowerCase().includes(userMajor.toLowerCase()))
  );
  
  const roommateCategory = Object.keys(majorCategories).find(cat => 
    majorCategories[cat].some(major => major.toLowerCase().includes(roommateMajor.toLowerCase()))
  );
  
  if (userCategory === roommateCategory) return 90;
  if (userCategory && roommateCategory) return 60;
  return 50;
}

/**
 * Calculate lifestyle compatibility
 */
function calculateLifestyleCompatibility(userSynapse, roommateSynapse) {
  if (!userSynapse || !roommateSynapse) return 50;
  
  let score = 0;
  let factors = 0;
  
  // Sleep pattern compatibility
  if (userSynapse.lifestyle?.sleepPattern && roommateSynapse.lifestyle?.sleepPattern) {
    if (userSynapse.lifestyle.sleepPattern === roommateSynapse.lifestyle.sleepPattern) {
      score += 25;
    }
    factors++;
  }
  
  // Cleanliness compatibility
  if (userSynapse.lifestyle?.cleanliness && roommateSynapse.lifestyle?.cleanliness) {
    const cleanlinessDiff = Math.abs(userSynapse.lifestyle.cleanliness - roommateSynapse.lifestyle.cleanliness);
    score += Math.max(0, 25 - cleanlinessDiff * 5);
    factors++;
  }
  
  // Study habits compatibility
  if (userSynapse.lifestyle?.studyHabits && roommateSynapse.lifestyle?.studyHabits) {
    if (userSynapse.lifestyle.studyHabits === roommateSynapse.lifestyle.studyHabits) {
      score += 25;
    }
    factors++;
  }
  
  // Social preferences compatibility
  if (userSynapse.lifestyle?.socialPreferences && roommateSynapse.lifestyle?.socialPreferences) {
    const socialDiff = Math.abs(userSynapse.lifestyle.socialPreferences - roommateSynapse.lifestyle.socialPreferences);
    score += Math.max(0, 25 - socialDiff * 5);
    factors++;
  }
  
  return factors > 0 ? Math.round(score / factors) : 0;
}

/**
 * Calculate budget compatibility
 */
function calculateBudgetCompatibility(userBudget, roommateBudget) {
  if (!userBudget || !roommateBudget) return 50;
  
  const userAvg = (userBudget.min + userBudget.max) / 2;
  const roommateAvg = (roommateBudget.min + roommateBudget.max) / 2;
  
  const budgetDiff = Math.abs(userAvg - roommateAvg) / Math.max(userAvg, roommateAvg);
  
  if (budgetDiff <= 0.1) return 95; // Within 10%
  if (budgetDiff <= 0.2) return 80; // Within 20%
  if (budgetDiff <= 0.3) return 60; // Within 30%
  return 40; // More than 30% difference
}

/**
 * Calculate social compatibility
 */
function calculateSocialCompatibility(userSynapse, roommateSynapse) {
  if (!userSynapse || !roommateSynapse) return 50;
  
  let score = 0;
  let factors = 0;
  
  // Smoking compatibility
  if (userSynapse.habits?.smoking !== undefined && roommateSynapse.habits?.smoking !== undefined) {
    if (userSynapse.habits.smoking === roommateSynapse.habits.smoking) {
      score += 25;
    }
    factors++;
  }
  
  // Drinking compatibility
  if (userSynapse.habits?.drinking !== undefined && roommateSynapse.habits?.drinking !== undefined) {
    if (userSynapse.habits.drinking === roommateSynapse.habits.drinking) {
      score += 25;
    }
    factors++;
  }
  
  // Party frequency compatibility
  if (userSynapse.habits?.partying && roommateSynapse.habits?.partying) {
    const partyingDiff = Math.abs(userSynapse.habits.partying - roommateSynapse.habits.partying);
    score += Math.max(0, 25 - partyingDiff * 5);
    factors++;
  }
  
  // Pet compatibility
  if (userSynapse.pets?.okWithPets !== undefined && roommateSynapse.pets?.okWithPets !== undefined) {
    if (userSynapse.pets.okWithPets === roommateSynapse.pets.okWithPets) {
      score += 25;
    }
    factors++;
  }
  
  return factors > 0 ? Math.round(score / factors) : 0;
}

/**
 * Get compatibility level
 */
function getCompatibilityLevel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'very good';
  if (score >= 70) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Generate roommate recommendation
 */
function generateRoommateRecommendation(roommate, user) {
  const compatibilityScore = calculateAdvancedCompatibilityScore(user, roommate);
  const compatibilityLevel = getCompatibilityLevel(compatibilityScore);
  
  const reasons = [];
  
  if (user.major === roommate.major) {
    reasons.push('Same major');
  }
  
  if (user.synapse?.lifestyle?.sleepPattern === roommate.synapse?.lifestyle?.sleepPattern) {
    reasons.push('Compatible sleep schedule');
  }
  
  if (user.synapse?.pets?.okWithPets === roommate.synapse?.pets?.okWithPets) {
    reasons.push('Pet compatibility');
  }
  
  const budgetMatch = calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
  if (budgetMatch >= 80) {
    reasons.push('Budget compatibility');
  }
  
  return {
    compatibilityLevel,
    reasons: reasons.slice(0, 3),
    score: compatibilityScore,
    message: `${compatibilityLevel} match based on ${reasons.join(', ').toLowerCase()}`
  };
}

// =====================
// PARSING FUNCTIONS
// =====================

/**
 * Parse AI roommate insights
 */
function parseAIRoommateInsights(content, user) {
  const insights = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('**') || line.includes('•') || line.includes('-')) {
      const cleanLine = line.replace(/[*•-]/g, '').trim();
      if (cleanLine.length > 10) {
        const insight = {
          title: extractTitle(cleanLine),
          message: cleanLine,
          priority: extractPriority(cleanLine),
          action: extractAction(cleanLine),
          category: 'roommate',
          icon: 'people',
          type: 'info'
        };
        insights.push(insight);
      }
    }
  }
  
  // Add fallback insights if none found
  if (insights.length === 0) {
    insights.push({
      title: 'Complete Synapse Profile',
      message: 'Complete your Synapse profile to get personalized roommate recommendations.',
      priority: 'high',
      action: 'Complete Synapse profile',
      category: 'roommate',
      icon: 'people',
      type: 'info'
    });
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
}

/**
 * Extract title from insight text
 */
function extractTitle(text) {
  const titleMatch = text.match(/^([^:]+):/);
  return titleMatch ? titleMatch[1].trim() : text.substring(0, 50) + '...';
}

/**
 * Extract priority from insight text
 */
function extractPriority(text) {
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('immediate')) return 'high';
  if (text.toLowerCase().includes('important') || text.toLowerCase().includes('soon')) return 'medium';
  return 'low';
}

/**
 * Extract action from insight text
 */
function extractAction(text) {
  if (text.toLowerCase().includes('complete')) return 'Complete profile';
  if (text.toLowerCase().includes('contact')) return 'Contact roommates';
  if (text.toLowerCase().includes('browse')) return 'Browse matches';
  return 'Learn more';
}

/**
 * Calculate Synapse completion percentage
 */
function calculateSynapseCompletion(synapse) {
  let completedFields = 0;
  let totalFields = 0;

  // Culture section
  if (synapse.culture) {
    totalFields += 3;
    if (synapse.culture.primaryLanguage) completedFields++;
    if (synapse.culture.home?.country) completedFields++;
    if (synapse.culture.home?.region) completedFields++;
  }

  // Logistics section
  if (synapse.logistics) {
    totalFields += 3;
    if (synapse.logistics.moveInMonth) completedFields++;
    if (synapse.logistics.budgetMax !== null) completedFields++;
    if (synapse.logistics.commuteMode?.length > 0) completedFields++;
  }

  // Lifestyle section
  if (synapse.lifestyle) {
    totalFields += 2;
    if (synapse.lifestyle.sleepPattern) completedFields++;
    if (synapse.lifestyle.cleanliness) completedFields++;
  }

  // Habits section
  if (synapse.habits) {
    totalFields += 2;
    if (synapse.habits.diet) completedFields++;
    if (synapse.habits.smoking) completedFields++;
  }

  // Pets section
  if (synapse.pets) {
    totalFields += 1;
    if (synapse.pets.hasPets !== undefined) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

/**
 * Generate fallback roommate insights
 */
function generateFallbackRoommateInsights(user) {
  const synapseCompletion = calculateSynapseCompletion(user.synapse || {});
  const isSynapseCompleted = synapseCompletion >= 80;
  
  const insights = [];
  
  if (!isSynapseCompleted) {
    insights.push({
      title: 'Complete Synapse Profile',
      message: `Your Synapse profile is ${synapseCompletion}% complete. Complete it to get personalized roommate recommendations based on your lifestyle, habits, and preferences.`,
      priority: 'high',
      action: 'Complete Synapse profile',
      category: 'roommate',
      icon: 'people',
      type: 'info'
    });
  } else {
    // Generate specific insights based on user's Synapse data
    if (user.synapse?.lifestyle?.sleepPattern) {
      insights.push({
        title: 'Find Sleep-Compatible Roommates',
        message: `Your ${user.synapse.lifestyle.sleepPattern} sleep pattern will help us match you with roommates who have similar schedules and won't disturb your rest.`,
        priority: 'high',
        action: 'Browse sleep-compatible matches',
        category: 'roommate',
        icon: 'moon',
        type: 'info'
      });
    }
    
    if (user.synapse?.lifestyle?.cleanliness) {
      insights.push({
        title: 'Match Cleanliness Standards',
        message: `Your cleanliness level of ${user.synapse.lifestyle.cleanliness}/10 will help us find roommates who share your standards for a harmonious living environment.`,
        priority: 'high',
        action: 'View cleanliness matches',
        category: 'roommate',
        icon: 'sparkles',
        type: 'info'
      });
    }
    
    if (user.synapse?.habits?.smoking === 'No' || user.synapse?.habits?.smoking === 'Never') {
      insights.push({
        title: 'Non-Smoking Roommates',
        message: `Since you prefer non-smoking environments, we'll match you with roommates who share this preference for a healthy living space.`,
        priority: 'medium',
        action: 'Find non-smoking matches',
        category: 'roommate',
        icon: 'shield-check',
        type: 'info'
      });
    }
    
    if (user.onboardingData?.budgetRange) {
      insights.push({
        title: 'Budget-Compatible Matches',
        message: `Your budget range of $${user.onboardingData.budgetRange.min}-$${user.onboardingData.budgetRange.max} will help us find financially compatible roommates who can share expenses effectively.`,
        priority: 'medium',
        action: 'View budget matches',
        category: 'roommate',
        icon: 'dollar-sign',
        type: 'info'
      });
    }
  }
  
  return insights;
}

module.exports = {
  getRoommateRecommendations,
  getRoommateRecommendationsDirectly,
  calculateAdvancedCompatibilityScore,
  calculateLifestyleCompatibility,
  calculateBudgetCompatibility,
  calculateSocialCompatibility,
  getCompatibilityLevel,
  generateRoommateRecommendation,
  parseAIRoommateInsights
};
