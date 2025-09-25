import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance monitoring hook for tracking component performance
 * and identifying bottlenecks in the dashboard
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef([]);

  // Track render performance
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    lastRenderTime.current = now;

    // Log performance warnings
    if (renderTime > 100) {
      console.warn(`🐌 Slow render in ${componentName}: ${renderTime}ms`);
    }

    if (renderCount.current > 20) {
      console.warn(`🔄 High render count in ${componentName}: ${renderCount.current} renders`);
    }
  });

  // Get performance stats
  const getPerformanceStats = useCallback(() => {
    const totalTime = Date.now() - startTime.current;
    const avgRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0;

    return {
      componentName,
      renderCount: renderCount.current,
      totalTime,
      avgRenderTime: Math.round(avgRenderTime),
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
      isSlow: avgRenderTime > 50,
      isHighFrequency: renderCount.current > 20
    };
  }, [componentName]);

  // Reset performance tracking
  const resetStats = useCallback(() => {
    renderCount.current = 0;
    startTime.current = Date.now();
    lastRenderTime.current = Date.now();
    renderTimes.current = [];
  }, []);

  return {
    getPerformanceStats,
    resetStats,
    renderCount: renderCount.current
  };
};

/**
 * Hook for monitoring API call performance
 */
export const useAPIPerformanceMonitor = () => {
  const apiCalls = useRef(new Map());
  const slowCalls = useRef([]);

  const startAPICall = useCallback((endpoint, requestId) => {
    apiCalls.current.set(requestId, {
      endpoint,
      startTime: Date.now(),
      requestId
    });
  }, []);

  const endAPICall = useCallback((requestId, success = true) => {
    const call = apiCalls.current.get(requestId);
    if (!call) return;

    const duration = Date.now() - call.startTime;
    const result = {
      ...call,
      duration,
      success,
      endTime: Date.now()
    };

    // Track slow calls
    if (duration > 2000) {
      slowCalls.current.push(result);
      console.warn(`🐌 Slow API call: ${call.endpoint} took ${duration}ms`);
    }

    apiCalls.current.delete(requestId);
    return result;
  }, []);

  const getAPIPerformanceStats = useCallback(() => {
    const totalCalls = apiCalls.current.size;
    const slowCallCount = slowCalls.current.length;
    const avgDuration = slowCalls.current.length > 0
      ? slowCalls.current.reduce((sum, call) => sum + call.duration, 0) / slowCalls.current.length
      : 0;

    return {
      totalCalls,
      slowCallCount,
      avgDuration: Math.round(avgDuration),
      slowCalls: slowCalls.current.slice(-10) // Last 10 slow calls
    };
  }, []);

  const clearAPICalls = useCallback(() => {
    apiCalls.current.clear();
    slowCalls.current = [];
  }, []);

  return {
    startAPICall,
    endAPICall,
    getAPIPerformanceStats,
    clearAPICalls
  };
};

/**
 * Hook for monitoring memory usage
 */
export const useMemoryMonitor = () => {
  const memoryStats = useRef([]);

  const checkMemory = useCallback(() => {
    if (performance.memory) {
      const stats = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
        timestamp: Date.now()
      };

      memoryStats.current.push(stats);
      
      // Keep only last 20 measurements
      if (memoryStats.current.length > 20) {
        memoryStats.current.shift();
      }

      // Warn about high memory usage
      if (stats.used > 100) {
        console.warn(`🧠 High memory usage: ${stats.used}MB`);
      }

      return stats;
    }
    return null;
  }, []);

  const getMemoryStats = useCallback(() => {
    if (memoryStats.current.length === 0) return null;

    const latest = memoryStats.current[memoryStats.current.length - 1];
    const avgUsed = memoryStats.current.reduce((sum, stat) => sum + stat.used, 0) / memoryStats.current.length;
    const maxUsed = Math.max(...memoryStats.current.map(stat => stat.used));

    return {
      current: latest,
      average: Math.round(avgUsed),
      max: maxUsed,
      trend: memoryStats.current.length > 1 
        ? memoryStats.current[memoryStats.current.length - 1].used - memoryStats.current[0].used
        : 0
    };
  }, []);

  // Check memory periodically
  useEffect(() => {
    const interval = setInterval(checkMemory, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [checkMemory]);

  return {
    checkMemory,
    getMemoryStats
  };
};
