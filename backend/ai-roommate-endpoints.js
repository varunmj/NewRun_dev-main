/**
 * AI Roommate Matching Endpoints
 * Using housing AI concept as template
 * CEO-level implementation for comprehensive roommate matching
 */

const express = require('express');
const router = express.Router();
const aiRoommateMatching = require('./ai-roommate-matching');
const PropertyDataTransformer = require('./services/propertyDataTransformer');

// =====================
// AI ROOMMATE INSIGHTS
// =====================

/**
 * POST /api/ai/roommate/insights
 * Generate AI-powered roommate insights and recommendations
 */
router.post('/insights', async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OpenAI API key is configured
    if (!process.env.NEWRUN_APP_OPENAI_API_KEY) {
      return res.json({
        success: false,
        insights: [],
        message: "AI roommate features are not available - OpenAI API key not configured"
      });
    }

    const { dashboardData } = req.body;

    // Prepare rich context for AI
    const userContext = {
      profile: {
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        university: user.university,
        major: user.major,
        graduationDate: user.graduationDate,
        currentLocation: user.currentLocation,
        hometown: user.hometown,
        birthday: user.birthday,
        campusLabel: user.campusLabel,
        campusDisplayName: user.campusDisplayName,
        schoolDepartment: user.schoolDepartment,
        cohortTerm: user.cohortTerm,
        emailVerified: user.emailVerified
      },
      onboarding: user.onboardingData,
      synapse: user.synapse || {},
      dashboard: dashboardData,
      timestamp: new Date().toISOString()
    };

    // Get AI roommate recommendations
    const result = await aiRoommateMatching.getRoommateRecommendations(user, userContext);
    
    res.json({
      success: true,
      insights: result.insights,
      specificRecommendations: result.specificRecommendations,
      aiGenerated: true,
      category: 'roommate'
    });
    
  } catch (error) {
    console.error('AI Roommate Insights Error:', error);
    
    // Fallback roommate insights
    const fallbackInsights = generateFallbackRoommateInsights(user);
    res.json({ 
      success: true, 
      insights: fallbackInsights, 
      fallback: true 
    });
  }
});

// =====================
// AI ROOMMATE TOOLS
// =====================

/**
 * POST /api/ai/roommate/tools/get-recommendations
 * Get specific roommate recommendations with AI reasoning
 */
router.post('/tools/get-recommendations', async (req, res) => {
  try {
    const { insightType, userProfile } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let recommendations = [];
    let reasoning = '';

    if (insightType === 'roommate') {
      // Get roommate recommendations directly from database
      console.log('🔍 Getting roommate recommendations directly from database...');
      
      const result = await aiRoommateMatching.getRoommateRecommendationsDirectly(user, insightType);
      
      if (result) {
        recommendations = result.roommates;
        reasoning = generateRoommateReasoning(user, result);
        
        // Cache the results
        await setCachedRoommateRecommendations(userId, {
          recommendations,
          reasoning,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({ 
      success: true, 
      recommendations,
      reasoning,
      insightType,
      timestamp: new Date().toISOString(),
      cached: false
    });
  } catch (error) {
    console.error('AI Roommate Tool - Get Recommendations Error:', error);
    res.status(500).json({ success: false, error: 'Failed to get roommate recommendations' });
  }
});

/**
 * POST /api/ai/roommate/tools/score-compatibility
 * Score roommates based on advanced compatibility
 */
router.post('/tools/score-compatibility', async (req, res) => {
  try {
    const { userProfile, roommates } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const scoredRoommates = roommates.map(roommate => {
      const compatibilityScore = aiRoommateMatching.calculateAdvancedCompatibilityScore(user, roommate);
      const lifestyleMatch = aiRoommateMatching.calculateLifestyleCompatibility(user.synapse, roommate.synapse);
      const budgetMatch = aiRoommateMatching.calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
      const socialMatch = aiRoommateMatching.calculateSocialCompatibility(user.synapse, roommate.synapse);
      
      const totalScore = (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4;
      
      return {
        ...roommate,
        compatibilityScore,
        lifestyleMatch,
        budgetMatch,
        socialMatch,
        totalScore,
        compatibilityLevel: aiRoommateMatching.getCompatibilityLevel(totalScore),
        recommendation: aiRoommateMatching.generateRoommateRecommendation(roommate, user)
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    res.json({ 
      success: true, 
      scoredRoommates,
      topMatches: scoredRoommates.slice(0, 5),
      averageCompatibility: scoredRoommates.reduce((sum, r) => sum + r.totalScore, 0) / scoredRoommates.length
    });
  } catch (error) {
    console.error('AI Roommate Tool - Score Compatibility Error:', error);
    res.status(500).json({ success: false, error: 'Failed to score roommate compatibility' });
  }
});

/**
 * POST /api/ai/roommate/tools/find-compatible
 * Find compatible roommates based on specific criteria
 */
router.post('/tools/find-compatible', async (req, res) => {
  try {
    const { 
      criteria = {},
      lifestyleFilters = {},
      budgetRange,
      academicLevel,
      socialPreferences = {},
      limit = 10
    } = req.body;
    
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build roommate query based on criteria
    let roommateQuery = { 
      'synapse.visibility.showAvatarInPreviews': true,
      university: user.university,
      _id: { $ne: user._id }
    };
    
    // Add budget filter
    if (budgetRange) {
      roommateQuery['onboardingData.budgetRange'] = {
        $gte: budgetRange.min * 0.8,
        $lte: budgetRange.max * 1.2
      };
    }
    
    // Add academic level filter
    if (academicLevel) {
      roommateQuery['synapse.education.level'] = academicLevel;
    }
    
    // Add lifestyle filters
    if (lifestyleFilters.sleepPattern) {
      roommateQuery['synapse.lifestyle.sleepPattern'] = lifestyleFilters.sleepPattern;
    }
    
    if (lifestyleFilters.cleanliness) {
      roommateQuery['synapse.lifestyle.cleanliness'] = {
        $gte: lifestyleFilters.cleanliness - 1,
        $lte: lifestyleFilters.cleanliness + 1
      };
    }
    
    // Find compatible roommates
    const rawRoommates = await User.find(roommateQuery)
      .select('firstName lastName email university major synapse onboardingData avatar lastActive')
      .limit(limit)
      .lean();
    
    // Score and rank roommates
    const scoredRoommates = rawRoommates.map(roommate => {
      const compatibilityScore = aiRoommateMatching.calculateAdvancedCompatibilityScore(user, roommate);
      const lifestyleMatch = aiRoommateMatching.calculateLifestyleCompatibility(user.synapse, roommate.synapse);
      const budgetMatch = aiRoommateMatching.calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
      const socialMatch = aiRoommateMatching.calculateSocialCompatibility(user.synapse, roommate.synapse);
      
      return {
        ...roommate,
        compatibilityScore,
        lifestyleMatch,
        budgetMatch,
        socialMatch,
        totalScore: (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4,
        compatibilityLevel: aiRoommateMatching.getCompatibilityLevel((compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4),
        recommendation: aiRoommateMatching.generateRoommateRecommendation(roommate, user)
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    res.json({ 
      success: true, 
      roommates: scoredRoommates,
      totalFound: scoredRoommates.length,
      averageCompatibility: scoredRoommates.reduce((sum, r) => sum + r.totalScore, 0) / scoredRoommates.length,
      bestMatch: scoredRoommates[0] || null
    });
  } catch (error) {
    console.error('AI Roommate Tool - Find Compatible Error:', error);
    res.status(500).json({ success: false, error: 'Failed to find compatible roommates' });
  }
});

// =====================
// AI ROOMMATE EXPLAIN
// =====================

/**
 * POST /api/ai/roommate/explain-match
 * Explain why a specific roommate is a good match
 */
router.post('/explain-match', async (req, res) => {
  try {
    const { roommate, userProfile } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate detailed compatibility breakdown
    const compatibilityScore = aiRoommateMatching.calculateAdvancedCompatibilityScore(user, roommate);
    const lifestyleMatch = aiRoommateMatching.calculateLifestyleCompatibility(user.synapse, roommate.synapse);
    const budgetMatch = aiRoommateMatching.calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
    const socialMatch = aiRoommateMatching.calculateSocialCompatibility(user.synapse, roommate.synapse);
    
    const explanation = generateRoommateMatchExplanation(user, roommate, {
      compatibilityScore,
      lifestyleMatch,
      budgetMatch,
      socialMatch
    });

    res.json({ 
      success: true, 
      explanation,
      compatibilityBreakdown: {
        compatibilityScore,
        lifestyleMatch,
        budgetMatch,
        socialMatch,
        totalScore: (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4
      },
      aiGenerated: true
    });
  } catch (error) {
    console.error('AI Roommate Explain Match Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to explain roommate match',
      fallback: true 
    });
  }
});

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Generate roommate reasoning
 */
function generateRoommateReasoning(user, result) {
  const { roommates, totalFound, averageCompatibility, bestMatch } = result;
  
  let reasoning = `Found ${totalFound} potential roommates with ${Math.round(averageCompatibility)}% average compatibility.`;
  
  if (bestMatch) {
    reasoning += ` Your best match is ${bestMatch.firstName} ${bestMatch.lastName} with ${Math.round(bestMatch.totalScore)}% compatibility.`;
    
    if (bestMatch.recommendation?.reasons?.length > 0) {
      reasoning += ` Key compatibility factors: ${bestMatch.recommendation.reasons.join(', ').toLowerCase()}.`;
    }
  }
  
  return reasoning;
}

/**
 * Generate roommate match explanation
 */
function generateRoommateMatchExplanation(user, roommate, scores) {
  const { compatibilityScore, lifestyleMatch, budgetMatch, socialMatch } = scores;
  const totalScore = (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4;
  
  let explanation = `Hey ${user.firstName}! ${roommate.firstName} ${roommate.lastName} is a ${Math.round(totalScore)}% compatibility match for you. `;
  
  // Add specific compatibility factors
  const factors = [];
  
  if (compatibilityScore >= 80) {
    factors.push('strong academic compatibility');
  }
  
  if (lifestyleMatch >= 80) {
    factors.push('compatible lifestyle preferences');
  }
  
  if (budgetMatch >= 80) {
    factors.push('similar budget range');
  }
  
  if (socialMatch >= 80) {
    factors.push('matching social habits');
  }
  
  if (factors.length > 0) {
    explanation += `You have ${factors.join(', ')}. `;
  }
  
  // Add specific recommendations
  if (user.major === roommate.major) {
    explanation += `You're both ${user.major} majors, which means you can study together and share academic resources. `;
  }
  
  if (user.synapse?.lifestyle?.sleepPattern === roommate.synapse?.lifestyle?.sleepPattern) {
    explanation += `You have the same sleep schedule, which will help maintain a peaceful living environment. `;
  }
  
  explanation += `I recommend reaching out to ${roommate.firstName} to discuss your living preferences and see if you'd be a good fit!`;
  
  return explanation;
}

/**
 * Generate fallback roommate insights
 */
function generateFallbackRoommateInsights(user) {
  const insights = [];
  
  if (!user.synapse || Object.keys(user.synapse).length === 0) {
    insights.push({
      title: 'Complete Synapse Profile',
      message: 'Complete your Synapse profile to get personalized roommate recommendations based on your lifestyle, habits, and preferences.',
      priority: 'high',
      action: 'Complete Synapse profile',
      category: 'roommate',
      icon: 'people',
      type: 'info'
    });
  }
  
  insights.push({
    title: 'Browse Roommate Matches',
    message: 'Explore potential roommates in your university to find compatible matches based on your preferences.',
    priority: 'medium',
    action: 'Browse matches',
    category: 'roommate',
    icon: 'people',
    type: 'info'
  });
  
  if (user.onboardingData?.budgetRange) {
    insights.push({
      title: 'Budget-Compatible Matches',
      message: `Find roommates within your budget range of $${user.onboardingData.budgetRange.min}-$${user.onboardingData.budgetRange.max} for optimal financial compatibility.`,
      priority: 'medium',
      action: 'Filter by budget',
      category: 'roommate',
      icon: 'money',
      type: 'info'
    });
  }
  
  return insights;
}

/**
 * Set cached roommate recommendations
 */
async function setCachedRoommateRecommendations(userId, data) {
  try {
    // TODO: Implement Redis caching for roommate recommendations
    console.log('Caching roommate recommendations for user:', userId);
  } catch (error) {
    console.error('Error caching roommate recommendations:', error);
  }
}

module.exports = router;

