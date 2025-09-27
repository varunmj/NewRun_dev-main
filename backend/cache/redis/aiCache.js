/**
 * AI Explanation Redis Cache
 * 
 * This module handles caching of AI explanations using Redis.
 * Prepared for future implementation when scaling beyond local storage.
 */

const redisClient = require('./redisClient');

class AICache {
  constructor() {
    this.defaultTTL = 24 * 60 * 60; // 24 hours in seconds
  }

  /**
   * Generate cache key for AI explanation
   */
  generateCacheKey(userId, insightId, userDataHash) {
    return `ai-explanation:${userId}:${insightId}:${userDataHash}`;
  }

  /**
   * Get cached AI explanation
   */
  async getCachedExplanation(userId, insightId, userDataHash) {
    try {
      if (!redisClient.isReady()) {
        return null;
      }

      const key = this.generateCacheKey(userId, insightId, userDataHash);
      const cached = await redisClient.getClient().get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached AI explanation
   */
  async setCachedExplanation(userId, insightId, userDataHash, explanation, ttl = null) {
    try {
      if (!redisClient.isReady()) {
        return false;
      }

      const key = this.generateCacheKey(userId, insightId, userDataHash);
      const cacheData = {
        explanation,
        timestamp: Date.now(),
        userDataHash,
        ttl: ttl || this.defaultTTL
      };

      await redisClient.getClient().setex(key, ttl || this.defaultTTL, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Redis cache set error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific user
   */
  async invalidateUserCache(userId) {
    try {
      if (!redisClient.isReady()) {
        return false;
      }

      const pattern = `ai-explanation:${userId}:*`;
      const keys = await redisClient.getClient().keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.getClient().del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      if (!redisClient.isReady()) {
        return null;
      }

      const info = await redisClient.getClient().info('memory');
      const keyspace = await redisClient.getClient().info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redisClient.isReady()
      };
    } catch (error) {
      console.error('Redis cache stats error:', error);
      return null;
    }
  }
}

module.exports = new AICache();
