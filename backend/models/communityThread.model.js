const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: '@anonymous' },
  author: { type: String, default: '@anonymous' }, // For backward compatibility
  body: { type: String, required: true },
  votes: { type: Number, default: 0 },
  accepted: { type: Boolean, default: false },
}, { timestamps: true });

const CommunityThreadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  tags: { type: [String], default: [] },
  school: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: '@anonymous' },
  author: { type: String, default: '@anonymous' }, // For backward compatibility
  votes: { type: Number, default: 0 },
  solved: { type: Boolean, default: false },
  answers: { type: [AnswerSchema], default: [] },
}, { timestamps: true });

CommunityThreadSchema.index({ title: 'text', body: 'text', tags: 1 });

module.exports = mongoose.model('CommunityThread', CommunityThreadSchema);


