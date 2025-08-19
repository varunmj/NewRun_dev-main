const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContactAccessRequestSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    ownerId:    { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    requesterId:{ type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    status:     { type: String, enum: ['pending','approved','denied','expired'], default: 'pending', index: true },
    approvedAt: Date,
    deniedAt:   Date,
    // Optional snapshot of contact at approval time (so later edits don’t change what was revealed)
    phone:      String,
    email:      String,
    // Auto-expire after 7 days (Mongo TTL index)
    expiresAt:  { type: Date, default: () => new Date(Date.now() + 7*24*60*60*1000), index: { expires: '7d' } },
  },
  { timestamps: true }
);

// One active request per requester per property
ContactAccessRequestSchema.index({ propertyId: 1, requesterId: 1 }, { unique: true });

module.exports = mongoose.model('ContactAccessRequest', ContactAccessRequestSchema);
