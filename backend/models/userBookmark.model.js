const mongoose = require('mongoose');

const UserBookmarkSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  threadId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CommunityThread', 
    required: true 
  },
  bookmarkedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Ensure one bookmark per user per thread
UserBookmarkSchema.index({ userId: 1, threadId: 1 }, { unique: true });

// Index for efficient querying by user
UserBookmarkSchema.index({ userId: 1, bookmarkedAt: -1 });

module.exports = mongoose.model('UserBookmark', UserBookmarkSchema);


