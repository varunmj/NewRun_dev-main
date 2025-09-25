import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import personalizationEngine from '../lib/personalizationEngine';

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
      console.log('🔄 Fetching onboarding data...');
      const response = await axiosInstance.get('/onboarding-data');
      
      console.log('📊 Onboarding data response:', response.data);
      
      if (response.data.error) {
        setError(response.data.message);
      } else {
        setOnboardingData(response.data.onboardingData);
        console.log('✅ Onboarding data set:', response.data.onboardingData);
      }
    } catch (err) {
      console.error('❌ Onboarding data fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to fetch onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedRecommendations = () => {
    if (!onboardingData) return null;

    // Use the enhanced personalization engine
    return personalizationEngine.getContextualRecommendations({
      onboardingData,
      university: onboardingData.university,
      currentLocation: onboardingData.city
    });
  };

  const getArrivalTimeline = () => {
    if (!onboardingData) return null;
    return personalizationEngine.getArrivalTimeline(onboardingData);
  };

  const getStudentSuccessInsights = () => {
    if (!onboardingData) return null;
    return personalizationEngine.predictStudentNeeds({
      onboardingData,
      major: onboardingData.university,
      budgetRange: onboardingData.budgetRange,
      roommateInterest: onboardingData.roommateInterest
    });
  };

  const getPersonalizedDashboard = () => {
    if (!onboardingData) return null;
    return personalizationEngine.getPersonalizedDashboard(onboardingData);
  };

  const getPersonalizedGreeting = (userName = 'there') => {
    if (!onboardingData) return `, ${userName}!`;

    const focus = onboardingData.focus;
    const name = userName || 'there';

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
        return ` ${name}!`;
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
    getNextSteps,
    getArrivalTimeline,
    getStudentSuccessInsights,
    getPersonalizedDashboard
  };
};
