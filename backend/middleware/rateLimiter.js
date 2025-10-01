const rateLimit = require('express-rate-limit');

// Rate limiting for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: true,
    message: 'Too many login attempts, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful logins
    return false;
  }
});

// Stricter rate limiting for failed attempts
const strictLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: true,
    message: 'Too many failed login attempts, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimit,
  strictLoginRateLimit,
  // Lightweight burst limiter for availability endpoints
  availabilityLimiter: rateLimit({
    windowMs: 30 * 1000, // 30s window
    max: 20,             // up to 20 checks per 30s per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
};

