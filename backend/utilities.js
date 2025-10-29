// backend/utilities.js
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.sendStatus(401);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret || typeof secret !== 'string' || !secret.length) {
      console.error('ACCESS_TOKEN_SECRET is missing or invalid');
      return res.status(500).json({ error: true, message: 'Server auth misconfiguration' });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = decoded; // keep your existing shape
      next();
    });
  } catch (e) {
    console.error('authenticateToken error:', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
}

// NEW: unify how we read the authed user's id (your JWT sometimes nests under user)
function getAuthUserId(req) {
  if (!req || !req.user) return null;
  const u = req.user;
  // Support both legacy tokens ({ user: {_id} }) and compact tokens ({ id })
  const raw = u?.user?.id || u?.user?._id || u?.id || u?._id || null;
  if (!raw) return null;
  // Always return a string
  try { return typeof raw === 'string' ? raw : String(raw); }
  catch { return null; }
}

// Middleware to require email verification for critical features
async function requireEmailVerified(req, res, next) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required',
        verificationRequired: false
      });
    }

    // Get user from database to check email verification status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        verificationRequired: false
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: true,
        message: 'Please verify your email to access this feature',
        verificationRequired: true,
        email: user.email
      });
    }

    // Email is verified, continue
    next();
  } catch (error) {
    console.error('Error checking email verification:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      verificationRequired: false
    });
  }
}

module.exports = {
  authenticateToken,
  getAuthUserId,
  requireEmailVerified, // ← new middleware
};
