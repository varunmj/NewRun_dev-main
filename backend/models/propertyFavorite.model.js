// backend/models/PropertyFavorite.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PropertyFavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true, required: true },
  },
  { timestamps: true }
);

PropertyFavoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('PropertyFavorite', PropertyFavoriteSchema);
