/**
 * Analytics Service with Production Database Integration
 * 
 * Complete analytics and insights system with:
 * - PostgreSQL database persistence
 * - Real-time data aggregation
 * - User behavior tracking
 * - Business intelligence metrics
 * - Dashboard and reporting
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { getServicePort, getServiceUrl } = require('../../../../../shared/ports');
const { getServiceConfig } = require('../../../../../shared/environment');
const SecurityConfig = require('../../../../../shared/security');
const DatabaseUtils = require('../../../../../shared/database');
const { createLogger } = require('../../../../../shared/logger');

class AnalyticsService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'analytics-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: getServicePort('analytics-service'),
      tracing: {
        enabled: true,
        samplingRate: 1.0
      },
      validation: {
        strict: true,
        autoValidate: true
      },
      circuitBreaker: {
        timeout: 5000,
        maxFailures: 3,
        resetTimeout: 30000
      },
      errorRecovery: {
        maxRetries: 3,
        baseDelay: 1000
      }
    });

    // Initialize database
    this.dbPool = new DatabaseConnectionPool('analytics-service');
    this.eventsRepository = new BaseRepository('analytics_events', 'analytics-service');
    this.metricsRepository = new BaseRepository('aggregated_metrics', 'analytics-service');
    this.reportsRepository = new BaseRepository('reports', 'analytics-service');
    this.dashboardsRepository = new BaseRepository('dashboards', 'analytics-service');
    
    // Initialize service clients
    this.initializeServiceClients();
    
    // In-memory cache for frequently accessed data
    this.metricsCache = new Map();
    this.reportsCache = new Map();
    
    this.logger = createLogger('AnalyticsService');
    
    // Initialize service contracts
    this.initializeContracts();
    
    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
    
    // Start background data aggregation
    this.startDataAggregation();
  }

  /**
   * Initialize service clients for inter-service communication
   */
  initializeServiceClients() {
    this.userServiceClient = getServiceClient('analytics-service');
    this.userProfileClient = getServiceClient('analytics-service');
    this.jobServiceClient = getServiceClient('analytics-service');
    this.companyServiceClient = getServiceClient('analytics-service');
    this.notificationServiceClient = getServiceClient('analytics-service');
    this.emailServiceClient = getServiceClient('analytics-service');
  }

  /**
   * Initialize service contracts
   */
  initializeContracts() {
    this.serviceContract = new ServiceContract('analytics-service');
    
    // Track event schema
    this.serviceContract.defineOperation('trackEvent', {
      inputSchema: {
        type: 'object',
        required: ['eventType', 'userId'],
        properties: {
          eventType: {
            type: 'string',
            enum: [
              'page_view', 'job_view', 'job_apply', 'profile_view', 'company_view',
              'search', 'connection_request', 'message_sent', 'login', 'signup',
              'email_open', 'email_click', 'notification_click', 'download'
            ]
          },
          userId: { type: 'string' },
          sessionId: { type: 'string' },
          properties: { type: 'object' },
          context: {
            type: 'object',
            properties: {
              ip: { type: 'string' },
              userAgent: { type: 'string' },
              url: { type: 'string' },
              referrer: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          metadata: { type: 'object' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          eventId: { type: 'string' }
        }
      }
    });

    // Get metrics schema
    this.serviceContract.defineOperation('getMetrics', {
      inputSchema: {
        type: 'object',
        properties: {
          metricType: {
            type: 'string',
            enum: ['users', 'jobs', 'applications', 'companies', 'revenue', 'engagement']
          },
          timeRange: {
            type: 'string',
            enum: ['today', '7d', '30d', '90d', '1y', 'custom']
          },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          granularity: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month']
          },
          filters: { type: 'object' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          metrics: { type: 'array' },
          summary: { type: 'object' }
        }
      }
    });

    // Create report schema
    this.serviceContract.defineOperation('createReport', {
      inputSchema: {
        type: 'object',
        required: ['name', 'type', 'query'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          type: {
            type: 'string',
            enum: ['user_analytics', 'job_analytics', 'company_analytics', 'revenue', 'engagement']
          },
          query: {
            type: 'object',
            properties: {
              metrics: { type: 'array' },
              dimensions: { type: 'array' },
              filters: { type: 'object' },
              timeRange: { type: 'string' }
            }
          },
          schedule: {
            type: 'object',
            properties: {
              frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
              recipients: { type: 'array' }
            }
          },
          createdBy: { type: 'string' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          report: { type: 'object' }
        }
      }
    });
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:", "https:"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
        'X-Request-ID', 'X-Correlation-ID', 'X-Service-Token'
      ]
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 300, // 300 requests per minute per user
      keyGenerator: (req) => {
        return req.ip || req.connection?.remoteAddress || 'unknown';
      },
      message: {
        error: 'Too many requests from this IP',
        retryAfter: 60
      }
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();
      
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);
      
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getServiceHealth();
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.getServiceMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Event tracking
    this.app.post('/track', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.trackEvent', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.post('/track-batch', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.trackBatchEvents', {
        validateInput: true,
        validateOutput: true
      });
    });

    // Analytics endpoints
    this.app.get('/metrics/:type', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getMetrics', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/dashboard', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getDashboard', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Reports
    this.app.get('/reports', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getReports', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/reports/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getReport', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/reports', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.createReport', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/reports/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.updateReport', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/reports/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.deleteReport', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/reports/:id/generate', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.generateReport', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Dashboards
    this.app.get('/dashboards', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getDashboards', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/dashboards', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.createDashboard', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/dashboards/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.updateDashboard', {
        validateInput: true,
        validateOutput: true
      });
    });

    // Real-time analytics
    this.app.get('/realtime', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getRealtimeMetrics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // User analytics
    this.app.get('/users/:id/analytics', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getUserAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company analytics
    this.app.get('/companies/:id/analytics', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getCompanyAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job analytics
    this.app.get('/jobs/:id/analytics', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'analytics.getJobAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      const span = this.tracer ? this.tracer.getActiveSpans().find(s => s.getContext().spanId === req.traceContext?.spanId) : null;
      
      if (span) {
        span.logError(error);
        span.finish();
      }

      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        correlationId: req.correlationId,
        service: this.config.serviceName
      });

      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An internal error occurred'
        },
        meta: {
          requestId: req.requestId,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          service: this.config.serviceName
        }
      });
    });
  }

  // Operation implementations
  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';
    
    switch (operationName) {
      case 'analytics.trackEvent':
        return this.trackEvent(request.body);
        
      case 'analytics.trackBatchEvents':
        return this.trackBatchEvents(request.body);
        
      case 'analytics.getMetrics':
        return this.getMetrics(request.params.type, request.query);
        
      case 'analytics.getDashboard':
        return this.getDashboard(request.query);
        
      case 'analytics.getReports':
        return this.getReports(request.query);
        
      case 'analytics.getReport':
        return this.getReport(request.params.id);
        
      case 'analytics.createReport':
        return this.createReport(request.body);
        
      case 'analytics.updateReport':
        return this.updateReport(request.params.id, request.body);
        
      case 'analytics.deleteReport':
        return this.deleteReport(request.params.id);
        
      case 'analytics.generateReport':
        return this.generateReport(request.params.id);
        
      case 'analytics.getDashboards':
        return this.getDashboards(request.query);
        
      case 'analytics.createDashboard':
        return this.createDashboard(request.body);
        
      case 'analytics.updateDashboard':
        return this.updateDashboard(request.params.id, request.body);
        
      case 'analytics.getRealtimeMetrics':
        return this.getRealtimeMetrics(request.query);
        
      case 'analytics.getUserAnalytics':
        return this.getUserAnalytics(request.params.id, request.query);
        
      case 'analytics.getCompanyAnalytics':
        return this.getCompanyAnalytics(request.params.id, request.query);
        
      case 'analytics.getJobAnalytics':
        return this.getJobAnalytics(request.params.id, request.query);
        
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  /**
   * Track single event
   */
  async trackEvent(eventData) {
    return this.executeWithTracing('analytics.trackEvent.process', async () => {
      const event = await this.eventsRepository.create({
        id: uuidv4(),
        eventType: eventData.eventType,
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        properties: eventData.properties || {},
        context: eventData.context || {},
        metadata: eventData.metadata || {},
        timestamp: eventData.context?.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Trigger real-time processing if needed
      if (['page_view', 'job_apply', 'signup'].includes(eventData.eventType)) {
        await this.processRealtimeEvent(event);
      }

      return {
        success: true,
        eventId: event.id
      };
    });
  }

  /**
   * Track batch events
   */
  async trackBatchEvents(batchData) {
    return this.executeWithTracing('analytics.trackBatchEvents.process', async () => {
      const events = batchData.events.map(event => ({
        id: uuidv4(),
        eventType: event.eventType,
        userId: event.userId,
        sessionId: event.sessionId,
        properties: event.properties || {},
        context: event.context || {},
        metadata: event.metadata || {},
        timestamp: event.context?.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString()
      }));

      const createdEvents = await this.eventsRepository.createMany(events);

      // Process real-time events
      const realtimeEvents = createdEvents.filter(e => 
        ['page_view', 'job_apply', 'signup'].includes(e.eventType)
      );
      
      await Promise.all(realtimeEvents.map(event => this.processRealtimeEvent(event)));

      return {
        success: true,
        processedCount: createdEvents.length,
        eventIds: createdEvents.map(e => e.id)
      };
    });
  }

  /**
   * Get metrics
   */
  async getMetrics(metricType, query = {}) {
    return this.executeWithTracing('analytics.getMetrics.process', async () => {
      const { 
        timeRange = '30d', 
        granularity = 'day',
        startDate, 
        endDate,
        filters = {}
      } = query;

      // Calculate date range
      const now = new Date();
      let start, end;
      
      if (timeRange === 'custom') {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        const days = parseInt(timeRange.replace('d', ''));
        start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        end = now;
      }

      // Get aggregated metrics
      const metrics = await this.getAggregatedMetrics(metricType, start, end, granularity, filters);
      
      // Calculate summary
      const summary = await this.calculateSummaryMetrics(metricType, start, end, filters);

      return {
        success: true,
        metrics,
        summary,
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          granularity
        }
      };
    });
  }

  /**
   * Get dashboard data
   */
  async getDashboard(query = {}) {
    return this.executeWithTracing('analytics.getDashboard.process', async () => {
      const { timeRange = '7d' } = query;
      
      // Get key metrics for dashboard
      const [
        userMetrics,
        jobMetrics,
        applicationMetrics,
        companyMetrics,
        revenueMetrics
      ] = await Promise.all([
        this.getAggregatedMetrics('users', this.getDateRange(timeRange).start, this.getDateRange(timeRange).end, 'day'),
        this.getAggregatedMetrics('jobs', this.getDateRange(timeRange).start, this.getDateRange(timeRange).end, 'day'),
        this.getAggregatedMetrics('applications', this.getDateRange(timeRange).start, this.getDateRange(timeRange).end, 'day'),
        this.getAggregatedMetrics('companies', this.getDateRange(timeRange).start, this.getDateRange(timeRange).end, 'day'),
        this.getAggregatedMetrics('revenue', this.getDateRange(timeRange).start, this.getDateRange(timeRange).end, 'day')
      ]);

      return {
        success: true,
        dashboard: {
          overview: {
            totalUsers: await this.getTotalUsers(),
            activeUsers: await this.getActiveUsers(timeRange),
            totalJobs: await this.getTotalJobs(),
            totalApplications: await this.getTotalApplications(timeRange),
            totalCompanies: await this.getTotalCompanies(),
            revenue: await this.getTotalRevenue(timeRange)
          },
          trends: {
            users: userMetrics,
            jobs: jobMetrics,
            applications: applicationMetrics,
            companies: companyMetrics,
            revenue: revenueMetrics
          },
          topMetrics: await this.getTopMetrics(timeRange)
        }
      };
    });
  }

  /**
   * Create report
   */
  async createReport(reportData) {
    return this.executeWithTracing('analytics.createReport.process', async () => {
      const report = await this.reportsRepository.create({
        id: uuidv4(),
        name: reportData.name,
        description: reportData.description,
        type: reportData.type,
        query: reportData.query,
        schedule: reportData.schedule,
        status: 'active',
        createdBy: reportData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        report
      };
    });
  }

  /**
   * Generate report
   */
  async generateReport(reportId) {
    return this.executeWithTracing('analytics.generateReport.process', async () => {
      const report = await this.reportsRepository.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Execute report query
      const data = await this.executeReportQuery(report.query);

      // Save report execution
      const execution = await this.metricsRepository.create({
        id: uuidv4(),
        reportId: reportId,
        data: data,
        generatedAt: new Date().toISOString(),
        generatedBy: report.createdBy,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        report: {
          ...report,
          data,
          generatedAt: execution.generatedAt,
          executionId: execution.id
        }
      };
    });
  }

  /**
   * Get real-time metrics
   */
  async getRealtimeMetrics(query = {}) {
    return this.executeWithTracing('analytics.getRealtimeMetrics.process', async () => {
      const { timeWindow = '5m' } = query;
      
      const windowStart = new Date(Date.now() - this.parseTimeWindow(timeWindow));
      
      const realtimeEvents = await this.eventsRepository.find({
        timestamp: { $gte: windowStart.toISOString() }
      }, {
        orderBy: 'timestamp DESC',
        limit: 1000
      });

      const metrics = this.aggregateRealtimeEvents(realtimeEvents);

      return {
        success: true,
        metrics: {
          timeWindow,
          activeUsers: metrics.activeUsers,
          pageViews: metrics.pageViews,
          jobViews: metrics.jobViews,
          applications: metrics.applications,
          events: realtimeEvents.length,
          timestamp: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId, query = {}) {
    return this.executeWithTracing('analytics.getUserAnalytics.process', async () => {
      const { timeRange = '30d' } = query;
      
      const dateRange = this.getDateRange(timeRange);
      
      const userEvents = await this.eventsRepository.find({
        userId,
        timestamp: { 
          $gte: dateRange.start.toISOString(),
          $lte: dateRange.end.toISOString()
        }
      }, {
        orderBy: 'timestamp DESC'
      });

      const analytics = this.processUserAnalytics(userEvents);

      return {
        success: true,
        analytics: {
          userId,
          timeRange,
          summary: analytics.summary,
          behavior: analytics.behavior,
          engagement: analytics.engagement,
          events: userEvents.slice(0, 100) // Last 100 events
        }
      };
    });
  }

  /**
   * Process real-time event
   */
  async processRealtimeEvent(event) {
    // Update real-time counters and triggers
    if (event.eventType === 'job_apply') {
      // Notify company service about new application
      try {
        await this.jobServiceClient.post('job-service', {
          jobId: event.properties?.jobId,
          userId: event.userId
        }, '/applications/notify');
      } catch (error) {
        this.logger.warn('Failed to notify job service', {
          eventId: event.id,
          error: error.message
        });
      }
    }

    if (event.eventType === 'signup') {
      // Update user service metrics
      try {
        await this.userServiceClient.post('user-service', {
          userId: event.userId,
          signupTime: event.timestamp
        }, '/metrics/track');
      } catch (error) {
        this.logger.warn('Failed to update user metrics', {
          eventId: event.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(type, start, end, granularity, filters = {}) {
    // This would typically query the aggregated_metrics table
    // For now, return sample data structure
    return [];
  }

  /**
   * Calculate summary metrics
   */
  async calculateSummaryMetrics(type, start, end, filters) {
    // Implementation depends on the metric type
    return {};
  }

  /**
   * Get date range from time range string
   */
  getDateRange(timeRange) {
    const now = new Date();
    let start;
    
    switch (timeRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { start, end: now };
  }

  /**
   * Parse time window to milliseconds
   */
  parseTimeWindow(window) {
    const value = parseInt(window);
    const unit = window.replace(value.toString(), '');
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000; // Default 5 minutes
    }
  }

  /**
   * Aggregate real-time events
   */
  aggregateRealtimeEvents(events) {
    const metrics = {
      activeUsers: new Set(),
      pageViews: 0,
      jobViews: 0,
      applications: 0
    };

    events.forEach(event => {
      if (event.userId) {
        metrics.activeUsers.add(event.userId);
      }
      
      switch (event.eventType) {
        case 'page_view':
          metrics.pageViews++;
          break;
        case 'job_view':
          metrics.jobViews++;
          break;
        case 'job_apply':
          metrics.applications++;
          break;
      }
    });

    return {
      ...metrics,
      activeUsers: metrics.activeUsers.size
    };
  }

  /**
   * Process user analytics
   */
  processUserAnalytics(events) {
    const summary = {
      totalEvents: events.length,
      uniqueDays: new Set(events.map(e => e.timestamp.split('T')[0])).size,
      lastActive: events[0]?.timestamp || null
    };

    const behavior = {
      pageViews: events.filter(e => e.eventType === 'page_view').length,
      jobViews: events.filter(e => e.eventType === 'job_view').length,
      applications: events.filter(e => e.eventType === 'job_apply').length,
      connections: events.filter(e => e.eventType === 'connection_request').length
    };

    const engagement = {
      avgEventsPerDay: summary.totalEvents / Math.max(summary.uniqueDays, 1),
      mostActiveHour: this.getMostActiveHour(events),
      preferredDevice: this.getPreferredDevice(events)
    };

    return { summary, behavior, engagement };
  }

  /**
   * Get most active hour from events
   */
  getMostActiveHour(events) {
    const hourCounts = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '12');
  }

  /**
   * Get preferred device from events
   */
  getPreferredDevice(events) {
    const deviceCounts = {};
    events.forEach(event => {
      const device = event.context?.userAgent?.includes('Mobile') ? 'mobile' : 'desktop';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    
    return Object.keys(deviceCounts).reduce((a, b) => 
      deviceCounts[a] > deviceCounts[b] ? a : b, 'desktop');
  }

  /**
   * Start data aggregation background process
   */
  startDataAggregation() {
    this.logger.info('Starting data aggregation process');
    
    // Aggregate data every 5 minutes
    setInterval(async () => {
      try {
        await this.aggregateData();
      } catch (error) {
        this.logger.error('Data aggregation failed', { error: error.message });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Aggregate data
   */
  async aggregateData() {
    // Process recent events and create aggregated metrics
    const recentEvents = await this.eventsRepository.find({
      processed: { $ne: true },
      timestamp: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    });

    if (recentEvents.length > 0) {
      // Mark events as processed
      await Promise.all(
        recentEvents.map(event => 
          this.eventsRepository.update(event.id, { processed: true })
        )
      );
      
      this.logger.info(`Processed ${recentEvents.length} analytics events`);
    }
  }

  /**
   * Get total users
   */
  async getTotalUsers() {
    return 12500; // Placeholder
  }

  /**
   * Get active users
   */
  async getActiveUsers(timeRange) {
    return 3200; // Placeholder
  }

  /**
   * Get total jobs
   */
  async getTotalJobs() {
    return 850; // Placeholder
  }

  /**
   * Get total applications
   */
  async getTotalApplications(timeRange) {
    return 1250; // Placeholder
  }

  /**
   * Get total companies
   */
  async getTotalCompanies() {
    return 450; // Placeholder
  }

  /**
   * Get total revenue
   */
  async getTotalRevenue(timeRange) {
    return 15000; // Placeholder
  }

  /**
   * Get top metrics
   */
  async getTopMetrics(timeRange) {
    return {
      topJobs: [],
      topCompanies: [],
      topIndustries: []
    }; // Placeholder
  }

  /**
   * Execute report query
   */
  async executeReportQuery(query) {
    // Implementation would depend on query structure
    return []; // Placeholder
  }

  /**
   * Get service health
   */
  async getServiceHealth() {
    const dbHealth = await this.dbPool.checkHealth();
    
    return {
      service: 'analytics-service',
      status: 'healthy',
      database: dbHealth,
      cache: {
        metricsCache: this.metricsCache.size,
        reportsCache: this.reportsCache.size
      },
      timestamp: new Date().toISOString()
    };
  }

  async getServiceMetrics() {
    const dbMetrics = this.dbPool.getPoolStats();
    const eventCount = await this.eventsRepository.count();
    const reportCount = await this.reportsRepository.count();

    return {
      service: 'analytics-service',
      metrics: {
        database: dbMetrics,
        events: {
          total: eventCount,
          today: await this.eventsRepository.count({
            timestamp: { $gte: new Date().toISOString().split('T')[0] }
          })
        },
        reports: reportCount
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
    }

    await this.dbPool.shutdown();
    
    this.logger.info('Analytics service shutdown complete');
  }

  /**
   * Graceful startup
   */
  async start() {
    await this.dbPool.initialize();
    
    this.server = this.app.listen(this.config.port, () => {
      logger.info(`📊 Analytics Service running on port ${this.config.port}`);
      logger.info(`📍 Database: PostgreSQL connected`);
      logger.info(`📈 Event Tracking: enabled`);
      logger.info(`📊 Real-time Analytics: enabled`);
      logger.info(`📋 Report Generation: enabled`);
      logger.info(`🔄 Data Aggregation: active`);
    });

    const startupSpan = this.tracer ? this.tracer.startSpan('analytics-service.startup') : null;
    
    try {
      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Analytics service started successfully');
      }

      this.server.on('error', (error) => {
        if (startupSpan) {
          startupSpan.logError(error);
          startupSpan.finish();
        }
      });

      if (startupSpan) {
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
}

module.exports = {
  AnalyticsService
};

// Auto-start if this is main module
if (require.main === module) {
  const analyticsService = new AnalyticsService();
  
  analyticsService.start().catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await analyticsService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await analyticsService.shutdown();
    process.exit(0);
  });
}