// backend/utilities.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  console.log('🔐 Auth check:', { 
    hasAuthHeader: !!authHeader, 
    hasToken: !!token,
    tokenStart: token ? token.substring(0, 20) + '...' : 'none'
  });
  
  if (!token) {
    console.log('❌ No token found');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    console.log('✅ Token verified, user:', decoded);
    req.user = decoded; // keep your existing shape
    next();
  });
}

// NEW: unify how we read the authed user's id (your JWT sometimes nests under user)
function getAuthUserId(req) {
  return (req.user && (req.user.user?._id || req.user._id)) || null;
}

module.exports = {
  authenticateToken,
  getAuthUserId, // ← make sure this is exported
};
