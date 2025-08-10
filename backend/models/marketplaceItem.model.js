// models/MarketplaceItem.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marketplaceItemSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  thumbnailUrl: { type: String },
  contactInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  images: { type: [String], default: [] }, // Optional image URLs
});

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);
