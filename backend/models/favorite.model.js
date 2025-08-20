// backend/models/Favorite.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'MarketplaceItem', index: true, required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
