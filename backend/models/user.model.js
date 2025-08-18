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

module.exports = mongoose.model('User', userSchema);
