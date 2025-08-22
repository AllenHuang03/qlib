// System Diagnostics Utility
// This file provides system monitoring and diagnostics capabilities

console.log('System Diagnostics: Initializing system monitoring...');

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    try {
      // Monitor navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            console.log('System Diagnostics: Navigation timing:', entry);
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 1000) {
              console.warn('System Diagnostics: Slow resource detected:', entry.name, entry.duration);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }
    } catch (error) {
      console.warn('System Diagnostics: Failed to initialize performance observers:', error);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetricSummary(name: string) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  getAllMetrics() {
    const summary: Record<string, any> = {};
    this.metrics.forEach((values, name) => {
      summary[name] = this.getMetricSummary(name);
    });
    return summary;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Memory monitoring
const monitorMemoryUsage = () => {
  if (!('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
    totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
    limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    utilization: memory.usedJSHeapSize / memory.jsHeapSizeLimit
  };
};

// Network monitoring
const monitorNetworkConditions = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) {
    return null;
  }

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData || false
  };
};

// System health check
const performHealthCheck = () => {
  const health = {
    timestamp: Date.now(),
    memory: monitorMemoryUsage(),
    network: monitorNetworkConditions(),
    performance: {
      now: performance.now(),
      timeOrigin: performance.timeOrigin
    },
    dom: {
      readyState: document.readyState,
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus()
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    errors: {
      jsErrors: (window as any).__ERROR_COUNT__ || 0,
      consoleWarnings: (window as any).__WARNING_COUNT__ || 0
    }
  };

  return health;
};

// Error tracking
let errorCount = 0;
let warningCount = 0;

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  errorCount++;
  (window as any).__ERROR_COUNT__ = errorCount;
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  warningCount++;
  (window as any).__WARNING_COUNT__ = warningCount;
  originalConsoleWarn.apply(console, args);
};

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Periodic health checks
const startPeriodicHealthChecks = (interval: number = 60000) => {
  const healthCheckInterval = setInterval(() => {
    const health = performHealthCheck();
    console.log('System Diagnostics: Health check:', health);
    
    // Check for concerning conditions
    if (health.memory && health.memory.utilization > 0.9) {
      console.warn('System Diagnostics: High memory usage detected:', health.memory.utilization);
    }
    
    if (health.errors.jsErrors > 50) {
      console.warn('System Diagnostics: High error count detected:', health.errors.jsErrors);
    }
  }, interval);

  return healthCheckInterval;
};

// Export diagnostics API
const diagnostics = {
  performanceMonitor,
  monitorMemoryUsage,
  monitorNetworkConditions,
  performHealthCheck,
  startPeriodicHealthChecks,
  getErrorCount: () => errorCount,
  getWarningCount: () => warningCount,
  resetCounters: () => {
    errorCount = 0;
    warningCount = 0;
    (window as any).__ERROR_COUNT__ = 0;
    (window as any).__WARNING_COUNT__ = 0;
  }
};

// Make diagnostics globally available
(window as any).__SYSTEM_DIAGNOSTICS__ = diagnostics;

// Auto-start health checks in development
if (process.env.NODE_ENV === 'development') {
  console.log('System Diagnostics: Starting periodic health checks...');
  startPeriodicHealthChecks(30000); // Every 30 seconds in development
}

console.log('System Diagnostics: Initialization complete. Access via window.__SYSTEM_DIAGNOSTICS__');

export default diagnostics;
export {
  PerformanceMonitor,
  monitorMemoryUsage,
  monitorNetworkConditions,
  performHealthCheck,
  startPeriodicHealthChecks
};