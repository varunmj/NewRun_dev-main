const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // required
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },

  // optional login/display
  username:  { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  avatar:    { type: String, default: '' },

  // profile basics
  currentLocation: { type: String, default: '' },
  hometown:        { type: String, default: '' },
  birthday:        { type: Date,   default: null },

  // university
  university:      { type: String, default: '' },
  major:           { type: String, default: '' },
  graduationDate:  { type: String, default: '' }, // e.g. "May 2026"

  // routing / campus extras (used by Properties map)
  schoolDepartment:   { type: String, default: '' }, // e.g. College of Business
  cohortTerm:         { type: String, default: '' }, // e.g. "Spring 2023"
  campusLabel:        { type: String, default: '' }, // your friendly label
  campusPlaceId:      { type: String, default: '' }, // Google Place ID
  campusDisplayName:  { type: String, default: '' }, // e.g. "Barsema Hall"

  // onboarding preferences
  onboardingData: {
    focus: { type: String, enum: ['Housing', 'Roommate', 'Essentials', 'Community', 'Everything'], default: null },
    arrivalDate: { type: Date, default: null },
    city: { type: String, default: '' },
    budgetRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null }
    },
    housingNeed: { type: String, enum: ['On-campus', 'Off-campus', 'Sublet', 'Undecided'], default: null },
    roommateInterest: { type: Boolean, default: null },
    essentials: [{ type: String, enum: ['SIM', 'Bedding', 'Bank', 'Cookware', 'Transit'] }],
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },

  // Email verification and security
  emailVerified:      { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
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

    dealbreakers: { type: [String], default: [] },
  },
  { _id: false }
);

userSchema.add({
  synapse: { type: SynapseSchema, default: () => ({}) },
});


module.exports = mongoose.model('User', userSchema);
