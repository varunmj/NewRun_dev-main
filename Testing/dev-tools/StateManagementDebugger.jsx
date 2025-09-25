import React, { useState, useEffect } from 'react';
import { useUnifiedState } from '../context/UnifiedStateContext';
import { getCacheStats, getCacheVersion } from '../utils/aiCache';
import dataSyncService from '../services/DataSyncService';

/**
 * State Management Debugger Component
 * Provides real-time monitoring of the unified state management system
 * Shows cache status, sync status, and data consistency
 */
const StateManagementDebugger = () => {
  const {
    state,
    isFullyInitialized,
    hasAnyErrors,
    isLoading,
    loading,
    errors,
    initialized,
    refreshAll,
    invalidateCache
  } = useUnifiedState();

  const [debugInfo, setDebugInfo] = useState({
    cacheStats: null,
    syncStatus: null,
    lastUpdate: null
  });

  const [isVisible, setIsVisible] = useState(false);

  // Update debug info periodically
  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        cacheStats: getCacheStats(),
        syncStatus: dataSyncService.getSyncStatus(),
        lastUpdate: new Date().toLocaleTimeString()
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncEvent = (event) => {
      console.log('🔄 Sync event:', event);
      setDebugInfo(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    };

    dataSyncService.on('sync:queued', handleSyncEvent);
    dataSyncService.on('sync:completed', handleSyncEvent);
    dataSyncService.on('sync:failed', handleSyncEvent);

    return () => {
      dataSyncService.removeListener('sync:queued', handleSyncEvent);
      dataSyncService.removeListener('sync:completed', handleSyncEvent);
      dataSyncService.removeListener('sync:failed', handleSyncEvent);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">State Management Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Status Overview */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Status Overview</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Initialized:</span>
            <span className={isFullyInitialized ? 'text-green-400' : 'text-yellow-400'}>
              {isFullyInitialized ? '✅' : '⏳'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Loading:</span>
            <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
              {isLoading ? '⏳' : '✅'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Errors:</span>
            <span className={hasAnyErrors ? 'text-red-400' : 'text-green-400'}>
              {hasAnyErrors ? '❌' : '✅'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading States */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Loading States</h4>
        <div className="space-y-1 text-sm">
          {Object.entries(loading).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key}:</span>
              <span className={value ? 'text-yellow-400' : 'text-green-400'}>
                {value ? '⏳' : '✅'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Initialization States */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Initialization</h4>
        <div className="space-y-1 text-sm">
          {Object.entries(initialized).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key}:</span>
              <span className={value ? 'text-green-400' : 'text-yellow-400'}>
                {value ? '✅' : '⏳'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Stats */}
      {debugInfo.cacheStats && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Cache Stats</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Entries:</span>
              <span>{debugInfo.cacheStats.entries}</span>
            </div>
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{Math.round(debugInfo.cacheStats.totalSize / 1024)}KB</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>{getCacheVersion()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {debugInfo.syncStatus && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Sync Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Online:</span>
              <span className={debugInfo.syncStatus.isOnline ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.syncStatus.isOnline ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Queue:</span>
              <span>{debugInfo.syncStatus.queueSize}</span>
            </div>
            <div className="flex justify-between">
              <span>In Progress:</span>
              <span>{debugInfo.syncStatus.inProgress}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={refreshAll}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh All
        </button>
        <button
          onClick={() => invalidateCache('manual_debug')}
          className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
        >
          🗑️ Clear Cache
        </button>
        <button
          onClick={() => dataSyncService.forceSyncAll()}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
        >
          🔄 Force Sync
        </button>
      </div>

      {/* Last Update */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Last update: {debugInfo.lastUpdate}
      </div>
    </div>
  );
};

export default StateManagementDebugger;
