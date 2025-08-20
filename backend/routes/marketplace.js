// backend/routes/marketplace.js
const express = require('express');
const router = express.Router();

const MarketplaceItem = require('../models/marketplaceItem.model');
const Offer = require('../models/Offer.model');
const Favorite = require('../models/favorite.model');

// You already have these helpers:
const { authenticateToken, getAuthUserId } = require('../utilities');

// Small helper
const toNum = (v) => (v === undefined ? undefined : Number(v));

// ------------------------------------------------------------------
// LIST + SEARCH
// GET /marketplace/items
// ------------------------------------------------------------------
router.get('/items', async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      condition,
      campus,
      delivery,          // pickup | localDelivery | shipping
      status = 'active',
      sort = '-createdAt',
      cursor,            // last _id to support "load more"
      limit = 24,
    } = req.query;

    const where = { status };
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (campus) where['location.campus'] = campus;
    if (delivery) where[`delivery.${delivery}`] = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.$gte = toNum(minPrice);
      if (maxPrice) where.price.$lte = toNum(maxPrice);
    }
    if (cursor) where._id = { $lt: cursor };

    let query = MarketplaceItem.find(where);
    if (q) query = query.find({ $text: { $search: q } });

    const sortObj = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
    const lim = Math.min(Number(limit) || 24, 48);

    const items = await query.sort(sortObj).limit(lim).lean();
    const nextCursor = items.length ? String(items[items.length - 1]._id) : null;

    res.json({ items, nextCursor });
  } catch (err) {
    console.error('GET /marketplace/items error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// ------------------------------------------------------------------
// ITEM CRUD
// ------------------------------------------------------------------

// POST /marketplace/item
router.post('/item', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const {
      title, description = '',
      images = [],
      coverIndex = 0,
      category, condition,
      tags = [],
      price,
      location = {},
      delivery = {},
    } = req.body;

    if (!title || price == null) {
      return res.status(400).json({ error: true, message: 'title and price are required' });
    }

    const doc = await MarketplaceItem.create({
      userId,
      title,
      description,
      images,
      coverIndex,
      category,
      condition,
      tags,
      price,
      location,
      delivery,
    });

    res.status(201).json({ success: true, item: doc });
  } catch (err) {
    console.error('POST /marketplace/item error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// PUT /marketplace/item/:id  (owner-only)
router.put('/item/:id', authenticateToken, async (req, res) => {
  try {
    const userId = String(getAuthUserId(req));
    const id = req.params.id;

    const item = await MarketplaceItem.findById(id);
    if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
    if (String(item.userId) !== userId) {
      return res.status(403).json({ error: true, message: 'Not your item' });
    }

    const updatable = [
      'title', 'description', 'images', 'coverIndex',
      'category', 'condition', 'tags', 'price',
      'location', 'delivery',
    ];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    console.error('PUT /marketplace/item/:id error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// DELETE /marketplace/item/:id (owner-only)
router.delete('/item/:id', authenticateToken, async (req, res) => {
  try {
    const userId = String(getAuthUserId(req));
    const id = req.params.id;

    const item = await MarketplaceItem.findById(id);
    if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
    if (String(item.userId) !== userId) {
      return res.status(403).json({ error: true, message: 'Not your item' });
    }
    await item.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /marketplace/item/:id error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /marketplace/item/:id/status  (owner-only; active/reserved/sold/hidden)
router.post('/item/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = String(getAuthUserId(req));
    const id = req.params.id;
    const { status } = req.body;

    if (!['active', 'reserved', 'sold', 'hidden'].includes(status)) {
      return res.status(400).json({ error: true, message: 'Invalid status' });
    }

    const item = await MarketplaceItem.findById(id);
    if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
    if (String(item.userId) !== userId) {
      return res.status(403).json({ error: true, message: 'Not your item' });
    }

    item.status = status;
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    console.error('POST /marketplace/item/:id/status error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /marketplace/item/:id/view (increment w/ simple throttle via ip+id in memory)
const recentViews = new Map(); // key: ip+id, val: timestamp
router.post('/item/:id/view', async (req, res) => {
  try {
    const id = req.params.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'ip';
    const key = `${ip}:${id}`;
    const now = Date.now();
    const prev = recentViews.get(key) || 0;
    if (now - prev > 60_000) {
      await MarketplaceItem.updateOne({ _id: id }, { $inc: { views: 1 } });
      recentViews.set(key, now);
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: true });
  }
});

// ------------------------------------------------------------------
// FAVORITES (watchlist)
// ------------------------------------------------------------------
router.post('/favorites/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const itemId = req.params.itemId;

    const existing = await Favorite.findOne({ userId, itemId });
    if (existing) {
      await existing.deleteOne();
      await MarketplaceItem.updateOne({ _id: itemId }, { $inc: { favorites: -1 } });
      return res.json({ success: true, favored: false });
    } else {
      await Favorite.create({ userId, itemId });
      await MarketplaceItem.updateOne({ _id: itemId }, { $inc: { favorites: 1 } });
      return res.json({ success: true, favored: true });
    }
  } catch (err) {
    console.error('POST /favorites/:itemId error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const favs = await Favorite.find({ userId }).populate('itemId').sort({ createdAt: -1 }).lean();
    res.json({ items: favs.map((f) => f.itemId).filter(Boolean) });
  } catch (err) {
    console.error('GET /favorites error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// ------------------------------------------------------------------
// OFFERS (negotiation)
// ------------------------------------------------------------------

// POST /offers
router.post('/offers', authenticateToken, async (req, res) => {
  try {
    const buyerId = getAuthUserId(req);
    const { itemId, amount, message = '' } = req.body;

    const item = await MarketplaceItem.findById(itemId).lean();
    if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
    if (String(item.userId) === String(buyerId))
      return res.status(400).json({ error: true, message: 'Cannot offer on your own item' });

    const doc = await Offer.create({
      itemId,
      buyerId,
      sellerId: item.userId,
      amount,
      message,
      status: 'pending',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    // notify seller
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${item.userId}`).emit('offer:new', {
        offerId: String(doc._id),
        itemId: String(itemId),
        amount,
        buyerId: String(buyerId),
        itemTitle: item.title,
        createdAt: doc.createdAt,
      });
    }

    res.status(201).json({ success: true, offer: doc });
  } catch (err) {
    console.error('POST /offers error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// GET /offers/inbox?role=seller|buyer&status=pending
router.get('/offers/inbox', authenticateToken, async (req, res) => {
  try {
    const me = String(getAuthUserId(req));
    const role = req.query.role === 'seller' ? 'sellerId' : 'buyerId';
    const status = req.query.status; // optional

    const where = { [role]: me };
    if (status) where.status = status;

    const items = await Offer.find(where)
      .sort({ createdAt: -1 })
      .populate('itemId', 'title images price userId')
      .populate('buyerId', 'firstName lastName email')
      .lean();

    res.json({ items });
  } catch (err) {
    console.error('GET /offers/inbox error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /offers/:id/respond  { action, amount? }   (seller only)
router.post('/offers/:id/respond', authenticateToken, async (req, res) => {
  try {
    const me = String(getAuthUserId(req));
    const id = req.params.id;
    const { action, amount } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ error: true, message: 'Offer not found' });
    if (String(offer.sellerId) !== me) {
      return res.status(403).json({ error: true, message: 'Not your offer to respond' });
    }
    if (offer.status !== 'pending' && offer.status !== 'countered') {
      return res.status(400).json({ error: true, message: 'Cannot respond to this offer' });
    }

    if (action === 'accept') {
      offer.status = 'accepted';
    } else if (action === 'decline') {
      offer.status = 'declined';
    } else if (action === 'counter') {
      if (amount == null) {
        return res.status(400).json({ error: true, message: 'Counter amount required' });
      }
      offer.status = 'countered';
      offer.counter = amount;
    } else {
      return res.status(400).json({ error: true, message: 'Invalid action' });
    }

    await offer.save();

    // notify buyer
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${offer.buyerId}`).emit('offer:updated', {
        offerId: String(offer._id),
        itemId: String(offer.itemId),
        status: offer.status,
        counter: offer.counter,
        updatedAt: offer.updatedAt,
      });
    }

    res.json({ success: true, offer });
  } catch (err) {
    console.error('POST /offers/:id/respond error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

module.exports = router;
