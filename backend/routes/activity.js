const express = require('express');
const router = express.Router();
const { authenticateToken, getAuthUserId } = require('../utilities');

// Import models
const UserActivity = require('../models/UserActivity.model');
const UserInteraction = require('../models/UserInteraction.model');
const RoommateRequest = require('../models/RoommateRequest.model');
const User = require('../models/user.model');
const Property = require('../models/property.model');
const MarketplaceItem = require('../models/marketplaceItem.model');

// =====================
// User Activity Routes
// =====================

// Track user activity
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const {
      activityType,
      targetType,
      targetId,
      metadata = {},
      location = {}
    } = req.body;

    if (!activityType || !targetType || !targetId) {
      return res.status(400).json({
        error: true,
        message: 'activityType, targetType, and targetId are required'
      });
    }

    // Validate activity type
    const validActivityTypes = ['search', 'view', 'like', 'unlike', 'favorite', 'unfavorite', 'share', 'contact_request'];
    if (!validActivityTypes.includes(activityType)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid activity type'
      });
    }

    // Validate target type
    const validTargetTypes = ['property', 'marketplace_item', 'user', 'conversation', 'thread'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid target type'
      });
    }

    // Create activity record
    const activity = new UserActivity({
      userId,
      activityType,
      targetType,
      targetId,
      metadata: {
        ...metadata,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      },
      location
    });

    await activity.save();

    res.json({
      error: false,
      message: 'Activity tracked successfully',
      activity
    });
  } catch (error) {
    console.error('POST /activity/track error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get user activity history
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    // Users can only view their own activity or admin can view any
    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      activityType,
      targetType,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = req.query;

    const activities = await UserActivity.getUserActivity(targetUserId, {
      activityType,
      targetType,
      startDate,
      endDate,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      error: false,
      activities,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: activities.length
      }
    });
  } catch (error) {
    console.error('GET /activity/user/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get popular items
router.get('/popular/:targetType', async (req, res) => {
  try {
    const { targetType } = req.params;
    const {
      activityType = 'view',
      startDate,
      endDate,
      limit = 20,
      campus,
      university
    } = req.query;

    const popularItems = await UserActivity.getPopularItems(targetType, {
      activityType,
      startDate,
      endDate,
      limit: parseInt(limit),
      campus,
      university
    });

    res.json({
      error: false,
      popularItems
    });
  } catch (error) {
    console.error('GET /activity/popular/:targetType error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get user engagement analytics
router.get('/analytics/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const engagement = await UserActivity.getUserEngagement(targetUserId, {
      startDate,
      endDate,
      groupBy
    });

    res.json({
      error: false,
      engagement
    });
  } catch (error) {
    console.error('GET /activity/analytics/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// =====================
// User Interaction Routes
// =====================

// Track user interaction
router.post('/interaction', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const {
      targetUserId,
      interactionType,
      context = {},
      content = {},
      visibility = 'private'
    } = req.body;

    if (!targetUserId || !interactionType) {
      return res.status(400).json({
        error: true,
        message: 'targetUserId and interactionType are required'
      });
    }

    // Validate interaction type
    const validInteractionTypes = [
      'follow', 'unfollow',
      'message_sent', 'message_received',
      'contact_request_sent', 'contact_request_received',
      'contact_approved', 'contact_denied',
      'roommate_request_sent', 'roommate_request_received',
      'roommate_request_accepted', 'roommate_request_declined',
      'property_inquiry', 'marketplace_inquiry',
      'community_post', 'community_comment', 'community_like',
      'thread_participation', 'thread_creation'
    ];

    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid interaction type'
      });
    }

    // Create interaction record
    const interaction = new UserInteraction({
      userId,
      targetUserId,
      interactionType,
      context,
      content,
      visibility,
      location: {
        campus: req.user?.campusLabel || '',
        university: req.user?.university || ''
      }
    });

    await interaction.save();

    res.json({
      error: false,
      message: 'Interaction tracked successfully',
      interaction
    });
  } catch (error) {
    console.error('POST /activity/interaction error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get user interactions
router.get('/interactions/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      interactionType,
      targetUserId: filterTargetUserId,
      status,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = req.query;

    const interactions = await UserInteraction.getUserInteractions(targetUserId, {
      interactionType,
      targetUserId: filterTargetUserId,
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      skip: parseInt(skip),
      includeTarget: true
    });

    res.json({
      error: false,
      interactions,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: interactions.length
      }
    });
  } catch (error) {
    console.error('GET /activity/interactions/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get interaction statistics
router.get('/interactions/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const stats = await UserInteraction.getInteractionStats(targetUserId, {
      startDate,
      endDate,
      groupBy
    });

    res.json({
      error: false,
      stats
    });
  } catch (error) {
    console.error('GET /activity/interactions/stats/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get most interacted users
router.get('/interactions/most-interacted/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      startDate,
      endDate,
      limit = 20,
      interactionType
    } = req.query;

    const mostInteracted = await UserInteraction.getMostInteractedUsers(targetUserId, {
      startDate,
      endDate,
      limit: parseInt(limit),
      interactionType
    });

    res.json({
      error: false,
      mostInteracted
    });
  } catch (error) {
    console.error('GET /activity/interactions/most-interacted/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// =====================
// Roommate Request Routes
// =====================

// Create roommate request
router.post('/roommate-request', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const {
      targetUserId,
      requestType,
      title,
      description,
      preferences = {},
      communication = {},
      visibility = 'campus_only',
      expiresAt
    } = req.body;

    if (!targetUserId || !requestType || !title || !description) {
      return res.status(400).json({
        error: true,
        message: 'targetUserId, requestType, title, and description are required'
      });
    }

    // Create roommate request
    const roommateRequest = new RoommateRequest({
      requesterId: userId,
      targetUserId,
      requestType,
      title,
      description,
      preferences,
      communication,
      visibility,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      location: {
        campus: req.user?.campusLabel || '',
        university: req.user?.university || ''
      }
    });

    await roommateRequest.save();

    // Track interaction
    const interaction = new UserInteraction({
      userId,
      targetUserId,
      interactionType: 'roommate_request_sent',
      context: {
        roommateRequestId: roommateRequest._id
      },
      content: {
        requestMessage: description
      }
    });
    await interaction.save();

    res.json({
      error: false,
      message: 'Roommate request created successfully',
      roommateRequest
    });
  } catch (error) {
    console.error('POST /activity/roommate-request error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get active roommate requests
router.get('/roommate-requests/active', async (req, res) => {
  try {
    const {
      campus,
      university,
      requestType,
      maxBudget,
      moveInDate,
      limit = 20,
      skip = 0,
      excludeUserId
    } = req.query;

    const requests = await RoommateRequest.getActiveRequests({
      campus,
      university,
      requestType,
      maxBudget: maxBudget ? parseInt(maxBudget) : undefined,
      moveInDate,
      limit: parseInt(limit),
      skip: parseInt(skip),
      excludeUserId
    });

    res.json({
      error: false,
      requests,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: requests.length
      }
    });
  } catch (error) {
    console.error('GET /activity/roommate-requests/active error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get user's roommate requests
router.get('/roommate-requests/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const targetUserId = req.params.userId;

    if (userId !== targetUserId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const {
      status,
      requestType,
      limit = 50,
      skip = 0
    } = req.query;

    const requests = await RoommateRequest.getUserRequests(targetUserId, {
      status,
      requestType,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      error: false,
      requests,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: requests.length
      }
    });
  } catch (error) {
    console.error('GET /activity/roommate-requests/user/:userId error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Respond to roommate request
router.post('/roommate-request/:requestId/respond', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const { requestId } = req.params;
    const { responseType, message, proposedTerms } = req.body;

    if (!responseType) {
      return res.status(400).json({
        error: true,
        message: 'responseType is required'
      });
    }

    const roommateRequest = await RoommateRequest.findById(requestId);
    if (!roommateRequest) {
      return res.status(404).json({
        error: true,
        message: 'Roommate request not found'
      });
    }

    // Add response
    await roommateRequest.addResponse(userId, responseType, message, proposedTerms);

    // Track interaction
    const interaction = new UserInteraction({
      userId,
      targetUserId: roommateRequest.requesterId,
      interactionType: 'roommate_request_received',
      context: {
        roommateRequestId: requestId
      },
      content: {
        requestMessage: message
      }
    });
    await interaction.save();

    res.json({
      error: false,
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('POST /activity/roommate-request/:requestId/respond error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Get roommate request analytics
router.get('/roommate-requests/analytics', async (req, res) => {
  try {
    const {
      campus,
      university,
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const analytics = await RoommateRequest.getRequestAnalytics({
      campus,
      university,
      startDate,
      endDate,
      groupBy
    });

    res.json({
      error: false,
      analytics
    });
  } catch (error) {
    console.error('GET /activity/roommate-requests/analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// =====================
// Community Engagement Routes
// =====================

// Get community engagement
router.get('/community/engagement', async (req, res) => {
  try {
    const {
      campus,
      university,
      startDate,
      endDate,
      limit = 50
    } = req.query;

    const engagement = await UserInteraction.getCommunityEngagement({
      campus,
      university,
      startDate,
      endDate,
      limit: parseInt(limit)
    });

    res.json({
      error: false,
      engagement
    });
  } catch (error) {
    console.error('GET /activity/community/engagement error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

module.exports = router;
