require('dotenv').config();

const config = require('./config.json');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const axios = require('axios');
const { authenticateToken, getAuthUserId, requireEmailVerified } = require('./utilities');
const { loginRateLimit, availabilityLimiter } = require('./middleware/rateLimiter');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const crypto = require('crypto');

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
const UserBookmark = require('./models/userBookmark.model');
const RoommateRequest = require('./models/RoommateRequest.model');
const EmailOTP = require('./models/emailOTP.model');
const { extractHousingCriteria } = require('./services/newrun-llm/newrunLLM');
const emailService = require('./services/emailService');


const app = express();

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173", 
      "https://newrun.club",
      "https://www.newrun.club"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});



app.use(express.json());
app.use(cors({ 
    origin: ["https://newrun.club", "https://www.newrun.club", "http://localhost:3000"],
    credentials: true
}));

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.ACCESS_TOKEN_SECRET || 'newrun-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // https on api.newrun.club
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));



// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, userId));
passport.deserializeUser(async (id, done) => {
  try { const user = await User.findById(id); done(null, user); }
  catch (e) { done(e); }
});

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'https://api.newrun.club'}/api/auth/google/callback`;
  console.log('[OAuth] Google callback URL:', googleCallbackUrl);
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackUrl
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
      // Link Google account to existing user (and backfill required fields if missing)
      const givenName = profile.name?.givenName || 'Google';
      const familyName = profile.name?.familyName || 'User';

      if (!user.googleId) user.googleId = profile.id;
      if (!user.firstName) user.firstName = givenName;
      if (!user.lastName) user.lastName = familyName;
      if (!user.password) {
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const hashedSecret = await bcrypt.hash(randomSecret, 10);
        user.password = hashedSecret;
      }
      user.emailVerified = true; // Google emails are pre-verified
      await user.save();
      return done(null, user);
    }

    const randomSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(randomSecret, 10);
    // password: hashedSecret
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      emailVerified: true,
      password: hashedSecret
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

// AWS S3 configuration for SDK v2
const s3 = new AWS.S3();

// S3 configuration verified

// Multer storage for S3
const upload = multer({
    storage: multerS3({
      s3: s3,
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
      fileSize: 30 * 1024 * 1024, // 30MB limit
  }
});

app.get('/', (req, res) => {
  res.json({ data: 'hello' });
});
// ---------------- Community API ----------------
// List threads (simple text search by q)
app.get('/community/threads', async (req, res) => {
  try {
    const { q = '', limit = 20, school = '', page = 1, offset = 0 } = req.query;
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
    
    // Calculate pagination
    const limitNum = Number(limit);
    const pageNum = Number(page);
    const offsetNum = Number(offset);
    const skip = offsetNum || (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const totalItems = await CommunityThread.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);
    
    // Get paginated results
    const items = await CommunityThread.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({ 
      success: true, 
      items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
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
    
    // Check if user is the original poster
    const isOP = t.authorId && authorId && t.authorId.toString() === authorId.toString();
    
    t.answers.push({ 
      body, 
      author: authorName || author || '@anonymous',
      authorName: authorName || author || '@anonymous',
      authorId,
      isOP: isOP
    });
    t.answersCount = t.answers.length;
    await t.save();
    res.json({ success: true, item: t });
  } catch (e) {
    console.error('Add answer error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Vote thread (upvote/downvote)
app.post('/community/threads/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { type = 'upvote' } = req.body || {}; // 'upvote' or 'downvote'
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    
    const t = await CommunityThread.findById(threadId);
    if (!t) return res.status(404).json({ success: false, message: 'Thread not found' });
    
    // Check if user already voted
    const existingVote = t.userVotes.find(vote => vote.userId.toString() === userId);
    
    if (existingVote) {
      // User already voted - check if it's the same vote type
      if (existingVote.voteType === type) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already voted on this question',
          currentVote: existingVote.voteType
        });
      } else {
        // User is changing their vote - remove old vote and add new one
        if (existingVote.voteType === 'upvote') {
          t.upvotes = Math.max(0, t.upvotes - 1);
        } else {
          t.downvotes = Math.max(0, t.downvotes - 1);
        }
        
        // Remove old vote
        t.userVotes = t.userVotes.filter(vote => vote.userId.toString() !== userId);
      }
    }
    
    // Add new vote
    if (type === 'upvote') {
      t.upvotes += 1;
    } else if (type === 'downvote') {
      t.downvotes += 1;
    }
    
    // Add user vote record
    t.userVotes.push({
      userId: userId,
      voteType: type,
      votedAt: new Date()
    });
    
    // Update net votes for backward compatibility
    t.votes = t.upvotes - t.downvotes;
    await t.save();
    
    res.json({ 
      success: true, 
      upvotes: t.upvotes, 
      downvotes: t.downvotes, 
      votes: t.votes,
      userVote: type
    });
  } catch (e) {
    console.error('Vote thread error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Bookmark thread (idempotent)
app.post('/community/threads/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    
    console.log('Bookmark request - userId:', userId, 'threadId:', threadId);
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID' });
    }
    
    // Check if thread exists
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    // Check if already bookmarked (idempotent)
    const existing = await UserBookmark.findOne({ userId, threadId });
    if (existing) {
      return res.json({ success: true, message: 'Already bookmarked' });
    }
    
    // Create bookmark
    const bookmark = await UserBookmark.create({ userId, threadId });
    
    res.json({ 
      success: true, 
      message: 'Thread bookmarked successfully',
      bookmarkId: bookmark._id 
    });
  } catch (e) {
    console.error('Bookmark thread error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Remove bookmark (idempotent)
app.delete('/community/threads/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID' });
    }
    
    const r = await UserBookmark.deleteOne({ userId, threadId });
    return res.json({ success: true, removed: r.deletedCount > 0 });
  } catch (e) {
    console.error('Remove bookmark error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Get user's bookmarked threads
app.get('/community/bookmarks', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const page  = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 20, 10);
    const skip  = (page - 1) * limit;

    // no populate needed to restore icon state
    const docs = await UserBookmark.find({ userId })
      .select('threadId')
      .sort({ bookmarkedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const ids = docs
      .map(d => d.threadId)
      .filter(Boolean)
      .map(String);

    const total = await UserBookmark.countDocuments({ userId });

    res.json({
      success: true,
      bookmarks: ids, // <— flat list of thread IDs
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookmarks: total,
        hasNextPage: skip + docs.length < total
      }
    });
  } catch (e) {
    console.error('Get bookmarks error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Check if thread is bookmarked by user
app.get('/community/threads/:id/bookmark-status', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    
    const bookmark = await UserBookmark.findOne({ userId, threadId });
    
    res.json({
      success: true,
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?._id
    });
  } catch (e) {
    console.error('Check bookmark status error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Get user's vote status for a thread
app.get('/community/threads/:id/vote-status', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    const userVote = thread.userVotes.find(vote => vote.userId.toString() === userId);
    
    res.json({
      success: true,
      userVote: userVote ? userVote.voteType : null,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      votes: thread.votes
    });
  } catch (e) {
    console.error('Check vote status error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Vote on answer
app.post('/community/threads/:id/answers/:answerId/vote', authenticateToken, async (req, res) => {
  try {
    const { type = 'upvote' } = req.body || {};
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const answerId = req.params.answerId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    
    const answer = thread.answers.id(answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });
    
    // Check if user already voted on this answer
    const existingVote = answer.userVotes.find(vote => vote.userId.toString() === userId);
    
    if (existingVote) {
      if (existingVote.voteType === type) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already voted on this answer',
          currentVote: existingVote.voteType
        });
      } else {
        // User is changing their vote
        if (existingVote.voteType === 'upvote') {
          answer.upvotes = Math.max(0, answer.upvotes - 1);
        } else {
          answer.downvotes = Math.max(0, answer.downvotes - 1);
        }
        answer.userVotes = answer.userVotes.filter(vote => vote.userId.toString() !== userId);
      }
    }
    
    // Add new vote
    if (type === 'upvote') {
      answer.upvotes += 1;
    } else if (type === 'downvote') {
      answer.downvotes += 1;
    }
    
    // Add user vote record
    answer.userVotes.push({
      userId: userId,
      voteType: type,
      votedAt: new Date()
    });
    
    // Update net votes
    answer.votes = answer.upvotes - answer.downvotes;
    
    // Auto-mark best answer based on upvotes
    await updateBestAnswer(thread);
    
    await thread.save();
    
    res.json({ 
      success: true, 
      upvotes: answer.upvotes, 
      downvotes: answer.downvotes, 
      votes: answer.votes,
      userVote: type
    });
  } catch (e) {
    console.error('Vote answer error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Add reply to answer
app.post('/community/threads/:id/answers/:answerId/reply', authenticateToken, async (req, res) => {
  try {
    const { body } = req.body;
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const answerId = req.params.answerId;
    
    console.log('🔄 Reply request:', { body: body?.substring(0, 50) + '...', userId, threadId, answerId });
    console.log('🔄 User object:', req.user);
    
    if (!body || !body.trim()) {
      console.log('❌ Missing reply body');
      return res.status(400).json({ success: false, message: 'Reply body is required' });
    }
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      console.log('❌ Thread not found:', threadId);
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    const answer = thread.answers.id(answerId);
    if (!answer) {
      console.log('❌ Answer not found:', answerId, 'in thread:', threadId);
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    
    // Check if user is the original poster
    const isOP = thread.authorId && thread.authorId.toString() === userId;
    
    const reply = {
      authorId: userId,
      authorName: req.user.username || '@anonymous',
      author: req.user.username || '@anonymous',
      body: body.trim(),
      isOP: isOP
    };
    
    console.log('✅ Adding reply:', reply);
    answer.replies.push(reply);
    await thread.save();
    
    console.log('✅ Reply added successfully');
    res.json({ 
      success: true, 
      message: 'Reply added successfully',
      reply: answer.replies[answer.replies.length - 1]
    });
  } catch (e) {
    console.error('❌ Add reply error:', e.message);
    console.error('❌ Full error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});
// Vote comment (for replies to answers)
app.post('/community/threads/:id/comments/:commentId/vote', authenticateToken, async (req, res) => {
  try {
    const { type = 'upvote' } = req.body || {};
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const commentId = req.params.commentId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    // Find the comment in any answer's replies
    let comment = null;
    let answer = null;
    for (const a of thread.answers) {
      comment = a.replies.id(commentId);
      if (comment) {
        answer = a;
        break;
      }
    }
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    // Check if user already voted
    const existingVote = comment.userVotes.find(vote => vote.userId.toString() === userId);
    
    if (existingVote) {
      if (existingVote.voteType === type) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already voted on this comment',
          currentVote: existingVote.voteType
        });
      } else {
        // User is changing their vote
        if (existingVote.voteType === 'upvote') {
          comment.upvotes = Math.max(0, comment.upvotes - 1);
        } else {
          comment.downvotes = Math.max(0, comment.downvotes - 1);
        }
        comment.userVotes = comment.userVotes.filter(vote => vote.userId.toString() !== userId);
      }
    }
    
    // Add new vote
    if (type === 'upvote') {
      comment.upvotes += 1;
    } else if (type === 'downvote') {
      comment.downvotes += 1;
    }
    
    comment.userVotes.push({
      userId: userId,
      voteType: type,
      votedAt: new Date()
    });
    
    comment.votes = comment.upvotes - comment.downvotes;
    await thread.save();
    
    res.json({ 
      success: true, 
      upvotes: comment.upvotes, 
      downvotes: comment.downvotes, 
      votes: comment.votes,
      userVote: type
    });
  } catch (e) {
    console.error('Vote comment error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});
// Add comment to answer (alias for reply)
app.post('/community/threads/:id/answers/:answerId/comments', authenticateToken, async (req, res) => {
  try {
    const { body } = req.body;
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const answerId = req.params.answerId;
    
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Comment body is required' });
    }
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    const answer = thread.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    
    const isOP = thread.authorId && thread.authorId.toString() === userId;
    
    const comment = {
      authorId: userId,
      authorName: req.user.username || '@anonymous',
      author: req.user.username || '@anonymous',
      body: body.trim(),
      isOP: isOP
    };
    
    answer.replies.push(comment);
    await thread.save();
    
    res.json({ 
      success: true, 
      message: 'Comment added successfully',
      comment: answer.replies[answer.replies.length - 1]
    });
  } catch (e) {
    console.error('Add comment error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Delete answer
app.delete('/community/threads/:id/answers/:answerId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const answerId = req.params.answerId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    
    const answer = thread.answers.id(answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });
    
    // Check if user is the author of the answer
    if (String(answer.authorId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own answers' });
    }
    
    // Remove the answer
    thread.answers.pull(answerId);
    await thread.save();
    
    res.json({ success: true, message: 'Answer deleted successfully' });
  } catch (e) {
    console.error('Delete answer error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Delete comment
app.delete('/community/threads/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const commentId = req.params.commentId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    
    // Find the comment in any answer's replies
    let comment = null;
    let answer = null;
    for (const a of thread.answers) {
      comment = a.replies.id(commentId);
      if (comment) {
        answer = a;
        break;
      }
    }
    
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    
    // Check if user is the author of the comment
    if (String(comment.authorId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }
    
    // Remove the comment
    answer.replies.pull(commentId);
    await thread.save();
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (e) {
    console.error('Delete comment error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Delete reply (nested reply to comment)
app.delete('/community/threads/:id/comments/:commentId/replies/:replyId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const commentId = req.params.commentId;
    const replyId = req.params.replyId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    
    // Find the comment and reply
    let comment = null;
    let reply = null;
    let answer = null;
    
    for (const a of thread.answers) {
      comment = a.replies.id(commentId);
      if (comment) {
        answer = a;
        // Check if this comment has nested replies
        if (comment.replies && comment.replies.length > 0) {
          reply = comment.replies.id(replyId);
        }
        break;
      }
    }
    
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
    
    // Check if user is the author of the reply
    if (String(reply.authorId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own replies' });
    }
    
    // Remove the reply
    comment.replies.pull(replyId);
    await thread.save();
    
    res.json({ success: true, message: 'Reply deleted successfully' });
  } catch (e) {
    console.error('Delete reply error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Add reply to comment (nested reply)
app.post('/community/threads/:id/comments/:commentId/replies', authenticateToken, async (req, res) => {
  try {
    const { body } = req.body;
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const commentId = req.params.commentId;
    
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Reply body is required' });
    }
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    // Find the comment in any answer's replies
    let comment = null;
    let answer = null;
    for (const a of thread.answers) {
      comment = a.replies.id(commentId);
      if (comment) {
        answer = a;
        break;
      }
    }
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    const isOP = thread.authorId && thread.authorId.toString() === userId;
    
    const reply = {
      authorId: userId,
      authorName: req.user.username || '@anonymous',
      author: req.user.username || '@anonymous',
      body: body.trim(),
      isOP: isOP
    };
    
    // For now, we'll add it as a new reply to the answer since we don't have nested replies in the schema
    // TODO: Implement proper nested replies in the schema
    answer.replies.push(reply);
    await thread.save();
    
    res.json({ 
      success: true, 
      message: 'Reply added successfully',
      reply: answer.replies[answer.replies.length - 1]
    });
  } catch (e) {
    console.error('Add comment reply error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Get answer vote status
app.get('/community/threads/:id/answers/:answerId/vote-status', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const threadId = req.params.id;
    const answerId = req.params.answerId;
    
    const thread = await CommunityThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    
    const answer = thread.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    
    const userVote = answer.userVotes.find(vote => vote.userId.toString() === userId);
    
    res.json({
      success: true,
      userVote: userVote ? userVote.voteType : null,
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      votes: answer.votes
    });
  } catch (e) {
    console.error('Check answer vote status error:', e.message);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Helper function to update best answer
async function updateBestAnswer(thread) {
  if (!thread.answers || thread.answers.length === 0) return;
  
  // Find answer with highest upvotes
  let bestAnswer = null;
  let maxUpvotes = 0;
  
  thread.answers.forEach(answer => {
    if (answer.upvotes > maxUpvotes) {
      maxUpvotes = answer.upvotes;
      bestAnswer = answer;
    }
  });
  
  // Reset all best answer flags
  thread.answers.forEach(answer => {
    answer.isBestAnswer = false;
  });
  
  // Mark the best answer (only if it has at least 1 upvote)
  if (bestAnswer && maxUpvotes > 0) {
    bestAnswer.isBestAnswer = true;
  }
}

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
    const domain = await getDomainFromUniversityName(universityName);
    const logoUrl = domain ? `https://logo.clearbit.com/${domain}?size=128` : '';
    
    // Use full university name as display name
    const displayName = universityName;
    
    // Get color from official university color schemes
    const colors = await getOfficialUniversityColors(universityName);

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

// Helper: Clear university branding cache (for testing/fixing)
app.delete('/university-branding/:universityName', async (req, res) => {
  try {
    const { universityName } = req.params;
    const result = await UniversityBranding.findOneAndDelete({
      universityName: new RegExp(`^${universityName}$`, 'i')
    });
    
    if (result) {
      res.json({ success: true, message: 'Cache cleared', deletedEntry: result });
    } else {
      res.json({ success: false, message: 'No cached entry found' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: true, message: 'Server error' });
  }
});

// Helper: Smart domain lookup using database first, then fallback
async function getDomainFromUniversityName(name) {
  if (!name) return null;
  
  const normalized = name.toLowerCase().trim();
  
  try {
    // 1. Check database for exact match or alias
    const dbEntry = await UniversityBranding.findOne({
      $or: [
        { universityName: new RegExp(`^${name}$`, 'i') },
        { displayName: new RegExp(`^${name}$`, 'i') }
      ]
    });
    
    if (dbEntry && dbEntry.domain) {
      console.log(`🎯 DB lookup found: ${name} -> ${dbEntry.domain}`);
      return dbEntry.domain;
    }
    
    // 2. Try fuzzy matching for common aliases (more specific)
    const words = normalized.split(' ');
    if (words.length >= 2) {
      const fuzzyMatch = await UniversityBranding.findOne({
        $or: [
          { universityName: new RegExp(`${words[0]}.*${words[1]}`, 'i') },
          { displayName: new RegExp(`${words[0]}.*${words[1]}`, 'i') }
        ]
      });
      
      if (fuzzyMatch && fuzzyMatch.domain) {
        console.log(`🔍 Fuzzy match found: ${name} -> ${fuzzyMatch.domain}`);
        return fuzzyMatch.domain;
      }
    }
    
  } catch (error) {
    console.error('Database lookup error:', error);
  }
  
  // 3. Fallback to algorithmic approach
  console.log(`🤖 Using fallback algorithm for: ${name}`);
  
  // Handle special cases
  if (normalized.includes('texas') && normalized.includes('dallas')) {
    return 'utdallas.edu';
  }
  
  if (normalized.includes('penn') && normalized.includes('state')) {
    return 'psu.edu';
  }
  
  // Try to construct domain
  const cleaned = normalized.replace(/university|college|of|the|at/g, ' ').replace(/\s+/g, ' ').trim();
  const firstWord = cleaned.split(' ')[0];
  
  if (firstWord && firstWord.length > 2) {
    return firstWord + '.edu';
  }
  
  return cleaned.replace(/\s+/g, '') + '.edu';
}

// Helper: Get official university colors from database first, then fallback
async function getOfficialUniversityColors(name) {
  if (!name) return { primary: '#2F64FF', secondary: '#FFA500', textColor: '#FFFFFF' };
  
  try {
    // 1. Check database for colors
    const dbEntry = await UniversityBranding.findOne({
      $or: [
        { universityName: new RegExp(`^${name}$`, 'i') },
        { displayName: new RegExp(`^${name}$`, 'i') }
      ]
    });
    
    if (dbEntry && dbEntry.primaryColor) {
      console.log(`🎨 DB colors found: ${name} -> ${dbEntry.primaryColor}`);
      return {
        primary: dbEntry.primaryColor,
        secondary: dbEntry.secondaryColor || '#FFFFFF',
        textColor: dbEntry.textColor || '#FFFFFF'
      };
    }
    
  } catch (error) {
    console.error('Database color lookup error:', error);
  }
  
  // 2. Default fallback (NewRun brand colors)
  console.log(`🎨 Using default colors for: ${name}`);
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
    console.log(`🔍 Debug - registerUser event received for userId: ${userId}`);
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
      
      // Debug: List all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      console.log(`🔍 Debug - Socket ${socket.id} is in rooms:`, rooms);
      
      // Debug: Check if the room was created
      const roomExists = io.sockets.adapter.rooms.has(`user_${userId}`);
      console.log(`🔍 Debug - Room user_${userId} exists after join:`, roomExists);
    } else {
      console.log(`❌ Debug - registerUser called with undefined/null userId`);
    }
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

    // Generate both verification methods
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Set both verification methods in user record
    user.emailVerificationCode = verificationCode;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send verification email with BOTH options
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    try {
      const emailResult = await emailService.sendEmailVerificationWithCode(
        user.email, 
        user.firstName, 
        verificationLink,
        verificationCode
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Continue with registration even if email fails
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with registration even if email fails
    }

    // Fix JWT expiry - use 24h instead of 25 days
    const accessToken = jwt.sign({user},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '24h',
    });

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Registration Successful! Please check your email to verify your account. You can either click the link or enter the verification code.",
        emailVerificationSent: true
    });
});
// Consolidated email verification endpoint (code-based only)
app.post('/verify-email', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        error: true, 
        message: 'Verification code is required' 
      });
    }

    // Find the OTP record
    const record = await EmailOTP.findOne({ code: String(code) }).sort({ lastSentAt: -1 });
    if (!record) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid or expired code.' 
      });
    }

    // Check if code is expired
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: true, 
        message: 'Code expired. Please request a new one.' 
      });
    }

    // Check attempt limit
    if (record.attempts >= 5) { // MAX_ATTEMPTS
      return res.status(429).json({ 
        error: true, 
        message: 'Too many attempts. Request a new code.' 
      });
    }

    // Find the user
    const user = await User.findOne({ email: record.email });
    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: 'User not found' 
      });
    }
    
    if (user.emailVerified) {
      return res.json({ 
        error: false, 
        message: 'Email already verified' 
      });
    }

    // Verify the code
    if (record.code !== String(code)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ 
        error: true, 
        message: 'That code doesn\'t look right. Try again.' 
      });
    }

    // Success - mark email as verified
    user.emailVerified = true;
    await user.save();
    await EmailOTP.deleteMany({ email: user.email });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName || 'there');
      console.log('Welcome email sent to:', user.email);
    } catch (welcomeEmailError) {
      console.error('Failed to send welcome email:', welcomeEmailError);
      // Don't fail the verification if welcome email fails
    }

    return res.json({ 
      error: false, 
      message: 'Email verified successfully! Welcome to NewRun!',
      user: {
        id: user._id,
        email: user.email,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
});

// Resend email verification code endpoint
app.post('/resend-email-verification', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;

    if (user.emailVerified) {
      return res.status(400).json({
        error: true,
        message: 'Email already verified'
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user record
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send verification code email
    const emailResult = await emailService.sendOTP(
      user.email, 
      user.firstName, 
      verificationCode
    );

    if (!emailResult.success) {
      return res.status(500).json({
        error: true,
        message: 'Failed to send verification code',
        details: emailResult.error
      });
    }

    res.json({
      error: false,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error'
    });
  }
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

  app.get('/api/auth/google/callback', async (req, res, next) => {
    console.log('[OAuth] Callback route hit', { queryKeys: Object.keys(req.query || {}) });
    try {
      passport.authenticate('google', async (err, user, info) => {
        console.log('[OAuth] Passport authenticate callback invoked', { hasErr: !!err, hasUser: !!user, hasInfo: !!info });
        if (err) {
          const rawBody = err.oauthError && err.oauthError.data ? String(err.oauthError.data) : '';
          const shortBody = rawBody.length > 400 ? rawBody.slice(0, 400) + '…' : rawBody;
          console.error('Google OAuth Token error:', {
            code: err.code,
            message: err.message,
            status: err.status,
            body: shortBody,
          });
          const reason = encodeURIComponent(err.code || 'oauth_error');
          const desc = encodeURIComponent((err.message || '').slice(0, 200));
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${reason}&desc=${desc}`);
        }
        if (!user) {
          const reason = encodeURIComponent(info?.message || 'google_auth_failed');
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${reason}`);
        }

        // Check if user has completed onboarding
        const hasCompletedOnboarding = user.onboardingData?.completed === true;
        console.log('[OAuth] User onboarding status:', { 
          userId: user._id, 
          hasCompletedOnboarding,
          onboardingData: user.onboardingData 
        });

        // Keep JWT small to avoid exceeding proxy header limits on redirect
        const tokenPayload = {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username || undefined,
        };
        const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '24h',
        });
        console.log('[OAuth] Redirecting with JWT length:', accessToken.length);
        
        // Redirect to onboarding if not completed, otherwise dashboard
        const redirectPath = hasCompletedOnboarding ? '/dashboard' : '/onboarding';
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}${redirectPath}?token=${accessToken}`);
      })(req, res, next);
      } catch (error) {
      console.error('Google OAuth callback handler error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`);
      }
  });
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

// Enterprise-grade OTP system constants
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const DAILY_CAP = 10;

const now = () => new Date();

// Send email verification
app.post('/send-email-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
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

    const dayKey = new Date().toISOString().slice(0, 10);

    let record = await EmailOTP.findOne({ email: user.email, dayKey });

    // Enforce cooldown
    if (record && record.lastSentAt && now() - record.lastSentAt < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now() - record.lastSentAt)) / 1000);
      return res.status(429).json({ 
        error: true, 
        message: `Please wait ${retryAfter}s before requesting again.`, 
        retryAfterSecs: retryAfter 
      });
    }

    // Enforce daily cap
    const count = record?.dailyCount ?? 0;
    if (count >= DAILY_CAP) {
      return res.status(429).json({ 
        error: true, 
        message: 'Daily limit reached. Try again tomorrow.' 
      });
    }

    // Generate new code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // upsert
    if (!record) {
      record = await EmailOTP.create({
        email: user.email,
        code,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        dailyCount: 1,
        dayKey
      });
    } else {
      record.code = code;
      record.expiresAt = expiresAt;
      record.attempts = 0;
      record.lastSentAt = new Date();
      record.dailyCount = count + 1;
      await record.save();
    }

    // Send OTP-only email
    const emailResult = await emailService.sendEmailVerificationWithCode(
      user.email, 
      user.firstName, 
      null, // no link needed
      code
    );

    if (emailResult.success) {
      res.json({
        error: false,
        message: 'Verification email sent successfully!',
        cooldownSecs: Math.floor(RESEND_COOLDOWN_MS / 1000),
        ttlSecs: Math.floor(OTP_TTL_MS / 1000)
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
    const resetLink = `${process.env.FRONTEND_URL || 'http://www.newrun.club'}/reset-password?tokenId=${tokenId}`;

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
app.post('/save-onboarding', authenticateToken, requireEmailVerified, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { onboardingData } = req.body;

    console.log('🔧 SAVE ONBOARDING API CALLED');
    console.log('👤 User ID:', userId);
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📊 Onboarding data:', JSON.stringify(onboardingData, null, 2));
    // Get user from database to check current onboarding data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
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
    const userDoc = await User.findById(userId);
    
    if (!userDoc) {
      console.error('❌ User document not found in database');
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Update the user document with onboarding data (CONSOLIDATED APPROACH)
    userDoc.onboardingData = onboardingDataToSave;
    
    // Auto-populate synapse data from onboardingData (only if synapse doesn't exist yet)
    if (!userDoc.synapse) {
      userDoc.synapse = {};
    }
    
    // Auto-populate synapse.culture.home.city from onboardingData.city
    if (onboardingData.city && !userDoc.synapse.culture?.home?.city) {
      if (!userDoc.synapse.culture) userDoc.synapse.culture = {};
      if (!userDoc.synapse.culture.home) userDoc.synapse.culture.home = {};
      userDoc.synapse.culture.home.city = onboardingData.city;
      console.log(`🔄 Auto-populating synapse city: ${onboardingData.city}`);
    }

    // Auto-populate synapse.logistics.budgetMax from onboardingData.budgetRange.max
    if (onboardingData.budgetRange?.max && !userDoc.synapse.logistics?.budgetMax) {
      if (!userDoc.synapse.logistics) userDoc.synapse.logistics = {};
      userDoc.synapse.logistics.budgetMax = onboardingData.budgetRange.max;
      console.log(`🔄 Auto-populating synapse budget: ${onboardingData.budgetRange.max}`);
    }
    
    // REMOVED: No longer duplicating data to root level fields
    // Data is now only stored in onboardingData and auto-populated to synapse
    
    const savedUser = await userDoc.save();
    // console.log('✅ User saved successfully');
    // console.log('💾 After save - userDoc.onboardingData:', JSON.stringify(userDoc.onboardingData, null, 2));
    // console.log('💾 Saved user document:', JSON.stringify(savedUser, null, 2));

    // Verify the data was actually saved by fetching from database
    const verifyUser = await User.findById(userId);
    console.log('🔍 Verification - User from database:', JSON.stringify(verifyUser, null, 2));

    res.json({
      error: false,
      message: 'Onboarding data saved successfully',
      user: {
        id: userId,
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
    // Get user ID from JWT token (support both token shapes)
    const userId = getAuthUserId(req);
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

// Update university endpoint (allows users to correct their university after onboarding)
app.post('/update-university', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { university } = req.body;

    console.log(`🏫 University update request for user ${userId}`, { university });

    if (!university || typeof university !== 'string') {
      return res.status(400).json({
        error: true,
        message: 'University name is required and must be a string'
      });
    }

    const trimmedUniversity = university.trim();
    if (trimmedUniversity.length === 0 || trimmedUniversity.length > 150) {
      return res.status(400).json({
        error: true,
        message: 'University name must be between 1 and 150 characters'
      });
    }

    // Find and update user
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // console.log(`   Old university: ${userDoc.university}`);
    // console.log(`   New university: ${trimmedUniversity}`);

    // Update both fields
    userDoc.university = trimmedUniversity;
    
    // Also update onboarding data if it exists
    if (userDoc.onboardingData) {
      userDoc.onboardingData.university = trimmedUniversity;
    }

    await userDoc.save();

    console.log(`✅ University updated successfully for user ${userId}`);

    res.json({
      error: false,
      message: 'University updated successfully',
      university: trimmedUniversity,
      user: {
        id: userDoc._id,
        university: userDoc.university
      }
    });
  } catch (error) {
    console.error('❌ Error updating university:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update university',
      details: error.message
    });
  }
});

// Get user API:
// app.get("/get-user", authenticateToken, async (req, res) => {
//     const { user } = req.user;

//     try {
//         const isUser = await User.findOne({ _id: userId });

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
  const payloadUser = (req?.user?.user || req?.user); // support both token shapes
  try {
    const userId = payloadUser?._id || payloadUser?.id;
    if (!userId) return res.sendStatus(401);
    const isUser = await User.findById(userId);
    if (!isUser) return res.sendStatus(401);

    // Consolidate all user data into onboardingData for consistent API
    const consolidatedOnboardingData = {
      // Basic profile info
      firstName: isUser.firstName,
      lastName: isUser.lastName,
      email: isUser.email,
      avatar: isUser.avatar,
      createdOn: isUser.createdOn,
      
      // Location and personal info
      currentLocation: isUser.currentLocation,
      hometown: isUser.hometown,
      birthday: isUser.birthday,
      
      // Academic info
      university: isUser.university,
      major: isUser.major,
      graduationDate: isUser.graduationDate,
      schoolDepartment: isUser.schoolDepartment,
      cohortTerm: isUser.cohortTerm,
      campusLabel: isUser.campusLabel,
      campusPlaceId: isUser.campusPlaceId,
      campusDisplayName: isUser.campusDisplayName,
      
    // Merge with existing onboarding data
    ...(isUser.onboardingData || {}),
  };

  console.log('🔍 Backend get-user - isUser.onboardingData:', JSON.stringify(isUser.onboardingData, null, 2));
  console.log('🔍 Backend get-user - consolidatedOnboardingData:', JSON.stringify(consolidatedOnboardingData, null, 2));

  return res.json({
      user: {
        _id: isUser._id,
        firstName: isUser.firstName,
        lastName: isUser.lastName,
        email: isUser.email,
        avatar: isUser.avatar,
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
        
        // ✨ consolidated onboarding data with ALL user info
        onboardingData: consolidatedOnboardingData,
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

// Profile Picture Upload API
app.post("/upload-avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    console.log('📸 Avatar upload request received');
    console.log('📸 User ID:', getAuthUserId(req));
    console.log('📸 File:', req.file);
    console.log('📸 File location:', req.file?.location);
    
    const userId = getAuthUserId(req);
    
    if (!userId) {
      return res.status(401).json({ error: true, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: true, message: "No image file provided" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: true, 
        message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." 
      });
    }

    // Validate file size (30MB max)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: true, 
        message: "File too large. Maximum size is 30MB." 
      });
    }

    const avatarUrl = req.file.location;
    
    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({
      error: false,
      message: "Avatar updated successfully",
      avatarUrl,
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        currentLocation: updatedUser.currentLocation,
        hometown: updatedUser.hometown,
        birthday: updatedUser.birthday,
        university: updatedUser.university,
        major: updatedUser.major,
        graduationDate: updatedUser.graduationDate,
        schoolDepartment: updatedUser.schoolDepartment,
        cohortTerm: updatedUser.cohortTerm,
        campusLabel: updatedUser.campusLabel,
        campusPlaceId: updatedUser.campusPlaceId,
        campusDisplayName: updatedUser.campusDisplayName,
      }
    });

  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({
      error: true,
      message: "Failed to upload avatar",
    });
  }
});

// Add Property API:
app.post('/add-property', authenticateToken, requireEmailVerified, async (req, res) => {
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
    const property = await Property.findOne({ _id: propertyId, userId: userId });

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
        const properties = await Property.find({ userId: userId })
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
  const userId = req.user ? req.userId : null; // Check if user is authenticated
  try {
      console.log('🔍 GET /get-all-property called');
      console.log('🔍 User ID:', userId);
      
      const properties = await Property.find({})
          .sort({ isPinned: -1 })
          .populate('userId', 'firstName lastName');
      
      console.log(`📊 Total properties found in DB: ${properties.length}`);
      console.log('📊 Property IDs:', properties.map(p => p._id));
      
      const propertiesWithLikes = properties.map((property) => ({
          ...property.toObject(),
          likesCount: property.likes.length,
          likedByUser: userId ? property.likes.includes(userId) : false
      }));

      console.log(`✅ Returning ${propertiesWithLikes.length} properties to frontend`);

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
        const property = await Property.findOne({ _id: propertyId, userId:userId
        });

        if(!property){
            return res.status(404).json({error:true,message:"Note not found"});
        }

        await Property.deleteOne({ _id: propertyId, userId:userId
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
  const userId = req.user ? req.userId : null;

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
        const property = await Property.findOne({_id:propertyId,userId:userId});

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
      availabilityStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = {};

    // Availability status filter - only add if provided
    if (availabilityStatus) {
      filter.availabilityStatus = availabilityStatus;
    }

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
    const userId = req.user ? req.userId : null;
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
    const userId = getAuthUserId(req); // compat if you change middleware later
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

    // If there's already a doc, don't create another; tell client it's already pending/approved
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

// Phone verification routes
const phoneVerificationRouter = require('./routes/phoneVerification');
app.use('/api/phone', phoneVerificationRouter);

// Notifications routes (includes verification + contact requests)
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);

// User verification status and notifications
app.get('/api/user/verification-status', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    
    const verificationStatus = {
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      hasUnverifiedEmail: !user.emailVerified,
      hasUnverifiedPhone: !user.phoneVerified,
      needsVerification: !user.emailVerified || !user.phoneVerified
    };

    // Generate notifications for unverified users
    const notifications = [];
    
    if (!user.emailVerified) {
      notifications.push({
        id: 'email_verification',
        type: 'warning',
        title: 'Email Verification Required',
        message: 'Please verify your email address to access all features',
        action: 'Verify Email',
        actionUrl: '/verify-email',
        priority: 'high',
        dismissible: false
      });
    }
    
    if (!user.phoneVerified) {
      notifications.push({
        id: 'phone_verification',
        type: 'info',
        title: 'Phone Verification Available',
        message: 'Add your phone number for enhanced security and features',
        action: 'Add Phone',
        actionUrl: '/add-phone',
        priority: 'medium',
        dismissible: true
      });
    }

    res.json({
      error: false,
      verificationStatus,
      notifications,
      unreadCount: notifications.length
    });

  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get verification status'
    });
  }
});


// New Platform Entity Routes - Temporarily disabled (moved to Upcoming Features)
// const studentFinanceRouter = require('./routes/studentFinance');
// const academicHubRouter = require('./routes/academicHub');
// const academicRoutes = require('./routes/academicRoutes');
// app.use('/api/finance', studentFinanceRouter);
// app.use('/api/academic', academicHubRouter);
// app.use('/api/academic', academicRoutes);

// Financial Management Models
const Transaction = require('./models/transaction.model');
const Budget = require('./models/budget.model');
const FinancialReport = require('./models/financialReport.model');

// Create a new marketplace item
app.post("/marketplace/item", authenticateToken, requireEmailVerified, async (req, res) => {
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
        userId: userId,
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
    const userId = getAuthUserId(req);

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
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: userId });
  
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
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: userId });
  
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
      const items = await MarketplaceItem.find({ userId: userId }); // Fetch items created by the logged-in user
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
  // const AIDataValidator = require('./services/aiDataValidator'); // File doesn't exist

  // AI Roommate Matching System
  const aiRoommateMatching = require('./ai-roommate-matching');

  // Helper function to get recommendations directly from database
  async function getRecommendationsDirectly(user, insightType) {
    try {
      if (insightType === 'housing') {
        // Direct property query
        let propertyQuery = {};
        if (user.onboardingData?.budgetRange?.min && user.onboardingData?.budgetRange?.max) {
          propertyQuery.price = { 
            $gte: user.onboardingData.budgetRange.min, 
            $lte: user.onboardingData.budgetRange.max 
          };
        }
        
        const rawProperties = await Property.find(propertyQuery)
          .limit(5)
          .select('title price bedrooms bathrooms address distanceFromUniversity contactInfo images availabilityStatus')
          .lean();
        
        // Direct roommate query
        let roommateQuery = { 
          'synapse.visibility.showAvatarInPreviews': true,
          university: user.university 
        };
        
        if (user.onboardingData?.budgetRange) {
          roommateQuery['onboardingData.budgetRange'] = {
            $gte: user.onboardingData.budgetRange.min,
            $lte: user.onboardingData.budgetRange.max
          };
        }
        
        const rawRoommates = await User.find(roommateQuery)
          .select('firstName lastName email university major synapse onboardingData')
          .limit(3)
          .lean();
        
        // Transform data
        const scoredProperties = PropertyDataTransformer.transformPropertiesForAI(rawProperties);
        const scoredRoommates = rawRoommates.map(roommate => 
          PropertyDataTransformer.transformRoommateForAI(roommate)
        );
        
        return {
          properties: scoredProperties,
          roommates: scoredRoommates,
          bestMatches: findBestPropertyRoommatePairs(scoredProperties, scoredRoommates)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting recommendations directly:', error);
      return null;
    }
  }

//   // Generate personalized insights using unified system
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

      // Use unified AI insights system
      const unifiedAIInsights = require('./services/unifiedAIInsights');
      const result = await unifiedAIInsights.generateUnifiedInsights(user, dashboardData, userContext);
      
      res.json(result);
    } catch (error) {
      console.error('AI Insights Error:', error);
      
      // Use unified system fallback
      const unifiedAIInsights = require('./services/unifiedAIInsights');
      const fallbackResult = unifiedAIInsights.generateFallbackInsights(user, dashboardData);
      res.json(fallbackResult);
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
      const systemPrompt = `You are an expert student advisor AI. Generate 4-6 personalized, actionable next steps for university students.

CRITICAL FORMAT: Each action must follow this EXACT structure:
**Label: [Short Action Name]**
**Description: [Detailed explanation with specific steps and context]**

MANDATORY: You MUST generate actions in this exact format. Do NOT include any other text or explanations.

PRIORITY FOCUS: Since this user has "Housing" in their focus areas, prioritize housing-related actions.

EXAMPLES (follow this exact format):
**Label: Browse Available Properties**
**Description: Check out properties in your budget range. Look for options near your university with good amenities and transportation access.**

**Label: Find Compatible Roommates**
**Description: Use the Synapse matching system to connect with potential roommates who share your lifestyle preferences and budget.**

**Label: Prepare Housing Essentials**
**Description: Gather essential items like bedding, cookware, and electronics for your new place. Check the marketplace for student deals.**

**Label: Explore Community Resources**
**Description: Join university groups and forums to get housing recommendations and connect with other students in your area.**

Focus on:
- Housing and roommate matching (since user has "Housing" and "Roommate" in focus)
- Budget-friendly options within their range
- University-specific resources and communities
- Essential items for housing setup

Generate ONLY housing-related actions. Do NOT include banking, financial, or other non-housing actions.`;

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
      // const validatedActions = AIDataValidator.validateActions(rawActions); // AIDataValidator not available
      const validatedActions = rawActions; // Use raw actions without validation for now
      
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
  const userId = getAuthUserId(req);
  if (!userId) return res.sendStatus(401);

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
      userId,
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
        onboardingData: updated.onboardingData || {},
      }
    });
  } catch (err) {
    console.error('PATCH /user/update error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- allow PATCHing only safe, known fields ---
const ALLOWED_USER_FIELDS = [
  'firstName','lastName','avatar','currentLocation','hometown','birthday',
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
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    console.log('Backend received data:', req.body);
    const updateDoc = buildUserUpdate(req.body);
    console.log('Built update doc:', updateDoc);
    if (Object.keys(updateDoc).length === 0) {
      console.log('No valid fields to update - returning 204');
      return res.sendStatus(204); // nothing to change; not an error
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

  // Get unread message count for user
  app.get('/messages/unread-count', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Invalid user authentication' });
      }

      // Count unread messages for this user
      const unreadCount = await Message.countDocuments({
        receiverId: userId,
        isRead: false
      });

      console.log(`Unread count for user ${userId}: ${unreadCount}`);
      res.json({ success: true, count: unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
  });

  // Mark messages as read in a conversation
  app.post('/conversations/:conversationId/mark-read', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { conversationId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Invalid user authentication' });
      }

      // Update all unread messages in this conversation for this user
      const result = await Message.updateMany(
        {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false
        },
        {
          $set: { isRead: true }
        }
      );

      console.log(`Marked ${result.modifiedCount} messages as read for user ${userId} in conversation ${conversationId}`);
      
      // Emit read status to other participants
      io.to(`conversation_${conversationId}`).emit('messageRead', {
        conversationId: conversationId,
        userId: userId,
        modifiedCount: result.modifiedCount
      });

      res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Initiate a conversation if it doesn't exist
  app.post('/conversations/initiate', authenticateToken, requireEmailVerified, async (req, res) => {
    const { receiverId } = req.body; // Only pass receiverId from the frontend
    const senderId = getAuthUserId(req); // Get the sender (current user) from the token

    // Check if senderId is valid
    if (!senderId) {
      console.error("Invalid senderId:", senderId);
      return res.status(401).json({ success: false, message: 'Invalid user authentication' });
    }

    // Prevent self-conversations
    if (senderId === receiverId) {
      console.error("Cannot create conversation with self:", senderId);
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    console.log("Creating conversation between:", senderId, "and", receiverId);

    try {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        // Ensure no duplicate participants
        const participants = [senderId, receiverId].filter((id, index, arr) => arr.indexOf(id) === index);
        conversation = new Conversation({
          participants: participants,
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
  app.post('/messages/send', authenticateToken, requireEmailVerified, async (req, res) => {
    console.log("Authenticated User:", req.user); // Debugging line
    const { conversationId, content, attachments, gif, emoji } = req.body;
    const senderId = getAuthUserId(req); // Current user from the token
  
    try {
      console.log("Request to send message with conversationId:", conversationId);
      
      // Check if senderId is valid
      if (!senderId) {
        console.error("Invalid senderId:", senderId);
        return res.status(401).json({ success: false, message: 'Invalid user authentication' });
      }
      
      const conversation = await Conversation.findById(conversationId);
  
      if (!conversation) {
        console.error(`Conversation with ID ${conversationId} not found.`);
        return res.status(403).json({ success: false, message: 'Conversation not found or unauthorized access' });
      }
      
      if (!conversation.participants.includes(senderId)) {
        console.error(`User ${senderId} is not a participant of conversation ${conversationId}.`);
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      // Clean up null participants and find the receiver
      const validParticipants = conversation.participants.filter(id => id !== null && id !== undefined);
      
      // If we have null participants, clean up the conversation
      if (validParticipants.length !== conversation.participants.length) {
        console.log("Cleaning up conversation with null participants");
        conversation.participants = validParticipants;
        await conversation.save();
      }
      
      const receiverId = validParticipants.find(id => id && senderId && id.toString() !== senderId.toString());
      
      console.log("Conversation participants:", conversation.participants);
      console.log("Valid participants:", validParticipants);
      console.log("Sender ID:", senderId);
      console.log("Receiver ID:", receiverId);
      
      if (!receiverId) {
        console.error("Could not find receiver in conversation participants");
        return res.status(400).json({ success: false, message: 'Invalid conversation: receiver not found' });
      }
  
      const newMessage = new Message({
        conversationId,
        senderId,
        receiverId,
        content,
        attachments,
        gif,
        emoji,
        readStatus: 'sent',
        sentAt: new Date(),
        deliveredAt: null,
        readAt: null
      });
  
      await newMessage.save();
  
      conversation.lastMessage = newMessage._id;
      conversation.lastUpdated = Date.now();
      await conversation.save();
  
      io.to(`conversation_${conversationId}`).emit('newMessage', {
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
    const userId = getAuthUserId(req);

    try {
      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate({
          path: 'participants',
          select: 'firstName lastName avatar', // Populate participant names and avatar
        })
        .populate({
          path: 'lastMessage',
          select: 'content timestamp senderId',
          populate: {
            path: 'senderId', // Populate sender's name in the last message
            select: 'firstName lastName avatar',
          },
        })
        .sort({ lastUpdated: -1 });

      // Clean up duplicate participants in conversations
      for (const conversation of conversations) {
        if (conversation.participants) {
          const uniqueParticipants = conversation.participants.filter((participant, index, arr) => 
            arr.findIndex(p => p._id && participant._id && p._id.toString() === participant._id.toString()) === index
          );
          
          if (uniqueParticipants.length !== conversation.participants.length) {
            console.log(`Cleaning up duplicate participants in conversation ${conversation._id}`);
            conversation.participants = uniqueParticipants;
            await conversation.save();
          }
        }
      }

      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all messages of a specific conversation
  app.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    const { conversationId } = req.params;
    const userId = getAuthUserId(req);

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
          select: 'firstName lastName avatar', // Populate sender names and avatar in each message
        })
        .sort({ timestamp: 1 }); // Sort messages by timestamp (earliest first)

      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // This endpoint is a duplicate - removing it

// =====================
// Dashboard Overview (NEW)
// =====================
  app.get('/dashboard/overview', authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const authed = getAuthUserId(req) || {};
      
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
      "We'll ping you when owners approve."
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
    const userId = getAuthUserId(req);
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
app.post("/synapse/preferences", authenticateToken, requireEmailVerified, async (req, res) => {
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

    // Calculate completion percentage
    const completionPercentage = calculateSynapseCompletion(norm);
    const isCompleted = completionPercentage >= 80;

    const updated = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          synapse: norm,
          synapseCompletion: {
            percentage: completionPercentage,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            lastUpdated: new Date()
          }
        } 
      },
      { new: true, projection: { synapse: 1, synapseCompletion: 1 } }
    ).lean();

    return res.json({ 
      ok: true, 
      preferences: updated?.synapse || {},
      completion: {
        percentage: completionPercentage,
        completed: isCompleted,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    console.error("POST /synapse/preferences error:", err);
    return res.status(500).json({ message: "Failed to save preferences" });
  }
});
// =====================
// SYNAPSE COMPLETION TRACKING
// =====================
// GET: Check Synapse completion status
app.get("/synapse/completion-status", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId, {
      synapseCompletion: 1,
      synapse: 1
    }).lean();

    const completion = user?.synapseCompletion || {};
    const synapse = user?.synapse || {};

    // Calculate completion percentage based on filled fields
    const completionPercentage = calculateSynapseCompletion(synapse);
    
    // Update completion status if needed
    const isCompleted = completionPercentage >= 80; // 80% threshold for completion
    
    if (isCompleted && !completion.completed) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          'synapseCompletion.completed': true,
          'synapseCompletion.completedAt': new Date(),
          'synapseCompletion.completionPercentage': completionPercentage
        }
      });
    }

    res.json({
      completed: isCompleted,
      completionPercentage,
      lastStep: completion.lastStep || 0,
      completedAt: completion.completedAt,
      totalSteps: completion.totalSteps || 11
    });
  } catch (error) {
    console.error('GET /synapse/completion-status error:', error);
    res.status(500).json({ message: 'Failed to get completion status' });
  }
});

// POST: Update Synapse progress
app.post("/synapse/progress", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { step, completionPercentage } = req.body;
    
    const updateData = {
      'synapseCompletion.lastStep': step || 0,
      'synapseCompletion.completionPercentage': completionPercentage || 0
    };

    // If completion is 100%, mark as completed
    if (completionPercentage >= 100) {
      updateData['synapseCompletion.completed'] = true;
      updateData['synapseCompletion.completedAt'] = new Date();
    }

    await User.findByIdAndUpdate(userId, { $set: updateData });

    res.json({ success: true });
  } catch (error) {
    console.error('POST /synapse/progress error:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

// POST: Mark Synapse as completed
app.post("/synapse/mark-complete", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await User.findByIdAndUpdate(userId, {
      $set: {
        'synapseCompletion.completed': true,
        'synapseCompletion.completedAt': new Date(),
        'synapseCompletion.completionPercentage': 100,
        'synapseCompletion.lastStep': 10 // Final step
      }
    });

    res.json({ success: true, message: 'Synapse marked as completed' });
  } catch (error) {
    console.error('POST /synapse/mark-complete error:', error);
    res.status(500).json({ message: 'Failed to mark as complete' });
  }
});

// Helper function to calculate completion percentage
function calculateSynapseCompletion(synapse) {
  if (!synapse || typeof synapse !== 'object') return 0;
  
  let completedFields = 0;
  let totalFields = 0;

  // Culture section (25% weight)
  const cultureFields = [
    'culture.primaryLanguage',
    'culture.home.country',
    'culture.home.region',
    'culture.home.city'
  ];
  cultureFields.forEach(field => {
    totalFields++;
    const value = field.split('.').reduce((obj, key) => obj?.[key], synapse);
    if (value && value.toString().trim() !== '') completedFields++;
  });

  // Logistics section (20% weight)
  const logisticsFields = [
    'logistics.moveInMonth',
    'logistics.budgetMax',
    'logistics.commuteMode'
  ];
  logisticsFields.forEach(field => {
    totalFields++;
    const value = field.split('.').reduce((obj, key) => obj?.[key], synapse);
    if (value !== null && value !== undefined && 
        !(Array.isArray(value) && value.length === 0)) completedFields++;
  });

  // Lifestyle section (25% weight)
  const lifestyleFields = [
    'lifestyle.sleepPattern',
    'lifestyle.cleanliness',
    'lifestyle.quietAfter',
    'lifestyle.quietUntil'
  ];
  lifestyleFields.forEach(field => {
    totalFields++;
    const value = field.split('.').reduce((obj, key) => obj?.[key], synapse);
    if (value !== null && value !== undefined && value !== '') completedFields++;
  });

  // Habits section (20% weight)
  const habitsFields = [
    'habits.diet',
    'habits.cookingFreq',
    'habits.smoking',
    'habits.drinking',
    'habits.partying'
  ];
  habitsFields.forEach(field => {
    totalFields++;
    const value = field.split('.').reduce((obj, key) => obj?.[key], synapse);
    if (value !== null && value !== undefined && value !== '') completedFields++;
  });

  // Pets section (10% weight)
  const petsFields = [
    'pets.hasPets',
    'pets.okWithPets'
  ];
  petsFields.forEach(field => {
    totalFields++;
    const value = field.split('.').reduce((obj, key) => obj?.[key], synapse);
    if (value !== null && value !== undefined) completedFields++;
  });

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

// Enhanced function to generate match explanations
function generateMatchExplanations(user, candidate, score) {
  const explanations = [];
  const userSynapse = user.synapse || {};
  const candidateSynapse = candidate.synapse || {};
  
  // Language compatibility
  if (userSynapse.culture?.primaryLanguage === candidateSynapse.culture?.primaryLanguage) {
    explanations.push({
      type: 'positive',
      category: 'language',
      text: `Both speak ${userSynapse.culture.primaryLanguage}`,
      weight: 20
    });
  }
  
  // Geographic compatibility
  if (userSynapse.culture?.home?.country === candidateSynapse.culture?.home?.country) {
    explanations.push({
      type: 'positive',
      category: 'geography',
      text: `Both from ${userSynapse.culture.home.country}`,
      weight: 8
    });
  }
  
  // Lifestyle compatibility
  if (userSynapse.lifestyle?.sleepPattern === candidateSynapse.lifestyle?.sleepPattern) {
    explanations.push({
      type: 'positive',
      category: 'lifestyle',
      text: `Similar sleep schedule (${userSynapse.lifestyle.sleepPattern})`,
      weight: 8
    });
  }
  
  // Cleanliness compatibility
  const userCleanliness = userSynapse.lifestyle?.cleanliness;
  const candidateCleanliness = candidateSynapse.lifestyle?.cleanliness;
  if (userCleanliness && candidateCleanliness && Math.abs(userCleanliness - candidateCleanliness) <= 1) {
    explanations.push({
      type: 'positive',
      category: 'lifestyle',
      text: `Similar cleanliness standards (${userCleanliness}/10 vs ${candidateCleanliness}/10)`,
      weight: 9
    });
  }
  
  // Habits compatibility
  const habitMatches = [];
  ['smoking', 'drinking', 'partying'].forEach(habit => {
    if (userSynapse.habits?.[habit] === candidateSynapse.habits?.[habit]) {
      habitMatches.push(habit);
    }
  });
  
  if (habitMatches.length > 0) {
    explanations.push({
      type: 'positive',
      category: 'habits',
      text: `Similar ${habitMatches.join(', ')} preferences`,
      weight: habitMatches.length * 4
    });
  }
  
  // Pet compatibility
  if (userSynapse.pets?.okWithPets === candidateSynapse.pets?.okWithPets) {
    explanations.push({
      type: 'positive',
      category: 'social',
      text: `Both ${userSynapse.pets.okWithPets ? 'okay' : 'not okay'} with pets`,
      weight: 7
    });
  }
  
  // Sort by weight and return top explanations
  return explanations
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(exp => ({ type: exp.type, text: exp.text }));
}
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

      console.log(`Synapse matches for user ${userId} (${me.firstName} ${me.lastName})`);
      console.log(`Scope: ${scope}, University: ${me.university}, Home Country: ${meHomeCountry}`);

      if (scope === "school" && me.university) {
        match.university = me.university;               // <-- top-level university
        console.log(`Filtering by university: ${me.university}`);
      } else if (scope === "country" && meHomeCountry) {
        match["synapse.culture.home.country"] = meHomeCountry;
        console.log(`Filtering by country: ${meHomeCountry}`);
      }
      // else "any": no extra narrowing

      console.log('Match filter:', JSON.stringify(match, null, 2));

      // Enhanced scoring weights for better compatibility matching
      const W = {
        // Language compatibility (30% total)
        langPrimarySame: 20,
        langCrossOK:     10,
        comfortBonus:    5,
        
        // Geographic compatibility (15% total)
        country:         8,
        region:          4,
        city:            3,
        
        // Lifestyle compatibility (25% total)
        commuteMode:     8,
        sleep:           8,
        cleanlinessNear: 9,
        
        // Habits compatibility (20% total)
        dietSame:        6,
        smokingSame:     5,
        drinkingSame:    4,
        partiesSame:     5,
        
        // Social compatibility (10% total)
        petsCompat:      7,
        socialCompatibility: 3,
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

      console.log('Executing aggregation pipeline...');
      const rows = await User.aggregate(pipeline);
      console.log(`Found ${rows.length} potential matches`);

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
          const today = new Date();
          const daysUntilArrival = Math.ceil((arrivalDate - today) / (1000 * 60 * 60 * 24));
          
          console.log('📅 Date calculation:', {
            arrivalDate: arrivalDate.toISOString(),
            today: today.toISOString(),
            daysUntilArrival: daysUntilArrival
          });
          
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
      
      // Split content into sections and look for **Label: and **Description:** patterns
      const sections = aiContent.split(/\*\*Label:/);
      
      sections.forEach((section, index) => {
        if (index === 0) return; // Skip first empty section
        
        const lines = section.split('\n');
        let label = '';
        let description = '';
        
        // Extract label (first line after **Label:)
        const labelLine = lines[0]?.trim();
        if (labelLine) {
          label = labelLine.replace(/\*\*$/, '').trim();
        }
        
        // Look for **Description:** in the section
        const descriptionMatch = section.match(/\*\*Description:\s*(.+?)(?=\*\*|$)/s);
        if (descriptionMatch) {
          description = descriptionMatch[1].trim();
        } else {
          // Fallback: use the rest of the content as description
          const remainingLines = lines.slice(1).join('\n').trim();
          description = remainingLines || label;
        }
        
        if (label && description && label !== description) {
          actions.push({
            label: label.length > 30 ? label.substring(0, 30) + '...' : label,
            description: description,
            path: getActionPath(label, userContext),
            icon: getActionIcon(label),
            color: getActionColor(index - 1),
            priority: index <= 2 ? 'high' : 'medium',
            aiGenerated: true
          });
        }
      });

      // Fallback: if no structured actions found, try the old format
      if (actions.length === 0) {
      const lines = aiContent.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        if (line.match(/^\d+\.|^[-*]|^•/)) {
          const cleanLine = line.replace(/^\d+\.|^[-*]|^•/, '').trim();
          if (cleanLine.length > 10) {
              const labelMatch = cleanLine.match(/^([^:]+?)(?:\s*:|\s*\.|$)/);
              const label = labelMatch ? labelMatch[1].trim() : cleanLine.substring(0, 25);
              
              const descriptionMatch = cleanLine.match(/^[^:]+:\s*(.+)$/);
              const description = descriptionMatch ? descriptionMatch[1].trim() : cleanLine;
              
            actions.push({
                label: label.length > 30 ? label.substring(0, 30) + '...' : label,
                description: description,
              path: getActionPath(cleanLine, userContext),
              icon: getActionIcon(cleanLine),
              color: getActionColor(index),
              priority: index < 2 ? 'high' : 'medium',
              aiGenerated: true
            });
          }
        }
      });
      }

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
      const arrivalDate = new Date(user.onboardingData.arrivalDate);
      const today = new Date();
      const daysUntilArrival = Math.ceil((arrivalDate - today) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Fallback date calculation:', {
        arrivalDate: arrivalDate.toISOString(),
        today: today.toISOString(),
        daysUntilArrival: daysUntilArrival
      });
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

  // AI Probe endpoint (no auth required for testing)
  app.get('/api/ai/insights/probe', (req, res) => {
    res.json({ 
      success: true, 
      message: 'AI insights endpoint is accessible',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

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

      // Category-aware tool instruction for explanations
      const category = insight?.category || (insight?.title || '').toLowerCase().includes('roommate') ? 'roommate' : 'housing';
      let toolDirective = '';
      if (category === 'housing') {
        toolDirective = `CRITICAL: For housing-related insights, you MUST call get_housing_recommendations to fetch specific properties (and related roommate context if needed).`;
      } else if (category === 'roommate') {
        toolDirective = `CRITICAL: For roommate-related insights, you MUST call get_roommate_recommendations to fetch specific candidates and compatibility details. Do not invent matches.`;
      } else {
        toolDirective = `CRITICAL: Use the appropriate tool for this category to fetch concrete data before explaining.`;
      }

      const systemPrompt = `You are a helpful NewRun advisor AI.
${toolDirective}

When explaining an insight:
1) Call the appropriate tool first
2) Use returned data to ground your explanation (names, scores, prices)
3) Reference concrete items and matches

Be conversational, motivating, and specific. ALWAYS start with a friendly greeting using the student's first name (e.g., "Hey [Name]!" or "Hi [Name]!"). Reference their timeline, budget, preferences, and current status. Keep it concise (120-180 words) and end with 2-3 actionable next steps.`;

              const userPrompt = `Student: ${userContext.profile.name}
        University: ${userContext.profile.university} (${userContext.profile.campusDisplayName})
        Major: ${userContext.profile.major}
        Arrival Date: ${userContext.onboarding?.arrivalDate || 'Not set'}
        Budget: $${userContext.onboarding?.budgetRange?.min || 'Unknown'} - $${userContext.onboarding?.budgetRange?.max || 'Unknown'}
        Current Status: ${userContext.dashboard?.propertiesCount || 0} properties listed, ${userContext.onboarding?.roommateInterest ? 'Interested in roommates' : 'No roommate interest'}

        Recommendation to explain: "${insight.title}" (Priority: ${insight.priority})`;

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
              description: "Get specific housing recommendations for the student",
              parameters: {
                type: "object",
                properties: {
                  insightType: { type: "string", enum: ["housing"] },
                  userProfile: { type: "object" }
                },
                required: ["insightType", "userProfile"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_roommate_recommendations",
              description: "Get specific roommate candidates and compatibility details",
              parameters: {
                type: "object",
                properties: {
                  userProfile: { type: "object" }
                },
                required: ["userProfile"]
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
      let explanation = aiMessage?.content || '';
      // Sanitize any literal tool placeholders that some models emit in content
      // e.g., "[get_housing_recommendations insightType: \"housing\"]"
      const toolPlaceholderRegex = /\[get_[^\]]+\]/gi;
      if (toolPlaceholderRegex.test(explanation)) {
        explanation = explanation.replace(toolPlaceholderRegex, '').trim();
      }
      // Also catch bare tool-call style text without brackets
      const bareToolCallRegex = /(^|\n)\s*get_[a-zA-Z0-9_]+[^\n]*/g;
      if (bareToolCallRegex.test(explanation)) {
        explanation = explanation.replace(bareToolCallRegex, '').trim();
      }
      
      let specificRecommendations = null;
      let structured = null;
      
      // Generate explanation directly without complex data fetching
      try {
        // Simple, reliable explanation generation
        const simplePrompt = `Please explain this insight in detail for ${userContext.profile.name}:

        Insight: ${insight.title}
        Message: ${insight.message}
        Priority: ${insight.priority}
        Category: ${insight.category}
        
        User Context:
        - University: ${userContext.profile.university}
        - Major: ${userContext.profile.major}
        - Arrival Date: ${userContext.arrivalDate || 'Not specified'}
        - Days until arrival: ${userContext.daysUntilArrival || 'Not calculated'}
        - Budget: $${userContext.onboardingData?.budget?.min || 'Not specified'} - $${userContext.onboardingData?.budget?.max || 'Not specified'}
        - Current Location: ${userContext.profile.currentLocation || 'Not specified'}
        
        Please provide a detailed, personalized explanation of why this recommendation is important for ${userContext.profile.name} and what they should do next.`;
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: "gpt-4o",
              temperature: 0.7,
              messages: [
                { role: "system", content: systemPrompt },
            { role: "user", content: simplePrompt }
              ]
            }, {
              headers: {
                Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            });
            
        explanation = response?.data?.choices?.[0]?.message?.content || '';
        
        // Final cleanup: strip any tool call artifacts
        explanation = explanation.replace(/\[get_[^\]]+\]/gi, '').replace(/(^|\n)\s*get_[a-zA-Z0-9_]+[^\n]*/g, '').trim();
        
      } catch (error) {
        console.error('Failed to generate explanation:', error);
        explanation = generateFallbackExplanation(insight, user, dashboardData);
      }

      // If this is a grouped insight, also return a structured payload the UI can render as mini-cards
      if (insight?.type === 'grouped' && insight?.group?.items && Array.isArray(insight.group.items)) {
        const items = insight.group.items.map((it) => {
          const base = {
            id: it.id,
            rank: it.rank,
            priority: it.priority || 'medium',
            href: it.href || null
          };
          if (insight.category === 'roommate') {
            return {
              ...base,
              name: it.name,
              score: it.score,
              reasons: Array.isArray(it.reasons) ? it.reasons : (typeof it.reasons === 'string' ? it.reasons.split(',').map(s=>s.trim()).filter(Boolean) : [])
            };
          }
          if (insight.category === 'housing') {
            return {
              ...base,
              title: it.title,
              price: it.price,
              distance: it.distance,
              description: it.description
            };
          }
          return base;
        });

        structured = {
          group: {
            kind: insight.category,
            title: insight.title,
            summary: insight.message,
          },
          items
        };
      }

      // Try to infer category if missing (roommate/housing) from title/message
      let inferredCategory = insight?.category;
      if (!inferredCategory) {
        const t = `${insight?.title || ''} ${insight?.message || ''}`.toLowerCase();
        if (/roommate|room\s*mate|match(es)?/i.test(t)) inferredCategory = 'roommate';
        else if (/housing|apartment|property|rent|lease/i.test(t)) inferredCategory = 'housing';
      }

      // Backend fallback: if no structured block was built, synthesize one from live recommendations
      if (!structured && insight && (inferredCategory === 'roommate' || inferredCategory === 'housing')) {
        try {
          const unifiedAIInsights = require('./services/unifiedAIInsights');
          if (inferredCategory === 'roommate') {
            const rec = await unifiedAIInsights.getRoommateRecommendations(user);
            const roommates = Array.isArray(rec?.roommates) ? rec.roommates.slice(0, 3) : [];
            if (roommates.length > 0) {
              const items = roommates.map((r, idx) => ({
                id: r._id,
                rank: idx + 1,
                name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
                score: Math.round(r.totalScore || r.score || 0),
                reasons: (unifiedAIInsights.getSharedPreferences(user, r) || '').split(',').map(s => s.trim()).filter(Boolean),
                priority: idx === 0 ? 'high' : 'medium',
                href: `/roommate/${r._id}`
              }));
              structured = {
                group: { kind: 'roommate', title: insight.title, summary: insight.message },
                items
              };
            }
          } else if (inferredCategory === 'housing') {
            const rec = await unifiedAIInsights.getHousingRecommendations(user);
            const properties = Array.isArray(rec?.properties) ? rec.properties.slice(0, 3) : [];
            if (properties.length > 0) {
              const items = properties.map((p, idx) => ({
                id: p._id,
                rank: idx + 1,
                title: p.name,
                price: p.price,
                distance: p.distance,
                description: p.description || 'Available property',
                priority: idx === 0 ? 'high' : 'medium',
                href: `/property/${p._id}`
              }));
              structured = {
                group: { kind: 'housing', title: insight.title, summary: insight.message },
                items
              };
            }
          }
        } catch (e) {
          console.error('Explain structured fallback failed:', e);
        }
      }
          
          res.json({ 
            success: true, 
        explanation: explanation || generateFallbackExplanation(insight, user, dashboardData),
        insight: insight,
        aiGenerated: true,
        specificRecommendations,
        structured
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
      const today = new Date();
      daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Explanation date calculation:', {
        arrivalDate: arrival.toISOString(),
        today: today.toISOString(),
        daysUntilArrival: daysUntilArrival
      });
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

  // =====================
  // UNIFIED ROOMMATE MATCHING ENDPOINT
  // =====================
  
  /**
   * POST /api/ai/roommate/match
   * Unified roommate matching with comprehensive input and output
   * Takes everything possible: user data, onboarding, synapse, dashboard, search criteria
   * Returns complete roommate matching results with AI insights and explanations
   */
  app.post('/api/ai/roommate/match', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Extract comprehensive input data
      const {
        // User profile data
        userProfile,
        // Onboarding information
        onboardingData,
        // Synapse preferences
        synapseData,
        // Dashboard data
        dashboardData,
        // Search criteria
        searchCriteria: {
          campusId,
          budgetRange,
          lifestyleFilters = {},
          language,
          dealbreakers = [],
          limit = 20,
          scope = 'all' // 'all', 'nearby', 'campus'
        } = {}
      } = req.body;

      // Use provided data or fallback to user data
      const userContext = {
        profile: userProfile || {
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
        onboarding: onboardingData || user.onboardingData,
        synapse: synapseData || user.synapse || {},
        dashboard: dashboardData,
        timestamp: new Date().toISOString()
      };

      // Build comprehensive roommate query
      let query = { 
        'synapse.visibility.showAvatarInPreviews': true,
        university: campusId || user.university,
        _id: { $ne: userId } // Exclude current user
      };
      
      // Budget filtering
      if (budgetRange) {
        query['onboardingData.budgetRange'] = {
          $gte: budgetRange.min,
          $lte: budgetRange.max
        };
      }

      // Lifestyle filtering
      if (lifestyleFilters.sleepPattern) {
        query['synapse.lifestyle.sleepPattern'] = lifestyleFilters.sleepPattern;
      }
      if (lifestyleFilters.cleanliness) {
        query['synapse.lifestyle.cleanliness'] = {
          $gte: lifestyleFilters.cleanliness - 1,
          $lte: lifestyleFilters.cleanliness + 1
        };
      }
      if (lifestyleFilters.smoking !== undefined) {
        query['synapse.habits.smoking'] = lifestyleFilters.smoking;
      }
      if (lifestyleFilters.partying !== undefined) {
        query['synapse.habits.partying'] = {
          $gte: lifestyleFilters.partying - 1,
          $lte: lifestyleFilters.partying + 1
        };
      }

      // Language filtering
      if (language) {
        query['synapse.culture.primaryLanguage'] = language;
      }

      // Dealbreakers filtering
      if (dealbreakers.length > 0) {
        const dealbreakerQuery = dealbreakers.map(dealbreaker => ({
          [`synapse.habits.${dealbreaker}`]: { $ne: true }
        }));
        if (dealbreakerQuery.length > 0) {
          query.$and = dealbreakerQuery;
        }
      }

      // Find potential roommates
      let roommates = await User.find(query)
        .select('firstName lastName email university major synapse onboardingData avatarUrl lastActive')
        .limit(limit)
        .lean();

      

      // Calculate comprehensive compatibility scores and explanations
      const scoredRoommates = roommates.map(roommate => {
        const compatibilityScore = calculateCompatibilityScore(user, roommate, lifestyleFilters, dealbreakers);
        const lifestyleMatch = calculateLifestyleMatch(user.synapse, roommate.synapse);
        const budgetMatch = calculateBudgetCompatibility(user.onboardingData?.budgetRange, roommate.onboardingData?.budgetRange);
        const socialMatch = calculateSocialCompatibility(user.synapse, roommate.synapse);
        
        // Generate match reasons
        const reasons = generateMatchReasons(user, roommate, {
          compatibilityScore,
          lifestyleMatch,
          budgetMatch,
          socialMatch
        });

        return {
          userId: roommate._id,
          firstName: roommate.firstName,
          lastName: roommate.lastName,
          name: `${roommate.firstName} ${roommate.lastName}`,
          avatarUrl: roommate.avatarUrl || "",
          university: roommate.university,
          graduation: roommate.synapse?.education?.graduation,
          verified: { edu: !!roommate.university },
          lastActive: roommate.lastActive,
          distanceMi: calculateDistance(user.currentLocation, roommate.currentLocation),
          budget: roommate.onboardingData?.budgetRange?.max || 0,
          keyTraits: extractKeyTraits(roommate.synapse),
          languages: roommate.synapse?.culture?.otherLanguages || [],
          petsOk: !!(roommate.synapse?.pets?.okWithPets),
          sleepStyle: roommate.synapse?.lifestyle?.sleepPattern,
          matchScore: Math.min(compatibilityScore / 100, 1), // Normalize to 0-1
          reasons: reasons,
          synapse: roommate.synapse,
          compatibilityBreakdown: {
            compatibilityScore,
            lifestyleMatch,
            budgetMatch,
            socialMatch,
            totalScore: (compatibilityScore + lifestyleMatch + budgetMatch + socialMatch) / 4
          }
        };
      }).filter(roommate => roommate.matchScore > 0.3); // Filter out low compatibility

      // Generate AI insights based on results
      const aiInsights = await generateRoommateInsights(user, userContext, scoredRoommates);
      const aiRecommendations = await generateRoommateRecommendations(user, userContext, scoredRoommates);

      res.json({
        success: true,
        results: scoredRoommates,
        total: scoredRoommates.length,
        criteria: {
          campusId: campusId || user.university,
          budgetRange,
          lifestyleFilters,
          language,
          dealbreakers,
          scope
        },
        aiInsights: aiInsights,
        aiRecommendations: aiRecommendations,
        userContext: {
          profile: userContext.profile,
          onboarding: userContext.onboarding,
          synapse: userContext.synapse
        },
        aiGenerated: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Unified Roommate Matching Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find roommate matches',
        fallback: true
      });
    }
  });

  // =====================
  // HELPER FUNCTIONS FOR UNIFIED ROOMMATE MATCHING
  // =====================

  // Calculate comprehensive compatibility score
  function calculateCompatibilityScore(user, roommate, lifestyleFilters, dealbreakers) {
    let score = 0;
    const weights = {
      language: 25,
      lifestyle: 20,
      budget: 15,
      habits: 15,
      social: 10,
      academic: 10,
      location: 5
    };

    // Language compatibility
    if (user.synapse?.culture?.primaryLanguage === roommate.synapse?.culture?.primaryLanguage) {
      score += weights.language;
    }

    // Lifestyle compatibility
    if (user.synapse?.lifestyle?.sleepPattern === roommate.synapse?.lifestyle?.sleepPattern) {
      score += weights.lifestyle * 0.5;
    }
    if (Math.abs((user.synapse?.lifestyle?.cleanliness || 3) - (roommate.synapse?.lifestyle?.cleanliness || 3)) <= 1) {
      score += weights.lifestyle * 0.5;
    }

    // Budget compatibility
    const userBudget = user.onboardingData?.budgetRange;
    const roommateBudget = roommate.onboardingData?.budgetRange;
    if (userBudget && roommateBudget) {
      const overlap = Math.min(userBudget.max, roommateBudget.max) - Math.max(userBudget.min, roommateBudget.min);
      if (overlap > 0) {
        score += weights.budget * (overlap / Math.max(userBudget.max - userBudget.min, roommateBudget.max - roommateBudget.min));
      }
    }

    // Habits compatibility
    const userHabits = user.synapse?.habits || {};
    const roommateHabits = roommate.synapse?.habits || {};
    const habitMatches = ['smoking', 'drinking', 'partying'].filter(habit => 
      userHabits[habit] === roommateHabits[habit]
    ).length;
    score += weights.habits * (habitMatches / 3);

    // Social compatibility
    if (user.synapse?.pets?.okWithPets === roommate.synapse?.pets?.okWithPets) {
      score += weights.social;
    }

    // Academic compatibility
    if (user.university === roommate.university) {
      score += weights.academic;
    }

    return Math.min(score, 100);
  }

  // Calculate lifestyle match score
  function calculateLifestyleMatch(userSynapse, roommateSynapse) {
    let match = 0;
    const factors = ['sleepPattern', 'cleanliness', 'smoking', 'partying'];
    factors.forEach(factor => {
      if (userSynapse?.lifestyle?.[factor] === roommateSynapse?.lifestyle?.[factor]) {
        match += 25;
      }
    });
    return Math.min(match, 100);
  }

  // Calculate budget compatibility
  function calculateBudgetCompatibility(userBudget, roommateBudget) {
    if (!userBudget || !roommateBudget) return 50;
    const overlap = Math.min(userBudget.max, roommateBudget.max) - Math.max(userBudget.min, roommateBudget.min);
    if (overlap <= 0) return 0;
    return Math.min((overlap / Math.max(userBudget.max - userBudget.min, roommateBudget.max - roommateBudget.min)) * 100, 100);
  }

  // Calculate social compatibility
  function calculateSocialCompatibility(userSynapse, roommateSynapse) {
    let compatibility = 0;
    if (userSynapse?.pets?.okWithPets === roommateSynapse?.pets?.okWithPets) compatibility += 50;
    if (userSynapse?.culture?.primaryLanguage === roommateSynapse?.culture?.primaryLanguage) compatibility += 50;
    return compatibility;
  }

  // Generate match reasons
  function generateMatchReasons(user, roommate, scores) {
    const reasons = [];
    
    if (user.synapse?.culture?.primaryLanguage === roommate.synapse?.culture?.primaryLanguage) {
      reasons.push({ type: "positive", text: "Same daily language" });
    }
    
    if (user.synapse?.lifestyle?.sleepPattern === roommate.synapse?.lifestyle?.sleepPattern) {
      reasons.push({ type: "positive", text: "Similar sleep schedule" });
    }
    
    if (Math.abs((user.synapse?.lifestyle?.cleanliness || 3) - (roommate.synapse?.lifestyle?.cleanliness || 3)) <= 1) {
      reasons.push({ type: "positive", text: "Compatible cleanliness levels" });
    }
    
    if (user.synapse?.pets?.okWithPets === roommate.synapse?.pets?.okWithPets) {
      reasons.push({ type: "positive", text: "Pet compatibility" });
    }
    
    if (user.university === roommate.university) {
      reasons.push({ type: "positive", text: "Same university" });
    }
    
    return reasons;
  }

  // Extract key traits from synapse data
  function extractKeyTraits(synapse) {
    const traits = [];
    if (synapse?.lifestyle?.cleanliness >= 4) traits.push("clean");
    if (synapse?.lifestyle?.sleepPattern === "early_bird") traits.push("early_riser");
    if (synapse?.lifestyle?.sleepPattern === "night_owl") traits.push("night_owl");
    if (synapse?.habits?.smoking === false) traits.push("non_smoker");
    if (synapse?.pets?.okWithPets) traits.push("pet_friendly");
    return traits;
  }

  // Calculate distance between users
  function calculateDistance(userLocation, roommateLocation) {
    // Simplified distance calculation - in real app, use proper geolocation
    if (!userLocation || !roommateLocation) return 0;
    return Math.random() * 10; // Mock distance
  }

  // Generate AI insights for roommate matching
  async function generateRoommateInsights(user, userContext, roommates) {
    try {
      if (!process.env.NEWRUN_APP_OPENAI_API_KEY) {
        return ["Complete your Synapse profile for better matches", "Consider your budget range when searching"];
      }

      const prompt = `Based on this user profile and ${roommates.length} potential roommates, provide 3-5 personalized insights for finding the best roommate match:
User Profile: ${JSON.stringify(userContext.profile)}
Onboarding: ${JSON.stringify(userContext.onboarding)}
Synapse: ${JSON.stringify(userContext.synapse)}
Top matches found: ${roommates.slice(0, 3).map(r => `${r.name} (${Math.round(r.matchScore * 100)}% match)`).join(', ')}

Provide actionable insights for better roommate matching.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      return response.data.choices[0].message.content.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('AI Insights Error:', error);
      return ["Complete your profile for better matches", "Consider lifestyle compatibility"];
    }
  }

  // Generate AI recommendations
  async function generateRoommateRecommendations(user, userContext, roommates) {
    try {
      if (!process.env.NEWRUN_APP_OPENAI_API_KEY) {
        return ["Update your Synapse profile", "Expand your search criteria"];
      }

      const prompt = `Based on this roommate search results, provide 3-5 specific recommendations for the user:
User: ${userContext.profile.name}
Results: ${roommates.length} matches found
Top match: ${roommates[0]?.name} (${Math.round(roommates[0]?.matchScore * 100)}% compatibility)
Provide specific, actionable recommendations for improving roommate matching.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      return response.data.choices[0].message.content.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('AI Recommendations Error:', error);
      return ["Complete your profile", "Try different search criteria"];
    }
  }

  // Legacy roommate endpoints removed - using unified endpoint above

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
      const cacheKey = `recommendations-${userId}-${insightType}-${JSON.stringify({
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
        // Find properties and roommates - use direct database calls instead of HTTP
        console.log('🔍 Getting properties directly from database...');
        
        // Direct property query
        let propertyQuery = {};
        if (user.onboardingData?.budgetRange?.min && user.onboardingData?.budgetRange?.max) {
          propertyQuery.price = { 
            $gte: user.onboardingData.budgetRange.min, 
            $lte: user.onboardingData.budgetRange.max 
          };
        }
        
        const rawProperties = await Property.find(propertyQuery)
          .limit(5)
          .select('title price bedrooms bathrooms address distanceFromUniversity contactInfo images availabilityStatus')
          .lean();
        
        console.log('🔍 Properties found:', rawProperties.length);
        
        // Direct roommate query
        let roommateQuery = { 
          'synapse.visibility.showAvatarInPreviews': true,
          university: user.university 
        };
        
        if (user.onboardingData?.budgetRange) {
          roommateQuery['onboardingData.budgetRange'] = {
            $gte: user.onboardingData.budgetRange.min,
            $lte: user.onboardingData.budgetRange.max
          };
        }
        
        const rawRoommates = await User.find(roommateQuery)
          .select('firstName lastName email university major synapse onboardingData')
          .limit(3)
          .lean();
        
        console.log('🔍 Roommates found:', rawRoommates.length);

        // Score and rank (using direct database results)

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

  // ==================== TRANSPORTATION ENDPOINTS (DISABLED) ====================
  // Temporarily disabled - moved to Upcoming Features directory
  /*
  
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

  */
  // Test endpoint to verify server is running
  app.get('/api/test', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Backend server is running',
      timestamp: new Date().toISOString()
    });
  });

  // In-memory user status tracking
  const userStatuses = new Map();
  
  // Get user statuses endpoint (requires auth to identify current user reliably)
  app.post('/users/statuses', authenticateToken, async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      // Get current user from token
      const currentUserId = getAuthUserId(req);
      
      // Set current user as online
      if (currentUserId) {
        userStatuses.set(currentUserId, Date.now());
      }
      
      // Clean up null entries from userStatuses
      for (const [key, value] of userStatuses.entries()) {
        if (key === null || key === 'null' || key === undefined) {
          userStatuses.delete(key);
        }
      }
      
      console.log('🔍 Status check - Current user:', currentUserId);
      console.log('🔍 Status check - Requested userIds:', userIds);
      console.log('🔍 Status check - userStatuses Map:', Array.from(userStatuses.entries()));
      
      // Return statuses - check all users for recent activity
      const statuses = {};
      userIds.forEach(userId => {
        // Check if user has been seen recently (within last 5 minutes)
        const lastSeen = userStatuses.get(userId);
        const isOnline = lastSeen && Date.now() - lastSeen < 5 * 60 * 1000;
        statuses[userId] = isOnline ? 'online' : 'offline';
        
        console.log(`🔍 Status for user ${userId}: lastSeen=${lastSeen}, isOnline=${isOnline}`);
      });

      console.log('🔍 Final statuses:', statuses);

      res.json({
        success: true,
        statuses
      });
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statuses'
      });
    }
  });

  // Middleware to track user activity for status
  const trackUserActivity = (req, res, next) => {
    const userId = getAuthUserId(req);
    if (userId && userId !== null && userId !== 'null') {
      userStatuses.set(userId, Date.now());
      console.log(`🔍 Activity tracked for user ${userId} at ${new Date().toISOString()}`);
    }
    next();
  };

  // Apply activity tracking to key endpoints
  app.use('/conversations', trackUserActivity);
  app.use('/messages', trackUserActivity);
  app.use('/get-user', trackUserActivity);

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their own room for personal notifications
    socket.on('join_user', (userId) => {
      if (userId && userId !== null && userId !== 'null') {
        socket.join(`user_${userId}`);
        // Mark user as online
        userStatuses.set(userId, Date.now());
        console.log(`🔍 Socket.io - User ${userId} joined their room and marked as online at ${new Date().toISOString()}`);
        console.log(`🔍 Socket.io - Current userStatuses Map:`, Array.from(userStatuses.entries()));
      } else {
        console.log(`⚠️ Socket.io - Invalid userId received:`, userId);
      }
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        console.log(`User joined conversation ${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
        console.log(`User left conversation ${conversationId}`);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      if (data.conversationId) {
        socket.to(`conversation_${data.conversationId}`).emit('userTyping', {
          userId: data.userId,
          conversationId: data.conversationId,
          isTyping: true
        });
      }
    });

    socket.on('stopTyping', (data) => {
      if (data.conversationId) {
        socket.to(`conversation_${data.conversationId}`).emit('userTyping', {
          userId: data.userId,
          conversationId: data.conversationId,
          isTyping: false
        });
      }
    });

    // Handle new messages
    socket.on('send_message', async (messageData) => {
      try {
        console.log('🔔 Socket.io - Received send_message:', messageData);
        
        // Emit to all users in the conversation
        io.to(`conversation_${messageData.conversationId}`).emit('newMessage', {
          conversationId: messageData.conversationId,
          message: messageData
        });
        console.log(`📤 Socket.io - Emitted newMessage to conversation_${messageData.conversationId}`);
        
        // Also emit to the receiver's personal room for unread count updates
        if (messageData.receiverId) {
          io.to(`user_${messageData.receiverId}`).emit('newMessage', {
            conversationId: messageData.conversationId,
            message: messageData
          });
          console.log(`📤 Socket.io - Emitted newMessage to user_${messageData.receiverId}`);
        }

        // Emit delivery receipt after a short delay (simulating delivery)
        setTimeout(async () => {
          try {
            // Use messageId from frontend instead of _id
            const messageId = messageData.messageId || messageData._id;
            console.log(`🔍 Debug - Delivery receipt: messageData.messageId=${messageData.messageId}, messageData._id=${messageData._id}, final messageId=${messageId}`);
            
            if (messageId) {
              // Update message status to delivered
              await Message.findByIdAndUpdate(messageId, {
                readStatus: 'delivered',
                deliveredAt: new Date()
              });

              // Emit delivery receipt
              io.to(`conversation_${messageData.conversationId}`).emit('readReceiptUpdate', {
                messageId: messageId,
                conversationId: messageData.conversationId,
                readStatus: 'delivered',
                deliveredAt: new Date()
              });
              console.log(`📤 Socket.io - Emitted delivery receipt for message ${messageId}`);
            } else {
              console.error('❌ Message ID is undefined for delivery receipt');
            }
          } catch (error) {
            console.error('Error updating message delivery status:', error);
          }
        }, 500); // 500ms delay for better UX to simulate delivery
      } catch (error) {
        console.error('Error handling send_message:', error);
      }
    });

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      if (data.conversationId && data.messageId) {
        console.log('📖 Socket.io - Message marked as read:', data);
        
        try {
          // Update message read status in database
          await Message.findByIdAndUpdate(data.messageId, {
            isRead: true,
            readStatus: 'read',
            readAt: new Date()
          });

          // Emit to conversation participants
          io.to(`conversation_${data.conversationId}`).emit('messageRead', {
            messageId: data.messageId,
            conversationId: data.conversationId
          });
          
          // Also emit mark_message_read event for navbar count updates
          io.to(`conversation_${data.conversationId}`).emit('mark_message_read', {
            messageId: data.messageId,
            conversationId: data.conversationId
          });
          
          // Also emit to user's individual room for navbar updates
          const message = await Message.findById(data.messageId);
          if (message && message.senderId) {
            io.to(`user_${message.senderId}`).emit('mark_message_read', {
              messageId: data.messageId,
              conversationId: data.conversationId
            });
          }

          // Emit read receipt update
          io.to(`conversation_${data.conversationId}`).emit('readReceiptUpdate', {
            messageId: data.messageId,
            conversationId: data.conversationId,
            readStatus: 'read',
            readAt: new Date()
          });
          console.log(`📤 Socket.io - Emitted readReceiptUpdate for message ${data.messageId}`);
        } catch (error) {
          console.error('Error updating message read status:', error);
        }
      }
    });

    // Handle user viewing conversation - immediately update read receipts
    socket.on('user_viewing_conversation', async (data) => {
      console.log('🔍 Debug - user_viewing_conversation event received:', data);
      if (data.conversationId && data.userId) {
        console.log('👁️ Socket.io - User viewing conversation:', data);
        
        try {
          // Find all unread messages in this conversation for this user
          console.log(`🔍 Debug - Searching for unread messages in conversation ${data.conversationId} for user ${data.userId}`);
          const unreadMessages = await Message.find({
            conversationId: data.conversationId,
            receiverId: data.userId,
            isRead: false
          });
          console.log(`🔍 Debug - Found ${unreadMessages.length} unread messages:`, unreadMessages.map(msg => ({ id: msg._id, content: msg.content, isRead: msg.isRead })));

          if (unreadMessages.length > 0) {
            console.log(`📖 Found ${unreadMessages.length} unread messages for user ${data.userId} in conversation ${data.conversationId}`);
            
            // Update all unread messages to read status
            await Message.updateMany(
              {
                conversationId: data.conversationId,
                receiverId: data.userId,
                isRead: false
              },
              {
                isRead: true,
                readStatus: 'read',
                readAt: new Date()
              }
            );

            // Emit read receipt updates for all messages
            unreadMessages.forEach(msg => {
              console.log(`🔍 Debug - Processing message ${msg._id} from sender ${msg.senderId}`);
              
              // Emit to conversation room
              io.to(`conversation_${data.conversationId}`).emit('readReceiptUpdate', {
                messageId: msg._id,
                conversationId: data.conversationId,
                readStatus: 'read',
                readAt: new Date()
              });
              console.log(`📤 Debug - Emitted readReceiptUpdate to conversation_${data.conversationId}`);
              
              // Emit to sender's individual room for read receipt updates
              const senderRoom = `user_${msg.senderId}`;
              const senderRoomExists = io.sockets.adapter.rooms.has(senderRoom);
              console.log(`🔍 Debug - Sender room ${senderRoom} exists:`, senderRoomExists);
              
              if (senderRoomExists) {
                const roomSize = io.sockets.adapter.rooms.get(senderRoom)?.size || 0;
                console.log(`🔍 Debug - Room ${senderRoom} has ${roomSize} sockets`);
              }
              
              io.to(senderRoom).emit('readReceiptUpdate', {
                messageId: msg._id,
                conversationId: data.conversationId,
                readStatus: 'read',
                readAt: new Date()
              });
              console.log(`📤 Debug - Emitted readReceiptUpdate to user_${msg.senderId}`);
              
              // Also emit mark_message_read for navbar updates
              io.to(`user_${msg.senderId}`).emit('mark_message_read', {
                messageId: msg._id,
                conversationId: data.conversationId
              });
              console.log(`📤 Debug - Emitted mark_message_read to user_${msg.senderId}`);
            });

            console.log(`📤 Socket.io - Updated ${unreadMessages.length} messages to read status`);
            
            // Debug: Log all socket rooms for the sender
            unreadMessages.forEach(msg => {
              console.log(`🔍 Debug - Sender ${msg.senderId} should receive readReceiptUpdate for message ${msg._id}`);
              console.log(`🔍 Debug - Available rooms for sender:`, Array.from(io.sockets.adapter.rooms.keys()).filter(room => room.includes(msg.senderId)));
              
              // Check if sender's room exists
              const senderRoom = `user_${msg.senderId}`;
              const roomExists = io.sockets.adapter.rooms.has(senderRoom);
              console.log(`🔍 Debug - Room ${senderRoom} exists:`, roomExists);
              
              if (roomExists) {
                const roomSize = io.sockets.adapter.rooms.get(senderRoom)?.size || 0;
                console.log(`🔍 Debug - Room ${senderRoom} has ${roomSize} sockets`);
              }
            });
          }
        } catch (error) {
          console.error('Error updating read receipts for viewing user:', error);
        }
      }
    });

    // Handle user status changes
    socket.on('user_status_change', (data) => {
      try {
        console.log('🔄 Socket.io - User status change:', data);
        
        if (data.userId && data.status) {
          // Update user status in memory
          userStatuses.set(data.userId, Date.now());
          
          // Broadcast status change to all users in conversations with this user
          // Get all conversations for this user
          Conversation.find({
            participants: data.userId
          }).then(conversations => {
            conversations.forEach(conversation => {
              // Emit to all participants in the conversation
              io.to(`conversation_${conversation._id}`).emit('userStatusUpdate', {
                userId: data.userId,
                status: data.status,
                timestamp: Date.now()
              });
              console.log(`📤 Socket.io - Emitted status update to conversation_${conversation._id}`);
            });
          }).catch(error => {
            console.error('Error finding conversations for status update:', error);
          });
          
          // Also emit to user's personal room for global status updates
          io.to(`user_${data.userId}`).emit('userStatusUpdate', {
            userId: data.userId,
            status: data.status,
            timestamp: Date.now()
          });
          console.log(`📤 Socket.io - Emitted status update to user_${data.userId}`);
        }
      } catch (error) {
        console.error('Error handling user_status_change:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Note: In a real implementation, you would track which user disconnected
      // and mark them as offline. For now, we'll rely on the 5-minute timeout.
    });
  });

  const PORT = process.env.PORT || 8000;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io server is running`);
  });
  
  module.exports = app;