/**
 * Unified AI Insights System
 * Single source of truth for all AI-generated insights
 * Eliminates duplicates, improves quality, and provides better user experience
 */

const AIDataValidator = require('../aiDataValidator');

class UnifiedAIInsights {
  constructor() {
    this.insightCategories = {
      HOUSING: 'housing',
      ROOMMATE: 'roommate', 
      // FINANCIAL: 'financial',
      ACADEMIC: 'academic',
      SOCIAL: 'social',
      URGENT: 'urgent'
    };
    
    this.priorityLevels = {
      CRITICAL: 'critical',    // Immediate action required
      HIGH: 'high',           // Important, act soon
      MEDIUM: 'medium',       // Good to do
      LOW: 'low'             // Nice to have
    };
  }

  /**
   * Generate unified insights for a user
   * This is the single entry point for all AI insights
   */
  async generateUnifiedInsights(user, dashboardData, userContext) {
    try {
      console.log('🎯 Generating unified AI insights for user:', user.firstName);
      
      // Step 1: Analyze user context and determine insight needs
      const insightNeeds = this.analyzeUserContext(user, dashboardData, userContext);
      console.log('📊 Insight needs analysis:', insightNeeds);
      
      // Step 2: Generate insights based on needs
      const allInsights = await this.generateContextualInsights(user, dashboardData, userContext, insightNeeds);
      
      // Step 3: Deduplicate and validate insights
      const deduplicatedInsights = this.deduplicateInsights(allInsights);
      
      // Step 4: Prioritize and rank insights
      const prioritizedInsights = this.prioritizeInsights(deduplicatedInsights, user, dashboardData);
      
      // Step 5: Limit to top insights (max 5)
      const finalInsights = prioritizedInsights.slice(0, 5);
      
      console.log(`✅ Generated ${finalInsights.length} unified insights`);
      return {
        success: true,
        insights: finalInsights,
        categories: this.getInsightCategories(finalInsights),
        aiGenerated: true,
        unified: true
      };
      
    } catch (error) {
      console.error('❌ Unified AI insights error:', error);
      return this.generateFallbackInsights(user, dashboardData);
    }
  }

  /**
   * Analyze user context to determine what insights are needed
   */
  analyzeUserContext(user, dashboardData, userContext) {
    const needs = {
      housing: false,
      roommate: false,
      financial: false,
      visa: false,
      academic: false,
      urgent: false
    };

    const onboarding = user.onboardingData || {};
    const synapse = user.synapse || {};
    const focus = Array.isArray(onboarding.focus) ? onboarding.focus : [];

    // Synapse readiness: lower threshold or presence of key fields
    const synapseCompletion = this.calculateSynapseCompletion(synapse);
    const hasKeySynapse = !!(
      synapse?.culture?.primaryLanguage ||
      synapse?.lifestyle?.sleepPattern ||
      Number.isFinite(synapse?.lifestyle?.cleanliness)
    );
    const isSynapseReady = synapseCompletion >= 60 || hasKeySynapse;

    // Urgency from arrival timeline (still valid for incoming students)
    if (onboarding.arrivalDate) {
      const arrivalDate = new Date(onboarding.arrivalDate);
      const daysUntilArrival = Math.ceil((arrivalDate - new Date()) / (1000 * 60 * 60 * 24));
      if (Number.isFinite(daysUntilArrival) && daysUntilArrival <= 30) {
        needs.urgent = true;
      }
    }

    // Housing: focus/needs/budget/synapse logistics or urgency
    if (
      focus.includes('Housing') ||
      onboarding.housingNeeds ||
      (onboarding.budgetRange && (onboarding.budgetRange.min != null || onboarding.budgetRange.max != null)) ||
      Number.isFinite(synapse?.logistics?.budgetMax) ||
      needs.urgent
    ) {
      needs.housing = true;
    }

    // Roommate: focus or synapse readiness
    if (focus.includes('Roommate') || isSynapseReady) {
      needs.roommate = true;
    }

    // Financial: optional if average price known vs budget (kept as soft signal)
    if (onboarding?.budgetRange && dashboardData?.propertiesStats?.averagePrice) {
      const avgPrice = Number(dashboardData.propertiesStats.averagePrice);
      const budgetMax = Number(onboarding.budgetRange.max);
      if (Number.isFinite(avgPrice) && Number.isFinite(budgetMax) && avgPrice > budgetMax * 1.2) {
        needs.financial = true;
      }
    }

    // Academic: only for active students (not alumni/working)
    const isAlumniOrWorking = (onboarding.currentSituation === 'working') || (user.role === 'alumni');
    if (user.major && !user.academicPlan && !isAlumniOrWorking) {
      needs.academic = true;
    }

    return needs;
  }

  /**
   * Generate contextual insights based on user needs
   */
  async generateContextualInsights(user, dashboardData, userContext, needs) {
    const insights = [];

    // Only generate housing insights if needed
    if (needs.housing) {
      const housingInsights = await this.generateHousingInsights(user, dashboardData, userContext);
      insights.push(...housingInsights);
    }

    // Only generate roommate insights if needed and Synapse is complete
    if (needs.roommate) {
      const roommateInsights = await this.generateRoommateInsights(user, userContext);
      insights.push(...roommateInsights);
    }

    // Only generate financial insights if needed
    if (needs.financial) {
      const financialInsights = this.generateFinancialInsights(user, dashboardData);
      insights.push(...financialInsights);
    }

    // Only generate academic insights if needed
    if (needs.academic) {
      const academicInsights = this.generateAcademicInsights(user);
      insights.push(...academicInsights);
    }

    // Add Synapse completion insight if needed
    if (!needs.roommate && user.synapse && Object.keys(user.synapse).length > 0) {
      const synapseCompletion = this.calculateSynapseCompletion(user.synapse);
      if (synapseCompletion < 80) {
        insights.push({
          id: 'synapse-completion',
          title: 'Complete Synapse Profile',
          message: `Your Synapse profile is ${synapseCompletion}% complete. Complete it to unlock AI-powered roommate matching and personalized recommendations.`,
          priority: this.priorityLevels.HIGH,
          category: this.insightCategories.ROOMMATE,
          icon: 'people',
          type: 'info',
          action: 'Complete Synapse profile'
        });
      }
    }

    return insights;
  }

  /**
   * Generate housing-specific insights
   */
  async generateHousingInsights(user, dashboardData, userContext) {
    const insights = [];
    
    // Get specific property recommendations
    try {
      const recommendations = await this.getHousingRecommendations(user);
      
      if (recommendations && recommendations.properties && recommendations.properties.length > 0) {
        // Grouped insight: show top 2–3 in a single card
        const topItems = recommendations.properties
          .slice(0, 3)
          .map((p, idx) => ({
            id: p._id,
            rank: idx + 1,
            title: p.name,
            price: p.price,
            distance: p.distance,
            description: p.description || 'Available property',
            priority: idx === 1 ? this.priorityLevels.HIGH : this.priorityLevels.MEDIUM,
            href: `/property/${p._id}`
          }));

        const topTitle = topItems[0]?.title || 'Top properties';
        insights.push({
          id: `housing-grouped`,
          title: `Top housing picks (best: ${topTitle})`,
          message: `We found ${topItems.length} options that fit your context. The top match is ${topTitle}.`,
          priority: this.priorityLevels.HIGH,
          category: this.insightCategories.HOUSING,
          icon: 'home',
          type: 'grouped',
          group: {
            kind: 'housing',
            items: topItems
          },
          action: 'View housing options'
        });
      } else {
        // No real properties found - provide honest guidance
        insights.push({
          id: 'no-properties-found',
          title: 'Explore Housing Options',
          message: 'No properties found within your budget range. Consider expanding your search radius, adjusting your budget, or checking back later for new listings.',
          priority: this.priorityLevels.MEDIUM,
          category: this.insightCategories.HOUSING,
          icon: 'home',
          type: 'info',
          action: 'Browse all properties'
        });
      }
    } catch (error) {
      console.error('Housing insights error:', error);
      
      // Provide honest fallback when system fails
      insights.push({
        id: 'housing-system-error',
        title: 'Housing Search Unavailable',
        message: 'Property search is temporarily unavailable. Try browsing the properties section manually or check back later.',
        priority: this.priorityLevels.LOW,
        category: this.insightCategories.HOUSING,
        icon: 'home',
        type: 'info',
        action: 'Browse properties manually'
      });
    }

    return insights;
  }

  /**
   * Generate roommate-specific insights
   */
  async generateRoommateInsights(user, userContext) {
    const insights = [];
    
    try {
      const roommateRecommendations = await this.getRoommateRecommendations(user);
      
      if (roommateRecommendations && roommateRecommendations.roommates && roommateRecommendations.roommates.length > 0) {
        // Filter to only show roommates with valid compatibility scores
        const validRoommates = roommateRecommendations.roommates.filter(roommate => roommate.totalScore > 0);
        
        if (validRoommates.length > 0) {
          const topItems = validRoommates
            .slice(0, 3)
            .map((r, idx) => ({
              id: r._id,
              rank: idx + 1,
              name: `${r.firstName} ${r.lastName}`.trim(),
              score: Math.round(r.totalScore),
              reasons: this.getSharedPreferences(user, r),
              priority: idx === 0 ? this.priorityLevels.HIGH : this.priorityLevels.MEDIUM,
              href: `/roommate/${r._id}`
            }));

          const best = topItems[0];
          insights.push({
            id: `roommate-grouped`,
            title: `Top roommate matches (best: ${best?.name || 'Match'})`,
            message: `We found ${topItems.length} strong matches. Top: ${best?.name} (${best?.score}%).`,
            priority: this.priorityLevels.HIGH,
            category: this.insightCategories.ROOMMATE,
            icon: 'people',
            type: 'grouped',
            group: {
              kind: 'roommate',
              items: topItems
            },
            action: 'View roommate matches'
          });
        } else {
          // No valid roommates found - provide honest guidance
          insights.push({
            id: 'no-compatible-roommates',
            title: 'Complete Synapse Profiles',
            message: 'Found potential roommates but need more Synapse data to calculate compatibility. Complete your Synapse profile and encourage others to do the same for better matching.',
            priority: this.priorityLevels.MEDIUM,
            category: this.insightCategories.ROOMMATE,
            icon: 'people',
            type: 'info',
            action: 'Complete Synapse profile'
          });
        }
      } else {
        // No roommates found - provide honest guidance
        insights.push({
          id: 'no-roommates-found',
          title: 'Expand Your Network',
          message: 'No compatible roommates found in your university yet. Consider joining university housing groups, social media communities, or roommate matching services to find potential matches.',
          priority: this.priorityLevels.MEDIUM,
          category: this.insightCategories.ROOMMATE,
          icon: 'people',
          type: 'info',
          action: 'Join housing groups'
        });
      }
    } catch (error) {
      console.error('Roommate insights error:', error);
      
      // Provide honest fallback when system fails
      insights.push({
        id: 'roommate-system-error',
        title: 'Roommate Matching Unavailable',
        message: 'Roommate matching is temporarily unavailable. Try browsing the roommate section manually or check back later.',
        priority: this.priorityLevels.LOW,
        category: this.insightCategories.ROOMMATE,
        icon: 'people',
        type: 'info',
        action: 'Browse roommates manually'
      });
    }

    return insights;
  }

  /**
   * Generate financial insights
   */
  generateFinancialInsights(user, dashboardData) {
    const insights = [];
    
    if (user.onboardingData?.budgetRange && dashboardData?.propertiesStats?.averagePrice) {
      const avgPrice = dashboardData.propertiesStats.averagePrice;
      const budget = user.onboardingData.budgetRange.max;
      
      if (avgPrice > budget) {
        insights.push({
          id: 'budget-alert',
          title: 'Budget Optimization Needed',
          message: `Average property price ($${avgPrice}) exceeds your budget ($${budget}). Consider roommate options or expand your search radius.`,
          priority: this.priorityLevels.HIGH,
          category: this.insightCategories.FINANCIAL,
          icon: 'money',
          type: 'warning',
          action: 'Adjust budget or search criteria'
        });
      }
    }

    return insights;
  }

  /**
   * Generate academic insights
   */
  generateAcademicInsights(user) {
    const insights = [];
    
    if (user.major && !user.academicPlan) {
      insights.push({
        id: 'academic-planning',
        title: 'Plan Your Academic Journey',
        message: `As a ${user.major} student, create an academic plan to track your progress and stay on track for graduation.`,
        priority: this.priorityLevels.MEDIUM,
        category: this.insightCategories.ACADEMIC,
        icon: 'school',
        type: 'info',
        action: 'Create academic plan'
      });
    }

    return insights;
  }

  /**
   * Deduplicate insights based on content similarity
   */
  deduplicateInsights(insights) {
    const seen = new Set();
    const deduplicated = [];

    for (const insight of insights) {
      // Create a unique key based on title and message
      const key = `${insight.title}-${insight.message}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(insight);
      }
    }

    return deduplicated;
  }

  /**
   * Prioritize insights based on user context and urgency
   */
  prioritizeInsights(insights, user, dashboardData) {
    return insights.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = {
        [this.priorityLevels.CRITICAL]: 4,
        [this.priorityLevels.HIGH]: 3,
        [this.priorityLevels.MEDIUM]: 2,
        [this.priorityLevels.LOW]: 1
      };

      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // If same priority, sort by category importance
      const categoryOrder = {
        [this.insightCategories.URGENT]: 5,
        [this.insightCategories.HOUSING]: 4,
        [this.insightCategories.ROOMMATE]: 3,
        [this.insightCategories.FINANCIAL]: 2,
        [this.insightCategories.ACADEMIC]: 1
      };

      const aCategory = categoryOrder[a.category] || 0;
      const bCategory = categoryOrder[b.category] || 0;

      return bCategory - aCategory;
    });
  }

  /**
   * Get insight categories summary
   */
  getInsightCategories(insights) {
    const categories = {};
    insights.forEach(insight => {
      categories[insight.category] = (categories[insight.category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Generate fallback insights when AI fails
   */
  generateFallbackInsights(user, dashboardData) {
    const insights = [];
    
    // Only one fallback insight
    insights.push({
      id: 'fallback-welcome',
      title: 'Welcome to NewRun!',
      message: 'Complete your profile to get personalized AI insights and recommendations.',
      priority: this.priorityLevels.LOW,
      category: this.insightCategories.ACADEMIC,
      icon: 'info',
      type: 'info',
      action: 'Complete profile',
      fallback: true
    });

    return {
      success: true,
      insights,
      fallback: true
    };
  }

  /**
   * Helper methods
   */
  calculateSynapseCompletion(synapse) {
    let completedFields = 0;
    let totalFields = 0;

    if (synapse.culture) {
      totalFields += 3;
      if (synapse.culture.primaryLanguage) completedFields++;
      if (synapse.culture.home?.country) completedFields++;
      if (synapse.culture.home?.region) completedFields++;
    }

    if (synapse.logistics) {
      totalFields += 3;
      if (synapse.logistics.moveInMonth) completedFields++;
      if (synapse.logistics.budgetMax !== null) completedFields++;
      if (synapse.logistics.commuteMode?.length > 0) completedFields++;
    }

    if (synapse.lifestyle) {
      totalFields += 2;
      if (synapse.lifestyle.sleepPattern) completedFields++;
      if (synapse.lifestyle.cleanliness) completedFields++;
    }

    if (synapse.habits) {
      totalFields += 2;
      if (synapse.habits.diet) completedFields++;
      if (synapse.habits.smoking) completedFields++;
    }

    if (synapse.pets) {
      totalFields += 1;
      if (synapse.pets.hasPets !== undefined) completedFields++;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  getSharedPreferences(user, roommate) {
    const shared = [];
    
    if (user.synapse?.lifestyle?.sleepPattern === roommate.synapse?.lifestyle?.sleepPattern) {
      shared.push('sleep schedule');
    }
    
    if (user.synapse?.habits?.smoking === roommate.synapse?.habits?.smoking) {
      shared.push('smoking preferences');
    }
    
    if (user.synapse?.lifestyle?.cleanliness && roommate.synapse?.lifestyle?.cleanliness) {
      const diff = Math.abs(user.synapse.lifestyle.cleanliness - roommate.synapse.lifestyle.cleanliness);
      if (diff <= 2) {
        shared.push('cleanliness standards');
      }
    }
    
    return shared.length > 0 ? shared.join(', ') : 'similar lifestyle preferences';
  }

  async getHousingRecommendations(user) {
    try {
      // Get REAL properties from database, not mock data
      const Property = require('../models/property.model');
      
      // Build query based on user's budget and preferences
      let propertyQuery = { availabilityStatus: 'available' };
      
      if (user.onboardingData?.budgetRange?.min && user.onboardingData?.budgetRange?.max) {
        propertyQuery.price = { 
          $gte: user.onboardingData.budgetRange.min, 
          $lte: user.onboardingData.budgetRange.max 
        };
      }
      
      const realProperties = await Property.find(propertyQuery)
        .select('title price location distanceFromCampus description landlordName')
        .limit(5)
        .lean();
      
      if (realProperties.length === 0) {
        return { properties: [] }; // No real properties found
      }
      
      // Transform to match expected format
      const properties = realProperties.map(property => ({
        _id: property._id,
        name: property.title,
        price: property.price,
        distance: property.distanceFromCampus || 0,
        description: property.description || 'Available property',
        landlordName: property.landlordName
      }));
      
      return { properties };
    } catch (error) {
      console.error('Error getting real housing recommendations:', error);
      return { properties: [] }; // Return empty if error
    }
  }

  async getRoommateRecommendations(user) {
    try {
      // Fetch candidates broadly (do not hard-restrict by university)
      const User = require('../models/user.model');

      const baseQuery = {
        _id: { $ne: userId },
        email: { $not: /@example\.com$/ }
      };

      // Soft preference for same university handled in scoring, not as a hard filter
      const realRoommates = await User.find(baseQuery)
        .select('firstName lastName major synapse onboardingData avatar lastActive university')
        .limit(50)
        .lean();

      if (realRoommates.length === 0) {
        return { roommates: [] }; // No roommates found
      }

      // Calculate compatibility scores using full Synapse data
      const scoredRoommates = realRoommates.map(roommate => {
        const compatibilityScore = this.calculateCompatibilityScore(user, roommate);
        // Optional boost for same university as a soft preference
        const universityBoost = user.university && roommate.university && user.university === roommate.university ? 5 : 0;
        return {
          ...roommate,
          totalScore: Math.min(100, compatibilityScore + universityBoost),
          score: compatibilityScore, // Add score field for compatibility
          recommendation: this.generateRoommateRecommendation(roommate, user)
        };
      }).filter(roommate => roommate.totalScore > 30)
      .sort((a, b) => b.totalScore - a.totalScore);

      return { roommates: scoredRoommates };
    } catch (error) {
      console.error('Error getting real roommate recommendations:', error);
      return { roommates: [] }; // Return empty if error
    }
  }

  calculateCompatibilityScore(user, roommate) {
    // Use the EXACT same logic as /synapse/matches endpoint
    const s = user.synapse || {};
    const culture = s.culture || {};
    const logistics = s.logistics || {};
    const lifestyle = s.lifestyle || {};
    const habits = s.habits || {};
    const pets = s.pets || {};

    const mePrimary = (culture.primaryLanguage || "").trim();
    const meOthers = Array.isArray(culture.otherLanguages) ? culture.otherLanguages : [];
    const meComfort = culture.languageComfort || "either";

    const meHomeCountry = (culture.home?.country || "").trim();
    const meHomeRegion = (culture.home?.region || "").trim();
    const meHomeCity = (culture.home?.city || "").trim();

    const meCommute = Array.isArray(logistics.commuteMode) ? logistics.commuteMode : [];
    const meCleanliness = Number.isFinite(lifestyle.cleanliness) ? lifestyle.cleanliness : null;

    // Scoring weights (EXACT same as /synapse/matches)
    const W = {
      langPrimarySame: 25,
      langCrossOK: 15,
      comfortBonus: 10,
      country: 10,
      region: 8,
      city: 6,
      commuteMode: 6,
      sleep: 6,
      cleanlinessNear: 8,
      dietSame: 4,
      smokingSame: 3,
      drinkingSame: 3,
      partiesSame: 3,
      petsCompat: 7,
    };

    let score = 0;

    // Language scoring
    const their = roommate.synapse || {};
    const tCult = their.culture || {};
    const tLog = their.logistics || {};
    const tLife = their.lifestyle || {};
    const tHab = their.habits || {};
    const tPets = their.pets || {};

    // Primary language match
    if (tCult.primaryLanguage && mePrimary && tCult.primaryLanguage === mePrimary) {
      score += W.langPrimarySame;
    }

    // Cross-language compatibility
    if (mePrimary && tCult.otherLanguages && tCult.otherLanguages.includes(mePrimary)) {
      score += W.langCrossOK;
    }
    if (tCult.primaryLanguage && meOthers.includes(tCult.primaryLanguage)) {
      score += W.langCrossOK;
    }

    // Comfort bonus
    if (meComfort !== "same") {
      score += W.comfortBonus;
    }

    // Commute overlap
    const commuteOverlap = (tLog.commuteMode || []).filter(mode => meCommute.includes(mode));
    if (commuteOverlap.length > 0) {
      score += W.commuteMode;
    }

    // Sleep pattern
    if (tLife.sleepPattern && lifestyle.sleepPattern && tLife.sleepPattern === lifestyle.sleepPattern) {
      score += W.sleep;
    }

    // Cleanliness compatibility
    if (meCleanliness !== null && Number.isFinite(tLife.cleanliness)) {
      if (Math.abs(tLife.cleanliness - meCleanliness) <= 1) {
        score += W.cleanlinessNear;
      }
    }

    // Habits compatibility
    if (tHab.diet && habits.diet && tHab.diet === habits.diet) {
      score += W.dietSame;
    }
    if (tHab.smoking && habits.smoking && tHab.smoking === habits.smoking) {
      score += W.smokingSame;
    }
    if (tHab.drinking && habits.drinking && tHab.drinking === habits.drinking) {
      score += W.drinkingSame;
    }
    if (tHab.partying && habits.partying && tHab.partying === habits.partying) {
      score += W.partiesSame;
    }

    // Pets compatibility
    const theirPetsOk = tPets.okWithPets ?? true;
    const myPetsOk = pets.okWithPets ?? true;
    if (theirPetsOk === myPetsOk) {
      score += W.petsCompat;
    }

    // Geographic compatibility
    if (meHomeCountry && tCult.home?.country === meHomeCountry) {
      score += W.country;
    }
    if (meHomeRegion && tCult.home?.region === meHomeRegion) {
      score += W.region;
    }
    if (meHomeCity && tCult.home?.city === meHomeCity) {
      score += W.city;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getAcademicCompatibility(userMajor, roommateMajor) {
    // Simple academic compatibility based on field similarity
    const stemFields = ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry'];
    const businessFields = ['Business', 'Economics', 'Finance', 'Marketing'];
    const humanitiesFields = ['English', 'History', 'Philosophy', 'Literature'];

    const userIsStem = stemFields.some(field => userMajor.includes(field));
    const roommateIsStem = stemFields.some(field => roommateMajor.includes(field));
    const userIsBusiness = businessFields.some(field => userMajor.includes(field));
    const roommateIsBusiness = businessFields.some(field => roommateMajor.includes(field));

    if (userIsStem && roommateIsStem) return 80;
    if (userIsBusiness && roommateIsBusiness) return 80;
    if (userMajor === roommateMajor) return 90;
    return 50; // Default compatibility
  }

  getLifestyleCompatibility(userSynapse, roommateSynapse) {
    if (!userSynapse || !roommateSynapse) return 50;

    let score = 0;
    let factors = 0;

    // Sleep pattern compatibility
    if (userSynapse.lifestyle?.sleepPattern && roommateSynapse.lifestyle?.sleepPattern) {
      if (userSynapse.lifestyle.sleepPattern === roommateSynapse.lifestyle.sleepPattern) {
        score += 90;
      } else {
        score += 60; // Different but not incompatible
      }
      factors++;
    }

    // Cleanliness compatibility
    if (userSynapse.lifestyle?.cleanliness && roommateSynapse.lifestyle?.cleanliness) {
      const diff = Math.abs(userSynapse.lifestyle.cleanliness - roommateSynapse.lifestyle.cleanliness);
      score += Math.max(0, 100 - (diff * 20)); // Penalty for large differences
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  getBudgetCompatibility(userBudget, roommateBudget) {
    if (!userBudget || !roommateBudget) return 50;

    const userAvg = (userBudget.min + userBudget.max) / 2;
    const roommateAvg = (roommateBudget.min + roommateBudget.max) / 2;
    const diff = Math.abs(userAvg - roommateAvg) / Math.max(userAvg, roommateAvg);

    return Math.max(0, 100 - (diff * 100));
  }

  getSocialCompatibility(userSynapse, roommateSynapse) {
    if (!userSynapse || !roommateSynapse) return 50;

    let score = 0;
    let factors = 0;

    // Smoking compatibility
    if (userSynapse.habits?.smoking !== undefined && roommateSynapse.habits?.smoking !== undefined) {
      if (userSynapse.habits.smoking === roommateSynapse.habits.smoking) {
        score += 100;
      } else {
        score += 30; // Incompatible
      }
      factors++;
    }

    // Partying compatibility
    if (userSynapse.habits?.partying && roommateSynapse.habits?.partying) {
      const diff = Math.abs(userSynapse.habits.partying - roommateSynapse.habits.partying);
      score += Math.max(0, 100 - (diff * 25));
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  generateRoommateRecommendation(roommate, user) {
    // Use the EXACT same reasoning logic as /synapse/matches endpoint
    const s = user.synapse || {};
    const culture = s.culture || {};
    const logistics = s.logistics || {};
    const lifestyle = s.lifestyle || {};
    const habits = s.habits || {};
    const pets = s.pets || {};

    const mePrimary = (culture.primaryLanguage || "").trim();
    const meOthers = Array.isArray(culture.otherLanguages) ? culture.otherLanguages : [];
    const meCommute = Array.isArray(logistics.commuteMode) ? logistics.commuteMode : [];
    const meCleanliness = Number.isFinite(lifestyle.cleanliness) ? lifestyle.cleanliness : null;

    const their = roommate.synapse || {};
    const tCult = their.culture || {};
    const tLog = their.logistics || {};
    const tLife = their.lifestyle || {};
    const tHab = their.habits || {};
    const tPets = their.pets || {};

    const reasons = [];

    // Language compatibility
    const primaryLangSame = tCult.primaryLanguage && mePrimary && tCult.primaryLanguage === mePrimary;
    if (primaryLangSame) {
      reasons.push("Same daily language");
    }

    // Cross-language compatibility
    const theirLangsAll = [tCult.primaryLanguage, ...(tCult.otherLanguages || [])].filter(Boolean);
    const myLangsAll = [mePrimary, ...meOthers].filter(Boolean);
    const bothLangs = theirLangsAll.filter(lang => myLangsAll.includes(lang));
    if (bothLangs.length > 0) {
      reasons.push(`Both speak ${bothLangs.join(", ")}`);
    }

    // Commute overlap
    const commuteOverlap = (tLog.commuteMode || []).filter(mode => meCommute.includes(mode));
    if (commuteOverlap.length > 0) {
      reasons.push(`Overlap: ${commuteOverlap.join(" / ")}`);
    }

    // Sleep pattern
    const sleepMatch = (tLife.sleepPattern && lifestyle.sleepPattern)
      ? (tLife.sleepPattern === lifestyle.sleepPattern ? "good" : "different")
      : null;
    if (sleepMatch === "good") {
      reasons.push("Similar sleep hours");
    }

    // Cleanliness compatibility
    const cleanMatch = (Number.isFinite(tLife.cleanliness) && meCleanliness !== null)
      ? (Math.abs(Number(tLife.cleanliness) - meCleanliness) <= 1)
      : false;
    if (cleanMatch) {
      reasons.push("Clean & tidy");
    }

    // Pets compatibility
    const theirPetsOk = tPets.okWithPets ?? true;
    const myPetsOk = pets.okWithPets ?? true;
    if (theirPetsOk && myPetsOk) {
      reasons.push("Pets are okay");
    }

    // Diet compatibility
    if (tHab.diet && habits.diet && tHab.diet === habits.diet) {
      reasons.push(`Both ${tHab.diet}`);
    }

    if (reasons.length > 0) {
      return `Great match! ${reasons.join(", ")}.`;
    }
    
    return 'Potential roommate based on university compatibility.';
  }
}

module.exports = new UnifiedAIInsights();
