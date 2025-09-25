const KEY_PREFIX = "nr-ai-";
const MAX_CACHE_SIZE = 50; // Maximum number of cache entries
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Enhanced cache with size management, cleanup, and invalidation triggers
class AICache {
  constructor() {
    this.cleanupInterval = setInterval(this.cleanup.bind(this), CACHE_CLEANUP_INTERVAL);
    this.invalidationTriggers = new Set();
    this.cacheVersion = Date.now();
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
