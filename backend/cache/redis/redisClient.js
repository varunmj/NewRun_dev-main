/**
 * Redis Client Configuration
 * 
 * This file contains the Redis connection setup for caching AI explanations.
 * Currently prepared for future implementation.
 */

const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis connection configuration
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        // AWS ElastiCache configuration
        // host: process.env.ELASTICACHE_ENDPOINT,
        // port: 6379,
        // tls: process.env.NODE_ENV === 'production' ? {} : undefined
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client;
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
