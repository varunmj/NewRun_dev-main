const mongoose = require('mongoose');

const carpoolSchema = new mongoose.Schema({
  driver: {
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
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 5
    },
    phone: String,
    email: String
  },
  route: {
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
    distance: Number, // in miles
    duration: Number // in minutes
  },
  schedule: {
    departure: {
      type: String,
      required: true
    },
    return: String,
    days: [String], // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    isRecurring: {
      type: Boolean,
      default: true
    }
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  capacity: {
    total: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    available: {
      type: Number,
      required: true,
      min: 0
    }
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['offer', 'request'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'full', 'cancelled', 'completed'],
    default: 'active'
  },
  passengers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    phone: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'pending'
    }
  }],
  preferences: {
    smoking: {
      type: Boolean,
      default: false
    },
    music: {
      type: Boolean,
      default: true
    },
    conversation: {
      type: String,
      enum: ['preferred', 'optional', 'quiet'],
      default: 'optional'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
carpoolSchema.index({ 'driver.userId': 1, status: 1 });
carpoolSchema.index({ 'route.from': 1, 'route.to': 1 });
carpoolSchema.index({ type: 1, status: 1 });
carpoolSchema.index({ 'schedule.days': 1 });
carpoolSchema.index({ lastActive: 1 });

// Virtual for formatted cost
carpoolSchema.virtual('formattedCost').get(function() {
  return `$${this.cost.toFixed(2)}`;
});

// Virtual for capacity percentage
carpoolSchema.virtual('capacityPercentage').get(function() {
  return Math.round(((this.capacity.total - this.capacity.available) / this.capacity.total) * 100);
});

// Method to add passenger
carpoolSchema.methods.addPassenger = function(passengerData) {
  if (this.capacity.available <= 0) {
    throw new Error('Carpool is full');
  }
  
  this.passengers.push(passengerData);
  this.capacity.available -= 1;
  
  if (this.capacity.available === 0) {
    this.status = 'full';
  }
  
  return this.save();
};

// Method to remove passenger
carpoolSchema.methods.removePassenger = function(passengerId) {
  this.passengers = this.passengers.filter(p => p.userId.toString() !== passengerId);
  this.capacity.available += 1;
  
  if (this.status === 'full') {
    this.status = 'active';
  }
  
  return this.save();
};

// Method to update last active
carpoolSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Static method to find nearby carpools
carpoolSchema.statics.findNearby = function(from, to, maxDistance = 5) {
  return this.find({
    'route.from': { $regex: from, $options: 'i' },
    'route.to': { $regex: to, $options: 'i' },
    status: 'active',
    'capacity.available': { $gt: 0 }
  });
};

module.exports = mongoose.model('Carpool', carpoolSchema);







