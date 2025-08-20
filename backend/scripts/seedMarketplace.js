require('dotenv').config();
const mongoose = require('mongoose');
const MarketplaceItem = require('../models/MarketplaceItem');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const sellerId = new mongoose.Types.ObjectId(); // dummy user id

  await MarketplaceItem.insertMany([
    {
      title: 'Eco Pack – Kitchen Starter Kit',
      description: 'Plates, mugs, cutlery. Barely used.',
      price: 35,
      category: 'kitchen',
      condition: 'like-new',
      delivery: 'pickup',
      location: { campus: 'NIU', city: 'DeKalb', state: 'IL' },
      images: [],
      sellerId,
      status: 'active',
    },
    {
      title: 'Lincoln Desk & Chair',
      description: 'Perfect for study. Small scuffs.',
      price: 60,
      category: 'furniture',
      condition: 'good',
      delivery: 'both',
      location: { campus: 'NIU', city: 'DeKalb', state: 'IL' },
      images: [],
      sellerId,
      status: 'active',
    },
  ]);

  console.log('Seeded!');
  await mongoose.disconnect();
  process.exit(0);
})();
