const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Activity type and details
  activityType: {
    type: String,
    required: true,
    enum: ['search', 'view', 'like', 'unlike', 'favorite', 'unfavorite', 'share', 'contact_request']
  },
  
  // Target resource information
  targetType: {
    type: String,
    required: true,
    enum: ['property', 'marketplace_item', 'user', 'conversation', 'thread']
  },
  
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Additional context data
  metadata: {
    // For search activities
    searchQuery: String,
    searchFilters: Schema.Types.Mixed,
    searchResults: Number,
    
    // For view activities
    viewDuration: Number, // in seconds
    viewSource: String, // 'search', 'browse', 'direct', 'recommendation'
    
    // For like/favorite activities
    likeReason: String,
    
    // For contact request activities
    requestStatus: String, // 'sent', 'approved', 'denied'
    
    // For share activities
    shareMethod: String, // 'link', 'social', 'email'
    shareTarget: String, // platform or recipient
    
    // General metadata
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    referrer: String
  },
  
  // Location context (if available)
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
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Expiration for temporary activities (optional)
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
userActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });
userActivitySchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, targetType: 1, timestamp: -1 });
userActivitySchema.index({ 'location.campus': 1, timestamp: -1 });
userActivitySchema.index({ 'location.university': 1, timestamp: -1 });

// Static methods for analytics
userActivitySchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    activityType,
    targetType,
    startDate,
    endDate,
    limit = 50,
    skip = 0
  } = options;
  
  const query = { userId };
  
  if (activityType) query.activityType = activityType;
  if (targetType) query.targetType = targetType;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName email university')
    .lean();
};

userActivitySchema.statics.getPopularItems = function(targetType, options = {}) {
  const {
    activityType = 'view',
    startDate,
    endDate,
    limit = 20,
    campus,
    university
  } = options;
  
  const matchStage = {
    activityType,
    targetType
  };
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  if (campus) matchStage['location.campus'] = campus;
  if (university) matchStage['location.university'] = university;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$targetId',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1, lastActivity: -1 } },
    { $limit: limit }
  ]);
};

userActivitySchema.statics.getUserEngagement = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    groupBy = 'day' // 'hour', 'day', 'week', 'month'
  } = options;
  
  const matchStage = { userId };
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00:00', date: '$timestamp' } };
      break;
    case 'day':
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
      break;
    case 'week':
      dateFormat = { $dateToString: { format: '%Y-W%U', date: '$timestamp' } };
      break;
    case 'month':
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$timestamp' } };
      break;
    default:
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: dateFormat,
          activityType: '$activityType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        activities: {
          $push: {
            type: '$_id.activityType',
            count: '$count'
          }
        },
        totalActivities: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
