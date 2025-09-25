import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getToken } from '../../utils/axiosInstance';
import AutocompleteInput from './AutocompleteInput';
import { searchCities, searchUniversities } from '../../data/autocompleteData';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  MessageCircle, 
  Star, 
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  Building2,
  Clock,
  HelpCircle
} from 'lucide-react';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to NewRun! 🎉',
    subtitle: 'Let\'s get you set up in just a few steps',
    type: 'welcome'
  },
  {
    id: 'focus',
    title: 'What should we help you with first?',
    subtitle: 'Choose your primary focus area',
    type: 'selection',
    options: [
      { label: 'Housing', icon: Home, description: 'Find your perfect place' },
      { label: 'Roommate', icon: Users, description: 'Connect with compatible roommates' },
      { label: 'Essentials', icon: ShoppingBag, description: 'Get your essentials pack' },
      { label: 'Community', icon: MessageCircle, description: 'Join your campus community' },
      { label: 'Everything', icon: Star, description: 'I want help with everything' }
    ]
  },
  {
    id: 'arrival',
    title: 'When will you arrive?',
    subtitle: 'This helps us prepare everything for you',
    type: 'date',
    field: 'arrival_date'
  },
  {
    id: 'location',
    title: 'Where are you located?',
    subtitle: 'Help us find the best local options',
    type: 'text',
    field: 'city',
    placeholder: 'Enter your city'
  },
  {
    id: 'university',
    title: 'Which university are you attending?',
    subtitle: 'We\'ll customize your experience',
    type: 'text',
    field: 'university',
    placeholder: 'Enter your university name'
  },
  {
    id: 'budget',
    title: 'What\'s your monthly budget?',
    subtitle: 'This helps us find the best options for you',
    type: 'budget',
    field: 'budget_range'
  },
  {
    id: 'housing_need',
    title: 'What type of housing do you need?',
    subtitle: 'Help us find the perfect match',
    type: 'selection',
    options: [
      { label: 'On-campus', icon: Building, description: 'University housing' },
      { label: 'Off-campus', icon: Building2, description: 'Private apartments/houses' },
      { label: 'Sublet', icon: Clock, description: 'Temporary housing' },
      { label: 'Undecided', icon: HelpCircle, description: 'I need help deciding' }
    ]
  },
  {
    id: 'roommate_interest',
    title: 'Are you looking for a roommate?',
    subtitle: 'This helps us connect you with others',
    type: 'boolean',
    field: 'roommate_interest'
  },
  {
    id: 'essentials',
    title: 'What essentials do you need?',
    subtitle: 'Select all that apply',
    type: 'multi-select',
    field: 'essentials',
    options: [
      { label: 'SIM Card', value: 'SIM' },
      { label: 'Bedding', value: 'Bedding' },
      { label: 'Bank Account', value: 'Bank' },
      { label: 'Cookware', value: 'Cookware' },
      { label: 'Transit Pass', value: 'Transit' }
    ]
  },
  {
    id: 'completion',
    title: 'You\'re all set! 🎉',
    subtitle: 'Let\'s get started with your personalized experience',
    type: 'completion'
  }
];

// Initial profile state
const initProfile = () => ({
  focus: null,
  arrival_date: '',
  city: '',
  university: '',
  budget_range: { min: '', max: '' },
  housing_need: null,
  roommate_interest: null,
  essentials: [],
  completed: false,
  started_at: new Date().toISOString(),
  completed_at: null
});

export default function UnifiedOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('nr_unified_onboarding');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If onboarding is completed, redirect to appropriate page
        if (parsed.completed) {
          const from = new URLSearchParams(window.location.search).get('from') || '/dashboard';
          setTimeout(() => navigate(from, { replace: true }), 100);
          return parsed;
        }
        return parsed;
      }
      return initProfile();
    } catch {
      return initProfile();
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [universitySuggestions, setUniversitySuggestions] = useState([]);

  // Professional confetti animation
  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"];
    
    const frame = () => {
      if (Date.now() > end) return;
      
      // Left cannon
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      
      // Right cannon
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });
      
      requestAnimationFrame(frame);
    };
    
    frame();
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nr_unified_onboarding', JSON.stringify(profile));
  }, [profile]);

  // Save current step to profile
  useEffect(() => {
    setProfile(prev => ({ ...prev, currentStep }));
  }, [currentStep]);

  // Resume from last completed step on component mount
  useEffect(() => {
    if (profile.currentStep && profile.currentStep < ONBOARDING_STEPS.length && !profile.completed) {
      setCurrentStep(profile.currentStep);
    }
  }, [profile.currentStep, profile.completed]);

  // Check backend for onboarding completion status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsCheckingCompletion(true);
        const token = getToken();
        if (!token) {
          console.log('❌ No authentication token found for completion check');
          setIsCheckingCompletion(false);
          return;
        }


        const response = await fetch('http://localhost:8000/onboarding-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.onboardingData && data.onboardingData.completed) {
            // User has already completed onboarding, redirect to dashboard
            const from = new URLSearchParams(window.location.search).get('from') || '/dashboard';
            navigate(from, { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingCompletion(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  // Trigger confetti when reaching completion step
  useEffect(() => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      // Trigger confetti immediately when completion step renders
      setTimeout(() => {
        triggerConfetti();
      }, 300);
    }
  }, [currentStep, triggerConfetti]);

  // Get current step configuration
  const stepConfig = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Get personalized next steps message
  const getNextStepsMessage = (focus) => {
    switch (focus) {
      case 'Housing':
        return 'We\'ll show you verified housing options near your campus. Browse properties, schedule viewings, and find your perfect place!';
      case 'Roommate':
        return 'Take our compatibility quiz to find your ideal roommate. We\'ll match you with students who share your lifestyle and preferences.';
      case 'Essentials':
        return 'Browse our marketplace for everything you need. From SIM cards to bedding, we\'ve got your essentials covered with student-friendly prices.';
      case 'Community':
        return 'Connect with your campus community! Join clubs, attend events, and meet students who share your interests.';
      case 'Everything':
        return 'We\'ll guide you through everything step by step. From housing to roommates to essentials, we\'ve got your entire journey covered.';
      default:
        return 'We\'ll personalize your experience based on your needs. Explore our features and let us know how we can help!';
    }
  };

  // Check if current step is valid
  const isStepValid = useCallback(() => {
    switch (stepConfig.type) {
      case 'welcome':
        return true;
      case 'selection':
        return profile[stepConfig.field] !== null;
      case 'date':
        return profile[stepConfig.field] !== '';
      case 'text':
        return profile[stepConfig.field] !== '';
      case 'budget':
        return profile.budget_range.min !== '' && profile.budget_range.max !== '';
      case 'boolean':
        return profile[stepConfig.field] !== null;
      case 'multi-select':
        return profile[stepConfig.field].length > 0;
      case 'completion':
        return true;
      default:
        return false;
    }
  }, [stepConfig.type, stepConfig.field, profile]);

  // Handle completion
  const handleCompletion = useCallback(async () => {
    if (isLoading) return; // Prevent multiple calls
    
    setIsLoading(true);
    
    try {
      // Mark as completed
      const completedProfile = {
        ...profile,
        completed: true,
        completed_at: new Date().toISOString()
      };
      
      setProfile(completedProfile);
      localStorage.setItem('nr_unified_onboarding', JSON.stringify(completedProfile));
      
      // Save onboarding data to backend
      try {
        const onboardingPayload = {
          focus: profile.focus || 'Everything', // Default to 'Everything' if null
          arrivalDate: profile.arrival_date ? new Date(profile.arrival_date) : null,
          city: profile.city || '',
          university: profile.university || '',
          budgetRange: {
            min: profile.budget_range?.min ? parseInt(profile.budget_range.min) : null,
            max: profile.budget_range?.max ? parseInt(profile.budget_range.max) : null
          },
          housingNeed: profile.housing_need || 'Undecided', // Default to 'Undecided' if null
          roommateInterest: profile.roommate_interest || false,
          essentials: profile.essentials || [],
          completed: true,
          completedAt: new Date()
        };

        // Get token using the same method as axiosInstance
        const token = getToken();
        console.log('🚀 ONBOARDING COMPLETION - Sending data to backend');
        console.log('🔑 Token present:', !!token);
        console.log('📊 Onboarding payload:', JSON.stringify(onboardingPayload, null, 2));

        if (!token) {
          console.error('❌ No authentication token found! Cannot save onboarding data.');
          return;
        }

        const response = await fetch('http://localhost:8000/save-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            onboardingData: onboardingPayload
          })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to save onboarding data to backend:', errorText);
        } else {
          const responseData = await response.json();
          console.log('✅ Onboarding data saved successfully:', responseData);
        }
      } catch (error) {
        console.error('❌ Error saving onboarding data:', error);
        // Continue with redirect even if API fails
      }
      
      // Clear old onboarding data
      localStorage.removeItem('nr_onboarding');
      localStorage.removeItem('nr_onboarding_focus');
      localStorage.removeItem('profileCompleted');
      
      // Show loading for 3 seconds then navigate
      const redirectTimeout = setTimeout(() => {
        try {
          switch (profile.focus) {
            case 'Housing':
              navigate('/all-properties', { state: { from: 'onboarding' } });
              break;
            case 'Roommate':
              navigate('/Synapsematches', { state: { from: 'onboarding' } });
              break;
            case 'Essentials':
              navigate('/marketplace', { state: { from: 'onboarding', category: 'essentials' } });
              break;
            case 'Community':
              navigate('/community', { state: { from: 'onboarding' } });
              break;
            default:
              navigate('/dashboard', { state: { from: 'onboarding' } });
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback to dashboard
          navigate('/dashboard', { state: { from: 'onboarding' } });
        }
      }, 3000);

      // Fallback: if still loading after 10 seconds, force redirect
      const fallbackTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn('Onboarding completion timeout, forcing redirect');
          navigate('/dashboard', { state: { from: 'onboarding' } });
        }
      }, 10000);

      // Cleanup timeouts
      return () => {
        clearTimeout(redirectTimeout);
        clearTimeout(fallbackTimeout);
      };
    } catch (error) {
      console.error('Error during completion:', error);
      setIsLoading(false);
    }
  }, [profile, navigate, isLoading]);

  // Navigation functions
  const nextStep = useCallback(() => {
    // Save progress before moving to next step
    localStorage.setItem('nr_unified_onboarding', JSON.stringify(profile));
    
    if (isLastStep) {
      handleCompletion();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, handleCompletion, profile, currentStep]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        if (stepConfig.type === 'completion' && !isLoading) {
          handleCompletion();
        } else if (stepConfig.type === 'welcome' || isStepValid()) {
          nextStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [stepConfig.type, isStepValid, nextStep, handleCompletion, isLoading]);

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };


  // Handle different input types
  const handleInputChange = (field, value) => {
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [field]: value
      };
      
      // Special handling for focus field - if "Everything" is selected, 
      // we need to set additional fields to indicate all options are selected
      if (field === 'focus' && value === 'Everything') {
        // Set all the individual focus areas to true
        newProfile.housingSelected = true;
        newProfile.roommateSelected = true;
        newProfile.essentialsSelected = true;
        newProfile.communitySelected = true;
      }
      
      return newProfile;
    });
  };

  const handleMultiSelect = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleBudgetChange = (type, value) => {
    setProfile(prev => ({
      ...prev,
      budget_range: {
        ...prev.budget_range,
        [type]: value
      }
    }));
  };

  // Autocomplete search functions
  const handleCitySearch = async (query) => {
    const suggestions = await searchCities(query);
    setCitySuggestions(suggestions);
  };

  const handleUniversitySearch = async (query) => {
    const suggestions = await searchUniversities(query);
    setUniversitySuggestions(suggestions);
  };

  // Render different step types
  const renderStep = () => {
    switch (stepConfig.type) {
      case 'welcome':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-6"
            >
              🎉
            </motion.div>
            <p className="text-white/70 text-lg mb-8">
              We're excited to help you get started with your university journey!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                nextStep();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25 cursor-pointer"
            >
              Let's Get Started! →
            </motion.button>
            <p className="text-white/50 text-sm mt-4">
              Click the button above or press Enter to begin your setup
            </p>
          </div>
        );

      case 'selection':
        return (
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              {stepConfig.options.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleInputChange(stepConfig.field, option.label);
                  // If "Everything" is selected, automatically select all other options
                  if (option.label === 'Everything') {
                    // Set all other options as selected
                    setProfile(prev => ({
                      ...prev,
                      focus: 'Everything',
                      housingSelected: true,
                      roommateSelected: true,
                      essentialsSelected: true,
                      communitySelected: true
                    }));
                    // Show brief visual feedback then continue
                    setTimeout(() => {
                      nextStep();
                    }, 1000);
                  } else {
                    setTimeout(nextStep, 300);
                  }
                }}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  profile[stepConfig.field] === option.label || 
                  (stepConfig.id === 'focus' && profile.focus === 'Everything' && option.label !== 'Everything')
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-white/90'
                }`}
              >
                <div className="flex items-center gap-4">
                  {option.icon && <option.icon size={24} className="text-blue-400" />}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{option.label}</h3>
                    <p className="text-white/70 text-sm">{option.description}</p>
                  </div>
                  {/* Show checkmark for selected options */}
                  {(profile[stepConfig.field] === option.label || 
                    (stepConfig.id === 'focus' && profile.focus === 'Everything' && option.label !== 'Everything')) && (
                    <CheckCircle size={20} className="text-green-400" />
                  )}
                </div>
              </motion.button>
              ))}
            </div>
            
          </div>
        );

      case 'date':
        return (
          <div className="max-w-md mx-auto">
            <input
              type="date"
              value={profile[stepConfig.field]}
              onChange={(e) => handleInputChange(stepConfig.field, e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/30 text-white text-center text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        );

      case 'text':
        return (
          <div className="max-w-md mx-auto">
            {stepConfig.field === 'city' ? (
              <AutocompleteInput
                value={profile[stepConfig.field]}
                onChange={(value) => handleInputChange(stepConfig.field, value)}
                onSearch={handleCitySearch}
                suggestions={citySuggestions}
                placeholder={stepConfig.placeholder}
                className="w-full p-4 rounded-xl bg-white/10 border border-white/30 text-white text-center text-lg focus:outline-none focus:border-blue-500 placeholder-white/50"
              />
            ) : stepConfig.field === 'university' ? (
              <AutocompleteInput
                value={profile[stepConfig.field]}
                onChange={(value) => handleInputChange(stepConfig.field, value)}
                onSearch={handleUniversitySearch}
                suggestions={universitySuggestions}
                placeholder={stepConfig.placeholder}
                className="w-full p-4 rounded-xl bg-white/10 border border-white/30 text-white text-center text-lg focus:outline-none focus:border-blue-500 placeholder-white/50"
              />
            ) : (
              <input
                type="text"
                value={profile[stepConfig.field]}
                onChange={(e) => handleInputChange(stepConfig.field, e.target.value)}
                placeholder={stepConfig.placeholder}
                className="w-full p-4 rounded-xl bg-white/10 border border-white/30 text-white text-center text-lg focus:outline-none focus:border-blue-500 placeholder-white/50"
              />
            )}
          </div>
        );

      case 'budget':
        return (
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-white text-sm mb-2 font-medium">Min Budget</label>
                <input
                  type="number"
                  value={profile.budget_range.min}
                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                  placeholder="0"
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white text-center focus:outline-none focus:border-blue-500 placeholder-white/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white text-sm mb-2 font-medium">Max Budget</label>
                <input
                  type="number"
                  value={profile.budget_range.max}
                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                  placeholder="1000"
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white text-center focus:outline-none focus:border-blue-500 placeholder-white/50"
                />
              </div>
            </div>
            <p className="text-white/60 text-sm text-center">Per month in your local currency</p>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex gap-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleInputChange(stepConfig.field, true);
                setTimeout(nextStep, 300);
              }}
              className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                profile[stepConfig.field] === true
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Yes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleInputChange(stepConfig.field, false);
                setTimeout(nextStep, 300);
              }}
              className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                profile[stepConfig.field] === false
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              No
            </motion.button>
          </div>
        );

      case 'multi-select':
        return (
          <div className="grid gap-3">
            {stepConfig.options.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMultiSelect(stepConfig.field, option.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  profile[stepConfig.field].includes(option.value)
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-white/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    profile[stepConfig.field].includes(option.value)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-white/40'
                  }`}>
                    {profile[stepConfig.field].includes(option.value) && (
                      <CheckCircle size={16} className="text-white" />
                    )}
                  </div>
                  <span className="font-medium text-white">{option.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'completion':
        return (
          <div className="text-center">
            {/* Clean Celebration Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.6 }}
              className="relative mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mx-auto"
              >
                <CheckCircle size={48} className="text-white" />
              </motion.div>
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 text-white">Welcome to NewRun!</h2>
            <p className="text-white/80 text-lg mb-8">
              Your profile is complete. Let's get started with your personalized experience!
            </p>
            
            {/* What's Next Section */}
            <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
              <h3 className="text-xl font-semibold mb-3 text-white">What's Next?</h3>
              <p className="text-white/70 text-sm mb-4">
                {getNextStepsMessage(profile.focus)}
              </p>
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up your experience...</span>
                </div>
              )}
            </div>
            
            {/* Manual Continue Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompletion}
              disabled={isLoading}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all mx-auto ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up...
                </>
              ) : (
                <>
                  Continue to NewRun
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
            
            
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading screen while checking completion status
  if (isCheckingCompletion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
            <span>{Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {stepConfig.title}
            </h1>
            <p className="text-white/80 text-lg">
              {stepConfig.subtitle}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          {stepConfig.type !== 'welcome' && stepConfig.type !== 'completion' && (
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                disabled={isFirstStep}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isFirstStep
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ArrowLeft size={20} />
                Back
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isStepValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'opacity-50 cursor-not-allowed bg-gray-600'
                }`}
              >
                {isLastStep ? 'Complete' : 'Next'}
                <ArrowRight size={20} />
              </motion.button>
            </div>
          )}

          {/* Skip option for non-essential steps */}
          {stepConfig.type === 'text' && (
            <div className="text-center mt-4">
              <button
                onClick={nextStep}
                className="text-white/60 hover:text-white/80 text-sm underline"
              >
                Skip this step
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
