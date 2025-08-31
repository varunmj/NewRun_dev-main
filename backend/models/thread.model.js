const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    kind: { type: String, enum: ['housing', 'marketplace', 'task'], required: true },

    prompt: { type: String, default: '' },      // raw user ask
    criteria: { type: Object, default: {} },     // parsed filters from LLM
    plan: { type: [String], default: [] },       // steps we show in UI

    // snapshot results so the thread page shows what we found at creation time
    candidatesSnapshot: { type: Array, default: [] },

    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    meta: { type: Object, default: {} },         // future (campus, tags, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Thread', ThreadSchema);
