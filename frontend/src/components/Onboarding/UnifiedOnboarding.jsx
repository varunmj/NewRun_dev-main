import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft
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
      { label: 'On-campus', description: 'University housing' },
      { label: 'Off-campus', description: 'Private apartments/houses' },
      { label: 'Sublet', description: 'Temporary housing' },
      { label: 'Undecided', description: 'I need help deciding' }
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
      return saved ? JSON.parse(saved) : initProfile();
    } catch {
      return initProfile();
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nr_unified_onboarding', JSON.stringify(profile));
  }, [profile]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && (stepConfig.type === 'welcome' || isStepValid())) {
        nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [stepConfig.type, isStepValid]);

  // Get current step configuration
  const stepConfig = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Navigation functions
  const nextStep = () => {
    if (isLastStep) {
      handleCompletion();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompletion = async () => {
    setIsLoading(true);
    
    // Mark as completed
    const completedProfile = {
      ...profile,
      completed: true,
      completed_at: new Date().toISOString()
    };
    
    setProfile(completedProfile);
    localStorage.setItem('nr_unified_onboarding', JSON.stringify(completedProfile));
    
    // Clear old onboarding data
    localStorage.removeItem('nr_onboarding');
    localStorage.removeItem('nr_onboarding_focus');
    localStorage.removeItem('profileCompleted');
    
    // Navigate based on focus
    setTimeout(() => {
      switch (profile.focus) {
        case 'Housing':
          navigate('/all-properties', { state: { from: 'onboarding' } });
          break;
        case 'Roommate':
          navigate('/Synapse', { state: { from: 'onboarding' } });
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
    }, 1000);
  };

  // Handle different input types
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Check if current step is valid
  const isStepValid = () => {
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
          <div className="grid gap-4 md:grid-cols-2">
            {stepConfig.options.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleInputChange(stepConfig.field, option.label);
                  setTimeout(nextStep, 300);
                }}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  profile[stepConfig.field] === option.label
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <option.icon size={24} className="text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-white/60 text-sm">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'date':
        return (
          <div className="max-w-md mx-auto">
            <input
              type="date"
              value={profile[stepConfig.field]}
              onChange={(e) => handleInputChange(stepConfig.field, e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white text-center text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        );

      case 'text':
        return (
          <div className="max-w-md mx-auto">
            <input
              type="text"
              value={profile[stepConfig.field]}
              onChange={(e) => handleInputChange(stepConfig.field, e.target.value)}
              placeholder={stepConfig.placeholder}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white text-center text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        );

      case 'budget':
        return (
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-white/70 text-sm mb-2">Min Budget</label>
                <input
                  type="number"
                  value={profile.budget_range.min}
                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                  placeholder="0"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white text-center focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white/70 text-sm mb-2">Max Budget</label>
                <input
                  type="number"
                  value={profile.budget_range.max}
                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                  placeholder="1000"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white text-center focus:outline-none focus:border-blue-500"
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
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
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
                  <span className="font-medium">{option.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'completion':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-6xl mb-6"
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Welcome to NewRun!</h2>
            <p className="text-white/70 text-lg mb-8">
              Your profile is complete. Let's get started with your personalized experience!
            </p>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up your experience...</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {stepConfig.title}
            </h1>
            <p className="text-white/70 text-lg">
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
