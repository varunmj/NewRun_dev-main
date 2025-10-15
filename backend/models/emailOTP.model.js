const mongoose = require('mongoose');

const emailOTPSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true 
  },
  code: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  lastSentAt: { 
    type: Date, 
    default: Date.now 
  },
  dailyCount: { 
    type: Number, 
    default: 0 
  },
  dayKey: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Compound index for efficient queries
emailOTPSchema.index({ email: 1, dayKey: 1 });

module.exports = mongoose.model('EmailOTP', emailOTPSchema);