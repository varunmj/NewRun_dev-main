const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
  source: { type: String, default: 'footer' },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);












