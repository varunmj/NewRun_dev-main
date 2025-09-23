# Legacy Onboarding Files

This folder contains legacy onboarding components that have been replaced by the unified onboarding system.

## Files Moved Here:

### `OnboardingFlow.tsx`
- **Original Location**: `src/onboarding/OnboardingFlow.tsx`
- **Purpose**: Basic onboarding flow with focus selection
- **Replaced By**: `src/components/Onboarding/UnifiedOnboarding.jsx`
- **Status**: Deprecated - Do not use

### `OG_Onboarding/`
- **Original Location**: `src/pages/OG_Onboarding/`
- **Purpose**: Original onboarding implementation
- **Replaced By**: `src/components/Onboarding/UnifiedOnboarding.jsx`
- **Status**: Deprecated - Do not use

## Current Onboarding System

The current onboarding system is located at:
- **Main Component**: `src/components/Onboarding/UnifiedOnboarding.jsx`
- **Autocomplete**: `src/components/Onboarding/AutocompleteInput.jsx`
- **Data**: `src/data/autocompleteData.js`

## Migration Notes

- All references to old onboarding files have been updated
- The unified system provides:
  - 10 comprehensive steps
  - Progress persistence
  - Smart routing based on user focus
  - Autocomplete functionality
  - Better UX and error handling

## Cleanup

These files can be safely deleted after confirming no external references exist.
