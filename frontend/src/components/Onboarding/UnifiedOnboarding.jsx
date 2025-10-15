import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  GraduationCap,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  Building2,
  Clock,
  HelpCircle,
  Briefcase,
  Flag,
  Plane,
  Search
} from 'lucide-react';

// Required fields registry for future-proofing
const REQUIRED_TEXT_IDS = new Set(['university']); // expand later

// Major Autocomplete Component
const MajorAutocomplete = ({ value, onChange, placeholder, university, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const controllerRef = useRef(null);

  const fetchMajors = useCallback(async (universityName) => {
    if (!universityName) return;
    
    // Cancel previous request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/universities/${encodeURIComponent(universityName)}/majors`, {
        signal: controller.signal
      });
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.majors || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching majors:', error);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (university) {
        fetchMajors(university);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [university, fetchMajors]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setIsOpen(inputValue.length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (major) => {
    onChange(major);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow clicks on suggestions
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const filteredSuggestions = suggestions.filter(major =>
    major.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(value.length > 0)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-activedescendant={isOpen && selectedIndex >= 0 ? `major-opt-${selectedIndex}` : undefined}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-live="polite" aria-label="Loading suggestions">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
        </div>
      )}
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          role="listbox"
        >
          {filteredSuggestions.map((major, index) => (
            <button
              key={index}
              id={`major-opt-${index}`}
              onClick={() => handleSuggestionClick(major)}
              className={`w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors ${
                index === selectedIndex ? 'bg-white/20' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {major}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  // STEP 0: Welcome
  {
    id: 'welcome',
    title: 'Welcome to NewRun! 🎉',
    subtitle: 'Let\'s get you set up in just a few steps',
    type: 'welcome'
  },
  
  // STEP 1: US Status (Everyone) - Moved to first for flow logic
  {
    id: 'us_status',
    title: 'Are you currently in the US?',
    subtitle: 'This helps us provide relevant resources',
    type: 'selection',
    field: 'usStatus',
    options: [
      { 
        label: 'Yes, I\'m in the US', 
        icon: Flag, 
        description: 'Already in the United States',
        value: 'in_us'
      },
      { 
        label: 'No, coming to the US', 
        icon: Plane, 
        description: 'Arriving from another country',
        value: 'coming_to_us'
      }
    ]
  },
  
  // STEP 2: Basic Info (Everyone)
  {
    id: 'birthday',
    title: 'What\'s your birthday?',
    subtitle: 'This helps us verify your age and provide age-appropriate services',
    type: 'date',
    field: 'birthday'
  },
  
  // STEP 3: Academic Level (Everyone)
  {
    id: 'academic_level',
    title: 'What\'s your academic level?',
    subtitle: 'This helps us tailor your experience',
    type: 'selection',
    field: 'academicLevel',
    options: [
      { 
        label: 'Undergraduate', 
        icon: GraduationCap, 
        description: 'Bachelor\'s degree student',
        value: 'undergraduate'
      },
      { 
        label: 'Graduate Student', 
        icon: Star, 
        description: 'Master\'s or PhD student',
        value: 'graduate'
      },
      { 
        label: 'Alumni', 
        icon: Users, 
        description: 'Graduated and working',
        value: 'alumni'
      }
    ]
  },
  
  // STEP 4: University (Students and Alumni)
  {
    id: 'university',
    title: (profile) => {
      if (profile.academicLevel === 'alumni') {
        return 'Which university did you attend?';
      }
      return 'Which university are you attending?';
    },
    subtitle: 'We\'ll customize your experience',
    type: 'text',
    field: 'university',
    placeholder: 'Enter your university name',
    conditional: (profile) => {
      return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
    }
  },
  
  // STEP 5: Current Situation (Dynamic based on academic level)
  {
    id: 'current_situation',
    title: 'What\'s your current situation?',
    subtitle: 'Help us understand your needs',
    type: 'selection',
    field: 'currentSituation',
    options: (profile) => {
      if (profile.academicLevel === 'alumni') {
        return [
          { 
            label: 'Currently Working', 
            icon: Building, 
            description: 'Already employed, looking for services',
            value: 'working'
          },
          { 
            label: 'Job Relocation', 
            icon: ArrowRight, 
            description: 'Got job offer, relocating',
            value: 'relocation'
          },
          { 
            label: 'Graduate School', 
            icon: GraduationCap, 
            description: 'Going to graduate school',
            value: 'grad_school'
          },
          { 
            label: 'Job Search', 
            icon: Search, 
            description: 'Looking for job opportunities',
            value: 'job_search'
          }
        ];
      } else {
        return [
          { 
            label: 'Incoming Student', 
            icon: Plane, 
            description: 'Starting university soon',
            value: 'incoming'
          },
          { 
            label: 'Current Student', 
            icon: Home, 
            description: 'Already studying, looking for housing',
            value: 'current'
          },
          { 
            label: 'Transfer Student', 
            icon: ArrowRight, 
            description: 'Transferring to new university',
            value: 'transfer'
          }
        ];
      }
    }
  },
  
  // STEP 6: Major (Students + Alumni)
  {
    id: 'major',
    title: 'What\'s your field of study?',
    subtitle: 'Help us connect you with relevant communities',
    type: 'autocomplete',
    field: 'major',
    placeholder: 'e.g., Computer Science, Business, Engineering',
    conditional: (profile) => {
      return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
    }
  },
  
  // STEP 7: Intake/Semester (Dynamic based on user type)
  {
    id: 'intake',
    title: (profile) => {
      if (profile.academicLevel === 'alumni') {
        return 'When did you graduate?';
      }
      return 'What\'s your intake/semester?';
    },
    subtitle: (profile) => {
      if (profile.academicLevel === 'alumni') {
        return 'Help us understand your background';
      }
      return 'Help us understand your timeline';
    },
    type: 'selection',
    field: 'intake',
    conditional: (profile) => {
      return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
    },
    options: (profile) => {
      if (profile.academicLevel === 'alumni') {
        // Alumni options - past graduation dates
        return [
          { 
            label: 'Spring 2020', 
            icon: Calendar, 
            description: 'Graduated Spring 2020',
            value: 'spring_2020'
          },
          { 
            label: 'Summer 2020', 
            icon: Calendar, 
            description: 'Graduated Summer 2020',
            value: 'summer_2020'
          },
          { 
            label: 'Fall 2020', 
            icon: Calendar, 
            description: 'Graduated Fall 2020',
            value: 'fall_2020'
          },
          { 
            label: 'Spring 2021', 
            icon: Calendar, 
            description: 'Graduated Spring 2021',
            value: 'spring_2021'
          },
          { 
            label: 'Summer 2021', 
            icon: Calendar, 
            description: 'Graduated Summer 2021',
            value: 'summer_2021'
          },
          { 
            label: 'Fall 2021', 
            icon: Calendar, 
            description: 'Graduated Fall 2021',
            value: 'fall_2021'
          },
          { 
            label: 'Spring 2022', 
            icon: Calendar, 
            description: 'Graduated Spring 2022',
            value: 'spring_2022'
          },
          { 
            label: 'Summer 2022', 
            icon: Calendar, 
            description: 'Graduated Summer 2022',
            value: 'summer_2022'
          },
          { 
            label: 'Fall 2022', 
            icon: Calendar, 
            description: 'Graduated Fall 2022',
            value: 'fall_2022'
          },
          { 
            label: 'Spring 2023', 
            icon: Calendar, 
            description: 'Graduated Spring 2023',
            value: 'spring_2023'
          },
          { 
            label: 'Summer 2023', 
            icon: Calendar, 
            description: 'Graduated Summer 2023',
            value: 'summer_2023'
          },
          { 
            label: 'Fall 2023', 
            icon: Calendar, 
            description: 'Graduated Fall 2023',
            value: 'fall_2023'
          },
          { 
            label: 'Spring 2024', 
            icon: Calendar, 
            description: 'Graduated Spring 2024',
            value: 'spring_2024'
          },
          { 
            label: 'Summer 2024', 
            icon: Calendar, 
            description: 'Graduated Summer 2024',
            value: 'summer_2024'
          },
          { 
            label: 'Fall 2024', 
            icon: Calendar, 
            description: 'Graduated Fall 2024',
            value: 'fall_2024'
          }
        ];
      } else {
        // Current students - future intake dates
        return [
          { 
            label: 'Spring 2024', 
            icon: Calendar, 
            description: 'Starting Spring 2024',
            value: 'spring_2024'
          },
          { 
            label: 'Summer 2024', 
            icon: Calendar, 
            description: 'Starting Summer 2024',
            value: 'summer_2024'
          },
          { 
            label: 'Fall 2024', 
            icon: Calendar, 
            description: 'Starting Fall 2024',
            value: 'fall_2024'
          },
          { 
            label: 'Spring 2025', 
            icon: Calendar, 
            description: 'Starting Spring 2025',
            value: 'spring_2025'
          },
          { 
            label: 'Summer 2025', 
            icon: Calendar, 
            description: 'Starting Summer 2025',
            value: 'summer_2025'
          },
          { 
            label: 'Fall 2025', 
            icon: Calendar, 
            description: 'Starting Fall 2025',
            value: 'fall_2025'
          },
          { 
            label: 'Spring 2026', 
            icon: Calendar, 
            description: 'Starting Spring 2026',
            value: 'spring_2026'
          },
          { 
            label: 'Summer 2026', 
            icon: Calendar, 
            description: 'Starting Summer 2026',
            value: 'summer_2026'
          },
          { 
            label: 'Fall 2026', 
            icon: Calendar, 
            description: 'Starting Fall 2026',
            value: 'fall_2026'
          }
        ];
      }
    }
  },
  
  // STEP 8: Graduation Date (Students only)
  {
    id: 'graduation_date',
    title: (profile) => {
      if (profile.currentSituation === 'current') {
        return 'Confirm your graduation date';
      }
      return 'When do you expect to graduate?';
    },
    subtitle: 'Help us plan your academic journey',
    type: 'date',
    field: 'graduationDate',
    conditional: (profile) => {
      return ['undergraduate', 'graduate'].includes(profile.academicLevel);
    }
  },
  
  // STEP 9: Essentials (Everyone)
  {
    id: 'essentials',
    title: 'What essentials do you need?',
    subtitle: 'Help us prepare everything you need for your new life',
    type: 'multi_selection',
    field: 'essentials',
    conditional: (profile) => {
      return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
    },
    options: [
      { 
        label: 'SIM Card', 
        icon: Search, 
        description: 'US phone number and data plan',
        value: 'sim_card',
        category: 'communication'
      },
      { 
        label: 'Banking', 
        icon: DollarSign, 
        description: 'US bank account and debit card',
        value: 'banking',
        category: 'financial'
      },
      { 
        label: 'Cookware', 
        icon: Home, 
        description: 'Kitchen essentials and cooking supplies',
        value: 'cookware',
        category: 'home'
      },
      { 
        label: 'Transportation', 
        icon: ArrowRight, 
        description: 'Public transit pass or bike',
        value: 'transportation',
        category: 'mobility'
      },
      { 
        label: 'Bedding', 
        icon: Home, 
        description: 'Sheets, pillows, and comfort items',
        value: 'bedding',
        category: 'home'
      },
      { 
        label: 'Electronics', 
        icon: Search, 
        description: 'Laptop accessories and adapters',
        value: 'electronics',
        category: 'tech'
      },
      { 
        label: 'Clothing', 
        icon: Home, 
        description: 'Weather-appropriate clothing',
        value: 'clothing',
        category: 'personal'
      },
      { 
        label: 'Study Materials', 
        icon: GraduationCap, 
        description: 'Textbooks and school supplies',
        value: 'study_materials',
        category: 'academic'
      }
    ]
  },
  
  
  // STEP 10: US Entry Date (Everyone with academic level)
  {
    id: 'us_entry_date',
    title: (profile) => {
      if (profile.currentSituation === 'incoming') {
        return 'When will you arrive in the US?';
      }
      return 'When did you first arrive in the US?';
    },
    subtitle: 'This helps us provide relevant resources',
    type: 'date',
    field: 'usEntryDate',
    conditional: (profile) => {
      return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
    }
  },
  
  // STEP 11: Visa Status (Everyone - for legal compliance)
  {
    id: 'visa_status',
    title: 'What\'s your visa/status?',
    subtitle: 'This helps us provide relevant resources',
    type: 'selection',
    field: 'visaStatus',
    options: [
      { 
        label: 'F1 Student Visa', 
        icon: GraduationCap, 
        description: 'International student',
        value: 'F1',
        category: 'international'
      },
      { 
        label: 'CPT (F-1)', 
        icon: Briefcase, 
        description: 'Curricular Practical Training',
        value: 'CPT',
        category: 'international'
      },
      { 
        label: 'OPT / STEM-OPT (F-1)', 
        icon: Briefcase, 
        description: 'Post-completion OPT or STEM-OPT',
        value: 'OPT_STEM',
        category: 'international'
      },
      { 
        label: 'H1B Work Visa', 
        icon: Building, 
        description: 'Professional worker',
        value: 'H1B',
        category: 'professional'
      },
      { 
        label: 'US Citizen/Green Card', 
        icon: Flag, 
        description: 'US citizen or permanent resident',
        value: 'citizen',
        category: 'domestic'
      }
    ]
  },
  
  // STEP 12: Location (Everyone)
  {
    id: 'location',
    title: 'Where are you located?',
    subtitle: 'Help us find the best local options',
    type: 'text',
    field: 'city',
    placeholder: 'Enter your current city'
  },
  
  // STEP 13: Budget (Everyone)
  {
    id: 'budget',
    title: 'What\'s your monthly budget?',
    subtitle: 'This helps us find the best options for you',
    type: 'budget',
    field: 'budget_range'
  },
  
  // STEP 14: Housing Needs (Everyone)
  {
    id: 'housing_needs',
    title: 'What are your housing needs?',
    subtitle: 'Choose what fits your situation',
    type: 'selection',
    field: 'housingNeeds',
    options: [
      { label: 'On-campus', icon: Building, description: 'University housing' },
      { label: 'Off-campus', icon: Building2, description: 'Private apartments/houses' },
      { label: 'Sublet', icon: Clock, description: 'Temporary housing' },
      { label: 'Need roommate', icon: Users, description: 'Looking for roommate' },
      { label: 'Have roommate', icon: CheckCircle, description: 'Already have someone' },
      { label: 'Undecided', icon: HelpCircle, description: 'I need help deciding' }
    ]
  },
  
  // STEP 15: Focus (Everyone)
  {
    id: 'focus',
    title: 'Where should we start?',
    subtitle: 'Choose what you want to see first (you can select multiple)',
    type: 'multi_selection',
    field: 'focus',
    options: [
      { label: 'Housing', icon: Building2, description: 'Find places near campus', value: 'Housing' },
      { label: 'Roommate', icon: Users, description: 'Compatibility-based matches', value: 'Roommate' },
      { label: 'Essentials', icon: ShoppingBag, description: 'SIM, bank, bedding & more', value: 'Essentials' },
      { label: 'Community', icon: MessageCircle, description: 'Clubs, events, groups', value: 'Community' },
      { label: 'Everything', icon: Star, description: 'Show me all the things', value: 'Everything' }
    ]
  },
  
  // STEP 16: Completion
  {
    id: 'completion',
    title: 'You\'re all set! 🎉',
    subtitle: 'Welcome to the NewRun community',
    type: 'completion'
  }
];

// Initial profile state
const initProfile = () => ({
  academicLevel: null,
  visaStatus: null,
  currentSituation: null,
  usStatus: null,
  usEntryDate: '',
  university: '',
  major: '',
  intake: '',
  graduationDate: '',
  graduationSemester: '',
  graduationYear: '',
  essentials: [],
  birthday: '',
  moveDate: '',
  city: '',
  budget_range: { min: null, max: null },
  housingNeeds: null,
  focus: [],
  currentStepId: null,
  completed: false,
  startedAt: new Date().toISOString(),
  completedAt: null
});

export default function UnifiedOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('nr_onboarding');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backward compatibility: normalize old CPT_OPT to OPT_STEM
        if (parsed.visaStatus === 'CPT_OPT') {
          parsed.visaStatus = 'OPT_STEM';
        }
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
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    
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
    localStorage.setItem('nr_onboarding', JSON.stringify(profile));
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

        // Check for debug mode
        const debugMode = localStorage.getItem('debug_mode') === 'true';
        const forceOnboarding = new URLSearchParams(window.location.search).get('force') === 'true';
        
        if (debugMode || forceOnboarding) {
          console.log('🔧 Debug mode enabled - allowing onboarding access');
          setIsCheckingCompletion(false);
          return;
        }

        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/onboarding-data`, {
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

  // Check if current step should be shown (for conditional steps)
  const shouldShowStep = useCallback((step) => {
    if (!step.conditional) return true;
    return step.conditional(profile);
  }, [profile]);

  // Compute visible steps for current profile
  const visibleSteps = useMemo(() => {
    return ONBOARDING_STEPS.filter(step => shouldShowStep(step));
  }, [shouldShowStep]);

  // Resume from saved step ID
  useEffect(() => {
    if (profile.currentStepId) {
      const i = visibleSteps.findIndex(s => s.id === profile.currentStepId);
      if (i >= 0) setCurrentStep(i);
    }
  }, [profile.currentStepId, visibleSteps]);

  // Clamp current step to valid range
  const clampIndex = (idx, stepsArray) => Math.max(0, Math.min(idx, stepsArray.length - 1));
  const safeStep = clampIndex(currentStep, visibleSteps);
  const stepConfig = visibleSteps[safeStep] || ONBOARDING_STEPS[0];

  // Calculate current position in visible steps
  const currentVisibleIndex = visibleSteps.findIndex(s => s.id === stepConfig.id);
  const totalVisible = visibleSteps.length;

  // Progress calculation
  const stepsExcludingCaps = Math.max(0, totalVisible - 2);
  const currentNumber = Math.max(0, currentVisibleIndex - 1); // exclude welcome

  const progressLabel = 
    currentVisibleIndex <= 0 ? 'Welcome' :
    currentVisibleIndex === totalVisible - 1 ? 'Complete' :
    stepsExcludingCaps === 0 ? 'Getting started' :
    `Step ${Math.min(currentNumber, stepsExcludingCaps)} of ${stepsExcludingCaps}`;

  const progressPercent = 
    currentVisibleIndex <= 0 ? 0 :
    Math.round((currentNumber / Math.max(1, stepsExcludingCaps)) * 100);

  const isFirstStep = currentVisibleIndex === 0;
  const isLastStep = currentVisibleIndex === totalVisible - 1;

  // Trigger confetti when reaching completion step
  useEffect(() => {
    if (isLastStep) {
      const t = setTimeout(triggerConfetti, 300);
      return () => clearTimeout(t);
    }
  }, [isLastStep, triggerConfetti]);

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
    if (!stepConfig || (stepConfig.conditional && !stepConfig.conditional(profile))) return true;

    switch (stepConfig.id) {
      case 'university':
      case 'major': {
        const needsIt = ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel);
        return needsIt && !!profile[stepConfig.field]?.trim();
      }

      case 'intake':
        return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel) && !!profile[stepConfig.field];
        
      case 'essentials':
        return ['undergraduate', 'graduate', 'alumni'].includes(profile.academicLevel) && Array.isArray(profile[stepConfig.field]) && profile[stepConfig.field].length > 0;
        
      case 'us_status':
        return !!profile.usStatus;

      case 'us_entry_date': {
        const d = profile.usEntryDate && new Date(profile.usEntryDate);
        if (!d || Number.isNaN(d.getTime())) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Incoming -> future or today (arrival date)
        if (profile.currentSituation === 'incoming') {
          return d >= today;
        }
        // Current/Alumni -> past or today (arrived date)
        return d <= today;
      }

      case 'budget':
        const { min, max } = profile.budget_range || {};
        return Number.isFinite(+min) && Number.isFinite(+max) && +min >= 0 && +max >= +min;

      default:
        // fallback by type
    switch (stepConfig.type) {
      case 'welcome':
        return true;
      case 'selection':
            return profile[stepConfig.field] != null;
      case 'date':
            return !!profile[stepConfig.field];
      case 'text':
            return !!profile[stepConfig.field]?.trim();
      case 'budget':
        return profile.budget_range.min !== null && profile.budget_range.max !== null;
      case 'boolean':
        return profile[stepConfig.field] !== null;
      case 'multi-select':
          case 'multi_selection':
            return Array.isArray(profile[stepConfig.field]) && profile[stepConfig.field].length > 0;
      case 'completion':
        return true;
      default:
            return true;
    }
    }
  }, [profile, stepConfig]);

  // Handle completion
  const handleCompletion = useCallback(async () => {
    if (isLoading) return; // Prevent multiple calls
    
    setIsLoading(true);
    
    try {
      // Mark as completed
      const completedProfile = {
        ...profile,
        completed: true,
        completedAt: new Date().toISOString()
      };
      
      setProfile(completedProfile);
      localStorage.setItem('nr_onboarding', JSON.stringify(completedProfile));
      
      // Save onboarding data to backend
      try {
        // Calculate anniversary key for arrival date
        const annivKey = (() => {
          if (!profile.usEntryDate) return null;
          const d = new Date(profile.usEntryDate);
          if (Number.isNaN(d.getTime())) return null;
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${mm}-${dd}`; // e.g., "08-21"
        })();

        const onboardingPayload = {
          // Basic info
          birthday: profile.birthday ? new Date(profile.birthday) : null,
          
          // Academic info
          academicLevel: profile.academicLevel,
          university: profile.university || '',
          major: profile.major || '',
          intake: profile.intake || null,
          graduationDate: profile.graduationDate ? new Date(profile.graduationDate) : null,
          
          // Current situation
          currentSituation: profile.currentSituation,
          usStatus: profile.usStatus || null,
          usEntryDate: profile.usEntryDate ? new Date(profile.usEntryDate) : null,
          
          // Visa and status
          visaStatus: profile.visaStatus,
          
          // Location and budget
          city: profile.city || '',
          budgetRange: {
            min: profile.budget_range?.min ? parseInt(profile.budget_range.min) : null,
            max: profile.budget_range?.max ? parseInt(profile.budget_range.max) : null
          },
          
          // Housing and essentials
          housingNeeds: profile.housingNeeds || 'Undecided',
          essentials: profile.essentials || [],
          
          // Focus and completion
          focus: profile.focus || ['Everything'],
          arrivalAnniversaryMMDD: annivKey,
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

        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/save-onboarding`, {
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

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Onboarding data saved successfully:', responseData);
          
          // Clear old onboarding data only on successful save
          localStorage.removeItem('nr_onboarding');
          localStorage.removeItem('nr_onboarding_focus');
          localStorage.removeItem('profileCompleted');
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to save onboarding data to backend:', errorText);
          // Keep local cache so user isn't stranded
        }
      } catch (error) {
        console.error('❌ Error saving onboarding data:', error);
        // Keep local cache so user isn't stranded
      }
      
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
    const idx = visibleSteps.findIndex(s => s.id === stepConfig.id);
    const lastIdx = visibleSteps.length - 1;
    
    if (idx >= lastIdx) {
      handleCompletion();
    } else {
      const nextIdx = idx + 1;
      setCurrentStep(nextIdx);
      setProfile(p => ({ ...p, currentStepId: visibleSteps[nextIdx].id }));
      localStorage.setItem('nr_onboarding', JSON.stringify({ ...profile, currentStepId: visibleSteps[nextIdx].id }));
    }
  }, [profile, visibleSteps, stepConfig, handleCompletion]);

  const prevStep = useCallback(() => {
    const idx = visibleSteps.findIndex(s => s.id === stepConfig.id);
    if (idx > 0) {
      setCurrentStep(idx - 1);
    }
  }, [visibleSteps, stepConfig]);


  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      const hasRoleCombo = e.target?.getAttribute?.('role') === 'combobox' || e.target?.closest?.('[role="listbox"]');
      const isListButton = e.target?.tagName?.toLowerCase() === 'button' && e.target?.closest?.('[role="listbox"]');

      if (e.key === 'Enter') {
        // avoid hijacking Enter while editing/choosing
        if (isTyping || hasRoleCombo || isListButton) return;

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



  // Handle different input types
  const handleInputChange = (field, value) => {
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [field]: value
      };
      
      // Reset dependent fields when academic level changes
      if (field === 'academicLevel') {
        Object.assign(newProfile, {
          currentSituation: null,
          university: '',
          major: '',
          intake: '',
          graduationDate: '',
          usStatus: null,
          arrivalDate: '',
        });
      }
      
      // Reset dependent fields when current situation changes
      if (field === 'currentSituation') {
        if (value !== 'incoming') {
          newProfile.usStatus = null;
          // If we had a future usEntryDate (planned arrival), clear it to avoid validation confusion
          const d = newProfile.usEntryDate ? new Date(newProfile.usEntryDate) : null;
          if (d && d > new Date()) newProfile.usEntryDate = '';
        }
        if (value !== 'current') {
          newProfile.graduationDate = '';
        }
        if (value !== 'transfer') {
          newProfile.intake = '';
        }
      }
      
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
    const num = value === '' ? null : Number(value);
    setProfile(prev => ({
      ...prev,
      budget_range: {
        ...prev.budget_range,
        [type]: num
      }
    }));
  };

  // Date validation helper
  const getUsEntryDateError = (profile) => {
    if (!profile.usEntryDate) return '';
    const d = new Date(profile.usEntryDate);
    if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
    const today = new Date(); 
    today.setHours(0,0,0,0);

    if (profile.currentSituation === 'incoming' && d < today) {
      return 'Arrival must be today or in the future.';
    }
    if (profile.currentSituation !== 'incoming' && d > today) {
      return 'Arrived date cannot be in the future.';
    }
    return '';
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
        // Check if this is the intake step for alumni
        if (stepConfig.id === 'intake' && profile.academicLevel === 'alumni') {
          return (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Semester Dropdown */}
                <div>
                  <label className="block text-blue-400 text-base font-semibold mb-4">
                    Semester
                  </label>
                  <select
                    value={profile.graduationSemester || ''}
                    onChange={(e) => {
                      const semester = e.target.value;
                      const year = profile.graduationYear || '';
                      const combinedValue = semester && year ? `${semester}_${year}` : '';
                      handleInputChange('graduationSemester', semester);
                      handleInputChange('intake', combinedValue);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-white/20 bg-black/40 text-white placeholder-white/50 focus:border-blue-500 focus:bg-black/60 transition-all duration-200 hover:border-white/40 hover:bg-black/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="" className="bg-black text-white">Select semester</option>
                    <option value="spring" className="bg-black text-white">Spring</option>
                    <option value="summer" className="bg-black text-white">Summer</option>
                    <option value="fall" className="bg-black text-white">Fall</option>
                  </select>
                </div>

                {/* Year Dropdown */}
                <div>
                  <label className="block text-blue-400 text-base font-semibold mb-4">
                    Year
                  </label>
                  <select
                    value={profile.graduationYear || ''}
                    onChange={(e) => {
                      const year = e.target.value;
                      const semester = profile.graduationSemester || '';
                      const combinedValue = semester && year ? `${semester}_${year}` : '';
                      handleInputChange('graduationYear', year);
                      handleInputChange('intake', combinedValue);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-white/20 bg-black/40 text-white placeholder-white/50 focus:border-blue-500 focus:bg-black/60 transition-all duration-200 hover:border-white/40 hover:bg-black/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="" className="bg-black text-white">Select year</option>
                    <option value="2020" className="bg-black text-white">2020</option>
                    <option value="2021" className="bg-black text-white">2021</option>
                    <option value="2022" className="bg-black text-white">2022</option>
                    <option value="2023" className="bg-black text-white">2023</option>
                    <option value="2024" className="bg-black text-white">2024</option>
                  </select>
                </div>
              </div>
              
              {/* Show combined value */}
              {profile.intake && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-white/90 text-sm">
                      Selected: <span className="text-blue-400 font-medium capitalize">{profile.intake.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              {(typeof stepConfig.options === 'function' ? stepConfig.options(profile) : stepConfig.options).map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const value = option.value || option.label;
                  handleInputChange(stepConfig.field, value);
                    setTimeout(nextStep, 300);
                }}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  profile[stepConfig.field] === (option.value || option.label)
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
                  {profile[stepConfig.field] === (option.value || option.label) && (
                    <CheckCircle size={20} className="text-green-400" />
                  )}
                </div>
              </motion.button>
              ))}
            </div>
            
          </div>
        );

      case 'multi_selection':
        return (
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              {stepConfig.options.map((option) => {
                const isSelected = profile[stepConfig.field]?.includes(option.value);
                return (
                  <motion.button
                    key={option.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const currentValues = profile[stepConfig.field] || [];
                      let newValues;
                      
                      if (option.value === 'Everything') {
                        if (isSelected) {
                          // If "Everything" is being deselected, clear all selections
                          newValues = [];
                        } else {
                          // If "Everything" is being selected, select all OTHER options (not Everything itself)
                          newValues = stepConfig.options.filter(opt => opt.value !== 'Everything').map(opt => opt.value);
                        }
                      } else {
                        // For other options, handle normally
                        newValues = isSelected
                          ? currentValues.filter(v => v !== option.value)
                          : [...currentValues, option.value];
                        
                        // If "Everything" was selected and we're deselecting another option, remove "Everything"
                        if (currentValues.includes('Everything') && isSelected) {
                          newValues = newValues.filter(v => v !== 'Everything');
                        }
                      }
                      
                      handleInputChange(stepConfig.field, newValues);
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <option.icon size={24} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{option.label}</h3>
                        <p className="text-white/70 text-sm">{option.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle size={24} className="text-blue-400" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={nextStep}
                disabled={!profile[stepConfig.field]?.length}
                className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue ({profile[stepConfig.field]?.length || 0} selected)
              </button>
            </div>
          </div>
        );

      case 'date':
        const isUsEntry = stepConfig.id === 'us_entry_date';
        const dateError = isUsEntry ? getUsEntryDateError(profile) : '';
        return (
          <div className="max-w-md mx-auto">
            <input
              type="date"
              value={profile[stepConfig.field]}
              onChange={(e) => handleInputChange(stepConfig.field, e.target.value)}
              aria-invalid={!!dateError}
              className={`w-full p-4 rounded-xl bg-white/10 border text-white text-center text-lg focus:outline-none ${
                dateError ? 'border-red-500 focus:border-red-500' : 'border-white/30 focus:border-blue-500'
              }`}
            />
            {isUsEntry && dateError && (
              <p className="mt-2 text-sm text-red-400" role="alert">{dateError}</p>
            )}
          </div>
        );

      case 'autocomplete':
        return (
          <div className="max-w-md mx-auto">
            {stepConfig.field === 'major' ? (
              <MajorAutocomplete
                value={profile[stepConfig.field]}
                onChange={(value) => handleInputChange(stepConfig.field, value)}
                placeholder={stepConfig.placeholder}
                university={profile.university}
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
            <span>{progressLabel}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          key={stepConfig.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {typeof stepConfig.title === 'function' ? stepConfig.title(profile) : stepConfig.title}
            </h1>
            <p className="text-white/80 text-lg">
              {typeof stepConfig.subtitle === 'function' ? stepConfig.subtitle(profile) : stepConfig.subtitle}
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

          {/* Skip option only for non-required text steps */}
          {stepConfig.type === 'text' && !REQUIRED_TEXT_IDS.has(stepConfig.id) && (
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
