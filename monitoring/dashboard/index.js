/**
 * Comprehensive Monitoring Dashboard for TalentSphere
 * Real-time monitoring of all services with distributed tracing integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { getTracer } = require('../backends/shared/tracing');

class MonitoringDashboard {
  constructor(config = {}) {
    this.config = {
      port: config.port || 8080,
      environment: config.environment || 'development',
      refreshInterval: config.refreshInterval || 5000,
      historySize: config.historySize || 1000,
      enableWebSocket: config.enableWebSocket !== false,
      enableAlerts: config.enableAlerts !== false,
      ...config
    };

    this.app = express();
    this.server = null;
    this.wss = null;
    this.tracer = getTracer();
    
    // Monitoring data storage
    this.serviceMetrics = new Map();
    this.alertHistory = [];
    this.systemMetrics = {
      uptime: 0,
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      servicesCount: 0,
      tracingEnabled: !!this.tracer
    };

    // Alert thresholds
    this.alertThresholds = {
      errorRate: 5, // percentage
      responseTime: 1000, // milliseconds
      serviceDownTime: 30000, // milliseconds
      memoryUsage: 90 // percentage
    };

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeDataCollection();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'dashboard-ui')));
  }

  initializeRoutes() {
    // Dashboard UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboard-ui', 'index.html'));
    });

    // API Routes
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('../../package.json').version
      });
    });

    // Get all metrics
    this.app.get('/api/metrics', (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('dashboard.metrics.get') : null;
      
      try {
        const metrics = this.getAllMetrics();
        
        if (span) {
          span.finish();
        }
        
        res.json(metrics);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(500).json({ error: error.message });
      }
    });

    // Get specific service metrics
    this.app.get('/api/metrics/:service', (req, res) => {
      const serviceName = req.params.service;
      const metrics = this.serviceMetrics.get(serviceName);
      
      if (!metrics) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(metrics);
    });

    // Get tracing data
    this.app.get('/api/traces', (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('dashboard.traces.get') : null;
      
      try {
        const tracingData = this.getTracingData();
        
        if (span) {
          span.finish();
        }
        
        res.json(tracingData);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(500).json({ error: error.message });
      }
    });

    // Get alerts
    this.app.get('/api/alerts', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const alerts = this.alertHistory.slice(-limit);
      
      res.json({
        alerts,
        count: alerts.length,
        total: this.alertHistory.length
      });
    });

    // Service health status
    this.app.get('/api/health/services', async (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('dashboard.services.health') : null;
      
      try {
        const healthStatus = await this.getAllServiceHealth();
        
        if (span) {
          span.finish();
        }
        
        res.json(healthStatus);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(500).json({ error: error.message });
      }
    });

    // Performance insights
    this.app.get('/api/insights', (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('dashboard.insights') : null;
      
      try {
        const insights = this.generatePerformanceInsights();
        
        if (span) {
          span.finish();
        }
        
        res.json(insights);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(500).json({ error: error.message });
      }
    });
  }

  initializeWebSocket() {
    if (!this.config.enableWebSocket) {return;}

    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws) => {
      console.log('📊 Dashboard client connected via WebSocket');
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.getAllMetrics()
      }));

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('📊 Dashboard client disconnected');
      });
    });
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to specific service updates
        ws.serviceSubscription = data.service;
        break;
      case 'getTrace':
        // Get specific trace details
        if (this.tracer) {
          const trace = this.tracer.getTraceById(data.traceId);
          ws.send(JSON.stringify({
            type: 'traceDetails',
            data: trace
          }));
        }
        break;
    }
  }

  initializeDataCollection() {
    // Start periodic data collection
    setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.broadcastUpdates();
    }, this.config.refreshInterval);

    // Process metrics collection
    setInterval(() => {
      this.updateProcessMetrics();
    }, 1000);
  }

  collectMetrics() {
    const span = this.tracer ? this.tracer.startSpan('dashboard.collect.metrics') : null;
    
    try {
      // Update system metrics
      this.systemMetrics.uptime = process.uptime();
      this.systemMetrics.servicesCount = this.serviceMetrics.size;

      // Calculate system-wide metrics
      let totalRequests = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let serviceCount = 0;

      for (const [serviceName, metrics] of this.serviceMetrics) {
        totalRequests += metrics.requests || 0;
        totalErrors += metrics.errors || 0;
        totalResponseTime += (metrics.avgResponseTime || 0) * (metrics.requests || 0);
        serviceCount++;
      }

      this.systemMetrics.totalRequests = totalRequests;
      this.systemMetrics.totalErrors = totalErrors;
      this.systemMetrics.avgResponseTime = serviceCount > 0 ? totalResponseTime / totalRequests : 0;

      // Collect tracing metrics
      if (this.tracer) {
        const tracerMetrics = this.tracer.getServiceMetrics();
        this.systemMetrics.tracingMetrics = tracerMetrics;
      }

      if (span) {
        span.finish();
      }

    } catch (error) {
      if (span) {
        span.logError(error);
        span.finish();
      }
      console.error('Error collecting metrics:', error);
    }
  }

  updateProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.systemMetrics.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    this.systemMetrics.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };
  }

  async getAllServiceHealth() {
    const healthStatus = {
      overall: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    for (const [serviceName, metrics] of this.serviceMetrics) {
      const serviceHealth = this.calculateServiceHealth(serviceName, metrics);
      healthStatus.services[serviceName] = serviceHealth;

      if (serviceHealth.status === 'unhealthy') {
        healthStatus.overall = 'degraded';
      } else if (serviceHealth.status === 'critical' && healthStatus.overall !== 'critical') {
        healthStatus.overall = 'critical';
      }
    }

    return healthStatus;
  }

  calculateServiceHealth(serviceName, metrics) {
    const health = {
      status: 'healthy',
      score: 100,
      issues: [],
      lastCheck: new Date().toISOString(),
      ...metrics
    };

    // Check error rate
    const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
    if (errorRate > this.alertThresholds.errorRate) {
      health.status = health.status === 'healthy' ? 'degraded' : 'critical';
      health.score -= 20;
      health.issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    // Check response time
    if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
      health.status = health.status === 'healthy' ? 'degraded' : 'critical';
      health.score -= 15;
      health.issues.push(`High response time: ${metrics.avgResponseTime}ms`);
    }

    // Check circuit breaker status
    if (metrics.circuitBreakerState && metrics.circuitBreakerState.state === 'OPEN') {
      health.status = 'critical';
      health.score -= 40;
      health.issues.push('Circuit breaker is open');
    }

    // Check last activity
    const lastActivity = new Date(metrics.lastActivity || 0);
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    if (timeSinceActivity > this.alertThresholds.serviceDownTime) {
      health.status = 'critical';
      health.score -= 50;
      health.issues.push(`Service inactive for ${Math.round(timeSinceActivity / 1000)}s`);
    }

    return health;
  }

  checkAlerts() {
    const span = this.tracer ? this.tracer.startSpan('dashboard.check.alerts') : null;
    
    try {
      // Check system-wide alerts
      this.checkSystemAlerts();

      // Check service-specific alerts
      for (const [serviceName, metrics] of this.serviceMetrics) {
        this.checkServiceAlerts(serviceName, metrics);
      }

      if (span) {
        span.finish();
      }

    } catch (error) {
      if (span) {
        span.logError(error);
        span.finish();
      }
      console.error('Error checking alerts:', error);
    }
  }

  checkSystemAlerts() {
    // Memory usage alert
    if (this.systemMetrics.memory && this.systemMetrics.memory.usagePercentage > this.alertThresholds.memoryUsage) {
      this.createAlert('HIGH_MEMORY_USAGE', {
        severity: 'warning',
        message: `High memory usage: ${this.systemMetrics.memory.usagePercentage.toFixed(1)}%`,
        details: this.systemMetrics.memory
      });
    }
  }

  checkServiceAlerts(serviceName, metrics) {
    // Error rate alert
    const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
    if (errorRate > this.alertThresholds.errorRate) {
      this.createAlert('HIGH_ERROR_RATE', {
        severity: errorRate > 10 ? 'critical' : 'warning',
        message: `${serviceName} has high error rate: ${errorRate.toFixed(2)}%`,
        service: serviceName,
        details: { errorRate, requests: metrics.requests, errors: metrics.errors }
      });
    }

    // Response time alert
    if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
      this.createAlert('HIGH_RESPONSE_TIME', {
        severity: 'warning',
        message: `${serviceName} has high response time: ${metrics.avgResponseTime}ms`,
        service: serviceName,
        details: { avgResponseTime: metrics.avgResponseTime }
      });
    }

    // Circuit breaker alert
    if (metrics.circuitBreakerState && metrics.circuitBreakerState.state === 'OPEN') {
      this.createAlert('CIRCUIT_BREAKER_OPEN', {
        severity: 'critical',
        message: `Circuit breaker is open for ${serviceName}`,
        service: serviceName,
        details: metrics.circuitBreakerState
      });
    }
  }

  createAlert(type, data) {
    const alert = {
      id: require('uuid').v4(),
      type,
      severity: data.severity || 'info',
      message: data.message,
      service: data.service,
      details: data.details,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alertHistory.push(alert);

    // Keep only recent alerts
    if (this.alertHistory.length > this.config.historySize) {
      this.alertHistory = this.alertHistory.slice(-this.config.historySize);
    }

    // Broadcast critical alerts immediately
    if (alert.severity === 'critical' && this.wss) {
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'alert',
            data: alert
          }));
        }
      });
    }

    console.log(`🚨 Alert: ${alert.message}`);
  }

  getAllMetrics() {
    return {
      system: this.systemMetrics,
      services: Object.fromEntries(this.serviceMetrics),
      alerts: this.alertHistory.slice(-10), // Last 10 alerts
      timestamp: new Date().toISOString()
    };
  }

  getTracingData() {
    if (!this.tracer) {
      return { enabled: false, message: 'Tracing is not enabled' };
    }

    const activeSpans = this.tracer.getActiveSpans();
    const tracerMetrics = this.tracer.getServiceMetrics();

    return {
      enabled: true,
      activeSpans: activeSpans.map(span => ({
        operationName: span.operationName,
        traceId: span.getContext().traceId,
        spanId: span.getContext().spanId,
        duration: Date.now() - span.getContext().startTime,
        tags: span.getContext().tags,
        status: span.getContext().status
      })),
      metrics: tracerMetrics,
      timestamp: new Date().toISOString()
    };
  }

  generatePerformanceInsights() {
    const insights = {
      overall: {
        status: 'good',
        score: 0,
        recommendations: []
      },
      services: {},
      timestamp: new Date().toISOString()
    };

    let totalScore = 0;
    let serviceCount = 0;

    for (const [serviceName, metrics] of this.serviceMetrics) {
      const serviceInsights = this.analyzeServicePerformance(serviceName, metrics);
      insights.services[serviceName] = serviceInsights;
      totalScore += serviceInsights.score;
      serviceCount++;
    }

    // Calculate overall score
    insights.overall.score = serviceCount > 0 ? totalScore / serviceCount : 100;
    
    // Determine overall status
    if (insights.overall.score >= 90) {
      insights.overall.status = 'excellent';
    } else if (insights.overall.score >= 75) {
      insights.overall.status = 'good';
    } else if (insights.overall.score >= 60) {
      insights.overall.status = 'fair';
    } else {
      insights.overall.status = 'poor';
    }

    // Generate recommendations
    insights.overall.recommendations = this.generateRecommendations(insights);

    return insights;
  }

  analyzeServicePerformance(serviceName, metrics) {
    const insights = {
      score: 100,
      issues: [],
      strengths: [],
      recommendations: []
    };

    // Analyze error rate
    const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
    if (errorRate > 5) {
      insights.score -= 20;
      insights.issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
      insights.recommendations.push('Investigate and fix root causes of errors');
    } else if (errorRate < 1) {
      insights.strengths.push('Low error rate');
    }

    // Analyze response time
    if (metrics.avgResponseTime > 1000) {
      insights.score -= 15;
      insights.issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
      insights.recommendations.push('Optimize database queries and algorithms');
    } else if (metrics.avgResponseTime < 200) {
      insights.strengths.push('Fast response time');
    }

    // Analyze circuit breaker
    if (metrics.circuitBreakerState && metrics.circuitBreakerState.state !== 'CLOSED') {
      insights.score -= 25;
      insights.issues.push('Circuit breaker issues detected');
      insights.recommendations.push('Check downstream service health');
    }

    return insights;
  }

  generateRecommendations(insights) {
    const recommendations = [];
    
    // System-wide recommendations
    if (this.systemMetrics.memory && this.systemMetrics.memory.usagePercentage > 80) {
      recommendations.push('Consider scaling up or optimizing memory usage');
    }

    // Aggregated service recommendations
    const serviceNames = Object.keys(insights.services);
    if (serviceNames.length === 0) {
      recommendations.push('Ensure all services are reporting metrics');
    }

    // Find common issues
    const commonIssues = {};
    for (const service of serviceNames) {
      for (const issue of insights.services[service].issues) {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1;
      }
    }

    for (const [issue, count] of Object.entries(commonIssues)) {
      if (count > 1) {
        recommendations.push(`Address common issue across ${count} services: ${issue}`);
      }
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  broadcastUpdates() {
    if (!this.wss) {return;}

    const updateData = this.getAllMetrics();
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Send updates based on subscription
        if (client.serviceSubscription) {
          const serviceData = updateData.services[client.serviceSubscription];
          if (serviceData) {
            client.send(JSON.stringify({
              type: 'serviceUpdate',
              service: client.serviceSubscription,
              data: serviceData
            }));
          }
        } else {
          // Send full update
          client.send(JSON.stringify({
            type: 'update',
            data: updateData
          }));
        }
      }
    });
  }

  // Methods for external metric reporting
  reportServiceMetrics(serviceName, metrics) {
    this.serviceMetrics.set(serviceName, {
      ...metrics,
      lastUpdated: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
  }

  reportServiceHealth(serviceName, health) {
    const existing = this.serviceMetrics.get(serviceName) || {};
    this.serviceMetrics.set(serviceName, {
      ...existing,
      health,
      lastHealthCheck: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('dashboard.startup') : null;
    
    try {
      this.server = http.createServer(this.app);
      
      this.server.listen(this.config.port, () => {
        console.log(`📊 Monitoring Dashboard running on port ${this.config.port}`);
        console.log(`📍 Environment: ${this.config.environment}`);
        console.log(`🔗 WebSocket: ${this.config.enableWebSocket ? 'enabled' : 'disabled'}`);
        console.log(`📈 Alerts: ${this.config.enableAlerts ? 'enabled' : 'disabled'}`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Dashboard started successfully');
        startupSpan.finish();
      }

    } catch (error) {
      if (startupSpan) {
        startupSpan.logError(error);
        startupSpan.finish();
      }
      throw error;
    }
  }

  async stop() {
    const shutdownSpan = this.tracer ? this.tracer.startSpan('dashboard.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }

      if (this.wss) {
        this.wss.close();
      }

      console.log('🛑 Monitoring Dashboard stopped');

      if (shutdownSpan) {
        shutdownSpan.finish();
      }

    } catch (error) {
      if (shutdownSpan) {
        shutdownSpan.logError(error);
        shutdownSpan.finish();
      }
      throw error;
    }
  }
}

module.exports = {
  MonitoringDashboard
};

// Auto-start if this is the main module
if (require.main === module) {
  const dashboard = new MonitoringDashboard({
    port: process.env.DASHBOARD_PORT || 8080,
    environment: process.env.NODE_ENV || 'development'
  });

  dashboard.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await dashboard.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await dashboard.stop();
    process.exit(0);
  });
}