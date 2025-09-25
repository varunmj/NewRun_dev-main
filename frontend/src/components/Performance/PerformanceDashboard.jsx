import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSpeed, MdMemory, MdApi, MdWarning, MdCheckCircle, MdRefresh } from 'react-icons/md';
import { getCacheStats } from '../../utils/aiCache';
import { usePerformanceMonitor, useAPIPerformanceMonitor, useMemoryMonitor } from '../../hooks/usePerformanceMonitor';

/**
 * Performance Dashboard Component
 * Shows real-time performance metrics and optimization suggestions
 */
const PerformanceDashboard = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState({
    cache: null,
    memory: null,
    api: null,
    components: []
  });

  const { getMemoryStats, checkMemory } = useMemoryMonitor();
  const { getAPIPerformanceStats } = useAPIPerformanceMonitor();

  // Update stats periodically
  useEffect(() => {
    if (!isOpen) return;

    const updateStats = () => {
      setStats(prev => ({
        ...prev,
        cache: getCacheStats(),
        memory: getMemoryStats(),
        api: getAPIPerformanceStats()
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, getMemoryStats, getAPIPerformanceStats]);

  if (!isOpen) return null;

  const getPerformanceScore = () => {
    let score = 100;
    
    // Deduct points for issues
    if (stats.memory?.current?.used > 100) score -= 20;
    if (stats.api?.slowCallCount > 5) score -= 15;
    if (stats.cache?.entries > 40) score -= 10;
    
    return Math.max(0, score);
  };

  const score = getPerformanceScore();
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <MdSpeed className="text-xl text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Performance Dashboard</h2>
              <p className="text-white/60 text-sm">Real-time performance metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <MdRefresh className="text-white/60" />
          </button>
        </div>

        {/* Performance Score */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Overall Performance</h3>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}/100</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1 }}
              className={`h-3 rounded-full ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Memory Usage */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <MdMemory className="text-xl text-purple-400" />
              <h4 className="font-semibold text-white">Memory Usage</h4>
            </div>
            {stats.memory ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Current:</span>
                  <span className="text-white">{stats.memory.current?.used || 0}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Average:</span>
                  <span className="text-white">{stats.memory.average || 0}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Max:</span>
                  <span className="text-white">{stats.memory.max || 0}MB</span>
                </div>
                {stats.memory.trend > 0 && (
                  <div className="text-xs text-red-400">
                    ⚠️ Memory usage increasing
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/60 text-sm">No memory data available</p>
            )}
          </div>

          {/* Cache Stats */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <MdSpeed className="text-xl text-green-400" />
              <h4 className="font-semibold text-white">Cache Performance</h4>
            </div>
            {stats.cache ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Entries:</span>
                  <span className="text-white">{stats.cache.entries}/{stats.cache.maxEntries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Size:</span>
                  <span className="text-white">{Math.round(stats.cache.totalSize / 1024)}KB</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${(stats.cache.entries / stats.cache.maxEntries) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-white/60 text-sm">No cache data available</p>
            )}
          </div>

          {/* API Performance */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <MdApi className="text-xl text-blue-400" />
              <h4 className="font-semibold text-white">API Performance</h4>
            </div>
            {stats.api ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Total Calls:</span>
                  <span className="text-white">{stats.api.totalCalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Slow Calls:</span>
                  <span className="text-white">{stats.api.slowCallCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Avg Duration:</span>
                  <span className="text-white">{stats.api.avgDuration}ms</span>
                </div>
                {stats.api.slowCallCount > 0 && (
                  <div className="text-xs text-yellow-400">
                    ⚠️ {stats.api.slowCallCount} slow API calls detected
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/60 text-sm">No API data available</p>
            )}
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <MdWarning className="text-yellow-400" />
            Optimization Suggestions
          </h4>
          <div className="space-y-2">
            {score < 80 && (
              <div className="flex items-start gap-2 text-sm">
                <MdWarning className="text-yellow-400 mt-0.5" />
                <span className="text-white/80">
                  Performance could be improved. Consider clearing cache or reducing memory usage.
                </span>
              </div>
            )}
            {stats.memory?.current?.used > 100 && (
              <div className="flex items-start gap-2 text-sm">
                <MdMemory className="text-red-400 mt-0.5" />
                <span className="text-white/80">
                  High memory usage detected. Consider optimizing component re-renders.
                </span>
              </div>
            )}
            {stats.api?.slowCallCount > 5 && (
              <div className="flex items-start gap-2 text-sm">
                <MdApi className="text-red-400 mt-0.5" />
                <span className="text-white/80">
                  Multiple slow API calls detected. Consider implementing request deduplication.
                </span>
              </div>
            )}
            {score >= 80 && (
              <div className="flex items-start gap-2 text-sm">
                <MdCheckCircle className="text-green-400 mt-0.5" />
                <span className="text-white/80">
                  Performance is optimal! Great job on the optimizations.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={checkMemory}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Refresh Memory
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PerformanceDashboard;
