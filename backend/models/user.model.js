const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // required
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },

  // optional login/display
  googleId:  { type: String, unique: true, sparse: true },
  username:  { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  avatar:    { type: String, default: '' },

  // profile basics (only hometown kept at root level)
  hometown:        { type: String, default: '' },
  
  // REMOVED DUPLICATE FIELDS - These are now only in onboardingData:
  // - currentLocation (moved to onboardingData.city)
  // - birthday (moved to onboardingData.birthday) 
  // - university (moved to onboardingData.university)
  // - major (moved to onboardingData.major)
  // - graduationDate (moved to onboardingData.graduationDate)

  // routing / campus extras (used by Properties map)
  schoolDepartment:   { type: String, default: '' }, // e.g. College of Business
  cohortTerm:         { type: String, default: '' }, // e.g. "Spring 2023"
  campusLabel:        { type: String, default: '' }, // your friendly label
  campusPlaceId:      { type: String, default: '' }, // Google Place ID
  campusDisplayName:  { type: String, default: '' }, // e.g. "Barsema Hall"

  // onboarding preferences
  onboardingData: {
    // Basic info
    birthday: { type: Date, default: null },
    
    // Academic info
    academicLevel: { type: String, enum: ['undergraduate', 'graduate', 'alumni'], default: null },
    university: { type: String, default: '' },
    major: { type: String, default: '' },
    intake: { type: String, default: null },
    graduationDate: { type: Date, default: null },
    
    // Current situation
    currentSituation: { type: String, default: null },
    usStatus: { type: String, enum: ['in_us', 'coming_to_us'], default: null },
    usEntryDate: { type: Date, default: null },
    
    // Visa and status
    visaStatus: { 
      type: String, 
      enum: ['F1', 'CPT', 'OPT_STEM', 'H1B', 'citizen'], 
      default: null 
    },
    
    // Location and budget
    city: { type: String, default: '' },
    budgetRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null }
    },
    housingNeed: { type: String, enum: ['On-campus', 'Off-campus', 'Sublet', 'Undecided'], default: null },
    roommateInterest: { type: Boolean, default: null },
    essentials: [{ 
      type: String, 
      enum: [
        'SIM', 'Bedding', 'Bank', 'Cookware', 'Transit',
        'sim_card', 'banking', 'cookware', 'transportation', 'bedding', 'electronics', 'clothing', 'study_materials'
      ] 
    }],
    focus: { 
      type: [String], 
      enum: ['Housing', 'Roommate', 'Essentials', 'Community', 'Everything'], 
      default: null 
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },

  // Email verification and security
  emailVerified:      { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
  // Onboarding abandonment tracking
  lastOnboardingStep: { type: Number, default: 0 },
  lastOnboardingTime: { type: Date, default: null },
  onboardingAbandonmentEmail1Sent: { type: Boolean, default: false },
  onboardingAbandonmentEmail2Sent: { type: Boolean, default: false },
  
  // OTP for various purposes
  otp:                { type: String, default: null },
  otpExpires:         { type: Date, default: null },
  otpPurpose:         { type: String, enum: ['email_verification', 'password_reset', 'login', 'two_factor'], default: null },
  
  // Password reset
  passwordResetToken: { type: String, default: null },
  passwordResetTokenId: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },

  createdOn: { type: Date, default: Date.now },
});

// --- Synapse (roommate) preferences sub-schema ---
const SynapseSchema = new mongoose.Schema(
  {
    culture: {
      primaryLanguage: { type: String, default: "" },
      otherLanguages: { type: [String], default: [] },
      languageComfort: { type: String, enum: ["either", "same", "learn"], default: "either" },
      home: {
        country:   { type: String, default: "" },
        countryISO:{ type: String, default: "" },
        region:    { type: String, default: "" },
        city:      { type: String, default: "" },
      },
      visibility: {
        showAvatarInPreviews:   { type: Boolean, default: false },
        shareCultureInPreviews: { type: String, enum: ["banded", "details"], default: "banded" },
      },
    },

    logistics: {
      moveInMonth:     { type: String,  default: null }, // "YYYY-MM"
      leaseMonths:     { type: Number,  default: 12 },
      budgetMax:       { type: Number,  default: null },
      maxDistanceMiles:{ type: Number,  default: 2 },
      commuteMode:     { type: [String], default: [] },  // e.g. ["walk","bus"]
    },

    lifestyle: {
      sleepPattern:     { type: String,  default: "" },   // "early_bird" | "flex" | "night_owl"
      quietAfter:       { type: String,  default: "22:00" },
      quietUntil:       { type: String,  default: "07:00" },
      cleanliness:      { type: Number,  default: 3 },
      bathroomUpkeep:   { type: Number,  default: 3 },
      kitchenCleanup:   { type: Number,  default: 3 },
      dishesTurnaround: { type: Number,  default: 3 },
      trashCadence:     { type: Number,  default: 3 },
    },

    habits: {
      diet:        { type: String,  default: "" },        // "veg" | "vegan" | "nonveg"
      cookingFreq: { type: String,  default: "sometimes" },
      smoking:     { type: String,  default: "no" },
      drinking:    { type: String,  default: "social" },
      partying:    { type: String,  default: "occasionally" },
    },

    pets: {
      hasPets:    { type: Boolean, default: false },
      okWithPets: { type: Boolean, default: true },
      allergies:  { type: [String], default: [] },
    },

    matching: {
      roommateGender: { 
        type: String, 
        enum: ["female", "male", "any"], 
        default: "any" 
      },
    },

    dealbreakers: { type: [String], default: [] },
  },
  { _id: false }
);

userSchema.add({
  synapse: { type: SynapseSchema, default: () => ({}) },
});

// Auto-population middleware: Populate synapse from onboardingData
userSchema.pre('save', function(next) {
  // Only auto-populate if onboardingData exists and synapse doesn't have the data yet
  if (this.onboardingData) {
    // Initialize synapse if it doesn't exist
    if (!this.synapse) this.synapse = {};
    
    // Auto-populate synapse.culture.home.city from onboardingData.city
    if (this.onboardingData.city && !this.synapse.culture?.home?.city) {
      if (!this.synapse.culture) this.synapse.culture = {};
      if (!this.synapse.culture.home) this.synapse.culture.home = {};
      this.synapse.culture.home.city = this.onboardingData.city;
    }

    // Auto-populate synapse.logistics.budgetMax from onboardingData.budgetRange.max
    if (this.onboardingData.budgetRange?.max && !this.synapse.logistics?.budgetMax) {
      if (!this.synapse.logistics) this.synapse.logistics = {};
      this.synapse.logistics.budgetMax = this.onboardingData.budgetRange.max;
    }
  }

  next();
});

// Virtual getters for backward compatibility (read-only)
userSchema.virtual('currentLocation').get(function() {
  return this.onboardingData?.city || '';
});

userSchema.virtual('university').get(function() {
  return this.onboardingData?.university || '';
});

userSchema.virtual('major').get(function() {
  return this.onboardingData?.major || '';
});

userSchema.virtual('graduationDate').get(function() {
  return this.onboardingData?.graduationDate || '';
});

userSchema.virtual('birthday').get(function() {
  return this.onboardingData?.birthday || null;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
