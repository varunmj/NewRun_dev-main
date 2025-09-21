// backend/models/MarketplaceItem.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeliverySchema = new Schema(
  {
    pickup: { type: Boolean, default: true },
    localDelivery: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false },
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    campus: String,
    city: String,
    state: String,
    country: String,
  },
  { _id: false }
);

const ContactInfoSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    exchangeMethod: { type: String, default: 'public' },
  },
  { _id: false }
);

const MarketplaceItemSchema = new Schema(
  {
    // ownership
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },

    // content
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    coverIndex: { type: Number, default: 0 }, // index within images[]

    // classification
    category: { type: String, index: true },   // e.g., "Furniture", "Electronics"
    condition: { type: String, index: true },  // "New", "Like New", "Good", "Fair"
    tags: { type: [String], default: [] },

    // commerce
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'reserved', 'sold', 'hidden'],
      default: 'active',
      index: true,
    },

    // logistics
    location: LocationSchema,
    delivery: DeliverySchema,
    contactInfo: ContactInfoSchema,

    // metrics
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// text search
MarketplaceItemSchema.index({ title: 'text', description: 'text', tags: 'text' });

// helpful compound indexes
MarketplaceItemSchema.index({ status: 1, createdAt: -1 });
MarketplaceItemSchema.index({ category: 1, status: 1, price: 1 });
MarketplaceItemSchema.index({ 'location.campus': 1, status: 1 });

module.exports = mongoose.model('MarketplaceItem', MarketplaceItemSchema);
