const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../utilities');

/**
 * @route GET /api/notifications
 * @desc Get all notifications for user (contact requests + verification)
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    
    // Get verification notifications
    const verificationNotifications = [];
    
    if (!user.emailVerified) {
      verificationNotifications.push({
        id: 'email_verification',
        type: 'verification',
        title: 'Email Verification Required',
        message: 'Please verify your email address to access all features',
        action: 'Verify Email',
        actionUrl: '/verify-email',
        priority: 'high',
        dismissible: false,
        timestamp: new Date(),
        avatar: '📧'
      });
    }
    
    if (!user.phoneVerified) {
      verificationNotifications.push({
        id: 'phone_verification',
        type: 'verification',
        title: 'Phone Verification Available',
        message: 'Add your phone number for enhanced security',
        action: 'Add Phone',
        actionUrl: '/add-phone',
        priority: 'medium',
        dismissible: true,
        timestamp: new Date(),
        avatar: '📱'
      });
    }

    // TODO: Add your existing contact request notifications here
    // This would integrate with your existing contact request system
    const contactNotifications = []; // Your existing contact request notifications

    // Combine all notifications
    const allNotifications = [...verificationNotifications, ...contactNotifications];
    
    // Sort by priority and timestamp
    allNotifications.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      error: false,
      notifications: allNotifications,
      unreadCount: allNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * @route POST /api/notifications/:id/dismiss
 * @desc Dismiss a notification
 * @access Private
 */
router.post('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.user;

    // Handle verification notification dismissal
    if (id === 'phone_verification') {
      // Mark phone verification as dismissed (you could add a field to user model)
      // For now, we'll just return success
      res.json({
        error: false,
        message: 'Notification dismissed'
      });
    } else {
      res.status(400).json({
        error: true,
        message: 'Cannot dismiss this notification'
      });
    }

  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to dismiss notification'
    });
  }
});

module.exports = router;