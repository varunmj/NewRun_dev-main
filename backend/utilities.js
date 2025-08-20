// backend/utilities.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
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
