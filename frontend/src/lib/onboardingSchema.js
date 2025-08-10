// Minimal “source of truth” for the onboarding data we gather.

export const FOCUS_OPTIONS = ["Housing", "Roommate", "Essentials", "Community", "Everything"];

export function initProfile() {
  return {
    focus: undefined,                // one of FOCUS_OPTIONS
    university: undefined,           // optional: fill later if you track it
    arrival_date: undefined,         // ISO string
    city: undefined,                 // optional
    budget_range: null,              // {min, max} | null
    housing_need: undefined,         // "On-campus"|"Off-campus"|"Sublet"|"Undecided"
    roommate_interest: undefined,    // boolean
    essentials: [],                  // ["SIM","Bedding","Bank","Cookware","Transit"]
    interests: [],                   // ["Hiking","Gaming"...] if you want later
    completed: false
  };
}
