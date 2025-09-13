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
