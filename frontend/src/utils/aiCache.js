const KEY_PREFIX = "nr-ai-";
const MAX_CACHE_SIZE = 50; // Maximum number of cache entries
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Enhanced cache with size management, cleanup, and invalidation triggers
class AICache {
  constructor() {
    this.cleanupInterval = setInterval(this.cleanup.bind(this), CACHE_CLEANUP_INTERVAL);
    this.invalidationTriggers = new Set();
    this.cacheVersion = Date.now();
  }

  /**
   * Generate user data hash for smart cache invalidation
   */
  generateUserDataHash(userData) {
    if (!userData) return 'no-data';
    
    // Create a hash of relevant user data to detect changes
    const dataString = JSON.stringify({
      university: userData?.university,
      major: userData?.major,
      onboardingData: userData?.onboardingData,
      dashboardData: userData?.dashboardData,
      userInfo: {
        id: userData?.userInfo?.id,
        university: userData?.userInfo?.university,
        major: userData?.userInfo?.major
      }
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate smart cache key with user data hash
   */
  generateSmartCacheKey(baseKey, userId, userData) {
    const userDataHash = this.generateUserDataHash(userData);
    return `${baseKey}-${userId}-${userDataHash}`;
  }

  read(key, { maxAgeMs = 24*60*60*1000, obVer, cacheVersion } = {}) {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + key);
      if (!raw) return null;
      
      const obj = JSON.parse(raw);
      const fresh = Date.now() - (obj._meta?.ts || 0) < maxAgeMs;
      const obSame = !obVer || obj._meta?.obVer === obVer;
      const versionSame = !cacheVersion || obj._meta?.cacheVersion === cacheVersion;
      
      if (fresh && obSame && versionSame) {
        // Update access time for LRU
        obj._meta.lastAccess = Date.now();
        localStorage.setItem(KEY_PREFIX + key, JSON.stringify(obj));
        return obj.payload;
      }
      
      // Remove stale cache
      if (!fresh || !versionSame) {
        localStorage.removeItem(KEY_PREFIX + key);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
      localStorage.removeItem(KEY_PREFIX + key);
    }
    return null;
  }

  write(key, payload, { obVer, ver = "v1", cacheVersion } = {}) {
    try {
      const obj = { 
        payload, 
        _meta: { 
          ts: Date.now(), 
          lastAccess: Date.now(),
          obVer, 
          ver,
          cacheVersion: cacheVersion || this.cacheVersion
        } 
      };
      localStorage.setItem(KEY_PREFIX + key, JSON.stringify(obj));
    } catch (error) {
      console.warn('Cache write error:', error);
      // If storage is full, try to clean up and retry
      this.cleanup();
      try {
        localStorage.setItem(KEY_PREFIX + key, JSON.stringify(obj));
      } catch (retryError) {
        console.error('Cache write failed after cleanup:', retryError);
      }
    }
  }

  cleanup() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX));
      
      if (keys.length <= MAX_CACHE_SIZE) return;

      // Get all cache entries with metadata
      const entries = keys.map(key => {
        try {
          const raw = localStorage.getItem(key);
          const obj = JSON.parse(raw);
          return {
            key,
            lastAccess: obj._meta?.lastAccess || obj._meta?.ts || 0,
            size: raw.length
          };
        } catch {
          return { key, lastAccess: 0, size: 0 };
        }
      });

      // Sort by last access time (LRU)
      entries.sort((a, b) => a.lastAccess - b.lastAccess);

      // Remove oldest entries until we're under the limit
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      toRemove.forEach(entry => {
        localStorage.removeItem(entry.key);
      });

      console.log(`Cache cleanup: removed ${toRemove.length} entries`);
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      this.cacheVersion = Date.now();
      console.log('🗑️ AI cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  // Invalidate cache with reason tracking
  invalidate(reason = 'manual') {
    console.log(`🗑️ Cache invalidation: ${reason}`);
    this.clear();
    this.cacheVersion = Date.now();
    
    // Trigger invalidation callbacks
    this.invalidationTriggers.forEach(callback => {
      try {
        callback(reason);
      } catch (error) {
        console.error('Cache invalidation callback error:', error);
      }
    });
  }

  // Subscribe to cache invalidation events
  onInvalidation(callback) {
    this.invalidationTriggers.add(callback);
    return () => this.invalidationTriggers.delete(callback);
  }

  // Get current cache version
  getVersion() {
    return this.cacheVersion;
  }

  /**
   * Smart cache for AI insights with user data validation
   */
  getCachedInsights(userId, userData) {
    try {
      const cacheKey = this.generateSmartCacheKey('insights', userId, userData);
      const cached = this.read(cacheKey, { maxAgeMs: DEFAULT_TTL });
      
      if (cached) {
        console.log('🎯 Cache HIT: Using cached AI insights');
        return cached;
      }
      
      console.log('❌ Cache MISS: No valid insights cache found');
      return null;
    } catch (error) {
      console.error('Insights cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached AI insights with smart invalidation
   */
  setCachedInsights(userId, userData, insights) {
    try {
      const cacheKey = this.generateSmartCacheKey('insights', userId, userData);
      this.write(cacheKey, insights, { 
        ver: "insights-v2",
        cacheVersion: this.cacheVersion 
      });
      console.log('💾 Cache SET: Stored AI insights');
      return true;
    } catch (error) {
      console.error('Insights cache set error:', error);
      return false;
    }
  }

  /**
   * Smart cache for AI actions with user data validation
   */
  getCachedActions(userId, userData) {
    try {
      const cacheKey = this.generateSmartCacheKey('actions', userId, userData);
      const cached = this.read(cacheKey, { maxAgeMs: DEFAULT_TTL });
      
      if (cached) {
        console.log('🎯 Cache HIT: Using cached AI actions');
        return cached;
      }
      
      console.log('❌ Cache MISS: No valid actions cache found');
      return null;
    } catch (error) {
      console.error('Actions cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached AI actions with smart invalidation
   */
  setCachedActions(userId, userData, actions) {
    try {
      const cacheKey = this.generateSmartCacheKey('actions', userId, userData);
      this.write(cacheKey, actions, { 
        ver: "actions-v2",
        cacheVersion: this.cacheVersion 
      });
      console.log('💾 Cache SET: Stored AI actions');
      return true;
    } catch (error) {
      console.error('Actions cache set error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific user when data changes
   */
  invalidateUserCache(userId) {
    try {
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith(KEY_PREFIX) && k.includes(`-${userId}-`)
      );
      
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`🗑️ Cache INVALIDATED: Removed ${keys.length} entries for user ${userId}`);
      return keys.length;
    } catch (error) {
      console.error('User cache invalidation error:', error);
      return 0;
    }
  }

  getStats() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX));
      const totalSize = keys.reduce((size, key) => {
        try {
          return size + (localStorage.getItem(key)?.length || 0);
        } catch {
          return size;
        }
      }, 0);
      
      return {
        entries: keys.length,
        totalSize,
        maxEntries: MAX_CACHE_SIZE
      };
    } catch {
      return { entries: 0, totalSize: 0, maxEntries: MAX_CACHE_SIZE };
    }
  }
}

// Create singleton instance
const cache = new AICache();

// Export the enhanced functions
export const readCache = (key, options) => cache.read(key, options);
export const writeCache = (key, payload, options) => cache.write(key, payload, options);
export const clearCache = () => cache.clear();
export const invalidateCache = (reason) => cache.invalidate(reason);
export const onCacheInvalidation = (callback) => cache.onInvalidation(callback);
export const getCacheVersion = () => cache.getVersion();
export const getCacheStats = () => cache.getStats();

// Export smart caching methods
export const getCachedInsights = (userId, userData) => cache.getCachedInsights(userId, userData);
export const setCachedInsights = (userId, userData, insights) => cache.setCachedInsights(userId, userData, insights);
export const getCachedActions = (userId, userData) => cache.getCachedActions(userId, userData);
export const setCachedActions = (userId, userData, actions) => cache.setCachedActions(userId, userData, actions);
export const invalidateUserCache = (userId) => cache.invalidateUserCache(userId);
