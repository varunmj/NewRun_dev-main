const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['bus', 'bike', 'car', 'carpool', 'walk', 'transit'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  distance: {
    type: Number, // in miles
    required: true
  },
  cost: {
    type: Number, // in dollars
    default: 0
  },
  frequency: {
    type: String,
    default: 'As needed'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  preferences: {
    avoidHighways: { type: Boolean, default: false },
    avoidTolls: { type: Boolean, default: false },
    preferBike: { type: Boolean, default: false },
    maxWalkDistance: { type: Number, default: 0.5 } // in miles
  },
  schedule: {
    departure: String,
    return: String,
    days: [String] // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  notes: {
    type: String,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
routeSchema.index({ userId: 1, isActive: 1 });
routeSchema.index({ userId: 1, method: 1 });
routeSchema.index({ from: 1, to: 1 });

// Virtual for formatted duration
routeSchema.virtual('formattedDuration').get(function() {
  if (this.duration < 60) {
    return `${this.duration} min`;
  } else {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
});

// Virtual for formatted cost
routeSchema.virtual('formattedCost').get(function() {
  return this.cost === 0 ? 'Free' : `$${this.cost.toFixed(2)}`;
});

// Method to increment usage
routeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('Route', routeSchema);



