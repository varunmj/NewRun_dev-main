const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: '@anonymous' },
  author: { type: String, default: '@anonymous' }, // For backward compatibility
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  userVotes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
    votedAt: { type: Date, default: Date.now }
  }],
  isOP: { type: Boolean, default: false }, // Original Poster
}, { timestamps: true });

const AnswerSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: '@anonymous' },
  author: { type: String, default: '@anonymous' }, // For backward compatibility
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votes: { type: Number, default: 0 }, // Net votes (upvotes - downvotes) for backward compatibility
  userVotes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
    votedAt: { type: Date, default: Date.now }
  }],
  accepted: { type: Boolean, default: false },
  isBestAnswer: { type: Boolean, default: false }, // Auto-marked based on upvotes
  isOP: { type: Boolean, default: false }, // Original Poster
  replies: { type: [ReplySchema], default: [] },
}, { timestamps: true });

const CommunityThreadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  tags: { type: [String], default: [] },
  school: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: '@anonymous' },
  author: { type: String, default: '@anonymous' }, // For backward compatibility
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votes: { type: Number, default: 0 }, // Net votes (upvotes - downvotes) for backward compatibility
  userVotes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
    votedAt: { type: Date, default: Date.now }
  }],
  solved: { type: Boolean, default: false },
  answers: { type: [AnswerSchema], default: [] },
}, { timestamps: true });

// Create text index for search (excluding tags array to avoid conflicts)
CommunityThreadSchema.index({ title: 'text', body: 'text' });
// Create separate index for tags
CommunityThreadSchema.index({ tags: 1 });

module.exports = mongoose.model('CommunityThread', CommunityThreadSchema);


