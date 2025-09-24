const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userInteractionSchema = new Schema({
  // Primary participants
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Target user (for interactions like following, messaging, etc.)
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Interaction type
  interactionType: {
    type: String,
    required: true,
    enum: [
      'follow', 'unfollow',
      'message_sent', 'message_received',
      'contact_request_sent', 'contact_request_received',
      'contact_approved', 'contact_denied',
      'roommate_request_sent', 'roommate_request_received',
      'roommate_request_accepted', 'roommate_request_declined',
      'property_inquiry', 'marketplace_inquiry',
      'community_post', 'community_comment', 'community_like',
      'thread_participation', 'thread_creation'
    ]
  },
  
  // Context about the interaction
  context: {
    // For message interactions
    conversationId: Schema.Types.ObjectId,
    messageId: Schema.Types.ObjectId,
    
    // For property/marketplace interactions
    propertyId: Schema.Types.ObjectId,
    marketplaceItemId: Schema.Types.ObjectId,
    
    // For community interactions
    postId: Schema.Types.ObjectId,
    commentId: Schema.Types.ObjectId,
    threadId: Schema.Types.ObjectId,
    
    // For roommate interactions
    roommateRequestId: Schema.Types.ObjectId,
    
    // General context
    topic: String,
    category: String,
    tags: [String]
  },
  
  // Interaction content and metadata
  content: {
    // Message content
    messageText: String,
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'gif', 'emoji', 'system']
    },
    
    // Post/comment content
    postTitle: String,
    postContent: String,
    commentText: String,
    
    // Request content
    requestMessage: String,
    requestReason: String,
    
    // Media attachments
    attachments: [{
      type: String,
      url: String,
      filename: String,
      size: Number
    }]
  },
  
  // Interaction status and outcomes
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'ignored', 'expired', 'cancelled'],
    default: 'pending'
  },
  
  // Response information
  response: {
    respondedAt: Date,
    responseMessage: String,
    responseType: {
      type: String,
      enum: ['accept', 'decline', 'ignore', 'counter_offer']
    }
  },
  
  // Privacy and visibility settings
  visibility: {
    type: String,
    enum: ['public', 'friends', 'mutual', 'private'],
    default: 'private'
  },
  
  // Location and context
  location: {
    campus: String,
    university: String,
    city: String,
    state: String,
    country: String
  },
  
  // Engagement metrics
  engagement: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    replies: { type: Number, default: 0 }
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Expiration for temporary interactions
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
userInteractionSchema.index({ userId: 1, interactionType: 1, timestamp: -1 });
userInteractionSchema.index({ targetUserId: 1, interactionType: 1, timestamp: -1 });
userInteractionSchema.index({ userId: 1, targetUserId: 1, timestamp: -1 });
userInteractionSchema.index({ 'context.conversationId': 1, timestamp: -1 });
userInteractionSchema.index({ 'context.propertyId': 1, timestamp: -1 });
userInteractionSchema.index({ 'context.marketplaceItemId': 1, timestamp: -1 });
userInteractionSchema.index({ status: 1, timestamp: -1 });
userInteractionSchema.index({ 'location.campus': 1, timestamp: -1 });
userInteractionSchema.index({ 'location.university': 1, timestamp: -1 });

// Static methods for analytics and queries
userInteractionSchema.statics.getUserInteractions = function(userId, options = {}) {
  const {
    interactionType,
    targetUserId,
    status,
    startDate,
    endDate,
    limit = 50,
    skip = 0,
    includeTarget = false
  } = options;
  
  const query = { userId };
  
  if (interactionType) query.interactionType = interactionType;
  if (targetUserId) query.targetUserId = targetUserId;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  let populateFields = 'userId firstName lastName email university avatar';
  if (includeTarget) {
    populateFields += ' targetUserId';
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName email university avatar')
    .populate('targetUserId', 'firstName lastName email university avatar')
    .lean();
};

userInteractionSchema.statics.getInteractionStats = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    groupBy = 'day'
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
          interactionType: '$interactionType',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        interactions: {
          $push: {
            type: '$_id.interactionType',
            status: '$_id.status',
            count: '$count'
          }
        },
        totalInteractions: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

userInteractionSchema.statics.getMostInteractedUsers = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    limit = 20,
    interactionType
  } = options;
  
  const matchStage = { userId };
  
  if (interactionType) matchStage.interactionType = interactionType;
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$targetUserId',
        interactionCount: { $sum: 1 },
        lastInteraction: { $max: '$timestamp' },
        interactionTypes: { $addToSet: '$interactionType' },
        statusCounts: {
          $push: {
            status: '$status',
            count: 1
          }
        }
      }
    },
    {
      $addFields: {
        uniqueInteractionTypes: { $size: '$interactionTypes' },
        acceptedCount: {
          $size: {
            $filter: {
              input: '$statusCounts',
              cond: { $eq: ['$$this.status', 'accepted'] }
            }
          }
        }
      }
    },
    { $sort: { interactionCount: -1, lastInteraction: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'targetUser',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              university: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        targetUser: { $arrayElemAt: ['$targetUser', 0] }
      }
    }
  ]);
};

userInteractionSchema.statics.getCommunityEngagement = function(options = {}) {
  const {
    campus,
    university,
    startDate,
    endDate,
    limit = 50
  } = options;
  
  const matchStage = {
    interactionType: { $in: ['community_post', 'community_comment', 'community_like'] }
  };
  
  if (campus) matchStage['location.campus'] = campus;
  if (university) matchStage['location.university'] = university;
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          interactionType: '$interactionType',
          campus: '$location.campus',
          university: '$location.university'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
