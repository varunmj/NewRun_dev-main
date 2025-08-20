// backend/models/Offer.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OfferSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'MarketplaceItem', index: true, required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },

    amount: { type: Number, required: true, min: 0 },
    message: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'countered', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    counter: Number, // last counter amount from seller
    expiresAt: Date,
  },
  { timestamps: true }
);

OfferSchema.index({ itemId: 1, buyerId: 1, status: 1 });

module.exports = mongoose.model('Offer', OfferSchema);
