require('dotenv').config();

const config = require('./config.json');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const axios = require('axios');
const { authenticateToken, getAuthUserId } = require('./utilities');
const { loginRateLimit, availabilityLimiter } = require('./middleware/rateLimiter');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Helper function to track user activities
async function trackActivity(userId, activityType, targetType, targetId, metadata = {}, location = {}) {
  try {
    if (!userId) return;
    
    const activity = new UserActivity({
      userId,
      activityType,
      targetType,
      targetId,
      metadata,
      location
    });
    
    await activity.save();
  } catch (error) {
    console.error('Error tracking activity:', error);
    // Don't throw error to avoid breaking main functionality
  }
}
const Thread = require('./models/thread.model');




mongoose.connect(config.connectionString);

const User = require('./models/user.model');
const Property = require('./models/property.model');
const MarketplaceItem = require('./models/marketplaceItem.model');
const Message = require('./models/message.model');
const Conversation = require('./models/conversation.model');
const ContactAccessRequest = require('./models/contactAccessRequest.model');
const UserActivity = require('./models/UserActivity.model');
const UserInteraction = require('./models/UserInteraction.model');
const CommunityThread = require('./models/communityThread.model');
const UniversityBranding = require('./models/universityBranding.model');
const Newsletter = require('./models/newsletter.model');
const RoommateRequest = require('./models/RoommateRequest.model');
const { extractHousingCriteria } = require('./services/newrun-llm/newrunLLM');
const emailService = require('./services/emailService');


const app = express();

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, { 
    cors: { origin: '*', methods: ['GET', 'POST'] }
});



app.use(express.json());
app.use(cors({ origin: '*' }));

// Passport configuration
app.use(passport.initialize());

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.emailVerified = true; // Google emails are pre-verified
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      emailVerified: true,
      password: null // No password for Google users
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
  }));
}

// Activity tracking middleware
app.use((req, res, next) => {
  // Track certain activities automatically
  const trackableRoutes = {
    'GET /properties/:id': { activityType: 'view', targetType: 'property' },
    'GET /marketplace/item/:id': { activityType: 'view', targetType: 'marketplace_item' },
    'GET /search-properties': { activityType: 'search', targetType: 'property' },
    'GET /marketplace/items': { activityType: 'search', targetType: 'marketplace_item' }
  };

  const routeKey = `${req.method} ${req.route?.path || req.path}`;
  const trackingInfo = trackableRoutes[routeKey];

  if (trackingInfo && req.user) {
    // Store tracking info in request for later use
    req.trackingInfo = {
      ...trackingInfo,
      targetId: req.params.id,
      metadata: {
        searchQuery: req.query.q || req.query.query,
        searchFilters: req.query,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    };
  }

  next();
});

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// AWS S3 configuration for SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const s3 = new AWS.S3();

// Multer storage for S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    // Adjust based on the access level you need
    key: function (req, file, cb) {
      const filename = Date.now().toString() + "-" + file.originalname;
      cb(null, filename); // File name format
    },
  }),
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

app.get('/', (req, res) => {
  res.json({ data: 'hello' });
});
// ---------------- Community API ----------------
// List threads (simple text search by q)
app.get('/community/threads', async (req, res) => {
  try {
    const { q = '', limit = 20, school = '' } = req.query;
    // Auto-seed if the collection is empty (first run)
    const total = await CommunityThread.countDocuments();
    if (total === 0) {
      const now = Date.now();
      await CommunityThread.insertMany([
        {
          title: 'I just got accepted! How do I apply for an I-20?',
          body: 'I received my admission letter. What docs and timeline are typical for issuing the I-20? Any pitfalls to avoid?',
          tags: ['visa','I-20','international'],
          school: 'NIU', author: '@aryarox', authorName: '@aryarox', votes: 18, solved: true,
          answers: [
            { author: '@admitcoach', authorName: '@admitcoach', body: 'Pay any processing fee, upload passport, bank statement (first year funds), affidavit of support. Issuance usually 1–2 weeks. Avoid name/order mismatches vs passport.' , votes: 12, accepted: true },
            { author: '@intloffice', authorName: '@intloffice', body: 'See the portal immigration checklist. Non‑English bank docs need notarized translations. Prefer PDF to prevent delays.', votes: 7 }
          ]
        },
        {
          title: 'How does my tourist visa affect F-1?',
          body: 'I have a B1/B2 visa. Any impact when applying for F‑1 at the consulate?',
          tags: ['visa','F-1'], school: 'UIC', author: '@hesen', authorName: '@hesen', votes: 12, solved: false,
          answers: [ { author: '@alumni', authorName: '@alumni', body: 'No conflict. Officer checks non‑immigrant intent. Bring ties to home country, admission letter, I‑20, SEVIS fee receipt, funding proofs.', votes: 5 } ]
        },
        {
          title: 'Tips for finding affordable housing near campus?',
          body: 'Looking for <$900 near campus. What neighborhoods and filters do you recommend?',
          tags: ['housing','budget'], school: 'NIU', author: '@yuechen', authorName: '@yuechen', votes: 25, solved: true,
          answers: [ { author: '@campusrealty', authorName: '@campusrealty', body: 'Sort by walking distance (<1.5 mi), use furnished if not buying furniture, set price alerts, and consider roommate boards to split 2BRs.', votes: 11, accepted: true } ]
        }
      ]);
    }

    // Build query with school filter
    const conditions = [];
    
    // Add school filter if specified
    if (school) {
      conditions.push({ school: new RegExp(school, 'i') });
    }
    
    // Add search query if specified
    if (q) {
      conditions.push({
        $or: [
          { title: new RegExp(q, 'i') },
          { body: new RegExp(q, 'i') },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const items = await CommunityThread.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, items });
  } catch (e) {
    console.error('List threads error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get thread
app.get('/community/threads/:id', async (req, res) => {
  try {
    const t = await CommunityThread.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item: t });
  } catch (e) {
    console.error('Get thread error:', e.message, '| ID:', req.params.id);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Create thread
app.post('/community/threads', async (req, res) => {
  try {
    const { title, body = '', tags = [], school = '', author = '', authorName = '', authorId = null } = req.body || {};
    if (!title || title.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Title too short' });
    }
    const t = await CommunityThread.create({ 
      title: title.trim(), 
      body, 
      tags, 
      school, 
      author: authorName || author || '@anonymous',
      authorName: authorName || author || '@anonymous',
      authorId 
    });
    res.json({ success: true, item: t });
  } catch (e) {
    console.error('Create thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add answer
app.post('/community/threads/:id/answers', async (req, res) => {
  try {
    const { body = '', author = '', authorName = '', authorId = null } = req.body || {};
    const t = await CommunityThread.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    t.answers.push({ 
      body, 
      author: authorName || author || '@anonymous',
      authorName: authorName || author || '@anonymous',
      authorId 
    });
    t.answersCount = t.answers.length;
    await t.save();
    res.json({ success: true, item: t });
  } catch (e) {
    console.error('Add answer error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Vote thread
app.post('/community/threads/:id/vote', async (req, res) => {
  try {
    const { delta = 1 } = req.body || {};
    const t = await CommunityThread.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    t.votes += Number(delta);
    await t.save();
    res.json({ success: true, votes: t.votes });
  } catch (e) {
    console.error('Vote thread error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Accept answer
app.post('/community/threads/:id/answers/:answerId/accept', async (req, res) => {
  try {
    const t = await CommunityThread.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    t.answers = t.answers.map(a => ({ ...a.toObject(), accepted: a.id === req.params.answerId }));
    t.solved = true;
    await t.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Accept answer error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});
// ---------------- University Branding API ----------------
// Get or create university branding (with caching)
app.get('/university-branding/:universityName', async (req, res) => {
  try {
    const { universityName } = req.params;
    
    if (!universityName) {
      return res.status(400).json({ error: true, message: 'University name required' });
    }

    // Check if branding exists in cache
    let branding = await UniversityBranding.findOne({ 
      universityName: new RegExp(`^${universityName}$`, 'i') 
    });

    if (branding) {
      // Found in cache - increment fetch count and return
      branding.fetchCount += 1;
      branding.lastUpdated = Date.now();
      await branding.save();
      
      return res.json({
        success: true,
        cached: true,
        branding: {
          name: branding.displayName,
          primary: branding.primaryColor,
          secondary: branding.secondaryColor,
          textColor: branding.textColor,
          logoUrl: branding.logoUrl,
          domain: branding.domain
        }
      });
    }

    // Not in cache - create new entry with smart defaults
    const domain = getDomainFromUniversityName(universityName);
    const logoUrl = domain ? `https://logo.clearbit.com/${domain}?size=128` : '';
    
    // Use full university name as display name
    const displayName = universityName;
    
    // Get color from official university color schemes
    const colors = getOfficialUniversityColors(universityName);

    // Create new branding entry
    const newBranding = await UniversityBranding.create({
      universityName,
      displayName,
      domain: domain || '',
      logoUrl,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      textColor: colors.textColor,
      fetchCount: 1
    });

    return res.json({
      success: true,
      cached: false,
      branding: {
        name: newBranding.displayName,
        primary: newBranding.primaryColor,
        secondary: newBranding.secondaryColor,
        textColor: newBranding.textColor,
        logoUrl: newBranding.logoUrl,
        domain: newBranding.domain
      }
    });

  } catch (error) {
    console.error('University branding error:', error);
    res.status(500).json({ error: true, message: 'Server error' });
  }
});

// Helper: Get domain from university name
function getDomainFromUniversityName(name) {
  const normalized = name.toLowerCase().trim();
  
  const domainMap = {
    'northern illinois university': 'niu.edu',
    'niu': 'niu.edu',
    'university of illinois chicago': 'uic.edu',
    'uic': 'uic.edu',
    'university of illinois at chicago': 'uic.edu',
    'university of illinois': 'illinois.edu',
    'uiuc': 'illinois.edu',
    'northwestern university': 'northwestern.edu',
    'northwestern': 'northwestern.edu',
    'depaul university': 'depaul.edu',
    'depaul': 'depaul.edu',
    'loyola university chicago': 'luc.edu',
    'loyola': 'luc.edu',
    'illinois institute of technology': 'iit.edu',
    'iit': 'iit.edu',
    'university of chicago': 'uchicago.edu',
    'uchicago': 'uchicago.edu',
  };

  if (domainMap[normalized]) {
    return domainMap[normalized];
  }

  // Try to construct domain
  const cleaned = normalized.replace(/university|college|of|the|at/g, '').trim();
  return cleaned.replace(/\s+/g, '') + '.edu';
}

// Helper: Get official university colors
function getOfficialUniversityColors(name) {
  const normalized = name.toLowerCase().trim();
  
  const colorMap = {
    'northern illinois university': { primary: '#BA0C2F', secondary: '#000000', textColor: '#FFFFFF' },
    'niu': { primary: '#BA0C2F', secondary: '#000000', textColor: '#FFFFFF' },
    'university of illinois chicago': { primary: '#001E62', secondary: '#D50032', textColor: '#FFFFFF' },
    'uic': { primary: '#001E62', secondary: '#D50032', textColor: '#FFFFFF' },
    'university of illinois': { primary: '#13294B', secondary: '#E84A27', textColor: '#FFFFFF' },
    'uiuc': { primary: '#13294B', secondary: '#E84A27', textColor: '#FFFFFF' },
    'northwestern university': { primary: '#4E2A84', secondary: '#FFFFFF', textColor: '#FFFFFF' },
    'northwestern': { primary: '#4E2A84', secondary: '#FFFFFF', textColor: '#FFFFFF' },
    'university of chicago': { primary: '#800000', secondary: '#767676', textColor: '#FFFFFF' },
    'uchicago': { primary: '#800000', secondary: '#767676', textColor: '#FFFFFF' },
    'depaul university': { primary: '#004B87', secondary: '#D40000', textColor: '#FFFFFF' },
    'depaul': { primary: '#004B87', secondary: '#D40000', textColor: '#FFFFFF' },
    'loyola university chicago': { primary: '#8B2332', secondary: '#F1BE48', textColor: '#FFFFFF' },
    'loyola': { primary: '#8B2332', secondary: '#F1BE48', textColor: '#FFFFFF' },
    'illinois institute of technology': { primary: '#CC0000', secondary: '#5E6A71', textColor: '#FFFFFF' },
    'iit': { primary: '#CC0000', secondary: '#5E6A71', textColor: '#FFFFFF' },
  };

  // Check for exact match
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default fallback
  return { primary: '#2F64FF', secondary: '#FFA500', textColor: '#FFFFFF' };
}

// Newsletter subscription
app.post('/newsletter', async (req, res) => {
  try {
    let { email, source } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: true, message: 'Email is required' });
    }
    email = String(email).trim().toLowerCase();
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: true, message: 'Invalid email address' });
    }
    const exists = await Newsletter.findOne({ email }).lean();
    if (exists) {
      return res.json({ success: true, message: 'Already subscribed' });
    }
    const sub = new Newsletter({
      email,
      source: source || 'footer',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });
    await sub.save();
    return res.json({ success: true, message: 'Subscribed' });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
});


// =====================
// Socket.IO Integration
// =====================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on('leaveRoom', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left room: ${conversationId}`);
  });

   socket.on('registerUser', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


//Create Account API:
app.post("/create-account", async(req,res)=>{

    let { firstName, lastName, email, password, username, termsConsent } = req.body;

    if (!firstName){
        return res
        .status(400)
        .json({error:true, message:"First name is required"});
    }

    if (!lastName){
        return res
        .status(400)
        .json({error:true, message:"Last name is required"});
    }

    if (!email){
        return res
        .status(400)
        .json({error:true, message:"Email address is required"});
    }

    if (!password){
        return res
        .status(400)
        .json({error:true, message:"Password is required"});
    }

    email = String(email).toLowerCase().trim();
    if (username) username = String(username).toLowerCase().trim();

    if (username) {
      const userByUsername = await User.findOne({ username });
      if (userByUsername) {
      return res.status(400).json({ error: true, message: "Username already taken" });
      }
    }

    const isUser = await User.findOne({email:email});

    if(isUser){
        return res
        .status(400)
        .json({
            error: true,
            message: "User already exist",
        });
    }

    // Hash the password before saving
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword, // Store hashed password
        username,
        termsConsent: {
          accepted: termsConsent?.accepted === true,
          version: termsConsent?.version || '',
          acceptedAt: termsConsent?.acceptedAt ? new Date(termsConsent.acceptedAt) : new Date(),
          ip: req.ip,
          userAgent: req.headers['user-agent'] || ''
        }
    });

    await user.save();

    // Fix JWT expiry - use 24h instead of 25 days
    const accessToken = jwt.sign({user},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '24h',
    });

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Registration Successful",
    });
});

// Live username availability check
app.get('/check-username', availabilityLimiter, async (req, res) => {
  try {
    let { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: true, message: 'username is required' });
    }
    username = String(username).toLowerCase().trim();
    if (username.length < 3) {
      return res.json({ available: false, reason: 'too_short' });
    }
    const exists = await User.findOne({ username }).select('_id').lean();
    return res.json({ available: !exists });
  } catch (err) {
    console.error('check-username error:', err);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
});

// Live email availability check
app.get('/check-email', availabilityLimiter, async (req, res) => {
  try {
    let { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: true, message: 'email is required' });
    }
    email = String(email).toLowerCase().trim();
    // simple email pattern guard
    const isEmail = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
    if (!isEmail) return res.json({ available: true }); // treat non-email (e.g., phone) as available
    const exists = await User.findOne({ email }).select('_id').lean();
    return res.json({ available: !exists });
  } catch (err) {
    console.error('check-email error:', err);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
});

// Google OAuth Routes (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    async (req, res) => {
      try {
        const user = req.user;
        const userData = { user: user };
        const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '24h',
        });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${accessToken}`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`);
      }
    }
  );
} else {
  // Fallback when Google OAuth is not configured
  app.get('/api/auth/google', (req, res) => {
    res.status(503).json({
      error: true,
      message: 'Google OAuth is not configured. Please contact administrator.'
    });
  });
}

//Login API:
// app.post ("/login", async(req,res)=>{
//     const {email,password } = req.body;

//     if(!email){
//         return res
//         .status(400)
//         .json({message: "Email address is required"});
//     }

//     if(!password){
//         return res
//         .status(400)
//         .json({message: "Password is required"});
//     }

//     const userInfo = await User.findOne({email: email});

//     if(!userInfo){
//         return res
//         .status(400)
//         .json({message: "User not found"});
//     }

//     if(userInfo.email == email && userInfo.password == password){
//         const user = {user:userInfo};
//         const accessToken =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
//             expiresIn:"36000m",
//         });

//         return res.json({
//             error: false,
//             message: "Login Successful",
//             email,
//             accessToken,
//         });
//     }else{
//         return res.status(400).json({
//             error: true,
//             message: "Invalid Credentials",
//         });
//     }
// });

app.post('/login', loginRateLimit, async (req, res) => {
  let { identifier, email, password, rememberMe } = req.body;

  console.log('Login attempt:', { identifier, email: email ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });

  if (!identifier && email) identifier = email;

  if (!identifier) {
      return res.status(400).json({ error: true, message: 'Email or username is required' });
    }

  if (!password) {
    return res.status(400).json({ error: true, message: 'Password is required' });
  }

  try {
    // Fetch only the fields needed for login
    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase().trim() }
      : { username: identifier.toLowerCase().trim() };
    const userInfo = await User.findOne(query, 'email username password firstName lastName _id emailVerified failedLoginAttempts lockedUntil');

    console.log('User found:', { 
      found: !!userInfo, 
      email: userInfo?.email, 
      username: userInfo?.username,
      passwordType: userInfo?.password ? (userInfo.password.startsWith('$2') ? 'hashed' : 'plain') : 'none'
    });

    if (!userInfo) {
      return res.status(400).json({ error: true, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (userInfo.lockedUntil && userInfo.lockedUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((userInfo.lockedUntil - Date.now()) / (1000 * 60));
      return res.status(423).json({ 
        error: true, 
        message: `Account locked due to too many failed attempts. Try again in ${lockTimeRemaining} minutes.` 
      });
    }

    // Email verification check (commented out for existing users)
    // TODO: Implement email verification for new signups only
    // if (userInfo.emailVerified === false) {
    //   return res.status(403).json({
    //     error: true,
    //     message: 'Please verify your email address before logging in. Check your inbox for verification link.',
    //   });
    // }

    // Compare password - only support hashed passwords (security requirement)
    let isPasswordValid = false;
    
    // Check if password is properly hashed
    if (userInfo.password.startsWith('$2a$') || userInfo.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt compare
      isPasswordValid = await bcrypt.compare(password, userInfo.password);
    } else {
      // Password is not properly hashed - security risk
      console.error(`User ${userInfo.email} has unhashed password - security risk`);
      return res.status(400).json({
        error: true,
        message: 'Account security issue. Please reset your password.',
      });
    }
    
    if (isPasswordValid) {
      // Reset failed attempts on successful login
      if (userInfo.failedLoginAttempts > 0 || userInfo.lockedUntil) {
        await User.findByIdAndUpdate(userInfo._id, {
          failedLoginAttempts: 0,
          lockedUntil: null
        });
      }

      const user = { user: userInfo };
      // Set token expiry based on rememberMe option
      const tokenExpiry = rememberMe ? '7d' : '24h'; // 7 days if remember me, 24 hours otherwise
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: tokenExpiry,
      });

      return res.json({
        error: false,
        message: 'Login Successful',
        email: userInfo.email,
        identifier,
        accessToken,
        user: userInfo, // Include user data in response
      });
    } else {
      // Handle failed login attempt
      const failedAttempts = (userInfo.failedLoginAttempts || 0) + 1;
      const maxAttempts = 5;
      const lockTime = 30 * 60 * 1000; // 30 minutes

      if (failedAttempts >= maxAttempts) {
        // Lock the account
        await User.findByIdAndUpdate(userInfo._id, {
          failedLoginAttempts: failedAttempts,
          lockedUntil: Date.now() + lockTime
        });
        
        return res.status(423).json({
          error: true,
          message: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
        });
      } else {
        // Update failed attempts
        await User.findByIdAndUpdate(userInfo._id, {
          failedLoginAttempts: failedAttempts
        });
        
        return res.status(400).json({
          error: true,
          message: `Invalid credentials. ${maxAttempts - failedAttempts} attempts remaining.`,
        });
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// Logout API (optional - mainly for logging purposes)
app.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    console.log(`User ${user.email || user.username} logged out`);
    
    // In a more sophisticated setup, you might:
    // 1. Add token to a blacklist
    // 2. Log the logout event
    // 3. Clean up user sessions
    
    res.json({
      error: false,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
  }
});

// ==================== EMAIL ENDPOINTS ====================

// Send OTP for various purposes
app.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpPurpose = purpose;
    await user.save();

    // Send OTP email
    const emailResult = await emailService.sendOTP(email, user.firstName, otp);
    
    if (emailResult.success) {
      res.json({
        error: false,
        message: 'OTP sent successfully',
        purpose: purpose
      });
    } else {
      console.error('Failed to send OTP email:', emailResult.error);
      res.status(500).json({
        error: true,
        message: 'Failed to send OTP email'
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'login' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: true,
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ 
      email, 
      otp, 
      otpPurpose: purpose,
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired OTP'
      });
    }

    // Handle different purposes
    if (purpose === 'email_verification') {
      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      // Clear OTP for email verification
      user.otp = null;
      user.otpExpires = null;
      user.otpPurpose = null;
    }
    // For password reset, keep OTP until password is actually reset

    await user.save();

    res.json({
      error: false,
      message: 'OTP verified successfully',
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Send email verification
app.post('/send-email-verification', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    
    if (user.emailVerified) {
      return res.status(400).json({
        error: true,
        message: 'Email already verified'
      });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Update user with verification token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    const emailResult = await emailService.sendEmailVerification(
      user.email, 
      user.firstName, 
      verificationLink
    );

    if (emailResult.success) {
      res.json({
        error: false,
        message: 'Verification email sent successfully'
      });
    } else {
      console.error('Failed to send verification email:', emailResult.error);
      res.status(500).json({
        error: true,
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    console.error('Error sending email verification:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Verify email with token
app.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: true,
        message: 'Verification token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: true,
        message: 'Email already verified'
      });
    }

    if (user.emailVerificationToken !== token) {
      return res.status(400).json({
        error: true,
        message: 'Invalid verification token'
      });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        error: true,
        message: 'Verification token expired'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName);

    res.json({
      error: false,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Forgot password
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Generate secure random token (NOT JWT)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Create secure reset link with token ID, not the actual token
    const tokenId = crypto.randomBytes(16).toString('hex');
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?tokenId=${tokenId}`;

    // Update user with secure token data
    user.passwordResetToken = resetToken;
    user.passwordResetTokenId = tokenId;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes only
    await user.save();

    // Send reset email
    const emailResult = await emailService.sendPasswordReset(
      user.email, 
      user.firstName, 
      resetLink
    );

    if (emailResult.success) {
      res.json({
        error: false,
        message: 'Password reset email sent successfully'
      });
    } else {
      console.error('Failed to send password reset email:', emailResult.error);
      res.status(500).json({
        error: true,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    console.error('Error sending password reset:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Reset password
app.post('/reset-password', async (req, res) => {
  try {
    const { tokenId, newPassword } = req.body;

    if (!tokenId || !newPassword) {
      return res.status(400).json({
        error: true,
        message: 'Token ID and new password are required'
      });
    }

    // Find user by token ID (secure lookup)
    const user = await User.findOne({ 
      passwordResetTokenId: tokenId,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear all reset tokens
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenId = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      error: false,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Validate reset token ID
app.post('/validate-reset-token', async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        error: true,
        message: 'Token ID is required'
      });
    }

    // Find user by token ID
    const user = await User.findOne({ 
      passwordResetTokenId: tokenId,
      passwordResetExpires: { $gt: new Date() }
    }).select('firstName email');

    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      error: false,
      message: 'Token is valid',
      user: {
        firstName: user.firstName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Reset password with OTP
app.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        error: true,
        message: 'Email, OTP, and new password are required'
      });
    }

    const user = await User.findOne({ 
      email, 
      otp, 
      otpPurpose: 'password_reset',
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired OTP'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    user.otpPurpose = null;
    await user.save();

    res.json({
      error: false,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password with OTP:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Save onboarding data
app.post('/save-onboarding', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    const { onboardingData } = req.body;

    console.log('🔧 SAVE ONBOARDING API CALLED');
    console.log('👤 User ID:', user._id);
    console.log('👤 User email:', user.email);
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📊 Onboarding data:', JSON.stringify(onboardingData, null, 2));
    console.log('📊 Current user.onboardingData before update:', JSON.stringify(user.onboardingData, null, 2));

    if (!onboardingData) {
      console.log('❌ No onboarding data provided');
      return res.status(400).json({
        error: true,
        message: 'Onboarding data is required'
      });
    }

    // Update user with onboarding data
    // Prepare onboarding data for saving
    const onboardingDataToSave = {
      ...onboardingData,
      completed: true,
      completedAt: new Date()
    };

    console.log('💾 Before save - onboardingDataToSave:', JSON.stringify(onboardingDataToSave, null, 2));
    console.log('💾 User document before save:', JSON.stringify(user, null, 2));
    
    // Fetch the user document from database to get the Mongoose document with save() method
    const userDoc = await User.findById(user._id);
    
    if (!userDoc) {
      console.error('❌ User document not found in database');
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Update the user document with onboarding data
    userDoc.onboardingData = onboardingDataToSave;
    if (onboardingData.city) {
      userDoc.currentLocation = onboardingData.city;
    }
    if (onboardingData.university) {
      userDoc.university = onboardingData.university;
    }
    
    const savedUser = await userDoc.save();
    console.log('✅ User saved successfully');
    console.log('💾 After save - userDoc.onboardingData:', JSON.stringify(userDoc.onboardingData, null, 2));
    console.log('💾 Saved user document:', JSON.stringify(savedUser, null, 2));

    // Verify the data was actually saved by fetching from database
    const verifyUser = await User.findById(user._id);
    console.log('🔍 Verification - User from database:', JSON.stringify(verifyUser, null, 2));

    res.json({
      error: false,
      message: 'Onboarding data saved successfully',
      user: {
        id: user._id,
        onboardingData: userDoc.onboardingData
      }
    });
  } catch (error) {
    console.error('❌ Error saving onboarding data:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
      return res.status(400).json({
        error: true,
        message: 'Validation Error',
        details: error.message,
        validationErrors: error.errors
      });
    }
    
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      details: error.message
    });
  }
});

// Get user onboarding data
app.get('/onboarding-data', authenticateToken, async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.user.user?._id || req.user._id;
    console.log('Onboarding data request for user ID:', userId);
    
    if (!userId) {
      return res.status(401).json({
        error: true,
        message: 'User ID not found in token'
      });
    }

    // Fetch full user data from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    console.log('User onboarding data from DB:', user.onboardingData);

    res.json({
      error: false,
      onboardingData: user.onboardingData || {}
    });
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Test endpoint to verify user data structure
app.get('/test-user-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user?._id || req.user._id;
    console.log('Test user data request - JWT token:', JSON.stringify(req.user, null, 2));
    
    // Fetch full user from database
    const user = await User.findById(userId);
    console.log('Test user data request - Full user from DB:', JSON.stringify(user, null, 2));
    
    res.json({
      error: false,
      jwtUser: req.user,
      dbUser: user,
      hasOnboardingData: !!user?.onboardingData,
      onboardingData: user?.onboardingData || {}
    });
  } catch (error) {
    console.error('Error in test-user-data:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Simple test endpoint to check database connection
app.get('/test-db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const sampleUser = await User.findOne();
    
    res.json({
      error: false,
      message: 'Database connection successful',
      userCount: userCount,
      sampleUser: sampleUser ? {
        _id: sampleUser._id,
        firstName: sampleUser.firstName,
        hasOnboardingData: !!sampleUser.onboardingData,
        onboardingData: sampleUser.onboardingData || {}
      } : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: true,
      message: 'Database connection failed',
      details: error.message
    });
  }
});

// Manual test endpoint to save onboarding data
app.post('/test-save-onboarding', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    
    console.log('🧪 TEST SAVE ONBOARDING - Manual test');
    console.log('👤 User ID:', user._id);
    console.log('📊 Current onboarding data:', JSON.stringify(user.onboardingData, null, 2));

    // Set test onboarding data
    user.onboardingData = {
      focus: 'Housing',
      arrivalDate: new Date(),
      city: 'Test City',
      university: 'Test University',
      budgetRange: {
        min: 1000,
        max: 2000
      },
      housingNeed: 'Off-campus',
      roommateInterest: true,
      essentials: ['SIM', 'Bank'],
      completed: true,
      completedAt: new Date()
    };

    console.log('💾 Setting test data:', JSON.stringify(user.onboardingData, null, 2));
    await user.save();
    console.log('✅ Test data saved');

    res.json({
      error: false,
      message: 'Test onboarding data saved successfully',
      user: {
        id: user._id,
        onboardingData: user.onboardingData
      }
    });
  } catch (error) {
    console.error('❌ Error in test save:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Test email service endpoint
app.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email is required for testing'
      });
    }

    console.log('🧪 Testing email service...');
    console.log('📧 Target email:', email);
    console.log('🔧 SMTP Config:', {
      host: process.env.SES_SMTP_HOST,
      port: process.env.SES_SMTP_PORT,
      username: process.env.SES_SMTP_USERNAME ? 'Set' : 'Not Set',
      password: process.env.SES_SMTP_PASSWORD ? 'Set' : 'Not Set'
    });

    // Check if transporter exists
    console.log('📡 Transporter status:', emailService.transporter ? 'Initialized' : 'Not initialized');
    
    // Force reinitialize if needed
    if (!emailService.transporter) {
      console.log('🔄 Forcing transporter initialization...');
      emailService.reinitialize();
    }

    // Test sending a simple OTP email
    const testOTP = '123456';
    const emailResult = await emailService.sendOTP(email, 'Test User', testOTP);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      console.log('📨 Message ID:', emailResult.messageId);
      
      res.json({
        error: false,
        message: 'Email test successful!',
        messageId: emailResult.messageId,
        config: {
          host: process.env.SES_SMTP_HOST,
          port: process.env.SES_SMTP_PORT,
          fromEmail: process.env.FROM_EMAIL
        }
      });
    } else {
      console.error('❌ Email test failed:', emailResult.error);
      
      res.status(500).json({
        error: true,
        message: 'Email test failed',
        errorDetails: emailResult.error,
        config: {
          host: process.env.SES_SMTP_HOST,
          port: process.env.SES_SMTP_PORT,
          fromEmail: process.env.FROM_EMAIL
        }
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      error: true,
      message: 'Email test failed',
      errorDetails: error.message,
      stack: error.stack
    });
  }
});

// Check environment variables endpoint
app.get('/check-env', (req, res) => {
  res.json({
    SES_SMTP_HOST: process.env.SES_SMTP_HOST,
    SES_SMTP_PORT: process.env.SES_SMTP_PORT,
    SES_SMTP_USERNAME: process.env.SES_SMTP_USERNAME ? 'Set' : 'Not Set',
    SES_SMTP_PASSWORD: process.env.SES_SMTP_PASSWORD ? 'Set' : 'Not Set',
    FROM_EMAIL: process.env.FROM_EMAIL,
    FRONTEND_URL: process.env.FRONTEND_URL
  });
});

// Get user API:
// app.get("/get-user", authenticateToken, async (req, res) => {
//     const { user } = req.user;

//     try {
//         const isUser = await User.findOne({ _id: user._id });

//         if (!isUser) {
//             return res.sendStatus(401);
//         }

//         // Send additional fields if needed
//         return res.json({
//             user: {
//                 firstName: isUser.firstName,
//                 lastName: isUser.lastName,
//                 email: isUser.email,
//                 // Add other fields if required
//                 _id: isUser._id,
//                 createdOn: isUser.createdOn,
//             },
//             message: "",
//         });
//     } catch (error) {
//         console.error("Error retrieving user:", error);
//         res.status(500).json({ error: "Failed to fetch user data" });
//     }
// });

// Updated Get User API
app.get("/get-user", authenticateToken, async (req, res) => {
  const payloadUser = req?.user?.user || req?.user; // support both token shapes
  try {
    const isUser = await User.findById(payloadUser._id);
    if (!isUser) return res.sendStatus(401);

    return res.json({
      user: {
        _id: isUser._id,
        firstName: isUser.firstName,
        lastName: isUser.lastName,
        email: isUser.email,
        createdOn: isUser.createdOn,

        currentLocation: isUser.currentLocation,
        hometown: isUser.hometown,
        birthday: isUser.birthday,

        university: isUser.university,
        major: isUser.major,
        graduationDate: isUser.graduationDate,

        // ✨ new fields
        schoolDepartment:  isUser.schoolDepartment,
        cohortTerm:        isUser.cohortTerm,
        campusLabel:       isUser.campusLabel,
        campusPlaceId:     isUser.campusPlaceId,
        campusDisplayName: isUser.campusDisplayName,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Image upload API:
// Route to handle image uploads
// Image Upload Route (using AWS SDK v3)
app.post("/upload-images", upload.array("images", 5), async (req, res) => {
  console.log('Upload images request received');
  console.log('Files:', req.files);
  console.log('Body:', req.body);
  try {
    console.log("Request files:", req.files); // Log incoming files
    const imageUrls = req.files.map((file) => file.location);
    console.log("Uploaded images:", imageUrls); // Log uploaded image URLs

    res.json({
      error: false,
      imageUrls,
    });
  } catch (error) {
    console.error("Error uploading images:", error); // Log the error
    res.status(500).json({
      error: true,
      message: "Failed to upload images",
    });
  }
});

// Add Property API:
app.post('/add-property', authenticateToken, async (req, res) => {
  const {
    title,
    content,                     // keep accepting if you still use it anywhere
    tags,
    price,
    bedrooms,
    bathrooms,
    distanceFromUniversity,
    address,
    availabilityStatus,
    images,
    contactInfo,
    description,
    isFeatured,
  } = req.body;

  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({
      error: true,
      message: 'User not authenticated'
    });
  }

  // ✅ Enhanced validation for required fields
  if (!title || !title.trim()) {
    return res.status(400).json({
      error: true,
      message: 'Property title is required'
    });
  }
  
  if (!address || !address.street || !address.city || !address.state) {
    return res.status(400).json({
      error: true,
      message: 'Complete address (street, city, state) is required'
    });
  }
  
  if (typeof price === 'undefined' || price < 0) {
    return res.status(400).json({
      error: true,
      message: 'Valid price is required'
    });
  }
  
  if (!contactInfo || !contactInfo.name || !contactInfo.phone || !contactInfo.email) {
    return res.status(400).json({
      error: true,
      message: 'Complete contact information (name, phone, email) is required'
    });
  }

  try {
    console.log('Creating property with userId:', userId);
    console.log('Property data:', { title, price, address, contactInfo });
    
    const property = new Property({
      title: title.trim(),
      content: content || '',           // optional
      tags: tags || [],
      price: Number(price) || 0,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      distanceFromUniversity: Number(distanceFromUniversity) || 0,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode ? address.zipCode.trim() : ''
      },
      availabilityStatus: availabilityStatus || 'available',
      images: images || [],             // expects array of URLs (from /upload-images)
      contactInfo: {
        name: contactInfo.name.trim(),
        phone: contactInfo.phone.trim(),
        email: contactInfo.email.trim()
      },
      description: description || '',
      isFeatured: Boolean(isFeatured),
      userId: userId,
      // optional: copy user.university onto the property for future scoping
      // university: user.university || ''
    });

    await property.save();
    return res.json({ error: false, property, message: 'Property added successfully' });
  } catch (error) {
    console.error('POST /add-property error:', error);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// Edit Property API:
// Edit Property API:
app.put('/edit-property/:propertyId', authenticateToken, async (req, res) => {
  const propertyId = req.params.propertyId;
  const {
    title,
    content,
    tags,
    isPinned,
    price,
    bedrooms,
    bathrooms,
    distanceFromUniversity,
    address,
    availabilityStatus,
    images,
    contactInfo,
    description,
    isFeatured,
  } = req.body;
  const { user } = req.user;

  try {
    const property = await Property.findOne({ _id: propertyId, userId: user._id });

    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    if (title) property.title = title;
    if (content) property.content = content;
    if (tags) property.tags = tags;
    if (isPinned !== undefined) property.isPinned = isPinned;
    if (price) property.price = price;
    if (bedrooms) property.bedrooms = bedrooms;
    if (bathrooms) property.bathrooms = bathrooms;
    if (distanceFromUniversity) property.distanceFromUniversity = distanceFromUniversity;
    if (address) property.address = address;
    if (availabilityStatus) property.availabilityStatus = availabilityStatus;
    if (images) property.images = images;
    if (contactInfo) property.contactInfo = contactInfo;
    if (description) property.description = description;
    if (isFeatured !== undefined) property.isFeatured = isFeatured;

    await property.save();
    return res.json({ error: false, property, message: 'Property updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// Get all properties by User:
app.get("/get-all-property-user", authenticateToken, async (req, res) => {
    const { user } = req.user;

    try {
        const properties = await Property.find({ userId: user._id })
            .sort({ isPinned: -1 })
            .populate('userId', 'firstName lastName');  // Populate user info

        return res.json({
            error: false,
            properties,
            message: "All properties retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Get all properties (for all users):
app.get("/get-all-property", async (req, res) => {
  const userId = req.user ? req.user._id : null; // Check if user is authenticated
  try {
      const properties = await Property.find({})
          .sort({ isPinned: -1 })
          .populate('userId', 'firstName lastName');
      
      const propertiesWithLikes = properties.map((property) => ({
          ...property.toObject(),
          likesCount: property.likes.length,
          likedByUser: userId ? property.likes.includes(userId) : false
      }));

      return res.json({
          error: false,
          properties: propertiesWithLikes,
          message: "All properties retrieved successfully",
      });
  } catch (error) {
      console.error("Error retrieving properties:", error);
      return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});




//Delete property API:
app.delete("/delete-property/:propertyId",authenticateToken,async(req,res)=>{
    const propertyId = req.params.propertyId;
    const {user} = req.user;

    try{
        const property = await Property.findOne({ _id: propertyId, userId:user._id
        });

        if(!property){
            return res.status(404).json({error:true,message:"Note not found"});
        }

        await Property.deleteOne({ _id: propertyId, userId:user._id
        });

        return res.json({
            error: false,
            message: "Note deleted successfully"
        });
    } catch(error){
        return res.status(500).json({
            error: true,
            message: "Internal Server Error"
        });
    }
});

//API for // Find the property by ID
app.get("/properties/:id", async (req, res) => {
  const propertyId = req.params.id;
  const userId = req.user ? req.user._id : null;

  try {
      // Find the property by ID
      const property = await Property.findById(propertyId).populate('userId', 'firstName lastName');

      if (!property) {
          return res.status(404).json({ error: true, message: "Property not found" });
      }

      // Track view activity if user is authenticated
      if (userId) {
          await trackActivity(
              userId,
              'view',
              'property',
              propertyId,
              {
                  viewSource: 'direct',
                  ipAddress: req.ip,
                  userAgent: req.get('User-Agent')
              },
              {
                  campus: req.user?.campusLabel || '',
                  university: req.user?.university || ''
              }
          );
      }

      return res.json({
          error: false,
          property,
          message: "Property details retrieved successfully",
      });
  } catch (error) {
      console.error("Error fetching property details:", error); // Log the error
      return res.status(500).json({
          error: true,
          message: "Internal Server Error",
      });
  }
});

//Update isPinned value API:
app.put("/update-property-pinned/:propertyId",authenticateToken,async(req,res)=>{
    const propertyId = req.params.propertyId;
    const {isPinned} = req.body;
    const {user} =req.user;

    try{
        const property = await Property.findOne({_id:propertyId,userId:user._id});

        if(!property){
            return res.status(404).json({error:true,message:"Note not found"});
        }

        property.isPinned = isPinned ;

        await property.save();

        return res.json({
            error: false,
            property,
            message: "Property Updated Succesfully",
        });
    }catch(error){
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Advanced Property Search API with Filters:
app.get("/search-properties", async (req, res) => {
  try {
    const {
      query = '',
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      maxDistance,
      city,
      state,
      availabilityStatus = 'available',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = {
      availabilityStatus: availabilityStatus
    };

    // Text search across multiple fields
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { 'address.street': { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Bedrooms filter
    if (minBedrooms || maxBedrooms) {
      filter.bedrooms = {};
      if (minBedrooms) filter.bedrooms.$gte = Number(minBedrooms);
      if (maxBedrooms) filter.bedrooms.$lte = Number(maxBedrooms);
    }

    // Bathrooms filter
    if (minBathrooms || maxBathrooms) {
      filter.bathrooms = {};
      if (minBathrooms) filter.bathrooms.$gte = Number(minBathrooms);
      if (maxBathrooms) filter.bathrooms.$lte = Number(maxBathrooms);
    }

    // Distance filter
    if (maxDistance) {
      filter.distanceFromUniversity = { $lte: Number(maxDistance) };
    }

    // Location filters
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    
    // Handle createdAt fallback - check for both createdAt and createdOn fields
    if (sortBy === 'createdAt') {
      // Try createdAt first, then createdOn, then _id as fallback
      sort['createdAt'] = sortOrder === 'desc' ? -1 : 1;
      sort['createdOn'] = sortOrder === 'desc' ? -1 : 1;
      sort['_id'] = sortOrder === 'desc' ? -1 : 1; // _id contains timestamp info
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Debug logging
    console.log('Sort parameters:', { sortBy, sortOrder, sort });

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with pagination
    const properties = await Property.find(filter)
      .populate('userId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Ensure createdAt field exists for all properties (fallback to createdOn or _id timestamp)
    const propertiesWithTimestamps = properties.map(property => ({
      ...property,
      createdAt: property.createdAt || property.createdOn || property._id.getTimestamp()
    }));

    // Get total count for pagination
    const totalCount = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Add likes count and liked status for each property
    const userId = req.user ? req.user._id : null;
    const propertiesWithLikes = propertiesWithTimestamps.map((property) => ({
      ...property,
      likesCount: property.likes ? property.likes.length : 0,
      likedByUser: userId ? property.likes?.includes(userId) : false
    }));

    return res.json({
      error: false,
      properties: propertiesWithLikes,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      filters: {
        query,
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        minBedrooms: minBedrooms ? Number(minBedrooms) : null,
        maxBedrooms: maxBedrooms ? Number(maxBedrooms) : null,
        minBathrooms: minBathrooms ? Number(minBathrooms) : null,
        maxBathrooms: maxBathrooms ? Number(maxBathrooms) : null,
        maxDistance: maxDistance ? Number(maxDistance) : null,
        city,
        state,
        availabilityStatus
      },
      message: "Properties retrieved successfully"
    });

  } catch (error) {
    console.error("Search properties error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error"
    });
  }
});

// Toggle Like API
app.put('/property/:propertyId/like', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.user?._id || req.user._id; // compat if you change middleware later
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ error: true, message: 'Property not found' });

    const hasLike = (property.likes || []).some((u) => String(u) === String(userId));

    if (hasLike) {
      property.likes = property.likes.filter((u) => String(u) !== String(userId));
      // Track unlike activity
      await trackActivity(
        userId,
        'unlike',
        'property',
        propertyId,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        {
          campus: req.user?.campusLabel || '',
          university: req.user?.university || ''
        }
      );
    } else {
      property.likes.push(userId);
      // Track like activity
      await trackActivity(
        userId,
        'like',
        'property',
        propertyId,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        {
          campus: req.user?.campusLabel || '',
          university: req.user?.university || ''
        }
      );
    }

    await property.save();
    return res.json({ success: true, likes: property.likes.length, liked: !hasLike });
  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({ error: true, message: 'Error toggling like' });
  }
});

// create / re-send request
// POST /contact-access/request
// POST /contact-access/request
app.post("/contact-access/request", authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.body;
    if (!requesterId) return res.status(401).json({ error: true, message: "Unauthorized" });
    if (!propertyId) return res.status(400).json({ error: true, message: "propertyId is required" });

    const prop = await Property.findById(propertyId).select("userId contactInfo").lean();
    if (!prop) return res.status(404).json({ error: true, message: "Property not found" });
    const ownerId = String(prop.userId);

    // If viewer is the owner, tell the client explicitly
    if (String(ownerId) === String(requesterId)) {
      return res.status(200).json({ success: true, self: true });
    }

    // If there’s already a doc, don’t create another; tell client it’s already pending/approved
    const existing = await ContactAccessRequest.findOne({ propertyId, requesterId }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        already: true,
        pending: existing.status === "pending",
        approved: existing.status === "approved",
      });
    }

    // Create a new pending request
    const doc = await ContactAccessRequest.create({
      propertyId,
      ownerId,
      requesterId,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    io.to(`user:${ownerId}`).emit("contact_request:new", {
      id: String(doc._id),
      propertyId: String(propertyId),
      requesterId: String(requesterId),
      status: doc.status,
      createdAt: doc.createdAt,
    });

    return res.status(201).json({ success: true, pending: true, requestId: doc._id });
  } catch (err) {
    console.error("POST /contact-access/request error:", err);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});


// GET /contact-access/status/:propertyId (for the requester)
app.get('/contact-access/status/:propertyId', authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.params;
    const doc = await ContactAccessRequest.findOne({ propertyId, requesterId }).lean();

    if (!doc) return res.json({ approved: false, pending: false });

    return res.json({
      approved: doc.status === 'approved',
      pending: doc.status === 'pending',
      phone: doc.status === 'approved' ? doc.phone : undefined,
      email: doc.status === 'approved' ? doc.email : undefined,
    });
  } catch (err) {
    console.error('GET /contact-access/status error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// GET /contact-access/inbox?status=pending (for the OWNER)
app.get('/contact-access/inbox', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const status = req.query.status || 'pending';

    const items = await ContactAccessRequest.find({ ownerId, status })
      .sort({ createdAt: -1 })
      .populate('requesterId', 'firstName lastName email')
      .populate('propertyId', 'title price')
      .lean();

    res.json({ items });
  } catch (err) {
    console.error('GET /contact-access/inbox error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /contact-access/approve  (owner action)
app.post('/contact-access/approve', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { requestId } = req.body;
    const reqDoc = await ContactAccessRequest.findOne({ _id: requestId, ownerId });
    if (!reqDoc) return res.status(404).json({ error: true, message: 'Request not found' });

    // snapshot contact at approval time
    const prop = await Property.findById(reqDoc.propertyId).select('contactInfo').lean();
    reqDoc.status = 'approved';
    reqDoc.approvedAt = new Date();
    reqDoc.phone = prop?.contactInfo?.phone || '';
    reqDoc.email = prop?.contactInfo?.email || '';
    await reqDoc.save();

    // notify requester
    io.to(`user:${reqDoc.requesterId}`).emit('contact_request:updated', {
      propertyId: String(reqDoc.propertyId),
      status: 'approved',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /contact-access/approve error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /contact-access/deny (owner action)
app.post('/contact-access/deny', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { requestId } = req.body;
    const reqDoc = await ContactAccessRequest.findOneAndUpdate(
      { _id: requestId, ownerId },
      { $set: { status: 'denied', deniedAt: new Date() } },
      { new: true }
    );
    if (!reqDoc) return res.status(404).json({ error: true, message: 'Request not found' });

    io.to(`user:${reqDoc.requesterId}`).emit('contact_request:updated', {
      propertyId: String(reqDoc.propertyId),
      status: 'denied',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /contact-access/deny error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});




// =====================
// Marketplace Routes
// =====================

// after you initialize io:
app.set('io', io);

// require the router
// const marketplaceRouter = require('./routes/marketplace');
// app.use('/marketplace', marketplaceRouter);

// Activity tracking routes
const activityRouter = require('./routes/activity');
app.use('/activity', activityRouter);

// New Platform Entity Routes
const studentFinanceRouter = require('./routes/studentFinance');
const academicHubRouter = require('./routes/academicHub');
const academicRoutes = require('./routes/academicRoutes');
app.use('/api/finance', studentFinanceRouter);
app.use('/api/academic', academicHubRouter);
app.use('/api/academic', academicRoutes);

// Financial Management Models
const Transaction = require('./models/transaction.model');
const Budget = require('./models/budget.model');
const FinancialReport = require('./models/financialReport.model');

// Create a new marketplace item
app.post("/marketplace/item", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const {
      title,
      description,
      price,
      category,
      condition,
      thumbnailUrl,
      contactInfo,
      images = [],
    } = req.body;
  
    console.log('Creating marketplace item with data:', {
      title,
      description,
      price,
      category,
      condition,
      contactInfo,
      images: images?.length || 0
    });
  
    // Enhanced validation for required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: true,
        message: "Item title is required"
      });
    }
    
    if (!description || !description.trim()) {
      return res.status(400).json({
        error: true,
        message: "Item description is required"
      });
    }
    
    if (!category || !category.trim()) {
      return res.status(400).json({
        error: true,
        message: "Item category is required"
      });
    }
    
    if (typeof price === 'undefined' || price < 0) {
      return res.status(400).json({
        error: true,
        message: "Valid price is required"
      });
    }
    
    if (!contactInfo || !contactInfo.name || !contactInfo.email) {
      return res.status(400).json({
        error: true,
        message: "Contact information (name and email) is required"
      });
    }
  
    try {
      // Map contactInfo to location if provided
      const location = contactInfo?.generalLocation ? {
        city: contactInfo.generalLocation,
        state: contactInfo.generalLocation, // Use general location for both
      } : {};
      
      // Map exchange method to delivery options
      const delivery = {
        pickup: contactInfo?.exchangeMethod === 'public' || contactInfo?.exchangeMethod === 'campus',
        localDelivery: false,
        shipping: contactInfo?.exchangeMethod === 'shipping',
      };
      
      const newItem = new MarketplaceItem({
        userId: user._id,
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        category: category.trim(),
        condition: condition || 'used',
        images: images || [],
        coverIndex: 0,
        location,
        delivery,
        // Store contact info with proper sanitization
        contactInfo: {
          name: contactInfo.name.trim(),
          email: contactInfo.email.trim(),
          phone: contactInfo.phone ? contactInfo.phone.trim() : '',
          exchangeMethod: contactInfo.exchangeMethod || 'public',
        },
      });
  
      await newItem.save();
      
      console.log('Marketplace item created successfully:', newItem._id);
  
      return res.json({
        error: false,
        item: newItem,
        message: "Marketplace item created successfully",
      });
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
        details: error.message
      });
    }
  });
  
  // Get all marketplace items
  function escapeRegExp(s = '') {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/marketplace/items', async (req, res) => {
  try {
    const {
      q = '',
      category = 'all',
      condition = 'any',
      campus = '',
      delivery = '',                  // '' | pickup | localDelivery | shipping
      min, max,                       // backend-style
      minPrice, maxPrice,             // frontend-style
      cursor = '',                    // ISO date string from FE
      limit = '24',
    } = req.query;

    const lim = Math.min(60, Math.max(1, parseInt(limit, 10) || 24));

    // Start lenient (show active; include legacy with no status if you want)
    const filter = {
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    };

    // Search q (title/description)
    if (q) {
      (filter.$and ||= []).push({
        $or: [
          { title:       { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ],
      });
    }

    // Exact (case-insensitive) filters
    if (category && category !== 'all') {
      filter.category = { $regex: `^${escapeRegExp(category)}$`, $options: 'i' };
    }
    if (condition && condition !== 'any') {
      filter.condition = { $regex: `^${escapeRegExp(condition)}$`, $options: 'i' };
    }
    if (campus) {
      filter['location.campus'] = { $regex: `^${escapeRegExp(campus)}$`, $options: 'i' };
    }

    // Delivery booleans (delivery.pickup / delivery.localDelivery / delivery.shipping)
    if (delivery) {
      filter[`delivery.${delivery}`] = true;
    }

    // Price range – accept min/max or minPrice/maxPrice
    const low  = (min ?? minPrice ?? '').toString().trim();
    const high = (max ?? maxPrice ?? '').toString().trim();
    if (low || high) {
      filter.price = {};
      if (low)  filter.price.$gte = Number(low);
      if (high) filter.price.$lte = Number(high);
    }

    // Cursor pagination — FE sends last item's createdAt (ISO) back as cursor
    const sort = { createdAt: -1, _id: -1 };
    if (cursor) {
      const before = new Date(cursor);
      if (!isNaN(before)) {
        (filter.$and ||= []).push({ createdAt: { $lt: before } });
      }
    }

    const items = await MarketplaceItem
      .find(filter)
      .sort(sort)
      .limit(lim)
      .lean();

    const nextCursor = items.length === lim
      ? items[items.length - 1].createdAt
      : null;

    res.json({ items, nextCursor });
  } catch (err) {
    console.error('GET /marketplace/items error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});
  
  // Get details of a single marketplace item
  app.get("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const userId = req.user.user?._id || req.user._id;

    try {
        const item = await MarketplaceItem.findById(itemId)
            .populate('userId', 'firstName lastName email phone'); // Populate user details

        if (!item) {
            return res.status(404).json({ error: true, message: "Item not found" });
        }

        // Track view activity
        await trackActivity(
          userId,
          'view',
          'marketplace_item',
          itemId,
          {
            viewSource: 'direct',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          },
          {
            campus: req.user?.campusLabel || '',
            university: req.user?.university || ''
          }
        );

        return res.json({
            error: false,
            item,
            message: "Marketplace item retrieved successfully",
        });
    } catch (error) {
        console.error("Error retrieving marketplace item:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.post('/marketplace/item/:id/view', async (req, res) => {
  try {
    await MarketplaceItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: false }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /marketplace/item/:id/view error', e);
    res.status(200).json({ ok: false }); // keep FE happy even if it fails
  }
});

app.post('/marketplace/favorites/:id', (req, res) => {
  // TODO: implement real per-user favorites (e.g., User.favoriteItemIds)
  res.json({ favored: true });
});
  
  // Update an existing marketplace item
  app.put("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const { user } = req.user;
    const {
      title,
      description,
      price,
      category,
      condition,
      thumbnailUrl,
      contactInfo,
    } = req.body;
  
    try {
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: user._id });
  
      if (!item) {
        return res.status(404).json({ error: true, message: "Item not found or unauthorized" });
      }
  
      // Update fields if provided
      if (title) item.title = title;
      if (description) item.description = description;
      if (price !== undefined) item.price = price;
      if (category) item.category = category;
      if (condition) item.condition = condition;
      if (thumbnailUrl) item.thumbnailUrl = thumbnailUrl;
      if (contactInfo) item.contactInfo = contactInfo;
  
      await item.save();
  
      return res.json({
        error: false,
        item,
        message: "Marketplace item updated successfully",
      });
    } catch (error) {
      console.error("Error updating marketplace item:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Delete a marketplace item
  app.delete("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const { user } = req.user;
  
    try {
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: user._id });
  
      if (!item) {
        return res.status(404).json({ error: true, message: "Item not found or unauthorized" });
      }
  
      await MarketplaceItem.deleteOne({ _id: itemId });
  
      return res.json({
        error: false,
        message: "Marketplace item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting marketplace item:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Search marketplace items
  app.get("/marketplace/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: true, message: "Search query is required" });
    }
  
    try {
      const items = await MarketplaceItem.find({
        $or: [
          { title: { $regex: new RegExp(query, "i") } },
          { description: { $regex: new RegExp(query, "i") } },
          { category: { $regex: new RegExp(query, "i") } },
        ],
      }).populate('userId', 'firstName lastName');
  
      return res.json({
        error: false,
        items,
        message: "Marketplace items matching the search query retrieved successfully",
      });
    } catch (error) {
      console.error("Error searching marketplace items:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });

  app.get("/marketplace/items-user", authenticateToken, async (req, res) => {
    const { user } = req.user;
  
    try {
      const items = await MarketplaceItem.find({ userId: user._id }); // Fetch items created by the logged-in user
      res.json({
        error: false,
        items,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Error fetching marketplace items",
      });
    }
  });

  // OpenAI proxy endpoint
  app.post('/api/openai', authenticateToken, async (req, res) => {
    const { prompt } = req.body;
  
    // Check if OpenAI API key is configured
    if (!process.env.NEWRUN_APP_OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        message: "Please configure NEWRUN_APP_OPENAI_API_KEY environment variable"
      });
    }
  
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 second timeout
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error in OpenAI request:", error);
      
      if (error.response?.status === 401) {
        return res.status(500).json({ 
          error: "Invalid OpenAI API key",
          message: "Please check your OpenAI API key configuration"
        });
      } else if (error.response?.status === 429) {
        return res.status(500).json({ 
          error: "OpenAI rate limit exceeded",
          message: "Please try again later"
        });
      } else {
        return res.status(500).json({ 
          error: "Failed to fetch data from OpenAI",
          message: error.message
        });
      }
    }
  });

  // AI Service endpoints - temporarily disabled
  // const aiService = require('./services/aiService');
  const PropertyDataTransformer = require('./services/propertyDataTransformer');
  const AIDataValidator = require('./services/aiDataValidator');

  // Generate personalized insights
  app.post('/api/ai/insights', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if OpenAI API key is configured
      if (!process.env.NEWRUN_APP_OPENAI_API_KEY) {
        return res.json({
          success: false,
          insights: [],
          message: "AI features are not available - OpenAI API key not configured"
        });
      }

      const { dashboardData } = req.body;

      // Prepare rich context for AI
      const userContext = {
        profile: {
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          university: user.university,
          major: user.major,
          graduationDate: user.graduationDate,
          currentLocation: user.currentLocation,
          hometown: user.hometown,
          birthday: user.birthday,
          campusLabel: user.campusLabel,
          campusDisplayName: user.campusDisplayName,
          schoolDepartment: user.schoolDepartment,
          cohortTerm: user.cohortTerm,
          emailVerified: user.emailVerified
        },
        onboarding: user.onboardingData,
        synapse: user.synapse || {},
        dashboard: dashboardData,
        timestamp: new Date().toISOString()
      };

      // Create AI prompt for personalized insights
      const systemPrompt = `You are an expert student advisor AI with access to a housing database. 

CRITICAL INSTRUCTION: You MUST use the get_housing_recommendations tool for ANY housing-related insights. Do not provide generic housing advice.

When you see housing needs, budget concerns, or roommate interests, you MUST:
1. Call get_housing_recommendations tool with insightType: "housing" 
2. Use the specific data returned to provide concrete recommendations
3. Reference actual properties, prices, and roommate matches

Do not provide generic advice like "start browsing housing options" - use the tool to get real data first.

Focus on:
- Housing needs and timeline (MUST use tool for specific properties)
- Academic success factors  
- Social integration opportunities
- Financial planning
- Campus life optimization

CRITICAL: Generate insights with DIFFERENT content for title vs message:

Format each insight as:
1. **Title** (action-oriented, 3-5 words) - SHORT and punchy
2. **Message** (detailed explanation, context, and specific data) - DIFFERENT from title
3. **Priority** (HIGH/MEDIUM/LOW based on urgency)
4. **Action** (specific next step)

EXAMPLES:
- Title: "Secure Housing Now"
- Message: "Based on your $300-1000 budget, I found 3 properties within 2 miles of campus. Average price is $350/month. Your arrival date is approaching - secure housing this week to avoid last-minute stress."

- Title: "Schedule Property Visits" 
- Message: "Contact Dheeban Kumar at Stadium View II ($300, 1.5 miles) and Sathya Keshav at Campus Drive ($300, 1 mile). Both are within your budget and close to campus. Schedule visits this week."

NEVER repeat the title in the message. The message should provide ADDITIONAL context, data, and reasoning.

REMEMBER: For housing insights, you MUST call the get_housing_recommendations tool first.`;

      const userPrompt = `Student Profile:
- Name: ${userContext.profile.name}
- Email: ${userContext.profile.email}
- University: ${userContext.profile.university}
- Major: ${userContext.profile.major}
- Graduation Date: ${userContext.profile.graduationDate}
- Current Location: ${userContext.profile.currentLocation}
- Hometown: ${userContext.profile.hometown}
- Birthday: ${userContext.profile.birthday}
- Campus: ${userContext.profile.campusLabel} (${userContext.profile.campusDisplayName})
- School Department: ${userContext.profile.schoolDepartment}
- Cohort Term: ${userContext.profile.cohortTerm}
- Email Verified: ${userContext.profile.emailVerified}

Onboarding Preferences:
- Focus Area: ${userContext.onboarding?.focus || 'Not specified'}
- Arrival Date: ${userContext.onboarding?.arrivalDate || 'Not set'}
- Budget Range: $${userContext.onboarding?.budgetRange?.min || 'Unknown'} - $${userContext.onboarding?.budgetRange?.max || 'Unknown'}
- Housing Need: ${userContext.onboarding?.housingNeed || 'Not specified'}
- Roommate Interest: ${userContext.onboarding?.roommateInterest ? 'Yes' : 'No'}
- Essentials Needed: ${userContext.onboarding?.essentials?.join(', ') || 'None specified'}

Synapse Profile (Compatibility Data):
- Culture: ${JSON.stringify(userContext.synapse?.culture || {})}
- Lifestyle: ${JSON.stringify(userContext.synapse?.lifestyle || {})}
- Habits: ${JSON.stringify(userContext.synapse?.habits || {})}
- Dealbreakers: ${JSON.stringify(userContext.synapse?.dealbreakers || [])}

Current Activity:
- Properties Listed: ${userContext.dashboard?.propertiesCount || 0}
- Marketplace Items: ${userContext.dashboard?.marketplaceCount || 0}
- Total Views: ${userContext.dashboard?.propertiesStats?.totalViews || 0}
- Average Property Price: $${userContext.dashboard?.propertiesStats?.averagePrice || 0}

Progress Status:
- Has housing secured: ${userContext.dashboard?.propertiesCount > 0 ? 'Yes' : 'No'}
- Has roommate connections: ${userContext.onboarding?.roommateInterest ? 'Interested' : 'Not specified'}
- Has essentials planned: ${userContext.onboarding?.essentials?.length > 0 ? 'Yes' : 'No'}
- Email verified: ${userContext.profile.emailVerified ? 'Yes' : 'No'}

This student needs housing help. You MUST use the get_housing_recommendations tool to find specific properties and roommates.

DO NOT provide generic advice like "start browsing housing options" or "contact landlords directly". 

You MUST:
1. Call get_housing_recommendations tool with insightType: "housing"
2. Use the returned data to provide specific property names, prices, and roommate matches
3. Reference actual addresses, distances from campus, and compatibility scores

Provide 3-5 specific, actionable insights that will help this student succeed. Focus on their biggest gaps and most urgent needs.`;

      // Call GPT-4o for insights with function calling
      const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "get_housing_recommendations",
              description: "Get specific housing and roommate recommendations for the student",
              parameters: {
                type: "object",
                properties: {
                  insightType: {
                    type: "string",
                    enum: ["housing", "roommate", "both"],
                    description: "Type of recommendations needed"
                  },
                  userProfile: {
                    type: "object",
                    description: "User profile data for recommendations"
                  }
                },
                required: ["insightType", "userProfile"]
              }
            }
          }
        ],
        tool_choice: "auto"
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const aiMessage = aiResponse?.data?.choices?.[0]?.message;
      const aiContent = aiMessage?.content || '';
      
      let insights = [];
      let specificRecommendations = null;
      
      // Check if AI wants to use tools
      if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
        console.log('🔧 AI wants to use tools:', aiMessage.tool_calls);
        const toolCall = aiMessage.tool_calls[0];
        
        if (toolCall.function.name === 'get_housing_recommendations') {
          try {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            console.log('🔧 Tool arguments:', toolArgs);
            
            // Get specific recommendations from our database
            console.log('🔧 Calling get-recommendations endpoint...');
            const recommendationsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/get-recommendations`, {
              insightType: toolArgs.insightType,
              userProfile: userContext
            }, {
              headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('🔧 Recommendations response:', recommendationsResponse.data);
            specificRecommendations = recommendationsResponse.data;
            
            // Generate insights with specific recommendations
            const enhancedPrompt = `${userPrompt}\n\nBased on the specific recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nProvide insights that reference these specific options.`;
            
            const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: "gpt-4o",
              temperature: 0.7,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: enhancedPrompt }
              ]
            }, {
              headers: {
                Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            });
            
            const enhancedContent = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
            insights = parseAIInsights(enhancedContent, userContext);
            
            // Add specific recommendations to insights
            insights = insights.map(insight => ({
              ...insight,
              hasSpecificRecommendations: true,
              specificRecommendations: specificRecommendations
            }));
            
          } catch (toolError) {
            console.error('Tool execution error:', toolError);
            insights = parseAIInsights(aiContent, userContext);
          }
        }
      } else {
        // AI didn't call tools - force it to use tools for housing insights
        console.log('🔧 AI didn\'t call tools, forcing tool usage for housing...');
        
        try {
          // Force call the recommendations tool
          const recommendationsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/get-recommendations`, {
            insightType: "housing",
            userProfile: userContext
          }, {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          });
          
          specificRecommendations = recommendationsResponse.data;
          console.log('🔧 Forced recommendations response:', specificRecommendations);
          
          // Generate insights with specific recommendations
          const enhancedPrompt = `${userPrompt}\n\nBased on the specific recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nProvide insights that reference these specific options.`;
          
          const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: enhancedPrompt }
            ]
          }, {
            headers: {
              Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          
          const enhancedContent = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
          insights = parseAIInsights(enhancedContent, userContext);
          
          // Add specific recommendations to insights
          insights = insights.map(insight => ({
            ...insight,
            hasSpecificRecommendations: true,
            specificRecommendations: specificRecommendations
          }));
          
        } catch (forceError) {
          console.error('Force tool usage error:', forceError);
          insights = parseAIInsights(aiContent, userContext);
        }
      }
      
      // Validate and fix any duplicate content
      const validatedInsights = AIDataValidator.validateInsights(insights);
      
      res.json({ 
        success: true, 
        insights: validatedInsights, 
        aiGenerated: true,
        specificRecommendations 
      });
    } catch (error) {
      console.error('AI Insights Error:', error);
      
      // Fallback insights based on user data
      const fallbackInsights = generateFallbackInsights(user, dashboardData);
      res.json({ success: true, insights: fallbackInsights, fallback: true });
    }
  });

  // Generate personalized actions
  app.post('/api/ai/actions', authenticateToken, async (req, res) => {
      const userId = getAuthUserId(req);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

    try {

      // Prepare rich context for AI
      const userContext = {
        profile: {
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          university: user.university,
          major: user.major,
          graduationDate: user.graduationDate,
          currentLocation: user.currentLocation,
          hometown: user.hometown,
          birthday: user.birthday,
          campusLabel: user.campusLabel,
          campusDisplayName: user.campusDisplayName,
          schoolDepartment: user.schoolDepartment,
          cohortTerm: user.cohortTerm,
          emailVerified: user.emailVerified
        },
        onboarding: user.onboardingData,
        synapse: user.synapse || {},
        dashboard: req.body.dashboardData,
        timestamp: new Date().toISOString()
      };

      // Create AI prompt for personalized actions
      const systemPrompt = `You are an expert student advisor AI. Based on the student's profile and current situation, provide 4-6 personalized, actionable next steps that will help them succeed.

CRITICAL: Generate actions with DIFFERENT content for label vs description:

Format each action as:
1. **Label** (action name, 2-4 words) - SHORT and clear
2. **Description** (detailed explanation, context, and specific steps) - DIFFERENT from label
3. **Priority** (HIGH/MEDIUM/LOW based on urgency)
4. **Path** (specific route or action to take)

EXAMPLES:
- Label: "Schedule Property Visits"
- Description: "Contact the 3 properties I found within your budget. Call Dheeban Kumar at Stadium View II ($300, 1.5 miles) and Sathya Keshav at Campus Drive ($300, 1 mile). Schedule visits this week to secure housing before your arrival date."

- Label: "Complete Onboarding"
- Description: "Finish your profile setup to get personalized recommendations. Add your budget range, arrival date, and housing preferences to unlock AI-powered property matches and roommate suggestions."

NEVER repeat the label in the description. The description should provide ADDITIONAL context, specific steps, and reasoning.

Focus on:
- Immediate priorities based on their timeline
- Their focus area (Housing, Roommate, Essentials, Community)
- Current activity and engagement level
- University-specific opportunities

Be specific, actionable, and prioritize based on urgency and importance.`;

      const userPrompt = `Student Profile:
- Name: ${userContext.profile.name}
- Email: ${userContext.profile.email}
- University: ${userContext.profile.university}
- Major: ${userContext.profile.major}
- Graduation Date: ${userContext.profile.graduationDate}
- Current Location: ${userContext.profile.currentLocation}
- Hometown: ${userContext.profile.hometown}
- Campus: ${userContext.profile.campusLabel} (${userContext.profile.campusDisplayName})
- School Department: ${userContext.profile.schoolDepartment}
- Email Verified: ${userContext.profile.emailVerified}

Onboarding Preferences:
- Focus Area: ${userContext.onboarding?.focus || 'Not specified'}
- Arrival Date: ${userContext.onboarding?.arrivalDate || 'Not set'}
- Budget Range: $${userContext.onboarding?.budgetRange?.min || 'Unknown'} - $${userContext.onboarding?.budgetRange?.max || 'Unknown'}
- Housing Need: ${userContext.onboarding?.housingNeed || 'Not specified'}
- Roommate Interest: ${userContext.onboarding?.roommateInterest ? 'Yes' : 'No'}
- Essentials Needed: ${userContext.onboarding?.essentials?.join(', ') || 'None specified'}

Synapse Profile (Compatibility Data):
- Culture: ${JSON.stringify(userContext.synapse?.culture || {})}
- Lifestyle: ${JSON.stringify(userContext.synapse?.lifestyle || {})}
- Habits: ${JSON.stringify(userContext.synapse?.habits || {})}
- Dealbreakers: ${JSON.stringify(userContext.synapse?.dealbreakers || [])}

Current Activity:
- Properties Listed: ${userContext.dashboard?.propertiesCount || 0}
- Marketplace Items: ${userContext.dashboard?.marketplaceCount || 0}
- Total Views: ${userContext.dashboard?.propertiesStats?.totalViews || 0}
- Average Property Price: $${userContext.dashboard?.propertiesStats?.averagePrice || 0}

Progress Status:
- Has housing secured: ${userContext.dashboard?.propertiesCount > 0 ? 'Yes' : 'No'}
- Has roommate connections: ${userContext.onboarding?.roommateInterest ? 'Interested' : 'Not specified'}
- Has essentials planned: ${userContext.onboarding?.essentials?.length > 0 ? 'Yes' : 'No'}
- Email verified: ${userContext.profile.emailVerified ? 'Yes' : 'No'}

Provide 4-6 specific, actionable next steps prioritized by importance and urgency. Consider their academic timeline, personal preferences, and current progress.`;

      // Call GPT-5 for actions
      const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const aiContent = aiResponse?.data?.choices?.[0]?.message?.content || '';
      
      // Parse AI response into structured actions
      const rawActions = parseAIActions(aiContent, userContext);
      
      // Validate and fix any duplicate content
      const validatedActions = AIDataValidator.validateActions(rawActions);
      
      res.json({ success: true, actions: validatedActions, aiGenerated: true });
    } catch (error) {
      console.error('AI Actions Error:', error);
      
      // Fallback actions based on user data
      const fallbackActions = generateFallbackActions(user);
      res.json({ success: true, actions: fallbackActions, fallback: true });
    }
  });

  // Extract housing criteria
  app.post('/api/ai/extract-criteria', authenticateToken, async (req, res) => {
    try {
      const { prompt, campus } = req.body;
      
      // Use the existing LLM service for criteria extraction
      const { extractHousingCriteria } = require('./services/newrun-llm/newrunLLM');
      const result = await extractHousingCriteria({ prompt, campus });
      
      if (result.ok) {
        res.json({ success: true, criteria: result.data, aiGenerated: true });
      } else {
        // Fallback to basic extraction
        const fallbackCriteria = {
          maxPrice: null,
          bedrooms: null,
          bathrooms: null,
          distanceMiles: null,
          moveIn: null,
          keywords: prompt.split(' ').slice(0, 5)
        };
        res.json({ success: true, criteria: fallbackCriteria, fallback: true });
      }
    } catch (error) {
      console.error('AI Extract Criteria Error:', error);
      res.status(500).json({ 
        error: 'Failed to extract criteria',
        fallback: true 
      });
    }
  });

  // Generate conversational response
  app.post('/api/ai/chat', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { message, context } = req.body;

      // Prepare context for AI
      const userContext = {
        profile: {
          name: user.firstName + ' ' + user.lastName,
          university: user.university,
          major: user.major,
          currentLocation: user.currentLocation
        },
        onboarding: user.onboardingData,
        context: context || {}
      };

      // Create AI prompt for conversational response
      const systemPrompt = `You are NewRun, an AI assistant for students transitioning to university life. You help with housing, roommates, essentials, and campus community.

Be helpful, empathetic, and specific to their situation. Focus on practical advice for university students.`;

      const userPrompt = `Student: ${userContext.profile.name}
University: ${userContext.profile.university}
Major: ${userContext.profile.major}
Current Location: ${userContext.profile.currentLocation}
Focus Area: ${userContext.onboarding?.focus || 'Not specified'}

Student Message: ${message}

Provide a helpful, personalized response.`;

      // Call GPT-5 for conversational response
      const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const response = aiResponse?.data?.choices?.[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request right now.';
      
      res.json({ success: true, response, aiGenerated: true });
    } catch (error) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate response',
        fallback: true 
      });
    }
  });

  // Update user data API
  app.patch('/user/update', authenticateToken, async (req, res) => {
  const authed = req.user?.user || req.user;
  if (!authed?._id) return res.sendStatus(401);

  // Whitelist fields you allow to update
  const {
    firstName, lastName, username, avatar,
    currentLocation, hometown, birthday,
    university, major, graduationDate,
    schoolDepartment, cohortTerm,
    campusLabel, campusPlaceId, campusDisplayName,
  } = req.body || {};

  // Build $set only with provided fields (avoid clobbering with undefined)
  const $set = {};
  const put = (k, v) => { if (typeof v !== 'undefined') $set[k] = v; };

  put('firstName', firstName);
  put('lastName',  lastName);
  put('username',  username);
  put('avatar',    avatar);

  put('currentLocation', currentLocation);
  put('hometown',        hometown);
  // normalize birthday if present (accepts "", null, or ISO/string)
  if (typeof birthday !== 'undefined') {
    if (!birthday) {
      $set['birthday'] = null;
    } else {
      const d = new Date(birthday);
      if (!isNaN(d)) $set['birthday'] = d;
    }
  }

  put('university',     university);
  put('major',          major);
  put('graduationDate', graduationDate);

  put('schoolDepartment',  schoolDepartment);
  put('cohortTerm',        cohortTerm);        // e.g. "Fall 2025"
  put('campusLabel',       campusLabel);
  put('campusPlaceId',     campusPlaceId);     // from Places
  put('campusDisplayName', campusDisplayName); // human-readable

  try {
    const updated = await User.findByIdAndUpdate(
      authed._id,
      { $set },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // mirror /get-user shape
    return res.json({
      success: true,
      user: {
        _id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        username: updated.username || '',
        avatar: updated.avatar || '',

        currentLocation: updated.currentLocation || '',
        hometown: updated.hometown || '',
        birthday: updated.birthday || null,

        university: updated.university || '',
        major: updated.major || '',
        graduationDate: updated.graduationDate || '',

        schoolDepartment: updated.schoolDepartment || '',
        cohortTerm: updated.cohortTerm || '',
        campusLabel: updated.campusLabel || '',
        campusPlaceId: updated.campusPlaceId || '',
        campusDisplayName: updated.campusDisplayName || '',

        createdOn: updated.createdOn || null,
      }
    });
  } catch (err) {
    console.error('PATCH /user/update error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- allow PATCHing only safe, known fields ---
const ALLOWED_USER_FIELDS = [
  'firstName','lastName','currentLocation','hometown','birthday',
  'university','major','graduationDate',
  'schoolDepartment','cohortTerm','campusLabel','campusPlaceId','campusDisplayName'
];

function buildUserUpdate(body = {}) {
  const doc = {};
  for (const k of ALLOWED_USER_FIELDS) {
    if (typeof body[k] !== 'undefined' && body[k] !== null) {
      doc[k] = (k === 'birthday' && body[k]) ? new Date(body[k]) : body[k];
    }
  }
  // fallback: if client sent season+year instead of cohortTerm
  if (!doc.cohortTerm && body.cohortSeason && body.cohortYear) {
    doc.cohortTerm = `${body.cohortSeason} ${body.cohortYear}`;
  }
  return doc;
}

async function updateUserHandler(req, res) {
  try {
    const userId = req?.user?.user?._id || req?.user?._id;  // supports both payload shapes
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const updateDoc = buildUserUpdate(req.body);
    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields to update' });
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateDoc }, { new: true });
    if (!updated) return res.status(404).json({ error: true, message: 'User not found' });

    return res.json({ error: false, user: updated });
  } catch (err) {
    console.error('update user error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
}

// Keep your original route AND add aliases used by the frontend
app.patch('/user/update', authenticateToken, updateUserHandler);   // existing canonical
app.patch('/update-user', authenticateToken, updateUserHandler);   // alias for old FE
app.patch('/update-profile', authenticateToken, updateUserHandler);// alias for old FE


  

  // =====================
  // Messaging and Conversation Routes
  // =====================

  // Initiate a conversation if it doesn't exist
  app.post('/conversations/initiate', authenticateToken, async (req, res) => {
    const { receiverId } = req.body; // Only pass receiverId from the frontend
    const senderId = req.user.user._id; // Get the sender (current user) from the token

    try {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
        });
        await conversation.save();
      }
      
      res.status(200).json({ success: true, conversationId: conversation._id });
    } catch (error) {
      console.error("Error initiating conversation:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send a message in a conversation
  app.post('/messages/send', authenticateToken, async (req, res) => {
    console.log("Authenticated User:", req.user); // Debugging line
    const { conversationId, content, attachments, gif, emoji } = req.body;
    const senderId = req.user.user._id; // Current user from the token
  
    try {
      console.log("Request to send message with conversationId:", conversationId);
      
      const conversation = await Conversation.findById(conversationId);
  
      if (!conversation) {
        console.error(`Conversation with ID ${conversationId} not found.`);
        return res.status(403).json({ success: false, message: 'Conversation not found or unauthorized access' });
      }
      
      if (!conversation.participants.includes(senderId)) {
        console.error(`User ${senderId} is not a participant of conversation ${conversationId}.`);
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      const receiverId = conversation.participants.find(id => id.toString() !== senderId.toString());
  
      const newMessage = new Message({
        conversationId,
        senderId,
        receiverId,
        content,
        attachments,
        gif,
        emoji,
      });
  
      await newMessage.save();
  
      conversation.lastMessage = newMessage._id;
      conversation.lastUpdated = Date.now();
      await conversation.save();
  
      io.to(conversationId).emit('newMessage', {
        conversationId,
        message: newMessage,
      });
  
      res.status(200).json({ success: true, message: 'Message sent!', data: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  // Get all conversations of a user
  app.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user.user._id;

    try {
      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate({
          path: 'participants',
          select: 'firstName lastName', // Populate participant names
        })
        .populate({
          path: 'lastMessage',
          select: 'content timestamp senderId',
          populate: {
            path: 'senderId', // Populate sender's name in the last message
            select: 'firstName lastName',
          },
        })
        .sort({ lastUpdated: -1 });

      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all messages of a specific conversation
  app.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.user._id;

    try {
      const conversation = await Conversation.findById(conversationId);

      // Check if the current user is a participant in the conversation
      if (!conversation || !conversation.participants.includes(userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }

      const messages = await Message.find({
        conversationId,
      })
        .populate({
          path: 'senderId',
          select: 'firstName lastName', // Populate sender names in each message
        })
        .sort({ timestamp: 1 }); // Sort messages by timestamp (earliest first)

      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint to get the count of unread messages
  app.get('/messages/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.user._id;
    try {
      const unreadCount = await Message.countDocuments({
        receiverId: userId,
        isRead: false
      });
      res.status(200).json({ success: true, count: unreadCount });
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread message count' });
    }
  });

// =====================
// Dashboard Overview (NEW)
// =====================
  app.get('/dashboard/overview', authenticateToken, async (req, res) => {
    try {
      const authed = req.user?.user || req.user;
      const userId = authed?._id;
      
      console.log('Dashboard API called for user:', userId);
      console.log('Authenticated user:', authed);
      
      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({ error: true, message: 'User not authenticated' });
      }
      
      // Ensure userId is properly converted to ObjectId
      const mongoose = require('mongoose');
      const userObjectId = new mongoose.Types.ObjectId(userId);
      console.log('Using ObjectId:', userObjectId);


      // Get comprehensive dashboard data
      const [
        // User's properties with stats
        userProperties,
        userPropertiesStats,
        
        // User's marketplace items with stats
        userMarketplaceItems,
        userMarketplaceStats,
        
        // Recent community interactions
        recentInteractions,
        
        // Solve thread history
        solveThreads,
        
        // Recent searches
        recentSearches,
        
        // Likes given/received
        likesGiven,
        likesReceived,
        
        // Roommate requests
        roommateRequestsSent,
        roommateRequestsReceived,
        
        // Recent conversations
        conversations
      ] = await Promise.all([
        // User's properties (latest 6)
        Property.find({ userId: userId }).sort({ createdAt: -1 }).limit(6).lean(),
        
        // Properties statistics
        Property.aggregate([
          { $match: { userId: userId } },
          {
            $group: {
              _id: null,
              totalProperties: { $sum: 1 },
              totalViews: { $sum: { $size: '$likes' } },
              averagePrice: { $avg: '$price' },
              availableProperties: {
                $sum: { $cond: [{ $eq: ['$availabilityStatus', 'available'] }, 1, 0] }
              },
              rentedProperties: {
                $sum: { $cond: [{ $eq: ['$availabilityStatus', 'rented'] }, 1, 0] }
              }
            }
          }
        ]),
        
        // User's marketplace items (latest 6)
        MarketplaceItem.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(6).lean(),
        
        // Marketplace statistics
        MarketplaceItem.aggregate([
          { $match: { userId: userObjectId } },
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              totalViews: { $sum: '$views' },
              totalFavorites: { $sum: '$favorites' },
              averagePrice: { $avg: '$price' },
              activeItems: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
              },
              soldItems: {
                $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
              },
              reservedItems: {
                $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
              }
            }
          }
        ]),
        
        // Recent community interactions (last 7 days)
        UserInteraction.find({
          userId: userObjectId,
          interactionType: { $in: ['community_post', 'community_comment', 'community_like'] },
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('targetUserId', 'firstName lastName avatar')
        .lean(),
        
        // Solve thread history (latest 5)
        Thread.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
        
        // Recent searches (last 7 days)
        UserActivity.find({
          userId: userObjectId,
          activityType: 'search',
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
        
        // Likes given by user
        UserActivity.find({
          userId: userObjectId,
          activityType: 'like',
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
        
        // Likes received by user (on their properties/items) - will be handled separately
        Promise.resolve([]),
        
        // Roommate requests sent by user
        RoommateRequest.find({ requesterId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('targetUserId', 'firstName lastName avatar university')
        .lean(),
        
        // Roommate requests received by user
        RoommateRequest.find({ targetUserId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('requesterId', 'firstName lastName avatar university')
        .lean(),
        
        // Recent conversations
        Conversation.find({ participants: userObjectId })
          .sort({ lastUpdated: -1 })
          .limit(3)
          .populate({
            path: 'lastMessage',
            select: 'content timestamp senderId',
            populate: { path: 'senderId', select: 'firstName lastName' }
          })
          .lean(),
      ]);

      // Get likes received by user (on their properties/items)
      const userPropertyIds = await Property.find({ userId: userId }).distinct('_id');
      const userMarketplaceIds = await MarketplaceItem.find({ userId: userObjectId }).distinct('_id');
      const likesReceivedData = await UserActivity.find({
        targetId: { $in: [...userPropertyIds, ...userMarketplaceIds] },
        activityType: 'like',
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

      // Process statistics with better error handling
      const propertiesStats = userPropertiesStats && userPropertiesStats.length > 0 ? userPropertiesStats[0] : {
        totalProperties: 0,
        totalViews: 0,
        averagePrice: 0,
        availableProperties: 0,
        rentedProperties: 0
      };

      const marketplaceStats = userMarketplaceStats && userMarketplaceStats.length > 0 ? userMarketplaceStats[0] : {
        totalItems: 0,
        totalViews: 0,
        totalFavorites: 0,
        averagePrice: 0,
        activeItems: 0,
        soldItems: 0,
        reservedItems: 0
      };
      
      console.log('Properties found:', userProperties.length);
      console.log('Properties stats:', propertiesStats);
      console.log('Marketplace items found:', userMarketplaceItems.length);
      console.log('Marketplace stats:', marketplaceStats);

      // Calculate engagement metrics with null checks
      const totalEngagement = (recentInteractions?.length || 0) + (recentSearches?.length || 0);
      const likesGivenCount = likesGiven?.length || 0;
      const likesReceivedCount = likesReceivedData?.length || 0;

      // Simple needs-attention rules on properties
      const needsAttention = [];
      for (const p of userProperties) {
        if (!p.images || p.images.length === 0)
          needsAttention.push({ type: 'missingImages', targetType: 'property', targetId: String(p._id), label: `Add images to "${p.title}"` });
        if (!p.description || !p.description.trim())
          needsAttention.push({ type: 'missingDescription', targetType: 'property', targetId: String(p._id), label: `Add description to "${p.title}"` });
        // Fix: Handle address as both string and object
        const addressStr = typeof p.address === 'string' ? p.address : (p.address?.street || p.address?.full || '');
        if (!addressStr || !addressStr.trim())
          needsAttention.push({ type: 'missingAddress', targetType: 'property', targetId: String(p._id), label: `Add address to "${p.title}"` });
      }

      // Campus pulse: latest public marketplace items
      const campusPulse = await MarketplaceItem.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title price images createdAt')
        .lean();

      const payload = {
        userSummary: {
          firstName: authed.firstName,
          university: authed.university || '',
          digest: `${conversations.length} recent chats • ${propertiesStats.totalProperties} properties • ${marketplaceStats.totalItems} items`,
        },
        
        // Enhanced properties data with statistics
        myProperties: {
          items: userProperties,
          statistics: {
            totalProperties: propertiesStats.totalProperties,
            totalViews: propertiesStats.totalViews,
            averagePrice: Math.round(propertiesStats.averagePrice || 0),
            availableProperties: propertiesStats.availableProperties,
            rentedProperties: propertiesStats.rentedProperties,
            occupancyRate: propertiesStats.totalProperties > 0 
              ? Math.round((propertiesStats.rentedProperties / propertiesStats.totalProperties) * 100) 
              : 0
          }
        },
        
        // Enhanced marketplace data with statistics
        myMarketplace: {
          items: userMarketplaceItems,
          statistics: {
            totalItems: marketplaceStats.totalItems,
            totalViews: marketplaceStats.totalViews,
            totalFavorites: marketplaceStats.totalFavorites,
            averagePrice: Math.round(marketplaceStats.averagePrice || 0),
            activeItems: marketplaceStats.activeItems,
            soldItems: marketplaceStats.soldItems,
            reservedItems: marketplaceStats.reservedItems,
            salesRate: marketplaceStats.totalItems > 0 
              ? Math.round((marketplaceStats.soldItems / marketplaceStats.totalItems) * 100) 
              : 0
          }
        },
        
        // Recent community interactions
        communityInteractions: {
          recent: (recentInteractions || []).map(interaction => ({
            id: String(interaction._id),
            type: interaction.interactionType,
            content: interaction.content,
            timestamp: interaction.timestamp,
            targetUser: interaction.targetUserId ? {
              name: `${interaction.targetUserId.firstName} ${interaction.targetUserId.lastName}`,
              avatar: interaction.targetUserId.avatar
            } : null
          })),
          totalEngagement: totalEngagement
        },
        
        // Solve thread history
        solveThreads: {
          recent: (solveThreads || []).map(thread => ({
            id: String(thread._id),
            kind: thread.kind,
            prompt: thread.prompt,
            status: thread.status,
            createdAt: thread.createdAt,
            candidatesCount: thread.candidatesSnapshot ? thread.candidatesSnapshot.length : 0
          })),
          totalThreads: (solveThreads || []).length
        },
        
        // Recent searches
        recentSearches: {
          searches: (recentSearches || []).map(search => ({
            id: String(search._id),
            query: search.metadata?.searchQuery || 'Unknown search',
            targetType: search.targetType,
            timestamp: search.timestamp,
            results: search.metadata?.searchResults || 0
          })),
          totalSearches: (recentSearches || []).length
        },
        
        // Likes data
        likes: {
          given: {
            count: likesGivenCount,
            recent: likesGiven.map(like => ({
              id: String(like._id),
              targetType: like.targetType,
              timestamp: like.timestamp
            }))
          },
          received: {
            count: likesReceivedCount,
            recent: likesReceivedData.map(like => ({
              id: String(like._id),
              targetType: like.targetType,
              timestamp: like.timestamp
            }))
          },
          ratio: likesGivenCount > 0 ? Math.round((likesReceivedCount / likesGivenCount) * 100) / 100 : 0
        },
        
        // Roommate requests
        roommateRequests: {
          sent: {
            requests: roommateRequestsSent.map(req => ({
              id: String(req._id),
              title: req.title,
              requestType: req.requestType,
              status: req.status,
              createdAt: req.createdAt,
              targetUser: req.targetUserId ? {
                name: `${req.targetUserId.firstName} ${req.targetUserId.lastName}`,
                university: req.targetUserId.university,
                avatar: req.targetUserId.avatar
              } : null
            })),
            count: roommateRequestsSent.length
          },
          received: {
            requests: roommateRequestsReceived.map(req => ({
              id: String(req._id),
              title: req.title,
              requestType: req.requestType,
              status: req.status,
              createdAt: req.createdAt,
              requester: req.requesterId ? {
                name: `${req.requesterId.firstName} ${req.requesterId.lastName}`,
                university: req.requesterId.university,
                avatar: req.requesterId.avatar
              } : null
            })),
            count: roommateRequestsReceived.length
          }
        },
        
        needsAttention,
        
        messagesPreview: conversations.map(c => ({
          id: String(c._id),
          lastUpdated: c.lastUpdated,
          lastMessage: c.lastMessage ? {
            content: c.lastMessage.content,
            timestamp: c.lastMessage.timestamp,
            sender: c.lastMessage.senderId ? `${c.lastMessage.senderId.firstName} ${c.lastMessage.senderId.lastName}` : 'Someone'
          } : null,
          participants: (c.participants || []).map(String),
        })),
        
        campusPulse,
        tasks: [], // can fill later
        profileProgress: { percent: 60, steps: [{ key: 'avatar', done: Boolean(authed.avatar) }] },
      };

      console.log('Dashboard payload prepared:', {
        propertiesCount: payload.myProperties.items.length,
        propertiesStats: payload.myProperties.statistics,
        marketplaceCount: payload.myMarketplace.items.length,
        marketplaceStats: payload.myMarketplace.statistics
      });

      res.json(payload);
    } catch (err) {
      console.error('GET /dashboard/overview error:', err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  });

// ========= Solve Threads (Housing) =========
app.post('/solve/housing', authenticateToken, async (req, res) => {
  try {
    const { prompt = "" } = req.body || {};
    const authedUser = req?.user?.user || req?.user || {};
    const campus = authedUser?.campusLabel || authedUser?.university || "";

    // 1) Ask LLM to extract criteria
    const sys = `You extract structured JSON search criteria for student housing.
Return only JSON with keys:
{
  "maxPrice": number|null,
  "bedrooms": number|null,
  "bathrooms": number|null,
  "distanceMiles": number|null,
  "moveIn": string|null,
  "keywords": string[]
}`;
    const userMsg = `Campus: ${campus || "unknown"}\nRequest: ${prompt}`;

    const aiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let extracted = {};
    try {
      const txt = aiResp?.data?.choices?.[0]?.message?.content || "{}";
      const m = txt.match(/\{[\s\S]*\}/);
      extracted = m ? JSON.parse(m[0]) : {};
    } catch { extracted = {}; }

    // Build filters
    const strictFilter = {};
    const lenientFilter = {};

    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

    const maxPrice = toNum(extracted.maxPrice);
    const minBeds  = toNum(extracted.bedrooms);
    const minBaths = toNum(extracted.bathrooms);

    // price / beds / baths go to BOTH strict & lenient queries
    if (maxPrice !== null) {
      strictFilter.price = { $lte: maxPrice };
      lenientFilter.price = { $lte: maxPrice };
    }
    if (minBeds !== null) {
      strictFilter.bedrooms = { $gte: minBeds };
      lenientFilter.bedrooms = { $gte: minBeds };
    }
    if (minBaths !== null) {
      strictFilter.bathrooms = { $gte: minBaths };
      lenientFilter.bathrooms = { $gte: minBaths };
    }

    // Optional keyword filter (strict only) — ignore generic words
    const stop = /^(near|around|close|campus|the|a|an|for|in|at|to|under|less|than|with|and|or|of|me|room|apartment|apt)$/i;
    const tokens = (Array.isArray(extracted.keywords) ? extracted.keywords : [])
      .map(s => String(s || "").trim())
      .filter(s => s && !stop.test(s) && s.length >= 3);

    if (tokens.length) {
      // Build AND-of-ORs: each token must appear in title OR description
      strictFilter.$and = tokens.map(t => ({
        $or: [
          { title:       { $regex: t, $options: 'i' } },
          { description: { $regex: t, $options: 'i' } },
          // don't regex the address object; uncomment if you store a string address:
          // { address:     { $regex: t, $options: 'i' } },
        ]
      }));
    }

    // Query strict first
    let candidates = await Property.find(strictFilter)
      .sort({ createdAt: -1 })
      .limit(12)
      .select('title price bedrooms bathrooms images address distanceFromUniversity description createdAt')
      .lean();

    // Fallback to lenient if strict returns nothing
    if (!candidates.length) {
      candidates = await Property.find(lenientFilter)
        .sort({ createdAt: -1 })
        .limit(12)
        .select('title price bedrooms bathrooms images address distanceFromUniversity description createdAt')
        .lean();
    }

    const criteria = {
      maxPrice: maxPrice ?? null,
      bedrooms: minBeds ?? null,
      bathrooms: minBaths ?? null,
      distanceMiles: extracted.distanceMiles ?? null,
      moveIn: extracted.moveIn ?? null,
      keywords: Array.isArray(extracted.keywords) ? extracted.keywords : [],
      campus,
    };

    const plan = [
      "We parsed your request into search criteria.",
      "Here are matching listings — select ones you like.",
      "Tap Request contact to ask owners (uses SafeContact).",
      "We’ll ping you when owners approve."
    ];

    // Save a thread snapshot
    const threadDoc = await Thread.create({
      userId: authedUser._id,
      kind: 'housing',
      prompt,
      criteria,
      plan,
      candidatesSnapshot: candidates,
      status: 'active',
      meta: { campus }
    });

    return res.json({
      ok: true,
      criteria,
      candidates,
      plan,
      thread: threadDoc,
      threadId: String(threadDoc._id),
    });
  } catch (err) {
    console.error("POST /solve/housing error:", err);
    res.status(500).json({ error: true, message: "Failed to run Solve Thread" });
  }
});


app.get('/threads/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user?.user || req.user)?._id;
    const t = await Thread.findOne({ _id: req.params.id, userId }).lean();
    if (!t) return res.status(404).json({ error: true, message: 'Thread not found' });
    res.json({ thread: t });
  } catch (e) {
    console.error('GET /threads/:id error', e);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});


// Synapse Preference : 

// --- Synapse (roommate) preferences ---
// GET: fetch current user's preferences
app.get("/synapse/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId, { synapse: 1 }).lean();
    return res.json({ preferences: user?.synapse || {} });
  } catch (err) {
    console.error("GET /synapse/preferences error:", err);
    return res.status(500).json({ message: "Failed to load preferences" });
  }
});

// POST: upsert (replace) current user's preferences
app.post("/synapse/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const incoming = req.body || {};

    // Only allow the expected top-level keys
    const allowed = ["culture", "logistics", "lifestyle", "habits", "pets", "dealbreakers"];
    const clean = {};
    for (const k of allowed) if (k in incoming) clean[k] = incoming[k];

    // --- normalize: drop primary from otherLanguages + dedupe ---
    const norm = (() => {
      const out = { ...clean };
      const c = { ...(out.culture || {}) };

      const primary =
        typeof c.primaryLanguage === "string" ? c.primaryLanguage.trim() : "";

      let others = Array.isArray(c.otherLanguages) ? c.otherLanguages : [];
      // keep strings only, trim empties, remove primary, and dedupe
      others = [...new Set(
        others
          .filter(x => typeof x === "string")
          .map(x => x.trim())
          .filter(x => x && x !== primary)
      )];

      out.culture = { ...c, otherLanguages: others };
      return out;
    })();

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { synapse: norm } },
      { new: true, projection: { synapse: 1 } }
    ).lean();

    return res.json({ ok: true, preferences: updated?.synapse || {} });
  } catch (err) {
    console.error("POST /synapse/preferences error:", err);
    return res.status(500).json({ message: "Failed to save preferences" });
  }
});



  // --- Synapse (roommate) matches ---
  // Query params:
  //   page (0-based), limit (default 24)
  //   scope: "school" | "country" | "any"   (optional narrowing)
  //   minScore: 0..100 (optional)
  // Notes: keep it simple now; we can iterate on weights later.
  // --- Synapse (roommate) matches ---
  app.get("/synapse/matches", authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Load the authed user with just what we need
      const me = await User.findById(userId, {
        firstName: 1, lastName: 1, avatar: 1,
        university: 1,
        synapse: 1,
      }).lean();

      const s         = me?.synapse || {};
      const culture   = s.culture   || {};
      const logistics = s.logistics || {};
      const lifestyle = s.lifestyle || {};
      const habits    = s.habits    || {};
      const pets      = s.pets      || {};

      const mePrimary = (culture.primaryLanguage || "").trim();
      const meOthers  = Array.isArray(culture.otherLanguages) ? culture.otherLanguages : [];
      const meComfort = culture.languageComfort || "either";

      const meHomeCountry = (culture.home?.country || "").trim();
      const meHomeRegion  = (culture.home?.region  || "").trim();
      const meHomeCity    = (culture.home?.city    || "").trim();

      const meCommute     = Array.isArray(logistics.commuteMode) ? logistics.commuteMode : [];
      const meCleanliness = Number.isFinite(lifestyle.cleanliness) ? lifestyle.cleanliness : null;

      // Pagination & filters
      const page     = Math.max(0, parseInt(req.query.page ?? "0", 10));
      const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "24", 10)));
      const minScore = Math.max(0, Math.min(100, parseInt(req.query.minScore ?? "0", 10)));
      const scope    = String(req.query.scope || "school").toLowerCase(); // default to same school

      // Pre-filter candidates. DO NOT require synapse; allow partial profiles.
      const match = { _id: { $ne: me._id } };

      if (scope === "school" && me.university) {
        match.university = me.university;               // <-- top-level university
      } else if (scope === "country" && meHomeCountry) {
        match["synapse.culture.home.country"] = meHomeCountry;
      }
      // else "any": no extra narrowing

      // Scoring weights (simple, tweak anytime)
      const W = {
        langPrimarySame: 25,
        langCrossOK:     15,
        comfortBonus:    10,
        country:         10,
        region:          8,
        city:            6,
        commuteMode:     6,
        sleep:           6,
        cleanlinessNear: 8,
        dietSame:        4,
        smokingSame:     3,
        drinkingSame:    3,
        partiesSame:     3,
        petsCompat:      7,
      };

      // Build the score parts dynamically so we only add checks that have a "me" side
      const scoreParts = [
        // Language
        { $cond: [{ $eq: ["$synapse.culture.primaryLanguage", mePrimary] }, W.langPrimarySame, 0] },
        { $cond: [
          { $in: [ mePrimary, { $ifNull: ["$synapse.culture.otherLanguages", []] } ] },
          W.langCrossOK, 0
        ]},
        { $cond: [
          { $in: [ "$synapse.culture.primaryLanguage", meOthers ] },
          W.langCrossOK, 0
        ]},
        // If my comfort isn't "same", small base
        ...(meComfort !== "same" ? [ { $literal: W.comfortBonus } ] : []),

        // Commute overlap
        { $cond: [
          { $gt: [ { $size: { $setIntersection: [ { $ifNull: ["$synapse.logistics.commuteMode", []] }, meCommute ] } }, 0 ] },
          W.commuteMode, 0
        ]},

        // Sleep & cleanliness
        { $cond: [ { $eq: ["$synapse.lifestyle.sleepPattern", lifestyle.sleepPattern || ""] }, W.sleep, 0 ] },
        ...(meCleanliness !== null ? [{
          $cond: [
            { $and: [
              { $ne: [ { $ifNull: ["$synapse.lifestyle.cleanliness", null] }, null ] },
              { $lte: [ { $abs: { $subtract: [ { $ifNull: ["$synapse.lifestyle.cleanliness", 0] }, meCleanliness ] } }, 1 ] }
            ]},
            W.cleanlinessNear, 0
          ]
        }] : []),

        // Habits
        { $cond: [ { $eq: ["$synapse.habits.diet",      habits.diet      || "" ] }, W.dietSame,     0 ] },
        { $cond: [ { $eq: ["$synapse.habits.smoking",   habits.smoking   || "" ] }, W.smokingSame,  0 ] },
        { $cond: [ { $eq: ["$synapse.habits.drinking",  habits.drinking  || "" ] }, W.drinkingSame, 0 ] },
        { $cond: [ { $eq: ["$synapse.habits.partying",  habits.partying  || "" ] }, W.partiesSame,  0 ] },

        // Pets compatibility (very light check)
        { $cond: [
          { $eq: [ { $ifNull: ["$synapse.pets.okWithPets", true] }, (pets.okWithPets ?? true) ] },
          W.petsCompat, 0
        ] },
      ];

      if (meHomeCountry) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.country", meHomeCountry] }, W.country, 0 ]
      });
      if (meHomeRegion) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.region",  meHomeRegion ] }, W.region,  0 ]
      });
      if (meHomeCity) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.city",    meHomeCity   ] }, W.city,    0 ]
      });

      const pipeline = [
        { $match: match },
        { $addFields: { score: { $add: scoreParts } } },
        ...(minScore > 0 ? [{ $match: { score: { $gte: minScore } } }] : []),
        { $sort: { score: -1, createdOn: -1 } },
        { $skip: page * limit },
        { $limit: limit },
        { $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
            university: 1,
            score: 1,
            synapse: 1,
            budgetMax: "$synapse.logistics.budgetMax",
          }
        }
      ];

      const rows = await User.aggregate(pipeline);

      // Post-process for UI niceties (overlap, reasons, flags)
      const toSet = (a) => Array.from(new Set((Array.isArray(a) ? a : []).filter(Boolean)));
      const intersect = (a, b) => {
        const sb = new Set(b || []);
        return toSet(a).filter(x => sb.has(x));
      };

      const matches = rows.map(r => {
        const their = r.synapse || {};
        const tCult = their.culture   || {};
        const tLog  = their.logistics || {};
        const tLife = their.lifestyle || {};
        const tHab  = their.habits    || {};
        const tPets = their.pets      || {};

        const primaryLangSame = tCult.primaryLanguage && mePrimary && tCult.primaryLanguage === mePrimary;

        const theirLangsAll = toSet([ tCult.primaryLanguage, ...(tCult.otherLanguages || []) ]);
        const myLangsAll    = toSet([ mePrimary,            ...meOthers ]);
        const bothLangs     = intersect(theirLangsAll, myLangsAll);

        const commuteOverlap = intersect(tLog.commuteMode || [], meCommute || []);

        const sleepMatch = (tLife.sleepPattern && lifestyle.sleepPattern)
          ? (tLife.sleepPattern === lifestyle.sleepPattern ? "good" : "different")
          : null;

        const cleanMatch = (Number.isFinite(tLife.cleanliness) && meCleanliness !== null)
          ? (Math.abs(Number(tLife.cleanliness) - meCleanliness) <= 1)
          : false;

        const reasons = [];
        if (primaryLangSame) reasons.push("Same daily language");
        if (bothLangs.length) reasons.push(`Both speak ${bothLangs.join(", ")}`);
        if (commuteOverlap.length) reasons.push(`Overlap: ${commuteOverlap.join(" / ")}`);
        if (sleepMatch === "good") reasons.push("Similar sleep hours");
        if (cleanMatch) reasons.push("Clean & tidy");
        if (tPets.okWithPets && (pets.okWithPets ?? true)) reasons.push("Pets are okay");
        if (tHab.diet && habits.diet && tHab.diet === habits.diet) reasons.push(`Both ${tHab.diet}`);

        const flags = {
          // Basic conflict flag: if both have dealbreakers arrays, mark when they intersect
          hasDealbreakerConflict: (
            (their.dealbreakers || []).length &&
            (s.dealbreakers || []).length &&
            intersect(their.dealbreakers, s.dealbreakers).length > 0
          )
        };

        return {
          id: String(r._id),
          name: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
          avatar: r.avatar || "",
          university: r.university || "",              // top-level field
          score: Math.max(0, Math.min(100, Math.round(r.score || 0))),
          homeCity: tCult?.home?.city || "",
          distanceMiles: null,                         // (optional) add real distance later
          budget: Number.isFinite(tLog.budgetMax) ? tLog.budgetMax : undefined,
          overlap: {
            primaryLanguage: primaryLangSame,
            otherLanguages: bothLangs,
            commute: commuteOverlap,
            sleep: sleepMatch,
            clean: cleanMatch,
            petsOk: Boolean(tPets.okWithPets),
            diet: tHab.diet || null,
          },
          reasons,
          flags,
          synapse: their, // keep raw slice if you need more details in the drawer
        };
      });

      return res.json({
        ok: true,
        page,
        limit,
        matches,          // <- what the FE expects
        results: matches, // <- alias for safety with older FE
      });
    } catch (err) {
      console.error("GET /synapse/matches error:", err);
      return res.status(500).json({ message: "Failed to load matches" });
    }
  });

  // Helper functions for AI parsing
  function parseAIInsights(aiContent, userContext) {
    try {
      console.log('🔍 Parsing AI insights from content:', aiContent.substring(0, 300) + '...');
      
      // Try to extract structured insights from AI response
      const insights = [];
      
      // Split by common patterns and extract insights
      const lines = aiContent.split('\n').filter(line => line.trim());
      
      // Look for specific housing-related insights
      const housingKeywords = ['housing', 'secure', 'apartment', 'roommate', 'budget', 'property'];
      const urgencyKeywords = ['urgent', 'immediate', 'soon', 'deadline', 'approaching'];
      
      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        
        // Check for numbered insights
        if (line.match(/^\d+\./)) {
          const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
          if (cleanLine.length > 10) {
            const isHousing = housingKeywords.some(keyword => lowerLine.includes(keyword));
            const isUrgent = urgencyKeywords.some(keyword => lowerLine.includes(keyword));
            
            insights.push({
              id: `ai-insight-${index}`,
              type: isHousing ? 'urgent' : 'info',
              title: cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : ''),
              message: cleanLine,
              priority: isUrgent || isHousing ? 'high' : 'medium',
              icon: isHousing ? 'home' : 'lightbulb',
              aiGenerated: true
            });
          }
        }
        // Check for bullet points
        else if (line.match(/^[-*]|^•/)) {
          const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
          if (cleanLine.length > 10) {
            const isHousing = housingKeywords.some(keyword => lowerLine.includes(keyword));
            const isUrgent = urgencyKeywords.some(keyword => lowerLine.includes(keyword));
            
            insights.push({
              id: `ai-insight-${index}`,
              type: isHousing ? 'urgent' : 'info',
              title: cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : ''),
              message: cleanLine,
              priority: isUrgent || isHousing ? 'high' : 'medium',
              icon: isHousing ? 'home' : 'lightbulb',
              aiGenerated: true
            });
          }
        }
        // Check for housing-specific content
        else if (housingKeywords.some(keyword => lowerLine.includes(keyword))) {
          insights.push({
            id: `ai-insight-${index}`,
            type: 'urgent',
            title: line.substring(0, 50) + (line.length > 50 ? '...' : ''),
            message: line,
            priority: 'high',
            icon: 'home',
            aiGenerated: true
          });
        }
      });

      // If no structured insights found, create specific housing insights
      if (insights.length === 0) {
        console.log('⚠️ No insights parsed, creating specific housing insights');
        
        // Create specific housing insights based on user data
        if (userContext.onboarding?.arrivalDate) {
          const arrivalDate = new Date(userContext.onboarding.arrivalDate);
          const daysUntilArrival = Math.ceil((arrivalDate - new Date()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilArrival <= 30) {
            insights.push({
              id: 'ai-insight-housing-urgent',
              type: 'urgent',
              title: 'Secure Housing Immediately',
              message: `Your arrival is in ${daysUntilArrival} days. Secure housing now to avoid last-minute stress.`,
              priority: 'high',
              icon: 'home',
              aiGenerated: true
            });
          } else {
            insights.push({
              id: 'ai-insight-housing-plan',
              type: 'info',
              title: 'Plan Housing Strategy',
              message: `Start researching housing options for your arrival in ${daysUntilArrival} days.`,
              priority: 'high',
              icon: 'home',
              aiGenerated: true
            });
          }
        }
        
        // Add roommate insight if interested
        if (userContext.onboarding?.roommateInterest) {
          insights.push({
            id: 'ai-insight-roommate',
            type: 'info',
            title: 'Find Compatible Roommates',
            message: 'Connect with potential roommates to split costs and build community.',
            priority: 'medium',
            icon: 'people',
            aiGenerated: true
          });
        }
        
        // Add budget insight
        if (userContext.onboarding?.budgetRange) {
          insights.push({
            id: 'ai-insight-budget',
            type: 'info',
            title: 'Optimize Your Budget',
            message: `With a budget of $${userContext.onboarding.budgetRange.min}-$${userContext.onboarding.budgetRange.max}, consider roommate options to maximize value.`,
            priority: 'medium',
            icon: 'money',
            aiGenerated: true
          });
        }
      }

      console.log(`✅ Parsed ${insights.length} insights:`, insights.map(i => i.title));
      return insights.slice(0, 5); // Limit to 5 insights
    } catch (error) {
      console.error('Error parsing AI insights:', error);
      return generateFallbackInsights(userContext.profile, userContext.dashboard);
    }
  }

  function parseAIActions(aiContent, userContext) {
    try {
      const actions = [];
      const lines = aiContent.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        if (line.match(/^\d+\.|^[-*]|^•/)) {
          const cleanLine = line.replace(/^\d+\.|^[-*]|^•/, '').trim();
          if (cleanLine.length > 10) {
            actions.push({
              label: cleanLine.substring(0, 30) + (cleanLine.length > 30 ? '...' : ''),
              description: cleanLine,
              path: getActionPath(cleanLine, userContext),
              icon: getActionIcon(cleanLine),
              color: getActionColor(index),
              priority: index < 2 ? 'high' : 'medium',
              aiGenerated: true
            });
          }
        }
      });

      if (actions.length === 0) {
        actions.push({
          label: 'AI Recommendation',
          description: aiContent.substring(0, 100) + (aiContent.length > 100 ? '...' : ''),
          path: '/dashboard',
          icon: 'lightbulb',
          color: 'blue',
          priority: 'high',
          aiGenerated: true
        });
      }

      return actions.slice(0, 6); // Limit to 6 actions
    } catch (error) {
      console.error('Error parsing AI actions:', error);
      return generateFallbackActions(userContext.profile);
    }
  }

  function generateFallbackInsights(user, dashboardData) {
    const insights = [];
    
    if (user.onboardingData?.arrivalDate) {
      const daysUntilArrival = Math.ceil((new Date(user.onboardingData.arrivalDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilArrival <= 30) {
        insights.push({
          id: 'fallback-arrival',
          type: 'urgent',
          title: 'Arrival Approaching!',
          message: `${daysUntilArrival} days until you arrive in ${user.onboardingData.city || 'your city'}`,
          priority: 'high',
          icon: 'schedule',
          fallback: true
        });
      }
    }
    
    if (user.onboardingData?.budgetRange?.max && dashboardData?.propertiesStats?.averagePrice) {
      const avgPrice = dashboardData.propertiesStats.averagePrice;
      const budget = user.onboardingData.budgetRange.max;
      if (avgPrice > budget) {
        insights.push({
          id: 'fallback-budget',
          type: 'warning',
          title: 'Budget Alert',
          message: `Average property price ($${avgPrice}) exceeds your budget ($${budget})`,
          priority: 'high',
          icon: 'money',
          fallback: true
        });
      }
    }
    
    if (insights.length === 0) {
      insights.push({
        id: 'fallback-welcome',
        type: 'info',
        title: 'Welcome to NewRun!',
        message: 'Complete your profile to get personalized insights and recommendations.',
        priority: 'low',
        icon: 'info',
        fallback: true
      });
    }
    
    return insights;
  }

  function generateFallbackActions(user) {
    const actions = [];
    
    actions.push({
      label: 'List Property',
      description: 'Add a new property listing',
      path: '/dashboard',
      icon: 'home',
      color: 'blue',
      priority: 'high',
      fallback: true
    });
    
    actions.push({
      label: 'Browse Properties',
      description: 'Find your perfect place',
      path: '/all-properties',
      icon: 'search',
      color: 'green',
      priority: 'high',
      fallback: true
    });
    
    if (user.onboardingData?.focus === 'Roommate' || user.onboardingData?.focus === 'Everything') {
      actions.push({
        label: 'Find Roommate',
        description: 'Connect with potential roommates',
        path: '/Synapse',
        icon: 'people',
        color: 'purple',
        priority: 'medium',
        fallback: true
      });
    }
    
    return actions;
  }

  function getActionPath(actionText, userContext) {
    const text = actionText.toLowerCase();
    
    // Smart routing based on content
    if (text.includes('housing') || text.includes('property') || text.includes('secure housing')) {
      return '/all-properties';
    }
    if (text.includes('roommate') || text.includes('connect') || text.includes('match')) {
      return '/Synapse';
    }
    if (text.includes('essentials') || text.includes('purchase') || text.includes('marketplace')) {
      return '/marketplace';
    }
    if (text.includes('community') || text.includes('social') || text.includes('network')) {
      return '/community';
    }
    if (text.includes('academic') || text.includes('study') || text.includes('course')) {
      return '/dashboard'; // Academic resources
    }
    if (text.includes('budget') || text.includes('financial') || text.includes('money')) {
      return '/dashboard'; // Financial planning
    }
    
    return '/dashboard';
  }

  function getActionIcon(actionText) {
    const text = actionText.toLowerCase();
    if (text.includes('property') || text.includes('housing')) return 'home';
    if (text.includes('search') || text.includes('browse')) return 'search';
    if (text.includes('roommate') || text.includes('people')) return 'people';
    if (text.includes('marketplace') || text.includes('shop')) return 'shopping';
    if (text.includes('community') || text.includes('chat')) return 'chat';
    return 'lightbulb';
  }

  function getActionColor(index) {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal'];
    return colors[index % colors.length];
  }

  // AI Explain Insight endpoint
  app.post('/api/ai/explain-insight', authenticateToken, async (req, res) => {
    const userId = getAuthUserId(req);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const { insight, dashboardData } = req.body;

      // Build the same rich context as insights endpoint
      const userContext = {
        profile: {
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          university: user.university,
          major: user.major,
          graduationDate: user.graduationDate,
          currentLocation: user.currentLocation,
          hometown: user.hometown,
          birthday: user.birthday,
          campusLabel: user.campusLabel,
          campusDisplayName: user.campusDisplayName,
          schoolDepartment: user.schoolDepartment,
          cohortTerm: user.cohortTerm,
          emailVerified: user.emailVerified
        },
        onboarding: user.onboardingData,
        synapse: user.synapse || {},
        dashboard: dashboardData,
        timestamp: new Date().toISOString()
      };

      const systemPrompt = `You are a helpful student advisor AI with access to a housing database. 

CRITICAL: For housing-related insights, you MUST use the get_housing_recommendations tool to find specific properties and roommates. Do not provide generic advice.

When explaining housing insights, you MUST:
1. Call get_housing_recommendations tool with insightType: "housing"
2. Use the specific data returned to provide concrete recommendations
3. Reference actual properties, prices, and roommate matches

Be conversational, motivating, and specific. ALWAYS start with a friendly greeting using the student's first name (e.g., "Hey [Name]!" or "Hi [Name]!"). Reference their arrival date, budget, preferences, and current status. Keep it concise (120-180 words) and end with 2-3 actionable next steps.`;

      const userPrompt = `Student: ${userContext.profile.name}
University: ${userContext.profile.university} (${userContext.profile.campusDisplayName})
Major: ${userContext.profile.major}
Arrival Date: ${userContext.onboarding?.arrivalDate || 'Not set'}
Budget: $${userContext.onboarding?.budgetRange?.min || 'Unknown'} - $${userContext.onboarding?.budgetRange?.max || 'Unknown'}
Current Status: ${userContext.dashboard?.propertiesCount || 0} properties listed, ${userContext.onboarding?.roommateInterest ? 'Interested in roommates' : 'No roommate interest'}

Recommendation to explain: "${insight.title}" (Priority: ${insight.priority})

This is a housing-related insight. You MUST use the get_housing_recommendations tool to find specific properties and roommates, then explain why this recommendation is important using the actual data found.`;

      const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "get_housing_recommendations",
              description: "Get specific housing and roommate recommendations for the student",
              parameters: {
                type: "object",
                properties: {
                  insightType: {
                    type: "string",
                    enum: ["housing", "roommate", "both"],
                    description: "Type of recommendations needed"
                  },
                  userProfile: {
                    type: "object",
                    description: "User profile data for recommendations"
                  }
                },
                required: ["insightType", "userProfile"]
              }
            }
          }
        ],
        tool_choice: "auto"
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const aiMessage = aiResponse?.data?.choices?.[0]?.message;
      const explanation = aiMessage?.content || '';
      
      let specificRecommendations = null;
      
      // Check if AI wants to use tools
      if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
        console.log('🔧 AI wants to use tools for explain-insight:', aiMessage.tool_calls);
        const toolCall = aiMessage.tool_calls[0];
        
        if (toolCall.function.name === 'get_housing_recommendations') {
          try {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            console.log('🔧 Tool arguments for explain-insight:', toolArgs);
            
            // Get specific recommendations from our database
            const recommendationsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/get-recommendations`, {
              insightType: toolArgs.insightType,
              userProfile: userContext
            }, {
              headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/json'
              }
            });
            
            specificRecommendations = recommendationsResponse.data;
            console.log('🔧 Recommendations response for explain-insight:', specificRecommendations);
            
            // Generate explanation with specific recommendations
            const enhancedPrompt = `${userPrompt}\n\nBased on the specific recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nExplain why this recommendation is important using these specific options.`;
            
            const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: "gpt-4o",
              temperature: 0.7,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: enhancedPrompt }
              ]
            }, {
              headers: {
                Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            });
            
            const enhancedExplanation = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
            
            res.json({ 
              success: true, 
              explanation: enhancedExplanation,
              insight: insight,
              aiGenerated: true,
              specificRecommendations: specificRecommendations
            });
            return;
            
          } catch (toolError) {
            console.error('Tool execution error in explain-insight:', toolError);
          }
        }
      } else {
        // AI didn't call tools - force it to use tools for housing insights
        console.log('🔧 AI didn\'t call tools for explain-insight, forcing tool usage...');
        
        try {
          // Force call the recommendations tool
          const recommendationsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/get-recommendations`, {
            insightType: "housing",
            userProfile: userContext
          }, {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          });
          
          specificRecommendations = recommendationsResponse.data;
          console.log('🔧 Forced recommendations response for explain-insight:', specificRecommendations);
          
          // Generate explanation with specific recommendations
          const enhancedPrompt = `${userPrompt}\n\nBased on the specific recommendations found:\n${JSON.stringify(specificRecommendations, null, 2)}\n\nExplain why this recommendation is important using these specific options.`;
          
          const enhancedResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: enhancedPrompt }
            ]
          }, {
            headers: {
              Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          
          const enhancedExplanation = enhancedResponse?.data?.choices?.[0]?.message?.content || '';
          
          res.json({ 
            success: true, 
            explanation: enhancedExplanation,
            insight: insight,
            aiGenerated: true,
            specificRecommendations: specificRecommendations
          });
          return;
          
        } catch (forceError) {
          console.error('Force tool usage error in explain-insight:', forceError);
        }
      }
      
      res.json({ 
        success: true, 
        explanation,
        insight: insight,
        aiGenerated: true,
        specificRecommendations
      });
    } catch (error) {
      console.error('AI Explain Insight Error:', error);
      
      // Fallback explanation based on insight type
      const fallbackExplanation = generateFallbackExplanation(insight, user, dashboardData);
      res.json({ 
        success: true, 
        explanation: fallbackExplanation,
        insight: insight,
        fallback: true 
      });
    }
  });

  // Helper function for fallback explanations
  function generateFallbackExplanation(insight, user, dashboardData) {
    const userName = user.firstName;
    const arrivalDate = user.onboardingData?.arrivalDate;
    const budget = user.onboardingData?.budgetRange;
    const university = user.university;
    const major = user.major;
    
    // Calculate days until arrival
    let daysUntilArrival = 0;
    if (arrivalDate) {
      const arrival = new Date(arrivalDate);
      daysUntilArrival = Math.ceil((arrival - new Date()) / (1000 * 60 * 60 * 24));
    }
    
    const explanations = {
      'Secure Housing Options': `Hey ${userName}! I'm highlighting housing as a HIGH priority because your arrival date is approaching and you haven't secured a place yet. With your budget of $${budget?.min || '300'}-$${budget?.max || '1000'}, there are great options near ${university}. The sooner you secure housing, the more choices you'll have and the less stress you'll feel. Next steps: 1) Browse properties on our platform, 2) Contact landlords directly, 3) Consider roommate options to split costs.`,
      
      'Secure Housing Immediately': `Hi ${userName}! Your arrival is in ${daysUntilArrival} days, making housing your top priority. With your budget of $${budget?.min || '300'}-$${budget?.max || '1000'}, I've found specific options near ${university} that match your needs. Next steps: 1) Review the properties I've identified, 2) Contact landlords immediately, 3) Consider roommate options to maximize your budget.`,
      
      'Plan Housing Strategy': `Hey ${userName}! With ${daysUntilArrival} days until your arrival at ${university}, it's time to start your housing search. Your budget of $${budget?.min || '300'}-$${budget?.max || '1000'} gives you good options. Next steps: 1) Research neighborhoods near campus, 2) Set up property alerts, 3) Connect with potential roommates.`,
      
      'Find Compatible Roommates': `Hi ${userName}! Finding a compatible roommate is important for your ${university} experience, especially with your budget range. A good roommate match can reduce living costs and provide social support. Next steps: 1) Complete your Synapse profile, 2) Browse potential roommates, 3) Start conversations with matches.`,
      
      'Optimize Your Budget': `Hey ${userName}! With your budget of $${budget?.min || '300'}-$${budget?.max || '1000'}, consider roommate options to maximize value. Splitting costs can give you access to better properties while staying within budget. Next steps: 1) Calculate potential savings with roommates, 2) Browse shared housing options, 3) Connect with budget-compatible roommates.`,
      
      'Verify University Email': `Hi ${userName}! Your email verification is crucial because ${university} will send important updates about classes, housing, and campus events to your verified email. Without verification, you might miss critical deadlines or opportunities. Next steps: 1) Check your email for verification link, 2) Contact IT support if needed, 3) Update your profile once verified.`,
      
      'Set Up Essentials': `Hi ${userName}! Setting up essentials early will make your transition to ${university} smoother. You'll need these items from day one, and having them ready reduces stress during your first week. Next steps: 1) Create your essentials checklist, 2) Shop for immediate needs, 3) Plan for delivery or pickup.`,
      
      'Engage with the Community': `Hey ${userName}! Building connections at ${university} is key to your success, especially in your ${major} program. Early engagement helps you feel at home and opens up academic and social opportunities. Next steps: 1) Join student groups, 2) Attend orientation events, 3) Connect with classmates.`
    };
    
    return explanations[insight.title] || `This recommendation is important for your success at ${university}. Take action on this to stay on track with your goals.`;
  }

  // AI Tool Endpoints for Database Interaction
  // These endpoints allow the AI to query the database and provide specific recommendations

  // Find properties based on user criteria
  app.post('/api/ai/tools/find-properties', authenticateToken, async (req, res) => {
    try {
      const { 
        campusId, 
        maxDistance = 10, 
        budgetMin, 
        budgetMax, 
        furnished = false, 
        moveInDate,
        limit = 20 
      } = req.body;

      // Build query based on criteria
      let query = {};
      
      // Debug logging
      console.log('🔍 find-properties query params:', { campusId, budgetMin, budgetMax, furnished, moveInDate, limit });
      
      // Start with basic availability - try both 'available' and no status filter
      query.availabilityStatus = 'available';
      
      // Don't filter by campusId for now - let's see all available properties
      // if (campusId) {
      //   query.campusId = campusId;
      // }
      
      if (budgetMin && budgetMax) {
        query.price = { $gte: budgetMin, $lte: budgetMax };
      }
      
      // Remove furnished filter for now since properties might not have this field
      // if (furnished) {
      //   query.furnished = true;
      // }
      
      // Remove moveInDate filter for now since properties might not have availableFrom field
      // if (moveInDate) {
      //   query.availableFrom = { $lte: new Date(moveInDate) };
      // }

      console.log('🔍 Final query:', JSON.stringify(query, null, 2));

      // Find properties
      let properties = await Property.find(query)
        .limit(limit)
        .select('title price bedrooms bathrooms address distanceFromUniversity contactInfo images availabilityStatus')
        .lean();
        
      console.log('🔍 Properties found in DB:', properties.length);
      
      // If still no properties, try without any filters
      if (properties.length === 0) {
        console.log('🔧 No properties found with filters, trying without any filters...');
        properties = await Property.find({})
          .limit(limit)
          .select('title price bedrooms bathrooms address distanceFromUniversity contactInfo images availabilityStatus')
          .lean();
        console.log('🔧 Properties found without filters:', properties.length);
      }

      // Log the actual properties found for debugging
      if (properties.length > 0) {
        console.log('🔧 Sample property found:', JSON.stringify(properties[0], null, 2));
      }

      // Add distance scoring if campusId provided
      const scoredProperties = properties.map(property => ({
        ...property,
        distanceScore: property.distanceFromUniversity ? 
          Math.max(0, 100 - (property.distanceFromUniversity * 10)) : 50,
        budgetScore: budgetMin && budgetMax ? 
          Math.max(0, 100 - Math.abs(property.price - (budgetMin + budgetMax) / 2) / ((budgetMax - budgetMin) / 2) * 50) : 50
      }));

      res.json({ 
        success: true, 
        properties: scoredProperties,
        total: scoredProperties.length,
        criteria: { campusId, maxDistance, budgetMin, budgetMax, furnished, moveInDate }
      });
    } catch (error) {
      console.error('AI Tool - Find Properties Error:', error);
      res.status(500).json({ success: false, error: 'Failed to find properties' });
    }
  });

  // Find compatible roommates based on user profile
  app.post('/api/ai/tools/find-roommates', authenticateToken, async (req, res) => {
    try {
      const { 
        campusId, 
        budgetBand, 
        lifestyleFilters = {}, 
        language, 
        dealbreakers = [],
        limit = 20 
      } = req.body;

      // Build roommate query based on Synapse data
      let query = { 
        'synapse.visibility.showAvatarInPreviews': true,
        university: campusId 
      };
      
      if (budgetBand) {
        query['onboardingData.budgetRange'] = {
          $gte: budgetBand.min,
          $lte: budgetBand.max
        };
      }

      // Find potential roommates
      let roommates = await User.find(query)
        .select('firstName lastName email university major synapse onboardingData')
        .limit(limit)
        .lean();

      // If no roommates found, add some test data for demonstration
      if (roommates.length === 0) {
        console.log('🔧 No roommates found, adding test data for demonstration...');
        roommates = [
          {
            firstName: "Sarah",
            lastName: "Chen",
            email: "sarah.chen@example.com",
            university: "Northern Illinois University",
            major: "Computer Science",
            onboardingData: { budgetRange: { min: 400, max: 600 } },
            synapse: {
              culture: { primaryLanguage: "English" },
              lifestyle: { sleepPattern: "early_bird", cleanliness: 4 },
              habits: { smoking: false, partying: 2 },
              dealbreakers: ["smoking", "loud_music"]
            }
          },
          {
            firstName: "Alex",
            lastName: "Johnson",
            email: "alex.johnson@example.com",
            university: "Northern Illinois University",
            major: "Business",
            onboardingData: { budgetRange: { min: 500, max: 700 } },
            synapse: {
              culture: { primaryLanguage: "English" },
              lifestyle: { sleepPattern: "night_owl", cleanliness: 3 },
              habits: { smoking: false, partying: 3 },
              dealbreakers: ["smoking"]
            }
          }
        ];
      }

      // Score compatibility
      const scoredRoommates = roommates.map(roommate => {
        const compatibilityScore = calculateCompatibilityScore(req.user, roommate, lifestyleFilters, dealbreakers);
        return {
          ...roommate,
          compatibilityScore,
          lifestyleMatch: calculateLifestyleMatch(req.user.synapse, roommate.synapse),
          languageMatch: roommate.synapse?.culture?.primaryLanguage === language
        };
      }).filter(roommate => roommate.compatibilityScore > 30); // Filter out low compatibility

      res.json({ 
        success: true, 
        roommates: scoredRoommates,
        total: scoredRoommates.length,
        criteria: { campusId, budgetBand, lifestyleFilters, language, dealbreakers }
      });
    } catch (error) {
      console.error('AI Tool - Find Roommates Error:', error);
      res.status(500).json({ success: false, error: 'Failed to find roommates' });
    }
  });

  // Score properties based on user preferences
  app.post('/api/ai/tools/score-properties', authenticateToken, async (req, res) => {
    try {
      const { userProfile, properties } = req.body;
      
      const scoredProperties = properties.map(property => {
        const scores = {
          budgetFit: calculateBudgetScore(property.price, userProfile.budgetRange),
          distanceFit: calculateDistanceScore(property.distanceFromUniversity, userProfile.maxDistance),
          amenityFit: calculateAmenityScore(property, userProfile.preferences),
          availabilityFit: calculateAvailabilityScore(property.availableFrom, userProfile.moveInDate)
        };
        
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
        
        return {
          ...property,
          scores,
          totalScore,
          recommendation: generatePropertyRecommendation(property, scores, userProfile)
        };
      }).sort((a, b) => b.totalScore - a.totalScore);

      res.json({ 
        success: true, 
        scoredProperties,
        topRecommendations: scoredProperties.slice(0, 5)
      });
    } catch (error) {
      console.error('AI Tool - Score Properties Error:', error);
      res.status(500).json({ success: false, error: 'Failed to score properties' });
    }
  });

  // Score roommates based on compatibility
  app.post('/api/ai/tools/score-roommates', authenticateToken, async (req, res) => {
    try {
      const { userProfile, roommates } = req.body;
      
      const scoredRoommates = roommates.map(roommate => {
        const scores = {
          lifestyleMatch: calculateLifestyleScore(userProfile.synapse, roommate.synapse),
          budgetMatch: calculateBudgetCompatibility(userProfile.budgetRange, roommate.onboardingData?.budgetRange),
          scheduleMatch: calculateScheduleCompatibility(userProfile.synapse, roommate.synapse),
          languageMatch: calculateLanguageCompatibility(userProfile.synapse?.culture, roommate.synapse?.culture),
          dealbreakerCheck: checkDealbreakers(userProfile.synapse?.dealbreakers, roommate.synapse)
        };
        
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
        
        return {
          ...roommate,
          scores,
          totalScore,
          compatibility: getCompatibilityLevel(totalScore),
          recommendation: generateRoommateRecommendation(roommate, scores, userProfile)
        };
      }).sort((a, b) => b.totalScore - a.totalScore);

      res.json({ 
        success: true, 
        scoredRoommates,
        topMatches: scoredRoommates.slice(0, 5)
      });
    } catch (error) {
      console.error('AI Tool - Score Roommates Error:', error);
      res.status(500).json({ success: false, error: 'Failed to score roommates' });
    }
  });

  // Get personalized recommendations with AI reasoning
  app.post('/api/ai/tools/get-recommendations', authenticateToken, async (req, res) => {
    try {
      const { insightType, userProfile } = req.body;
      
      // Get user data
      const userId = getAuthUserId(req);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Generate cache key based on user data and insight type
      const cacheKey = `recommendations-${user._id}-${insightType}-${JSON.stringify({
        university: user.university,
        budgetRange: user.onboardingData?.budgetRange,
        language: user.synapse?.culture?.primaryLanguage,
        dealbreakers: user.synapse?.dealbreakers
      })}`;
      
      // Check cache first (5 minute TTL for recommendations)
      const cached = await getCachedRecommendations(cacheKey);
      if (cached) {
        console.log('🎯 Cache HIT: Using cached recommendations');
        return res.json({ 
          success: true, 
          recommendations: cached.recommendations,
          reasoning: cached.reasoning,
          insightType,
          timestamp: cached.timestamp,
          cached: true
        });
      }

      let recommendations = [];
      let reasoning = '';

      if (insightType === 'housing') {
        // Find properties and roommates
        const propertiesResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/find-properties`, {
          campusId: user.university,
          budgetMin: user.onboardingData?.budgetRange?.min,
          budgetMax: user.onboardingData?.budgetRange?.max,
          moveInDate: user.onboardingData?.arrivalDate

        }, {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          }
        });

        const roommatesResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/tools/find-roommates`, {
          campusId: user.university,
          budgetBand: user.onboardingData?.budgetRange,
          language: user.synapse?.culture?.primaryLanguage,
          dealbreakers: user.synapse?.dealbreakers || []
        }, {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          }
        });

        // Score and rank
        const rawProperties = propertiesResponse.data.properties.slice(0, 5);
        const rawRoommates = roommatesResponse.data.roommates.slice(0, 3);

        // Transform properties for beautiful AI drawer display
        const scoredProperties = PropertyDataTransformer.transformPropertiesForAI(rawProperties);
        const scoredRoommates = rawRoommates.map(roommate => 
          PropertyDataTransformer.transformRoommateForAI(roommate)
        );

        recommendations = {
          properties: scoredProperties,
          roommates: scoredRoommates,
          bestMatches: findBestPropertyRoommatePairs(scoredProperties, scoredRoommates)
        };

        reasoning = generateHousingReasoning(user, recommendations);
        
        // Cache the results
        await setCachedRecommendations(cacheKey, {
          recommendations,
          reasoning,
          timestamp: new Date().toISOString()
        });
      }

      res.json({ 
        success: true, 
        recommendations,
        reasoning,
        insightType,
        timestamp: new Date().toISOString(),
        cached: false
      });
    } catch (error) {
      console.error('AI Tool - Get Recommendations Error:', error);
      res.status(500).json({ success: false, error: 'Failed to get recommendations' });
    }
  });

  // Scoring Algorithm Helper Functions
  function calculateCompatibilityScore(user, roommate, lifestyleFilters, dealbreakers) {
    let score = 0;
    let factors = 0;

    // Budget compatibility (30% weight)
    if (user.onboardingData?.budgetRange && roommate.onboardingData?.budgetRange) {
      const userBudget = (user.onboardingData.budgetRange.min + user.onboardingData.budgetRange.max) / 2;
      const roommateBudget = (roommate.onboardingData.budgetRange.min + roommate.onboardingData.budgetRange.max) / 2;
      const budgetDiff = Math.abs(userBudget - roommateBudget) / Math.max(userBudget, roommateBudget);
      score += (1 - budgetDiff) * 30;
      factors++;
    }

    // Lifestyle compatibility (25% weight)
    if (user.synapse && roommate.synapse) {
      const lifestyleScore = calculateLifestyleMatch(user.synapse, roommate.synapse);
      score += lifestyleScore * 0.25;
      factors++;
    }

    // Language compatibility (20% weight)
    if (user.synapse?.culture?.primaryLanguage && roommate.synapse?.culture?.primaryLanguage) {
      if (user.synapse.culture.primaryLanguage === roommate.synapse.culture.primaryLanguage) {
        score += 20;
      } else if (user.synapse.culture.otherLanguages?.includes(roommate.synapse.culture.primaryLanguage)) {
        score += 15;
      }
      factors++;
    }

    // Dealbreaker check (25% weight)
    if (dealbreakers.length > 0) {
      const hasDealbreaker = dealbreakers.some(dealbreaker => 
        roommate.synapse?.dealbreakers?.includes(dealbreaker)
      );
      if (!hasDealbreaker) {
        score += 25;
      }
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  function calculateLifestyleMatch(userSynapse, roommateSynapse) {
    if (!userSynapse || !roommateSynapse) return 0;

    let matchScore = 0;
    let factors = 0;

    // Sleep pattern compatibility
    if (userSynapse.lifestyle?.sleepPattern && roommateSynapse.lifestyle?.sleepPattern) {
      if (userSynapse.lifestyle.sleepPattern === roommateSynapse.lifestyle.sleepPattern) {
        matchScore += 25;
      }
      factors++;
    }

    // Cleanliness compatibility
    if (userSynapse.lifestyle?.cleanliness && roommateSynapse.lifestyle?.cleanliness) {
      const cleanlinessDiff = Math.abs(userSynapse.lifestyle.cleanliness - roommateSynapse.lifestyle.cleanliness);
      matchScore += Math.max(0, 25 - cleanlinessDiff * 5);
      factors++;
    }

    // Smoking compatibility
    if (userSynapse.habits?.smoking !== undefined && roommateSynapse.habits?.smoking !== undefined) {
      if (userSynapse.habits.smoking === roommateSynapse.habits.smoking) {
        matchScore += 25;
      }
      factors++;
    }

    // Party frequency compatibility
    if (userSynapse.habits?.partying && roommateSynapse.habits?.partying) {
      const partyingDiff = Math.abs(userSynapse.habits.partying - roommateSynapse.habits.partying);
      matchScore += Math.max(0, 25 - partyingDiff * 5);
      factors++;
    }

    return factors > 0 ? Math.round(matchScore / factors) : 0;
  }

  function calculateBudgetScore(propertyPrice, userBudgetRange) {
    if (!userBudgetRange) return 50;
    
    const budgetMid = (userBudgetRange.min + userBudgetRange.max) / 2;
    const budgetRange = userBudgetRange.max - userBudgetRange.min;
    const priceDiff = Math.abs(propertyPrice - budgetMid);
    
    if (priceDiff <= budgetRange * 0.1) return 100; // Within 10% of budget
    if (priceDiff <= budgetRange * 0.2) return 80;  // Within 20% of budget
    if (priceDiff <= budgetRange * 0.3) return 60;  // Within 30% of budget
    return Math.max(0, 40 - (priceDiff / budgetRange) * 20); // Below 40% if way off
  }

  function calculateDistanceScore(distance, maxDistance) {
    if (!distance || !maxDistance) return 50;
    
    if (distance <= maxDistance * 0.5) return 100; // Within half of max distance
    if (distance <= maxDistance) return 80;         // Within max distance
    if (distance <= maxDistance * 1.5) return 60;  // Within 1.5x max distance
    return Math.max(0, 40 - (distance / maxDistance) * 20);
  }

  function calculateAmenityScore(property, userPreferences) {
    if (!userPreferences) return 50;
    
    let score = 50; // Base score
    
    // Furnished preference
    if (userPreferences.furnished && property.furnished) score += 20;
    if (userPreferences.furnished && !property.furnished) score -= 10;
    
    // Pet-friendly preference
    if (userPreferences.petFriendly && property.petFriendly) score += 15;
    
    // Parking preference
    if (userPreferences.parking && property.parking) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  function calculateAvailabilityScore(availableFrom, userMoveInDate) {
    if (!availableFrom || !userMoveInDate) return 50;
    
    const moveInDate = new Date(userMoveInDate);
    const availableDate = new Date(availableFrom);
    const daysDiff = (availableDate - moveInDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 0) return 100;      // Available before move-in
    if (daysDiff <= 7) return 90;       // Available within a week
    if (daysDiff <= 14) return 80;      // Available within 2 weeks
    if (daysDiff <= 30) return 60;      // Available within a month
    return Math.max(0, 40 - daysDiff / 30 * 20); // Decreasing score
  }

  function generatePropertyRecommendation(property, scores, userProfile) {
    const reasons = [];
    
    if (scores.budgetFit > 80) reasons.push("perfect budget fit");
    if (scores.distanceFit > 80) reasons.push("close to campus");
    if (scores.amenityFit > 80) reasons.push("matches your preferences");
    if (scores.availabilityFit > 80) reasons.push("available when you need it");
    
    return reasons.length > 0 
      ? `Great match: ${reasons.join(", ")}`
      : "Good option based on your criteria";
  }

  function generateRoommateRecommendation(roommate, scores, userProfile) {
    const reasons = [];
    
    if (scores.lifestyleMatch > 80) reasons.push("similar lifestyle");
    if (scores.budgetMatch > 80) reasons.push("compatible budget");
    if (scores.scheduleMatch > 80) reasons.push("compatible schedule");
    if (scores.languageMatch > 80) reasons.push("speaks your language");
    
    return reasons.length > 0 
      ? `Great match: ${reasons.join(", ")}`
      : "Compatible roommate based on your profile";
  }

  function findBestPropertyRoommatePairs(properties, roommates) {
    const pairs = [];
    
    properties.slice(0, 3).forEach(property => {
      roommates.slice(0, 2).forEach(roommate => {
        const pairScore = (property.totalScore + roommate.totalScore) / 2;
        pairs.push({
          property,
          roommate,
          pairScore,
          savings: property.price / 2, // Assuming 2-bedroom split
          recommendation: `Perfect match: ${property.title} with ${roommate.firstName} - save $${Math.round(property.price / 2)}/month`
        });
      });
    });
    
    return pairs.sort((a, b) => b.pairScore - a.pairScore).slice(0, 3);
  }

  function generateHousingReasoning(user, recommendations) {
    const { properties, roommates, bestMatches } = recommendations;
    
    let reasoning = `Based on your profile (${user.university}, $${user.onboardingData?.budgetRange?.min}-$${user.onboardingData?.budgetRange?.max} budget, ${user.synapse?.culture?.primaryLanguage} language), I found:\n\n`;
    
    if (properties.length > 0) {
      reasoning += `🏠 **${properties.length} properties** that match your budget and location preferences\n`;
    }
    
    if (roommates.length > 0) {
      reasoning += `👥 **${roommates.length} compatible roommates** with similar lifestyle and budget\n`;
    }
    
    if (bestMatches.length > 0) {
      reasoning += `✨ **${bestMatches.length} perfect property-roommate pairs** for maximum savings and compatibility\n\n`;
      
      bestMatches.forEach((match, index) => {
        reasoning += `${index + 1}. **${match.property.title}** with **${match.roommate.firstName}** - Save $${Math.round(match.savings)}/month\n`;
      });
    }
    
    return reasoning;
  }

  // Recommendation Caching Functions
  const recommendationCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Clear cache endpoint for testing
  app.post('/api/ai/tools/clear-cache', authenticateToken, async (req, res) => {
    try {
      recommendationCache.clear();
      console.log('🧹 Cache cleared for testing');
      res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ success: false, error: 'Failed to clear cache' });
    }
  });

  async function getCachedRecommendations(cacheKey) {
    const cached = recommendationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    // Remove expired cache
    if (cached) {
      recommendationCache.delete(cacheKey);
    }
    return null;
  }

  async function setCachedRecommendations(cacheKey, data) {
    recommendationCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up old entries periodically
    if (recommendationCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of recommendationCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          recommendationCache.delete(key);
        }
      }
    }
  }

  // ==================== FINANCIAL MANAGEMENT ENDPOINTS ====================
  
  // Transaction endpoints
  app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 20, type, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;
      
      const query = { userId: getAuthUserId(req) };
      
      // Apply filters
      if (type) query.type = type;
      if (category) query.category = category;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const transactions = await Transaction.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'name email');
      
      const total = await Transaction.countDocuments(query);
      
      res.json({
        success: true,
        data: transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  });

  app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: error.message
      });
    }
  });

  app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
      const {
        type,
        amount,
        category,
        description,
        date,
        tags,
        isRecurring,
        recurringPattern,
        paymentMethod,
        location
      } = req.body;
      
      // Validate required fields
      if (!type || !amount || !category) {
        return res.status(400).json({
          success: false,
          message: 'Type, amount, and category are required'
        });
      }
      
      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }
      
      const transaction = new Transaction({
        userId: getAuthUserId(req),
        type,
        amount,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        tags,
        isRecurring: isRecurring || false,
        recurringPattern,
        paymentMethod: paymentMethod || 'card',
        location
      });
      
      await transaction.save();
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error.message
      });
    }
  });

  app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
      const {
        type,
        amount,
        category,
        description,
        date,
        tags,
        isRecurring,
        recurringPattern,
        paymentMethod,
        location,
        status
      } = req.body;
      
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      // Update fields
      if (type !== undefined) transaction.type = type;
      if (amount !== undefined) transaction.amount = amount;
      if (category !== undefined) transaction.category = category;
      if (description !== undefined) transaction.description = description;
      if (date !== undefined) transaction.date = new Date(date);
      if (tags !== undefined) transaction.tags = tags;
      if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
      if (recurringPattern !== undefined) transaction.recurringPattern = recurringPattern;
      if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
      if (location !== undefined) transaction.location = location;
      if (status !== undefined) transaction.status = status;
      
      await transaction.save();
      
      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error.message
      });
    }
  });

  app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error.message
      });
    }
  });

  // Budget endpoints
  app.get('/api/budgets/current', authenticateToken, async (req, res) => {
    try {
      const budget = await Budget.findOne({
        userId: getAuthUserId(req),
        'period.isActive': true
      });
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'No active budget found'
        });
      }
      
      // Update spent amounts from transactions
      await budget.updateSpentAmounts();
      
      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      console.error('Error fetching current budget:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch current budget',
        error: error.message
      });
    }
  });

  app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
      const {
        name,
        description,
        monthlyIncome,
        savingsGoal,
        categories,
        alerts,
        goals
      } = req.body;
      
      // Validate required fields
      if (!name || !monthlyIncome || !savingsGoal) {
        return res.status(400).json({
          success: false,
          message: 'Name, monthly income, and savings goal are required'
        });
      }
      
      // Validate amounts
      if (monthlyIncome <= 0 || savingsGoal < 0) {
        return res.status(400).json({
          success: false,
          message: 'Monthly income must be greater than 0 and savings goal must be non-negative'
        });
      }
      
      // Check if savings goal exceeds income
      if (savingsGoal > monthlyIncome) {
        return res.status(400).json({
          success: false,
          message: 'Savings goal cannot exceed monthly income'
        });
      }
      
      // Deactivate any existing active budget
      await Budget.updateMany(
        { userId: getAuthUserId(req), 'period.isActive': true },
        { 'period.isActive': false }
      );
      
      const budget = new Budget({
        userId: getAuthUserId(req),
        name,
        description,
        monthlyIncome,
        savingsGoal,
        categories: categories || [],
        alerts: alerts || {
          spendingThreshold: 0.8,
          emailNotifications: true,
          pushNotifications: true
        },
        goals: goals || []
      });
      
      await budget.save();
      
      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create budget',
        error: error.message
      });
    }
  });

  // Financial Reports endpoints
  app.post('/api/reports/generate', authenticateToken, async (req, res) => {
    try {
      const { reportType, startDate, endDate } = req.body;
      
      if (!reportType || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Report type, start date, and end date are required'
        });
      }
      
      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
      
      // Check if report already exists for this period
      const existingReport = await FinancialReport.findOne({
        userId: getAuthUserId(req),
        reportType,
        'period.startDate': start,
        'period.endDate': end
      });
      
      if (existingReport) {
        return res.json({
          success: true,
          message: 'Report already exists',
          data: existingReport
        });
      }
      
      // Generate new report
      const report = await FinancialReport.generateReport(
        getAuthUserId(req),
        reportType,
        start,
        end
      );
      
      res.status(201).json({
        success: true,
        message: 'Report generated successfully',
        data: report
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  });

  app.get('/api/reports/overview/quick', authenticateToken, async (req, res) => {
    try {
      const { months = 3 } = req.query;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months));
      
      // Get latest monthly report or generate quick overview
      let report = await FinancialReport.findOne({
        userId: getAuthUserId(req),
        reportType: 'monthly',
        'period.startDate': { $gte: startDate }
      }).sort({ generatedAt: -1 });
      
      if (!report) {
        // Generate quick overview
        report = await FinancialReport.generateReport(
          getAuthUserId(req),
          'monthly',
          startDate,
          endDate
        );
      }
      
      // Extract key metrics
      const overview = {
        totalIncome: report.summary.totalIncome,
        totalExpenses: report.summary.totalExpenses,
        netIncome: report.summary.netIncome,
        savingsRate: report.summary.savingsRate,
        topCategory: report.categoryBreakdown[0]?.category || 'N/A',
        topCategoryAmount: report.categoryBreakdown[0]?.amount || 0,
        insights: report.insights.recommendations.slice(0, 3), // Top 3 recommendations
        period: report.formattedPeriod
      };
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error fetching quick overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quick overview',
        error: error.message
      });
    }
  });

  // ==================== TRANSPORTATION ENDPOINTS ====================
  
  // Import transportation models
  const Route = require('./models/route.model');
  const Transit = require('./models/transit.model');
  const Carpool = require('./models/carpool.model');

  // Route Management endpoints
  app.get('/api/transportation/routes', authenticateToken, async (req, res) => {
    try {
      const { method, isActive, isFavorite, sortBy = 'lastUsed', sortOrder = 'desc' } = req.query;
      
      const query = { userId: getAuthUserId(req) };
      
      // Apply filters
      if (method) query.method = method;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const routes = await Route.find(query)
        .sort(sortOptions)
        .populate('userId', 'name email');
      
      res.json({
        success: true,
        data: routes
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch routes',
        error: error.message
      });
    }
  });

  app.post('/api/transportation/routes', authenticateToken, async (req, res) => {
    try {
      const {
        name,
        from,
        to,
        method,
        duration,
        distance,
        cost,
        frequency,
        preferences,
        schedule,
        notes
      } = req.body;
      
      // Validate required fields
      if (!name || !from || !to || !method || !duration || !distance) {
        return res.status(400).json({
          success: false,
          message: 'Name, from, to, method, duration, and distance are required'
        });
      }
      
      const route = new Route({
        userId: getAuthUserId(req),
        name,
        from,
        to,
        method,
        duration,
        distance,
        cost: cost || 0,
        frequency: frequency || 'As needed',
        preferences: preferences || {},
        schedule: schedule || {},
        notes
      });
      
      await route.save();
      
      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: route
      });
    } catch (error) {
      console.error('Error creating route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create route',
        error: error.message
      });
    }
  });

  app.put('/api/transportation/routes/:id', authenticateToken, async (req, res) => {
    try {
      const {
        name,
        from,
        to,
        method,
        duration,
        distance,
        cost,
        frequency,
        isActive,
        isFavorite,
        preferences,
        schedule,
        notes
      } = req.body;
      
      const route = await Route.findOne({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }
      
      // Update fields
      if (name !== undefined) route.name = name;
      if (from !== undefined) route.from = from;
      if (to !== undefined) route.to = to;
      if (method !== undefined) route.method = method;
      if (duration !== undefined) route.duration = duration;
      if (distance !== undefined) route.distance = distance;
      if (cost !== undefined) route.cost = cost;
      if (frequency !== undefined) route.frequency = frequency;
      if (isActive !== undefined) route.isActive = isActive;
      if (isFavorite !== undefined) route.isFavorite = isFavorite;
      if (preferences !== undefined) route.preferences = preferences;
      if (schedule !== undefined) route.schedule = schedule;
      if (notes !== undefined) route.notes = notes;
      
      await route.save();
      
      res.json({
        success: true,
        message: 'Route updated successfully',
        data: route
      });
    } catch (error) {
      console.error('Error updating route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update route',
        error: error.message
      });
    }
  });

  app.delete('/api/transportation/routes/:id', authenticateToken, async (req, res) => {
    try {
      const route = await Route.findOneAndDelete({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Route deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete route',
        error: error.message
      });
    }
  });

  // Route Planning endpoint
  app.post('/api/transportation/plan', authenticateToken, async (req, res) => {
    try {
      const { from, to, preferences = {} } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: 'From and to locations are required'
        });
      }
      
      // Find existing routes
      const existingRoutes = await Route.find({
        userId: getAuthUserId(req),
        from: { $regex: from, $options: 'i' },
        to: { $regex: to, $options: 'i' },
        isActive: true
      }).sort({ usageCount: -1 });
      
      // Generate route suggestions based on preferences
      const suggestions = [];
      
      // Bus route
      if (!preferences.avoidBus) {
        suggestions.push({
          method: 'bus',
          duration: 25,
          distance: 3.2,
          cost: 2.50,
          frequency: 'Every 15 min',
          description: 'Direct bus route with multiple stops'
        });
      }
      
      // Bike route
      if (!preferences.avoidBike) {
        suggestions.push({
          method: 'bike',
          duration: 15,
          distance: 2.8,
          cost: 0,
          frequency: 'Always available',
          description: 'Bike-friendly route with bike lanes'
        });
      }
      
      // Carpool route
      suggestions.push({
        method: 'carpool',
        duration: 20,
        distance: 3.0,
        cost: 5.00,
        frequency: 'Daily 8:00 AM',
        description: 'Shared ride with verified drivers'
      });
      
      // Walk route (if distance is reasonable)
      if (!preferences.maxWalkDistance || preferences.maxWalkDistance >= 1) {
        suggestions.push({
          method: 'walk',
          duration: 35,
          distance: 1.2,
          cost: 0,
          frequency: 'Always available',
          description: 'Walking route through campus'
        });
      }
      
      res.json({
        success: true,
        data: {
          suggestions,
          existingRoutes,
          preferences
        }
      });
    } catch (error) {
      console.error('Error planning route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to plan route',
        error: error.message
      });
    }
  });

  // Live Transit endpoints
  app.get('/api/transportation/transit', authenticateToken, async (req, res) => {
    try {
      const { line, status, limit = 20 } = req.query;
      
      const query = { isActive: true };
      
      if (line) query.line = { $regex: line, $options: 'i' };
      if (status) query.status = status;
      
      const transit = await Transit.find(query)
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: transit
      });
    } catch (error) {
      console.error('Error fetching transit data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transit data',
        error: error.message
      });
    }
  });

  app.post('/api/transportation/transit', authenticateToken, async (req, res) => {
    try {
      const {
        line,
        route,
        destination,
        nextArrival,
        frequency,
        cost,
        amenities
      } = req.body;
      
      // Validate required fields
      if (!line || !route || !destination || !nextArrival || !frequency) {
        return res.status(400).json({
          success: false,
          message: 'Line, route, destination, nextArrival, and frequency are required'
        });
      }
      
      const transit = new Transit({
        line,
        route,
        destination,
        nextArrival,
        frequency,
        cost: cost || 2.50,
        amenities: amenities || []
      });
      
      await transit.save();
      
      res.status(201).json({
        success: true,
        message: 'Transit route created successfully',
        data: transit
      });
    } catch (error) {
      console.error('Error creating transit route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transit route',
        error: error.message
      });
    }
  });

  // Carpool Management endpoints
  app.get('/api/transportation/carpools', authenticateToken, async (req, res) => {
    try {
      const { type, status, from, to, limit = 20 } = req.query;
      
      const query = {};
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (from) query['route.from'] = { $regex: from, $options: 'i' };
      if (to) query['route.to'] = { $regex: to, $options: 'i' };
      
      const carpools = await Carpool.find(query)
        .populate('driver.userId', 'name email')
        .populate('passengers.userId', 'name email')
        .sort({ lastActive: -1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: carpools
      });
    } catch (error) {
      console.error('Error fetching carpools:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch carpools',
        error: error.message
      });
    }
  });

  app.post('/api/transportation/carpools', authenticateToken, async (req, res) => {
    try {
      const {
        type,
        route,
        schedule,
        vehicle,
        capacity,
        cost,
        preferences,
        notes
      } = req.body;
      
      // Validate required fields
      if (!type || !route || !schedule || !capacity || !cost) {
        return res.status(400).json({
          success: false,
          message: 'Type, route, schedule, capacity, and cost are required'
        });
      }
      
      const carpool = new Carpool({
        driver: {
          userId: getAuthUserId(req),
          name: req.user.name,
          rating: 5.0
        },
        route,
        schedule,
        vehicle: vehicle || {},
        capacity: {
          total: capacity,
          available: capacity
        },
        cost,
        type,
        preferences: preferences || {},
        notes
      });
      
      await carpool.save();
      
      res.status(201).json({
        success: true,
        message: 'Carpool created successfully',
        data: carpool
      });
    } catch (error) {
      console.error('Error creating carpool:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create carpool',
        error: error.message
      });
    }
  });

  app.post('/api/transportation/carpools/:id/join', authenticateToken, async (req, res) => {
    try {
      const { name, phone } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required to join carpool'
        });
      }
      
      const carpool = await Carpool.findById(req.params.id);
      
      if (!carpool) {
        return res.status(404).json({
          success: false,
          message: 'Carpool not found'
        });
      }
      
      if (carpool.capacity.available <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Carpool is full'
        });
      }
      
      const passengerData = {
        userId: getAuthUserId(req),
        name,
        phone,
        status: 'pending'
      };
      
      await carpool.addPassenger(passengerData);
      
      res.json({
        success: true,
        message: 'Successfully joined carpool',
        data: carpool
      });
    } catch (error) {
      console.error('Error joining carpool:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join carpool',
        error: error.message
      });
    }
  });

  // Route Usage tracking
  app.post('/api/transportation/routes/:id/use', authenticateToken, async (req, res) => {
    try {
      const route = await Route.findOne({
        _id: req.params.id,
        userId: getAuthUserId(req)
      });
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }
      
      await route.incrementUsage();
      
      res.json({
        success: true,
        message: 'Route usage recorded',
        data: route
      });
    } catch (error) {
      console.error('Error recording route usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record route usage',
        error: error.message
      });
    }
  });

  // Transportation Dashboard Summary
  app.get('/api/transportation/dashboard', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      
      // Get active routes count
      const activeRoutesCount = await Route.countDocuments({
        userId,
        isActive: true
      });
      
      // Get favorite routes count
      const favoriteRoutesCount = await Route.countDocuments({
        userId,
        isFavorite: true
      });
      
      // Get active carpools
      const activeCarpools = await Carpool.countDocuments({
        'driver.userId': userId,
        status: 'active'
      });
      
      // Get recent carpools joined
      const joinedCarpools = await Carpool.countDocuments({
        'passengers.userId': userId,
        'passengers.status': 'confirmed'
      });
      
      // Get active transit routes
      const activeTransitCount = await Transit.countDocuments({
        isActive: true
      });
      
      const dashboard = {
        routes: {
          active: activeRoutesCount,
          favorites: favoriteRoutesCount
        },
        carpools: {
          driving: activeCarpools,
          riding: joinedCarpools
        },
        transit: {
          active: activeTransitCount
        }
      };
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard',
        error: error.message
      });
    }
  });

  // Test endpoint to verify server is running
  app.get('/api/test', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Backend server is running',
      timestamp: new Date().toISOString()
    });
  });

  const PORT = process.env.PORT || 8000;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  module.exports = app;