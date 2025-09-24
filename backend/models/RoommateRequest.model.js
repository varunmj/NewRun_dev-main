const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roommateRequestSchema = new Schema({
  // Primary participants
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Request details
  requestType: {
    type: String,
    required: true,
    enum: [
      'roommate_search', // Looking for a roommate
      'roommate_offer',  // Offering to be a roommate
      'mutual_search',   // Both looking for roommates
      'housing_share',  // Sharing existing housing
      'roommate_referral' // Referring someone else
    ]
  },
  
  // Request content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Housing preferences and requirements
  preferences: {
    // Location preferences
    location: {
      campus: String,
      university: String,
      city: String,
      state: String,
      country: String,
      maxDistanceMiles: Number,
      preferredNeighborhoods: [String]
    },
    
    // Budget preferences
    budget: {
      minBudget: Number,
      maxBudget: Number,
      currency: { type: String, default: 'USD' },
      includesUtilities: Boolean,
      flexibleBudget: Boolean
    },
    
    // Move-in preferences
    moveIn: {
      preferredMoveInDate: Date,
      moveInFlexibility: {
        type: String,
        enum: ['exact', 'within_week', 'within_month', 'flexible'],
        default: 'flexible'
      },
      leaseLength: Number, // in months
      leaseType: {
        type: String,
        enum: ['month_to_month', 'fixed_term', 'academic_year', 'flexible'],
        default: 'academic_year'
      }
    },
    
    // Roommate preferences
    roommate: {
      genderPreference: {
        type: String,
        enum: ['any', 'male', 'female', 'non_binary', 'prefer_not_to_say'],
        default: 'any'
      },
      ageRange: {
        min: Number,
        max: Number
      },
      smokingPreference: {
        type: String,
        enum: ['any', 'non_smoker', 'smoker_ok'],
        default: 'any'
      },
      petPreference: {
        type: String,
        enum: ['any', 'no_pets', 'pets_ok'],
        default: 'any'
      },
      lifestyle: {
        quiet: Boolean,
        social: Boolean,
        study_focused: Boolean,
        party_friendly: Boolean
      }
    },
    
    // Property preferences
    property: {
      propertyType: {
        type: [String],
        enum: ['apartment', 'house', 'condo', 'townhouse', 'studio', 'shared_room', 'private_room']
      },
      bedrooms: {
        min: Number,
        max: Number
      },
      bathrooms: {
        min: Number,
        max: Number
      },
      amenities: [String],
      furnished: Boolean,
      parking: Boolean,
      laundry: Boolean,
      internet: Boolean,
      airConditioning: Boolean
    }
  },
  
  // Request status and workflow
  status: {
    type: String,
    enum: [
      'draft',           // Being created
      'active',          // Open for responses
      'pending_review',  // Under review
      'matched',         // Successfully matched
      'expired',         // Expired without match
      'cancelled',       // Cancelled by requester
      'closed'          // Closed by system
    ],
    default: 'draft',
    index: true
  },
  
  // Response handling
  responses: [{
    responderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    responseType: {
      type: String,
      enum: ['interest', 'question', 'counter_offer', 'decline'],
      required: true
    },
    message: String,
    proposedTerms: Schema.Types.Mixed, // Custom terms if counter-offering
    respondedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'ignored'],
      default: 'pending'
    }
  }],
  
  // Matching and compatibility
  matching: {
    compatibilityScore: Number, // 0-100
    matchingFactors: [String], // What made them compatible
    mutualInterests: [String],
    sharedPreferences: [String],
    dealBreakers: [String]
  },
  
  // Communication
  communication: {
    preferredContactMethod: {
      type: String,
      enum: ['message', 'email', 'phone', 'video_call'],
      default: 'message'
    },
    contactInfo: {
      email: String,
      phone: String,
      socialMedia: String
    },
    availability: {
      timezone: String,
      preferredTimes: [String],
      responseTimeExpectation: String
    }
  },
  
  // Privacy and visibility
  visibility: {
    type: String,
    enum: ['public', 'campus_only', 'university_only', 'private'],
    default: 'campus_only'
  },
  
  // Location context
  location: {
    campus: String,
    university: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // Timestamps and expiration
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Analytics and engagement
  analytics: {
    views: { type: Number, default: 0 },
    responses: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    lastViewed: Date,
    lastResponse: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
roommateRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
roommateRequestSchema.index({ targetUserId: 1, status: 1, createdAt: -1 });
roommateRequestSchema.index({ 'location.campus': 1, status: 1, createdAt: -1 });
roommateRequestSchema.index({ 'location.university': 1, status: 1, createdAt: -1 });
roommateRequestSchema.index({ requestType: 1, status: 1, createdAt: -1 });
roommateRequestSchema.index({ 'preferences.budget.maxBudget': 1, status: 1 });
roommateRequestSchema.index({ 'preferences.moveIn.preferredMoveInDate': 1, status: 1 });
roommateRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods for queries and analytics
roommateRequestSchema.statics.getActiveRequests = function(options = {}) {
  const {
    campus,
    university,
    requestType,
    maxBudget,
    moveInDate,
    limit = 20,
    skip = 0,
    excludeUserId
  } = options;
  
  const query = { status: 'active' };
  
  if (campus) query['location.campus'] = campus;
  if (university) query['location.university'] = university;
  if (requestType) query.requestType = requestType;
  if (excludeUserId) query.requesterId = { $ne: excludeUserId };
  
  if (maxBudget) {
    query['preferences.budget.maxBudget'] = { $lte: maxBudget };
  }
  
  if (moveInDate) {
    query['preferences.moveIn.preferredMoveInDate'] = { $gte: new Date(moveInDate) };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('requesterId', 'firstName lastName email university avatar')
    .populate('targetUserId', 'firstName lastName email university avatar')
    .lean();
};

roommateRequestSchema.statics.getUserRequests = function(userId, options = {}) {
  const {
    status,
    requestType,
    limit = 50,
    skip = 0
  } = options;
  
  const query = {
    $or: [
      { requesterId: userId },
      { targetUserId: userId }
    ]
  };
  
  if (status) query.status = status;
  if (requestType) query.requestType = requestType;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('requesterId', 'firstName lastName email university avatar')
    .populate('targetUserId', 'firstName lastName email university avatar')
    .lean();
};

roommateRequestSchema.statics.getMatchingRequests = function(userId, userPreferences, options = {}) {
  const {
    limit = 20,
    minCompatibilityScore = 50
  } = options;
  
  // This would typically involve more complex matching logic
  // For now, we'll do basic filtering based on preferences
  const query = {
    status: 'active',
    requesterId: { $ne: userId }
  };
  
  // Add preference-based filtering
  if (userPreferences.budget?.maxBudget) {
    query['preferences.budget.maxBudget'] = { $lte: userPreferences.budget.maxBudget };
  }
  
  if (userPreferences.location?.campus) {
    query['location.campus'] = userPreferences.location.campus;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('requesterId', 'firstName lastName email university avatar')
    .lean();
};

roommateRequestSchema.statics.getRequestAnalytics = function(options = {}) {
  const {
    campus,
    university,
    startDate,
    endDate,
    groupBy = 'day'
  } = options;
  
  const matchStage = {};
  
  if (campus) matchStage['location.campus'] = campus;
  if (university) matchStage['location.university'] = university;
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00:00', date: '$createdAt' } };
      break;
    case 'day':
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      break;
    case 'week':
      dateFormat = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
      break;
    case 'month':
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      break;
    default:
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: dateFormat,
          requestType: '$requestType',
          status: '$status'
        },
        count: { $sum: 1 },
        totalViews: { $sum: '$analytics.views' },
        totalResponses: { $sum: '$analytics.responses' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        requests: {
          $push: {
            type: '$_id.requestType',
            status: '$_id.status',
            count: '$count',
            views: '$totalViews',
            responses: '$totalResponses'
          }
        },
        totalRequests: { $sum: '$count' },
        totalViews: { $sum: '$totalViews' },
        totalResponses: { $sum: '$totalResponses' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Instance methods
roommateRequestSchema.methods.addResponse = function(responderId, responseType, message, proposedTerms = null) {
  const response = {
    responderId,
    responseType,
    message,
    proposedTerms,
    respondedAt: new Date(),
    status: 'pending'
  };
  
  this.responses.push(response);
  this.analytics.responses += 1;
  this.analytics.lastResponse = new Date();
  
  return this.save();
};

roommateRequestSchema.methods.updateResponseStatus = function(responderId, status) {
  const response = this.responses.id(responderId);
  if (response) {
    response.status = status;
    return this.save();
  }
  throw new Error('Response not found');
};

roommateRequestSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

module.exports = mongoose.model('RoommateRequest', roommateRequestSchema);
