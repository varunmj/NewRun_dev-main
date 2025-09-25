import axiosInstance from '../utils/axiosInstance';
import { invalidateCache, onCacheInvalidation } from '../utils/aiCache';

// Simple EventEmitter for browser compatibility
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  removeListener(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }
}

/**
 * Data Synchronization Service
 * Handles real-time data synchronization and consistency across the application
 * Prevents race conditions and ensures data integrity
 */
class DataSyncService extends SimpleEventEmitter {
  constructor() {
    super();
    this.syncQueue = new Map();
    this.syncInProgress = new Set();
    this.lastSyncTime = new Map();
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup cache invalidation listener
    onCacheInvalidation((reason) => {
      this.handleCacheInvalidation(reason);
    });
  }

  setupEventListeners() {
    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('network:online');
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('network:offline');
    });

    // Visibility change monitoring
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncPendingChanges();
      }
    });
  }

  /**
   * Queue a data synchronization operation
   */
  queueSync(operation, priority = 'normal') {
    const id = `${operation.type}_${Date.now()}_${Math.random()}`;
    const syncItem = {
      id,
      operation,
      priority,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.set(id, syncItem);
    this.emit('sync:queued', syncItem);
    
    // Process queue if not already processing
    this.processSyncQueue();
    
    return id;
  }

  /**
   * Process the synchronization queue
   */
  async processSyncQueue() {
    if (this.syncInProgress.size > 0 || !this.isOnline) {
      return;
    }

    // Sort by priority and timestamp
    const sortedItems = Array.from(this.syncQueue.values())
      .sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return a.timestamp - b.timestamp;
      });

    for (const item of sortedItems) {
      if (this.syncInProgress.has(item.id)) {
        continue;
      }

      try {
        this.syncInProgress.add(item.id);
        await this.executeSync(item);
        this.syncQueue.delete(item.id);
        this.emit('sync:completed', item);
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);
        this.handleSyncError(item, error);
      } finally {
        this.syncInProgress.delete(item.id);
      }
    }
  }

  /**
   * Execute a synchronization operation
   */
  async executeSync(item) {
    const { operation } = item;
    
    switch (operation.type) {
      case 'user_update':
        await this.syncUserData(operation.data);
        break;
      case 'dashboard_refresh':
        await this.syncDashboardData();
        break;
      case 'ai_refresh':
        await this.syncAIData(operation.data);
        break;
      case 'cache_invalidation':
        await this.syncCacheInvalidation(operation.reason);
        break;
      default:
        throw new Error(`Unknown sync operation: ${operation.type}`);
    }
  }

  /**
   * Sync user data changes
   */
  async syncUserData(userData) {
    try {
      const response = await axiosInstance.put('/update-user', userData);
      this.lastSyncTime.set('user', Date.now());
      this.emit('sync:user_updated', response.data);
      
      // Invalidate related caches
      invalidateCache('user_data_sync');
    } catch (error) {
      throw new Error(`User data sync failed: ${error.message}`);
    }
  }

  /**
   * Sync dashboard data
   */
  async syncDashboardData() {
    try {
      const response = await axiosInstance.get('/dashboard/overview');
      this.lastSyncTime.set('dashboard', Date.now());
      this.emit('sync:dashboard_updated', response.data);
      
      // Invalidate AI cache if dashboard data changed significantly
      const lastSync = this.lastSyncTime.get('dashboard');
      if (lastSync && Date.now() - lastSync > 30000) { // 30 seconds
        invalidateCache('dashboard_data_sync');
      }
    } catch (error) {
      throw new Error(`Dashboard sync failed: ${error.message}`);
    }
  }

  /**
   * Sync AI data
   */
  async syncAIData(aiData) {
    try {
      // AI data is typically read-only, but we can sync preferences
      if (aiData.preferences) {
        const response = await axiosInstance.put('/ai-preferences', aiData.preferences);
        this.lastSyncTime.set('ai', Date.now());
        this.emit('sync:ai_updated', response.data);
      }
    } catch (error) {
      throw new Error(`AI data sync failed: ${error.message}`);
    }
  }

  /**
   * Handle cache invalidation sync
   */
  async syncCacheInvalidation(reason) {
    try {
      // Notify backend about cache invalidation
      await axiosInstance.post('/cache-invalidation', { reason });
      this.emit('sync:cache_invalidated', { reason });
    } catch (error) {
      console.warn('Cache invalidation sync failed:', error);
    }
  }

  /**
   * Handle sync errors with retry logic
   */
  handleSyncError(item, error) {
    item.retries++;
    
    if (item.retries < item.maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, item.retries) * 1000;
      setTimeout(() => {
        this.syncQueue.set(item.id, item);
        this.processSyncQueue();
      }, delay);
      
      this.emit('sync:retry', { item, error, retries: item.retries });
    } else {
      // Max retries exceeded, remove from queue
      this.syncQueue.delete(item.id);
      this.emit('sync:failed', { item, error });
    }
  }

  /**
   * Handle cache invalidation events
   */
  handleCacheInvalidation(reason) {
    this.queueSync({
      type: 'cache_invalidation',
      reason
    }, 'high');
  }

  /**
   * Sync pending changes when coming back online
   */
  async syncPendingChanges() {
    if (!this.isOnline || this.syncQueue.size === 0) {
      return;
    }

    console.log(`🔄 Syncing ${this.syncQueue.size} pending changes...`);
    await this.processSyncQueue();
  }

  /**
   * Start periodic synchronization
   */
  startPeriodicSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.size === 0) {
        // Sync dashboard data periodically
        this.queueSync({
          type: 'dashboard_refresh'
        }, 'low');
      }
    }, intervalMs);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.size,
      inProgress: this.syncInProgress.size,
      lastSyncTimes: Object.fromEntries(this.lastSyncTime)
    };
  }

  /**
   * Force sync all data
   */
  async forceSyncAll() {
    console.log('🔄 Force syncing all data...');
    
    // Queue all sync operations
    this.queueSync({ type: 'dashboard_refresh' }, 'high');
    this.queueSync({ type: 'ai_refresh' }, 'high');
    
    // Process queue
    await this.processSyncQueue();
  }

  /**
   * Clear all pending sync operations
   */
  clearSyncQueue() {
    this.syncQueue.clear();
    this.syncInProgress.clear();
    this.emit('sync:queue_cleared');
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

export default dataSyncService;
