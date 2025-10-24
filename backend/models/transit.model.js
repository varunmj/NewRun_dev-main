const mongoose = require('mongoose');

const transitSchema = new mongoose.Schema({
  line: {
    type: String,
    required: true,
    trim: true
  },
  route: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['on-time', 'delayed', 'cancelled', 'arrived'],
    default: 'on-time'
  },
  delay: {
    type: Number, // in minutes
    default: 0
  },
  nextArrival: {
    type: String, // "5 min", "2:30 PM"
    required: true
  },
  frequency: {
    type: String, // "Every 15 min"
    required: true
  },
  cost: {
    type: Number,
    default: 2.50
  },
  capacity: {
    current: { type: Number, default: 0 },
    max: { type: Number, default: 50 }
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'charging', 'air_conditioning', 'wheelchair_accessible', 'bike_rack']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  stops: [{
    name: String,
    time: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
transitSchema.index({ line: 1, isActive: 1 });
transitSchema.index({ status: 1 });
transitSchema.index({ lastUpdated: 1 });

// Virtual for capacity percentage
transitSchema.virtual('capacityPercentage').get(function() {
  return Math.round((this.capacity.current / this.capacity.max) * 100);
});

// Virtual for formatted cost
transitSchema.virtual('formattedCost').get(function() {
  return `$${this.cost.toFixed(2)}`;
});

// Method to update status
transitSchema.methods.updateStatus = function(status, delay = 0) {
  this.status = status;
  this.delay = delay;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get active transit
transitSchema.statics.getActiveTransit = function() {
  return this.find({ isActive: true }).sort({ lastUpdated: -1 });
};

module.exports = mongoose.model('Transit', transitSchema);












