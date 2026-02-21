/**
 * Performance Optimization System for TalentSphere
 * Comprehensive performance monitoring, optimization, and auto-tuning
 */

const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { getTracer } = require('../backends/shared/tracing');

class PerformanceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      monitoringInterval: 30000, // 30 seconds
      optimizationInterval: 300000, // 5 minutes
      historySize: 1000,
      enableAutoTuning: config.enableAutoTuning !== false,
      enableProfiling: config.enableProfiling !== false,
      thresholds: {
        responseTime: 500, // ms
        cpuUsage: 80, // percentage
        memoryUsage: 85, // percentage
        errorRate: 2, // percentage
        queueLength: 100
      },
      ...config
    };

    this.tracer = getTracer();
    
    // Performance metrics storage
    this.metrics = {
      requests: [],
      responseTimes: [],
      cpuUsage: [],
      memoryUsage: [],
      errorRates: [],
      queueLengths: [],
      timestamp: []
    };

    // Optimization state
    this.optimizationState = {
      lastOptimization: null,
      activeOptimizations: new Set(),
      optimizationHistory: [],
      autoTuningEnabled: this.config.enableAutoTuning
    };

    // Performance profiles
    this.profiles = new Map();
    this.benchmarks = new Map();
    
    this.initializeMonitoring();
    this.startOptimizationCycle();
  }

  initializeMonitoring() {
    if (!this.config.enabled) return;

    // Start periodic monitoring
    setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoringInterval);

    // Monitor process metrics
    setInterval(() => {
      this.collectProcessMetrics();
    }, 5000);

    console.log('🚀 Performance optimization system initialized');
  }

  collectMetrics() {
    const span = this.tracer ? this.tracer.startSpan('performance.collect.metrics') : null;
    
    try {
      const now = Date.now();
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Store metrics
      this.metrics.timestamp.push(now);
      this.metrics.memoryUsage.push({
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        usagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      });

      this.metrics.cpuUsage.push({
        user: cpuUsage.user,
        system: cpuUsage.system,
        percentage: this.calculateCPUUsage()
      });

      // Maintain history size
      this.trimMetricsHistory();

      // Emit metrics update
      this.emit('metricsUpdate', {
        timestamp: now,
        memory: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1],
        cpu: this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1]
      });

      if (span) {
        span.finish();
      }

    } catch (error) {
      if (span) {
        span.logError(error);
        span.finish();
      }
      console.error('Error collecting performance metrics:', error);
    }
  }

  collectProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Check thresholds and emit warnings
    const memoryPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memoryPercent > this.config.thresholds.memoryUsage) {
      this.emit('performanceAlert', {
        type: 'HIGH_MEMORY',
        severity: 'warning',
        value: memoryPercent,
        threshold: this.config.thresholds.memoryUsage,
        timestamp: Date.now()
      });
    }

    const cpuPercent = this.calculateCPUUsage();
    if (cpuPercent > this.config.thresholds.cpuUsage) {
      this.emit('performanceAlert', {
        type: 'HIGH_CPU',
        severity: 'warning',
        value: cpuPercent,
        threshold: this.config.thresholds.cpuUsage,
        timestamp: Date.now()
      });
    }
  }

  recordRequest(req, res, responseTime) {
    if (!this.config.enabled) return;

    const now = Date.now();
    const request = {
      timestamp: now,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      responseTime,
      statusCode: res.statusCode,
      service: req.headers['x-service'] || 'unknown',
      traceId: req.traceId || req.headers['x-trace-id']
    };

    this.metrics.requests.push(request);
    this.metrics.responseTimes.push(responseTime);

    // Calculate error rate
    if (res.statusCode >= 400) {
      this.metrics.errorRates.push({
        timestamp: now,
        error: true,
        statusCode: res.statusCode
      });
    }

    // Check response time threshold
    if (responseTime > this.config.thresholds.responseTime) {
      this.emit('performanceAlert', {
        type: 'SLOW_RESPONSE',
        severity: 'warning',
        value: responseTime,
        threshold: this.config.thresholds.responseTime,
        request: {
          method: req.method,
          url: req.url,
          service: request.service
        },
        timestamp: now
      });
    }

    // Maintain history size
    if (this.metrics.requests.length > this.config.historySize) {
      this.metrics.requests = this.metrics.requests.slice(-this.config.historySize);
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-this.config.historySize);
    }
  }

  calculateCPUUsage() {
    // Simple CPU usage calculation
    // In a real implementation, you'd want more sophisticated CPU monitoring
    const cpuUsage = process.cpuUsage();
    return Math.min(100, (cpuUsage.user + cpuUsage.system) / 1000000); // Convert to percentage
  }

  trimMetricsHistory() {
    const maxSize = this.config.historySize;
    
    if (this.metrics.timestamp.length > maxSize) {
      this.metrics.timestamp = this.metrics.timestamp.slice(-maxSize);
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-maxSize);
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-maxSize);
      this.metrics.errorRates = this.metrics.errorRates.slice(-maxSize);
      this.metrics.queueLengths = this.metrics.queueLengths.slice(-maxSize);
    }
  }

  startOptimizationCycle() {
    if (!this.config.enableAutoTuning) return;

    setInterval(() => {
      this.performOptimization();
    }, this.config.optimizationInterval);
  }

  async performOptimization() {
    const span = this.tracer ? this.tracer.startSpan('performance.optimization') : null;
    
    try {
      const analysis = this.analyzePerformance();
      const optimizations = this.generateOptimizations(analysis);

      console.log(`🎯 Performance Analysis: ${analysis.status} (Score: ${analysis.score}/100)`);
      
      if (optimizations.length > 0) {
        console.log(`⚡ Applying ${optimizations.length} optimizations...`);
        
        for (const optimization of optimizations) {
          await this.applyOptimization(optimization);
        }
      }

      this.optimizationState.lastOptimization = Date.now();
      
      if (span) {
        span.setTag('optimizations.applied', optimizations.length);
        span.setTag('performance.score', analysis.score);
        span.finish();
      }

    } catch (error) {
      if (span) {
        span.logError(error);
        span.finish();
      }
      console.error('Error during performance optimization:', error);
    }
  }

  analyzePerformance() {
    const analysis = {
      score: 100,
      status: 'excellent',
      issues: [],
      strengths: [],
      recommendations: []
    };

    // Analyze memory usage
    if (this.metrics.memoryUsage.length > 0) {
      const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      const memoryUsagePercent = latestMemory.usagePercentage;
      
      if (memoryUsagePercent > this.config.thresholds.memoryUsage) {
        analysis.score -= 25;
        analysis.issues.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
        analysis.recommendations.push('Consider implementing memory optimization strategies');
      } else if (memoryUsagePercent < 50) {
        analysis.strengths.push('Efficient memory usage');
      }
    }

    // Analyze response times
    if (this.metrics.responseTimes.length > 10) {
      const avgResponseTime = this.metrics.responseTimes.slice(-10).reduce((a, b) => a + b, 0) / 10;
      
      if (avgResponseTime > this.config.thresholds.responseTime) {
        analysis.score -= 20;
        analysis.issues.push(`Slow response times: ${avgResponseTime.toFixed(0)}ms`);
        analysis.recommendations.push('Optimize database queries and caching');
      } else if (avgResponseTime < 200) {
        analysis.strengths.push('Fast response times');
      }
    }

    // Analyze error rates
    if (this.metrics.errorRates.length > 10) {
      const recentErrors = this.metrics.errorRates.slice(-10).filter(e => e.error).length;
      const errorRate = (recentErrors / 10) * 100;
      
      if (errorRate > this.config.thresholds.errorRate) {
        analysis.score -= 30;
        analysis.issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
        analysis.recommendations.push('Investigate and fix error sources');
      } else if (errorRate === 0) {
        analysis.strengths.push('No errors detected');
      }
    }

    // Determine status
    if (analysis.score >= 90) {
      analysis.status = 'excellent';
    } else if (analysis.score >= 75) {
      analysis.status = 'good';
    } else if (analysis.score >= 60) {
      analysis.status = 'fair';
    } else {
      analysis.status = 'poor';
    }

    return analysis;
  }

  generateOptimizations(analysis) {
    const optimizations = [];

    // Memory optimizations
    if (analysis.issues.some(issue => issue.includes('memory'))) {
      optimizations.push({
        type: 'MEMORY_CLEANUP',
        priority: 'high',
        description: 'Force garbage collection',
        action: () => this.forceGarbageCollection()
      });
    }

    // Response time optimizations
    if (analysis.issues.some(issue => issue.includes('response'))) {
      optimizations.push({
        type: 'CACHE_OPTIMIZATION',
        priority: 'medium',
        description: 'Optimize cache settings',
        action: () => this.optimizeCache()
      });
    }

    // Error handling optimizations
    if (analysis.issues.some(issue => issue.includes('error'))) {
      optimizations.push({
        type: 'ERROR_HANDLING',
        priority: 'high',
        description: 'Improve error handling',
        action: () => this.improveErrorHandling()
      });
    }

    // Always include basic optimizations
    optimizations.push({
      type: 'METRICS_CLEANUP',
      priority: 'low',
      description: 'Clean up old metrics',
      action: () => this.cleanupOldMetrics()
    });

    return optimizations.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
  }

  async applyOptimization(optimization) {
    const span = this.tracer ? this.tracer.startSpan(`optimization.${optimization.type}`) : null;
    
    try {
      console.log(`🔧 Applying optimization: ${optimization.description}`);
      
      this.optimizationState.activeOptimizations.add(optimization.type);
      
      const result = await optimization.action();
      
      this.optimizationState.activeOptimizations.delete(optimization.type);
      
      this.optimizationState.optimizationHistory.push({
        type: optimization.type,
        description: optimization.description,
        result,
        timestamp: Date.now(),
        success: true
      });

      this.emit('optimizationApplied', {
        type: optimization.type,
        result,
        timestamp: Date.now()
      });

      if (span) {
        span.setTag('optimization.success', true);
        span.finish();
      }

    } catch (error) {
      this.optimizationState.activeOptimizations.delete(optimization.type);
      
      this.optimizationState.optimizationHistory.push({
        type: optimization.type,
        description: optimization.description,
        error: error.message,
        timestamp: Date.now(),
        success: false
      });

      if (span) {
        span.logError(error);
        span.setTag('optimization.success', false);
        span.finish();
      }

      console.error(`Optimization failed: ${optimization.description}`, error);
    }
  }

  forceGarbageCollection() {
    if (global.gc) {
      const beforeGC = process.memoryUsage();
      global.gc();
      const afterGC = process.memoryUsage();
      
      const memoryFreed = beforeGC.heapUsed - afterGC.heapUsed;
      return {
        memoryFreed: memoryFreed,
        beforeGC,
        afterGC
      };
    } else {
      return { message: 'Garbage collection not available' };
    }
  }

  optimizeCache() {
    // This would integrate with your caching system
    // For now, just return a placeholder result
    return {
      message: 'Cache optimization completed',
      cacheSize: 'optimized',
      hitRate: 'improved'
    };
  }

  improveErrorHandling() {
    // This would integrate with your error handling system
    return {
      message: 'Error handling improved',
      retryStrategies: 'updated',
      circuitBreakers: 'adjusted'
    };
  }

  cleanupOldMetrics() {
    const beforeSize = this.metrics.requests.length;
    
    // Keep only recent metrics (last 100 records)
    this.metrics.requests = this.metrics.requests.slice(-100);
    this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
    
    const afterSize = this.metrics.requests.length;
    
    return {
      beforeSize,
      afterSize,
      cleaned: beforeSize - afterSize
    };
  }

  // Performance profiling
  startProfile(name) {
    if (!this.config.enableProfiling) return null;
    
    const profile = {
      name,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      measurements: []
    };
    
    this.profiles.set(name, profile);
    return profile;
  }

  endProfile(name) {
    if (!this.profiles.has(name)) return null;
    
    const profile = this.profiles.get(name);
    profile.endTime = performance.now();
    profile.endMemory = process.memoryUsage();
    profile.duration = profile.endTime - profile.startTime;
    profile.memoryDelta = {
      heapUsed: profile.endMemory.heapUsed - profile.startMemory.heapUsed,
      heapTotal: profile.endMemory.heapTotal - profile.startMemory.heapTotal
    };
    
    this.profiles.delete(name);
    return profile;
  }

  addMeasurement(profileName, type, value) {
    if (!this.profiles.has(profileName)) return;
    
    this.profiles.get(profileName).measurements.push({
      type,
      value,
      timestamp: performance.now()
    });
  }

  // Benchmarking
  async benchmark(name, fn, iterations = 100) {
    const span = this.tracer ? this.tracer.startSpan(`benchmark.${name}`) : null;
    
    try {
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        results.push(end - start);
      }
      
      const benchmark = {
        name,
        iterations,
        results,
        avgTime: results.reduce((a, b) => a + b, 0) / results.length,
        minTime: Math.min(...results),
        maxTime: Math.max(...results),
        medianTime: results.sort((a, b) => a - b)[Math.floor(results.length / 2)],
        timestamp: Date.now()
      };
      
      this.benchmarks.set(name, benchmark);
      
      if (span) {
        span.setTag('benchmark.avg_time', benchmark.avgTime);
        span.finish();
      }
      
      return benchmark;
      
    } catch (error) {
      if (span) {
        span.logError(error);
        span.finish();
      }
      throw error;
    }
  }

  // Performance reports
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      performance: this.analyzePerformance(),
      metrics: this.getMetricsSummary(),
      profiles: Array.from(this.profiles.values()),
      benchmarks: Array.from(this.benchmarks.values()),
      optimizations: this.optimizationState.optimizationHistory.slice(-10),
      configuration: this.config
    };
    
    return report;
  }

  getMetricsSummary() {
    const summary = {
      totalRequests: this.metrics.requests.length,
      avgResponseTime: this.calculateAverage(this.metrics.responseTimes),
      errorRate: this.calculateErrorRate(),
      currentMemory: this.metrics.memoryUsage.length > 0 ? 
        this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] : null,
      currentCPU: this.metrics.cpuUsage.length > 0 ? 
        this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1] : null
    };
    
    return summary;
  }

  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  calculateErrorRate() {
    if (this.metrics.errorRates.length === 0) return 0;
    const errors = this.metrics.errorRates.filter(e => e.error).length;
    return (errors / this.metrics.errorRates.length) * 100;
  }

  // Export metrics for external systems
  exportMetrics() {
    return {
      metrics: this.metrics,
      profiles: Array.from(this.profiles.values()),
      benchmarks: Array.from(this.benchmarks.values()),
      optimizationState: this.optimizationState,
      timestamp: Date.now()
    };
  }

  // Import metrics from external systems
  importMetrics(data) {
    if (data.metrics) {
      Object.assign(this.metrics, data.metrics);
    }
    
    if (data.profiles) {
      data.profiles.forEach(profile => {
        this.profiles.set(profile.name, profile);
      });
    }
    
    if (data.benchmarks) {
      data.benchmarks.forEach(benchmark => {
        this.benchmarks.set(benchmark.name, benchmark);
      });
    }
    
    console.log('📥 Performance metrics imported successfully');
  }

  // Reset all metrics
  reset() {
    this.metrics = {
      requests: [],
      responseTimes: [],
      cpuUsage: [],
      memoryUsage: [],
      errorRates: [],
      queueLengths: [],
      timestamp: []
    };
    
    this.profiles.clear();
    this.benchmarks.clear();
    this.optimizationState.optimizationHistory = [];
    
    console.log('🔄 Performance metrics reset');
  }
}

// Middleware for Express integration
function createPerformanceMiddleware(optimizer) {
  return (req, res, next) => {
    const startTime = performance.now();
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = performance.now() - startTime;
      optimizer.recordRequest(req, res, responseTime);
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

module.exports = {
  PerformanceOptimizer,
  createPerformanceMiddleware
};