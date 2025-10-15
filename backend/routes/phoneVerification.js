const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const smsService = require('../services/smsService');
const { authenticateToken } = require('../utilities');

/**
 * @route POST /api/phone/send-verification
 * @desc Send SMS verification code to user's phone
 * @access Private (user must be logged in)
 */
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.user?._id || req.user._id;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Validate formatted phone number
    if (!smsService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use format: +1234567890'
      });
    }

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({ 
      phoneNumber: formattedPhone, 
      phoneVerified: true,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already verified by another account'
      });
    }

    // Generate verification code
    const verificationCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with phone number and verification code
    await User.findByIdAndUpdate(userId, {
      phoneNumber: formattedPhone,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpires: expiresAt,
      phoneVerified: false
    });

    // Send SMS
    const smsResult = await smsService.sendVerificationCode(formattedPhone, verificationCode);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: smsResult.error
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      phoneNumber: formattedPhone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1-***-***-$4') // Masked for security
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/phone/verify
 * @desc Verify SMS code and mark phone as verified
 * @access Private (user must be logged in)
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { verificationCode } = req.body;
    const userId = req.user.user?._id || req.user._id;

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if phone verification is in progress
    if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new code.'
      });
    }

    // Check if code has expired
    if (new Date() > user.phoneVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Verify code
    if (user.phoneVerificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Mark phone as verified
    await User.findByIdAndUpdate(userId, {
      phoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpires: null
    });

    // Send welcome SMS
    await smsService.sendWelcomeMessage(user.phoneNumber, user.firstName);

    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      phoneVerified: true
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/phone/resend
 * @desc Resend verification code
 * @access Private (user must be logged in)
 */
router.post('/resend', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user?._id || req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number found. Please add a phone number first.'
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update verification code
    await User.findByIdAndUpdate(userId, {
      phoneVerificationCode: verificationCode,
      phoneVerificationExpires: expiresAt
    });

    // Send SMS
    const smsResult = await smsService.sendVerificationCode(user.phoneNumber, verificationCode);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: smsResult.error
      });
    }

    res.json({
      success: true,
      message: 'Verification code resent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/phone/status
 * @desc Get phone verification status
 * @access Private (user must be logged in)
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user?._id || req.user._id;

    const user = await User.findById(userId).select('phoneNumber phoneVerified phoneVerificationExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      hasPendingVerification: !!(user.phoneVerificationExpires && new Date() < user.phoneVerificationExpires)
    });

  } catch (error) {
    console.error('Get phone status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/phone/verification-status
 * @desc Get comprehensive verification status (email + phone)
 * @access Private (user must be logged in)
 */
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user?._id || req.user._id;
    const verificationStatus = await getUserVerificationStatus(userId);
    
    res.json(verificationStatus);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/phone/check-access
 * @desc Check if user can access a specific feature
 * @access Private (user must be logged in)
 */
router.post('/check-access', authenticateToken, async (req, res) => {
  try {
    const { feature } = req.body;
    const userId = req.user.user?._id || req.user._id;

    if (!feature) {
      return res.status(400).json({
        success: false,
        message: 'Feature name is required'
      });
    }

    const accessResult = await checkFeatureAccess(userId, feature);
    res.json(accessResult);
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;