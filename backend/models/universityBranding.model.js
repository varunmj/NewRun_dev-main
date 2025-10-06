const mongoose = require('mongoose');

const UniversityBrandingSchema = new mongoose.Schema({
  universityName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  displayName: { 
    type: String, 
    required: true 
  },
  domain: { 
    type: String, 
    required: true 
  },
  logoUrl: { 
    type: String, 
    default: '' 
  },
  primaryColor: { 
    type: String, 
    required: true,
    default: '#2F64FF' 
  },
  secondaryColor: { 
    type: String, 
    default: '#FFA500' 
  },
  textColor: { 
    type: String, 
    default: '#FFFFFF' 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  fetchCount: { 
    type: Number, 
    default: 1 
  }
}, { timestamps: true });

// Index for faster lookups
UniversityBrandingSchema.index({ universityName: 1 });

module.exports = mongoose.model('UniversityBranding', UniversityBrandingSchema);



