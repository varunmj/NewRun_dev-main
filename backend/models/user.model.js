const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true }, // Mandatory
  lastName: { type: String, required: true }, // Mandatory
  email: { type: String, required: true, unique: true }, // Login relies on this
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Login relies on this
  currentLocation: { type: String, default: '' }, // New optional field
  hometown: { type: String, default: '' }, // New optional field
  birthday: { type: Date, default: null }, // New optional field
  university: { type: String, default: '' }, // New optional field
  major: { type: String, default: '' }, // New optional field
  graduationDate: { type: String, default: '' }, // New optional field (Month/Year)
  createdOn: { type: Date, default: Date.now }, // Keeps track of user creation
});

module.exports = mongoose.model('User', userSchema);
