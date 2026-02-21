/**
 * TalentSphere Analytics Service
 * Comprehensive analytics and reporting for all platform activities
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const auth = require('../shared/middleware/auth');
const { getDatabaseManager } = require('../shared/database-connection');

class AnalyticsService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'analytics-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.ANALYTICS_PORT || 3006,
      tracing: {
        enabled: true,
        samplingRate: 1.0
      },
      circuitBreaker: {
        timeout: 5000,
        maxFailures: 3,
        resetTimeout: 30000
      }
    });

    // Initialize database connection
    this.database = getDatabaseManager();
    
    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || req.traceId || uuidv4();
      
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);
      
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('analytics.health', req.traceContext) : null;
      
      try {
        const health = await this.getServiceHealth();
        
        if (span) {
          span.setTag('health.status', 'healthy');
          span.finish();
        }

        res.json(health);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Dashboard analytics
    this.app.get('/dashboard', 
      auth.required,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.dashboard');
      }
    );

    // Job analytics
    this.app.get('/jobs/overview', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.jobsOverview');
      }
    );

    this.app.get('/jobs/:jobId', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      auth.requireCompanyAccess,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.jobDetails');
      }
    );

    // User analytics
    this.app.get('/users/overview', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.usersOverview');
      }
    );

    this.app.get('/users/:userId', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      auth.requireOwnership('userId'),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.userDetails');
      }
    );

    // Company analytics
    this.app.get('/companies/overview', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.companiesOverview');
      }
    );

    this.app.get('/companies/:companyId', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      auth.requireCompanyAccess,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.companyDetails');
      }
    );

    // Engagement analytics
    this.app.get('/engagement', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.engagement');
      }
    );

    // Performance metrics
    this.app.get('/performance', 
      auth.required,
      auth.requireRole(['admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.performance');
      }
    );

    // Custom reports
    this.app.get('/reports', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.reports');
      }
    );

    this.app.post('/reports', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.createReport');
      }
    );

    // Data exports
    this.app.post('/export', 
      auth.required,
      auth.requireRole(['admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.export');
      }
    );

    // Event tracking
    this.app.post('/track', 
      auth.required,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'analytics.track');
      }
    );

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

  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';
    
    switch (operationName) {
      case 'analytics.dashboard':
        return this.getDashboardAnalytics(request.query, request.user);
      case 'analytics.jobsOverview':
        return this.getJobsOverview(request.query, request.user);
      case 'analytics.jobDetails':
        return this.getJobAnalytics(request.params.jobId, request.query, request.user);
      case 'analytics.usersOverview':
        return this.getUsersOverview(request.query, request.user);
      case 'analytics.userDetails':
        return this.getUserAnalytics(request.params.userId, request.query, request.user);
      case 'analytics.companiesOverview':
        return this.getCompaniesOverview(request.query, request.user);
      case 'analytics.companyDetails':
        return this.getCompanyAnalytics(request.params.companyId, request.query, request.user);
      case 'analytics.engagement':
        return this.getEngagementAnalytics(request.query, request.user);
      case 'analytics.performance':
        return this.getPerformanceMetrics(request.query, request.user);
      case 'analytics.reports':
        return this.getReports(request.query, request.user);
      case 'analytics.createReport':
        return this.createReport(request.body, request.user);
      case 'analytics.export':
        return this.exportData(request.body, request.user);
      case 'analytics.track':
        return this.trackEvent(request.body, request.user);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  // Dashboard analytics
  async getDashboardAnalytics(query, user) {
    return this.executeWithTracing('analytics.dashboard.process', async () => {
      await this.database.initialize();

      const { period = '30d', companyId } = query;
      const dateCondition = this.getDateCondition(period);

      // Base metrics
      const metrics = await this.database.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN u.created_at >= ${dateCondition} THEN u.id END) as new_users,
          COUNT(DISTINCT CASE WHEN j.posted_at >= ${dateCondition} THEN j.id END) as new_jobs,
          COUNT(DISTINCT CASE WHEN a.created_at >= ${dateCondition} THEN a.id END) as new_applications,
          COUNT(DISTINCT j.id) as total_jobs,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT a.id) as total_applications
        FROM users u
        LEFT JOIN jobs j ON true
        LEFT JOIN job_applications a ON true
        ${companyId ? 'WHERE j.company_id = $1' : ''}
      `, companyId ? [companyId] : []);

      // Activity trends
      const activityTrends = await this.database.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as activities
        FROM user_activities
        WHERE created_at >= ${dateCondition}
        ${companyId ? 'AND company_id = $1' : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, companyId ? [companyId] : []);

      // Top performing jobs
      const topJobs = await this.database.query(`
        SELECT 
          j.id,
          j.title,
          c.name as company_name,
          COUNT(ja.id) as application_count,
          COUNT(jv.id) as view_count
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        LEFT JOIN job_views jv ON j.id = jv.job_id
        WHERE j.posted_at >= ${dateCondition}
        ${companyId ? 'AND j.company_id = $1' : ''}
        GROUP BY j.id, j.title, c.name
        ORDER BY application_count DESC
        LIMIT 10
      `, companyId ? [companyId] : []);

      return {
        metrics: metrics.rows[0],
        activityTrends: activityTrends.rows,
        topJobs: topJobs.rows,
        period,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Jobs analytics
  async getJobsOverview(query, user) {
    return this.executeWithTracing('analytics.jobs.process', async () => {
      await this.database.initialize();

      const { period = '30d', companyId, status = 'all' } = query;
      const dateCondition = this.getDateCondition(period);

      const jobsStats = await this.database.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN posted_at >= ${dateCondition} THEN 1 END) as new_jobs,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_jobs,
          COUNT(CASE WHEN is_featured = TRUE THEN 1 END) as featured_jobs,
          AVG(salary_max) as avg_max_salary,
          AVG(salary_min) as avg_min_salary,
          employment_type,
          COUNT(*) as count
        FROM jobs
        WHERE 1=1
        ${companyId ? 'AND company_id = $1' : ''}
        ${status !== 'all' ? 'AND is_active = $2' : ''}
        GROUP BY employment_type
      `, companyId ? [companyId] : []);

      return {
        employmentStats: jobsStats.rows,
        period,
        timestamp: new Date().toISOString()
      };
    });
  }

  async getJobAnalytics(jobId, query, user) {
    return this.executeWithTracing('analytics.job.process', async () => {
      await this.database.initialize();

      // Job details with analytics
      const jobStats = await this.database.query(`
        SELECT 
          j.*,
          c.name as company_name,
          COUNT(ja.id) as total_applications,
          COUNT(jv.id) as total_views,
          COUNT(DISTINCT ja.user_id) as unique_applicants,
          AVG(ja.created_at) as avg_application_time
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        LEFT JOIN job_views jv ON j.id = jv.job_id
        WHERE j.id = $1
        GROUP BY j.id, c.name
      `, [jobId]);

      if (jobStats.rows.length === 0) {
        throw new Error('Job not found');
      }

      // Daily application trends
      const applicationTrends = await this.database.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as applications
        FROM job_applications
        WHERE job_id = $1
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, [jobId]);

      return {
        job: jobStats.rows[0],
        applicationTrends: applicationTrends.rows,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Users analytics
  async getUsersOverview(query, user) {
    return this.executeWithTracing('analytics.users.process', async () => {
      await this.database.initialize();

      const { period = '30d', companyId } = query;
      const dateCondition = this.getDateCondition(period);

      const userStats = await this.database.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= ${dateCondition} THEN 1 END) as new_users,
          COUNT(CASE WHEN last_login >= ${dateCondition} THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as verified_users,
          role,
          COUNT(*) as count
        FROM users
        WHERE 1=1
        ${companyId ? 'AND company_id = $1' : ''}
        GROUP BY role
      `, companyId ? [companyId] : []);

      // User registration trends
      const registrationTrends = await this.database.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM users
        WHERE created_at >= ${dateCondition}
        ${companyId ? 'AND company_id = $1' : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, companyId ? [companyId] : []);

      return {
        userStats: userStats.rows,
        registrationTrends: registrationTrends.rows,
        period,
        timestamp: new Date().toISOString()
      };
    });
  }

  async getUserAnalytics(userId, query, user) {
    return this.executeWithTracing('analytics.user.process', async () => {
      await this.database.initialize();

      const userStats = await this.database.query(`
        SELECT 
          u.*,
          c.name as company_name,
          COUNT(ja.id) as total_applications,
          COUNT(jv.id) as total_views,
          COUNT(DISTINCT conn.id) as connections,
          u.last_login
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN job_applications ja ON u.id = ja.user_id
        LEFT JOIN job_views jv ON u.id = jv.user_id
        LEFT JOIN connections conn ON (u.id = conn.user_id_1 OR u.id = conn.user_id_2)
        WHERE u.id = $1
        GROUP BY u.id, c.name
      `, [userId]);

      if (userStats.rows.length === 0) {
        throw new Error('User not found');
      }

      // User activity timeline
      const activityTimeline = await this.database.query(`
        SELECT 
          activity_type,
          created_at,
          metadata
        FROM user_activities
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `, [userId]);

      return {
        user: userStats.rows[0],
        activityTimeline: activityTimeline.rows,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Companies analytics
  async getCompaniesOverview(query, user) {
    return this.executeWithTracing('analytics.companies.process', async () => {
      await this.database.initialize();

      const companyStats = await this.database.query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_companies,
          industry,
          COUNT(*) as count,
          AVG(CASE WHEN j.id IS NOT NULL THEN 1 ELSE 0 END) as avg_job_posting_rate
        FROM companies c
        LEFT JOIN jobs j ON c.id = j.company_id AND j.posted_at >= NOW() - INTERVAL '30 days'
        GROUP BY industry
        ORDER BY count DESC
      `);

      return {
        companyStats: companyStats.rows,
        timestamp: new Date().toISOString()
      };
    });
  }

  async getCompanyAnalytics(companyId, query, user) {
    return this.executeWithTracing('analytics.company.process', async () => {
      await this.database.initialize();

      const companyStats = await this.database.query(`
        SELECT 
          c.*,
          COUNT(DISTINCT j.id) as total_jobs,
          COUNT(DISTINCT CASE WHEN j.is_active = TRUE THEN j.id END) as active_jobs,
          COUNT(DISTINCT ja.id) as total_applications,
          COUNT(DISTINCT u.id) as total_employees
        FROM companies c
        LEFT JOIN jobs j ON c.id = j.company_id
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        LEFT JOIN users u ON c.id = u.company_id
        WHERE c.id = $1
        GROUP BY c.id
      `, [companyId]);

      if (companyStats.rows.length === 0) {
        throw new Error('Company not found');
      }

      return {
        company: companyStats.rows[0],
        timestamp: new Date().toISOString()
      };
    });
  }

  // Engagement analytics
  async getEngagementAnalytics(query, user) {
    return this.executeWithTracing('analytics.engagement.process', async () => {
      await this.database.initialize();

      const { period = '30d' } = query;
      const dateCondition = this.getDateCondition(period);

      const engagementMetrics = await this.database.query(`
        SELECT 
          activity_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM user_activities
        WHERE created_at >= ${dateCondition}
        GROUP BY activity_type
        ORDER BY count DESC
      `);

      return {
        engagementMetrics: engagementMetrics.rows,
        period,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Performance metrics
  async getPerformanceMetrics(query, user) {
    return this.executeWithTracing('analytics.performance.process', async () => {
      await this.database.initialize();

      const { period = '1h' } = query;
      
      // This would typically integrate with monitoring systems
      // For now, return placeholder data
      const performanceMetrics = {
        responseTime: {
          avg: 145,
          p95: 320,
          p99: 580
        },
        throughput: {
          requests_per_second: 42,
          requests_per_minute: 2520
        },
        errorRate: 0.02,
        uptime: 99.98
      };

      return {
        metrics: performanceMetrics,
        period,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Reports management
  async getReports(query, user) {
    return this.executeWithTracing('analytics.reports.process', async () => {
      await this.database.initialize();

      const result = await this.database.query(`
        SELECT * FROM analytics_reports
        WHERE created_by = $1
        ORDER BY created_at DESC
      `, [user.userId]);

      return {
        reports: result.rows,
        total: result.rows.length
      };
    });
  }

  async createReport(reportData, user) {
    return this.executeWithTracing('analytics.createReport.process', async () => {
      await this.database.initialize();

      const { name, description, reportType, filters, schedule } = reportData;

      const report = await this.database.insert('analytics_reports', {
        name,
        description,
        report_type: reportType,
        filters,
        schedule,
        created_by: user.userId,
        created_at: new Date()
      });

      return {
        report: {
          id: report.id,
          name,
          description,
          reportType,
          filters,
          schedule,
          createdAt: report.created_at
        }
      };
    });
  }

  // Data export
  async exportData(exportRequest, user) {
    return this.executeWithTracing('analytics.export.process', async () => {
      const { dataType, format = 'csv', filters } = exportRequest;

      // This would generate and store export files
      const exportId = uuidv4();
      
      return {
        exportId,
        status: 'processing',
        dataType,
        format,
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        downloadUrl: `/api/v1/analytics/exports/${exportId}/download`
      };
    });
  }

  // Event tracking
  async trackEvent(eventData, user) {
    return this.executeWithTracing('analytics.track.process', async () => {
      await this.database.initialize();

      const { eventType, eventName, properties, timestamp = new Date() } = eventData;

      await this.database.query(`
        INSERT INTO user_activities (user_id, activity_type, event_name, properties, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [user.userId, eventType, eventName, JSON.stringify(properties), timestamp]);

      return {
        success: true,
        tracked: {
          eventType,
          eventName,
          timestamp
        }
      };
    });
  }

  // Helper method to get date condition
  getDateCondition(period) {
    switch (period) {
      case '1d':
        return "NOW() - INTERVAL '1 day'";
      case '7d':
        return "NOW() - INTERVAL '7 days'";
      case '30d':
        return "NOW() - INTERVAL '30 days'";
      case '90d':
        return "NOW() - INTERVAL '90 days'";
      case '1y':
        return "NOW() - INTERVAL '1 year'";
      default:
        return "NOW() - INTERVAL '30 days'";
    }
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('analytics-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        this.logger.info(`📊 Analytics Service running on port ${this.config.port}`);
        this.logger.info(`📍 Environment: ${this.config.environment}`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Analytics service started successfully');
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
    const shutdownSpan = this.tracer ? this.tracer.startSpan('analytics-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        this.logger.info('🛑 Analytics Service stopped');
      }

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

module.exports = { AnalyticsService };

// Auto-start if this is main module
if (require.main === module) {
  const analyticsService = new AnalyticsService();

  analyticsService.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    this.logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await analyticsService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    this.logger.info('🛑 SIGINT received, shutting down gracefully...');
    await analyticsService.stop();
    process.exit(0);
  });
}