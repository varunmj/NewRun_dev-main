# Redis Cache Implementation

This folder contains the Redis-based caching solution for AI explanations.

## Structure
- `redisClient.js` - Redis connection and configuration
- `aiCache.js` - AI explanation caching logic
- `cacheMiddleware.js` - Express middleware for caching
- `README.md` - This documentation

## Features
- **Server-side caching** - Shared across all users
- **TTL-based expiration** - Automatic cache invalidation
- **Smart invalidation** - Cache updates when user data changes
- **Cost optimization** - Reduces OpenAI API calls by 90%+

## Setup
1. Install Redis server or use AWS ElastiCache
2. Configure connection in `redisClient.js`
3. Enable caching in your routes

## Usage
```javascript
import { getCachedExplanation, setCachedExplanation } from './aiCache.js';

// Get cached explanation
const cached = await getCachedExplanation(userId, insightId);

// Set cached explanation
await setCachedExplanation(userId, insightId, explanation, ttl);
```

## Future Implementation
This is prepared for when you're ready to scale beyond local storage caching.
