import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

export const useOnboardingData = () => {
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/onboarding-data');
      
      if (response.data.error) {
        setError(response.data.message);
      } else {
        setOnboardingData(response.data.onboardingData);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedRecommendations = () => {
    if (!onboardingData) return null;

    const recommendations = {
      properties: [],
      roommates: [],
      essentials: [],
      community: []
    };

    // Property recommendations based on budget and location
    if (onboardingData.budgetRange && onboardingData.city) {
      recommendations.properties = [
        {
          type: 'budget_match',
          message: `Properties in ${onboardingData.city} within your budget ($${onboardingData.budgetRange.min}-$${onboardingData.budgetRange.max})`,
          count: 12
        }
      ];
    }

    // Roommate recommendations
    if (onboardingData.roommateInterest) {
      recommendations.roommates = [
        {
          type: 'compatible_roommates',
          message: 'Compatible roommates in your area',
          count: 8
        }
      ];
    }

    // Essentials recommendations
    if (onboardingData.essentials && onboardingData.essentials.length > 0) {
      recommendations.essentials = onboardingData.essentials.map(essential => ({
        type: 'essential',
        name: essential,
        message: `Get your ${essential} setup`
      }));
    }

    // Community recommendations
    if (onboardingData.university) {
      recommendations.community = [
        {
          type: 'university_community',
          message: `Connect with ${onboardingData.university} students`,
          count: 156
        }
      ];
    }

    return recommendations;
  };

  const getPersonalizedGreeting = () => {
    if (!onboardingData) return 'Welcome to NewRun!';

    const focus = onboardingData.focus;
    const name = onboardingData.firstName || 'there';

    switch (focus) {
      case 'Housing':
        return `Hi ${name}! Ready to find your perfect place in ${onboardingData.city || 'your city'}?`;
      case 'Roommate':
        return `Hi ${name}! Let's find you the perfect roommate!`;
      case 'Essentials':
        return `Hi ${name}! Let's get you set up with everything you need!`;
      case 'Community':
        return `Hi ${name}! Welcome to the ${onboardingData.university || 'NewRun'} community!`;
      case 'Everything':
        return `Hi ${name}! We're here to help with everything you need!`;
      default:
        return `Welcome to NewRun, ${name}!`;
    }
  };

  const getNextSteps = () => {
    if (!onboardingData) return [];

    const nextSteps = [];

    if (onboardingData.focus === 'Housing' || onboardingData.focus === 'Everything') {
      nextSteps.push({
        title: 'Browse Properties',
        description: 'Find your perfect place',
        action: '/all-properties',
        priority: 'high'
      });
    }

    if (onboardingData.roommateInterest) {
      nextSteps.push({
        title: 'Find Roommates',
        description: 'Connect with compatible roommates',
        action: '/Synapse',
        priority: 'high'
      });
    }

    if (onboardingData.essentials && onboardingData.essentials.length > 0) {
      nextSteps.push({
        title: 'Get Essentials',
        description: 'Set up your essentials',
        action: '/marketplace',
        priority: 'medium'
      });
    }

    if (onboardingData.focus === 'Community' || onboardingData.focus === 'Everything') {
      nextSteps.push({
        title: 'Join Community',
        description: 'Connect with fellow students',
        action: '/community',
        priority: 'medium'
      });
    }

    return nextSteps;
  };

  return {
    onboardingData,
    loading,
    error,
    fetchOnboardingData,
    getPersonalizedRecommendations,
    getPersonalizedGreeting,
    getNextSteps
  };
};
