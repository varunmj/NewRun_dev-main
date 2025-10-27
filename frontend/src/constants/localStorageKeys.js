/**
 * Centralized localStorage key constants
 * This prevents data loss from inconsistent key usage across the app
 */

// Authentication keys
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  TOKEN: 'token', // Legacy
  USER_TOKEN: 'userToken', // Legacy
  USER_DATA: 'userData'
};

// Onboarding keys
export const ONBOARDING_KEYS = {
  UNIFIED_ONBOARDING: 'nr_unified_onboarding', // Main onboarding data
  ONBOARDING_FOCUS: 'nr_onboarding_focus', // Legacy focus selection
  ONBOARDING_COMPLETED: 'onboarding_completed', // Legacy completion flag
  PROFILE_COMPLETED: 'profileCompleted' // Legacy profile flag
};

// Terms and consent
export const CONSENT_KEYS = {
  TERMS_CONSENT: 'nr_terms_consent'
};

// Debug and development
export const DEBUG_KEYS = {
  DEBUG_MODE: 'debug_mode'
};

// Community and threads
export const COMMUNITY_KEYS = {
  THREADS: 'nr_community_threads',
  RECENT_CAMPUSES: 'nr_recent_campuses'
};

// Solve threads (legacy)
export const SOLVE_KEYS = {
  FILTERS: 'solve:filters',
  THREAD_ID: 'solve:threadId',
  FAVORITES: 'solve:favs',
  HIDDEN: 'solve:hidden',
  NOTES: 'solve:notes',
  SHORTLIST_ONLY: 'solve:shortlistOnly'
};

// AI and caching
export const AI_KEYS = {
  CACHE_PREFIX: 'nr_ai_cache:',
  EXPLANATION_CACHE_PREFIX: 'nr_ai_explanation:'
};

// Legal and UI
export const UI_KEYS = {
  LEGAL_THEME: 'nr_legal_theme'
};

// Transportation
export const TRANSPORT_KEYS = {
  HAS_USED_TRANSPORTATION: 'hasUsedTransportation'
};

// Clearbit logos
export const CLEARBIT_KEYS = {
  PREFIX: 'nr_clearbit_logo:'
};

// Roommate matches
export const ROOMMATE_KEYS = {
  MATCHES_PREFIX: 'nr_roommate_matches:'
};

// Property matches
export const PROPERTY_KEYS = {
  FAVORITES_PREFIX: 'nr_property_favs:'
};

/**
 * Get the correct onboarding key
 * This ensures consistency across the app
 */
export const getOnboardingKey = () => ONBOARDING_KEYS.UNIFIED_ONBOARDING;

/**
 * Get the correct auth token key
 * This ensures consistency across the app
 */
export const getAuthTokenKey = () => AUTH_KEYS.ACCESS_TOKEN;

/**
 * Migration helper: Move data from old keys to new keys
 * This helps users who have data in old format
 */
export const migrateOnboardingData = () => {
  try {
    // Check if data exists in old key
    const oldData = localStorage.getItem('nr_onboarding');
    const newData = localStorage.getItem(ONBOARDING_KEYS.UNIFIED_ONBOARDING);
    
    // If old data exists but new data doesn't, migrate it
    if (oldData && !newData) {
      console.log('🔄 Migrating onboarding data from old key to new key');
      localStorage.setItem(ONBOARDING_KEYS.UNIFIED_ONBOARDING, oldData);
      
      // Clean up old key
      localStorage.removeItem('nr_onboarding');
      
      return JSON.parse(oldData);
    }
    
    // Return new data if it exists
    if (newData) {
      return JSON.parse(newData);
    }
    
    return null;
  } catch (error) {
    console.error('Error migrating onboarding data:', error);
    return null;
  }
};

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting localStorage key ${key}:`, error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key ${key}:`, error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key ${key}:`, error);
      return false;
    }
  }
};
