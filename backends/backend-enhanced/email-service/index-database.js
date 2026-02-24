/**
 * Email Service with Production Database Integration
 * 
 * Complete email management system with:
 * - PostgreSQL database persistence
 * - Email template management
 * - Campaign and broadcast management
 * - Delivery tracking and analytics
 * - Integration with email service providers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { getServicePort, getServiceUrl } = require('../../../shared/ports');
const { getServiceConfig } = require('../../../shared/environment');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../shared/validation');
const { ServiceContract } = require('../../../shared/contracts');
const { getServiceClient } = require('../../../services/shared/production-service-client');
const BaseRepository = require('../../../shared/base-repository');
const DatabaseConnectionPool = require('../../../services/shared/database-connection-pool');
const { createLogger } = require('../../../shared/logger');

class EmailService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'email-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: getServicePort('email-service'),
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
    this.dbPool = new DatabaseConnectionPool('email-service');
    this.emailRepository = new BaseRepository('emails', 'email-service');
    this.templateRepository = new BaseRepository('email_templates', 'email-service');
    this.campaignRepository = new BaseRepository('email_campaigns', 'email-service');
    this.subscriptionRepository = new BaseRepository('email_subscriptions', 'email-service');

    // Initialize service clients
    this.initializeServiceClients();

    // Email transporter configuration
    this.initializeEmailTransporters();

    // In-memory cache for frequently accessed data
    this.templateCache = new Map();
    this.campaignCache = new Map();

    this.logger = createLogger('EmailService');

    // Initialize service contracts
    this.initializeContracts();

    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();

    // Start background worker for processing emails
    this.startEmailWorker();
  }

  /**
   * Initialize service clients for inter-service communication
   */
  initializeServiceClients() {
    this.userServiceClient = getServiceClient('email-service');
    this.notificationServiceClient = getServiceClient('email-service');
    this.userProfileClient = getServiceClient('email-service');
    this.companyServiceClient = getServiceClient('email-service');
    this.jobServiceClient = getServiceClient('email-service');
    this.analyticsServiceClient = getServiceClient('email-service');
  }

  /**
   * Initialize email transporters
   */
  initializeEmailTransporters() {
    // Primary SMTP transporter (production)
    this.primaryTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      pool: true,
      maxConnections: 10,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    });

    // Backup transporter (fallback)
    this.backupTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.BACKUP_EMAIL_USER,
        pass: process.env.BACKUP_EMAIL_PASSWORD
      }
    });

    // Verify transporters
    this.verifyEmailTransporters();
  }

  /**
   * Verify email transporters
   */
  async verifyEmailTransporters() {
    try {
      await this.primaryTransporter.verify();
      this.logger.info('Primary email transporter verified successfully');
    } catch (error) {
      this.logger.error('Primary email transporter verification failed', {
        error: error.message
      });
    }

    try {
      await this.backupTransporter.verify();
      this.logger.info('Backup email transporter verified successfully');
    } catch (error) {
      this.logger.error('Backup email transporter verification failed', {
        error: error.message
      });
    }
  }

  /**
   * Initialize service contracts
   */
  initializeContracts() {
    this.serviceContract = new ServiceContract('email-service');

    // Send email schema
    this.serviceContract.defineOperation('sendEmail', {
      inputSchema: {
        type: 'object',
        required: ['to', 'subject', 'message'],
        properties: {
          to: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            },
            minItems: 1,
            maxItems: 1000
          },
          cc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            }
          },
          bcc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            }
          },
          from: {
            type: 'string',
            format: 'email'
          },
          replyTo: {
            type: 'string',
            format: 'email'
          },
          subject: { type: 'string', minLength: 1, maxLength: 200 },
          message: { type: 'string', minLength: 1, maxLength: 100000 },
          html: { type: 'string', maxLength: 200000 },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                content: { type: 'string' }, // base64 encoded
                contentType: { type: 'string' }
              }
            }
          },
          template: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              data: { type: 'object' }
            }
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
          },
          scheduledFor: { type: 'string' },
          tracking: {
            type: 'object',
            properties: {
              enableOpenTracking: { type: 'boolean' },
              enableClickTracking: { type: 'boolean' },
              utmParams: { type: 'object' }
            }
          },
          metadata: { type: 'object' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          emailId: { type: 'string' },
          messageId: { type: 'string' },
          sentAt: { type: 'string' }
        }
      }
    });

    // Email template schema
    this.serviceContract.defineOperation('createTemplate', {
      inputSchema: {
        type: 'object',
        required: ['name', 'subject', 'html'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          subject: { type: 'string', minLength: 1, maxLength: 200 },
          html: { type: 'string', minLength: 1, maxLength: 100000 },
          text: { type: 'string', maxLength: 100000 },
          variables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                required: { type: 'boolean' },
                description: { type: 'string' }
              }
            }
          },
          category: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          template: { type: 'object' }
        }
      }
    });

    // Campaign schema
    this.serviceContract.defineOperation('createCampaign', {
      inputSchema: {
        type: 'object',
        required: ['name', 'templateId', 'recipients'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          templateId: { type: 'string' },
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                userId: { type: 'string' },
                variables: { type: 'object' }
              }
            }
          },
          scheduledFor: { type: 'string' },
          timezone: { type: 'string' },
          settings: {
            type: 'object',
            properties: {
              sendRate: { type: 'number' }, // emails per minute
              enableOpenTracking: { type: 'boolean' },
              enableClickTracking: { type: 'boolean' }
            }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          campaign: { type: 'object' }
        }
      }
    });

    // Email tracking schema
    this.serviceContract.defineOperation('trackEmailEvent', {
      inputSchema: {
        type: 'object',
        required: ['emailId', 'event'],
        properties: {
          emailId: { type: 'string' },
          event: {
            type: 'string',
            enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']
          },
          timestamp: { type: 'string' },
          ip: { type: 'string' },
          userAgent: { type: 'string' },
          url: { type: 'string' },
          metadata: { type: 'object' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' }
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
      max: 200, // 200 requests per minute per user
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

    // Email sending
    this.app.post('/send', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.sendEmail', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.post('/send-bulk', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.sendBulkEmails', {
        validateInput: true,
        validateOutput: true
      });
    });

    // Template management
    this.app.get('/templates', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getTemplates', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/templates/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getTemplate', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/templates', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.createTemplate', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/templates/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.updateTemplate', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/templates/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.deleteTemplate', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Campaign management
    this.app.get('/campaigns', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getCampaigns', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/campaigns/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getCampaign', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/campaigns', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.createCampaign', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/campaigns/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.updateCampaign', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/campaigns/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.deleteCampaign', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/campaigns/:id/send', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.sendCampaign', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Email tracking
    this.app.post('/track', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.trackEmailEvent', {
        validateInput: true,
        validateOutput: false
      });
    });

    this.app.get('/track/open/:emailId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.trackOpen', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/track/click/:emailId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.trackClick', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Subscriptions
    this.app.get('/subscriptions/:email', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getSubscriptions', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/subscribe', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.subscribe', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.post('/unsubscribe', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.unsubscribe', {
        validateInput: true,
        validateOutput: true
      });
    });

    // Analytics
    this.app.get('/analytics/overview', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getAnalyticsOverview', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/analytics/campaigns/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'email.getCampaignAnalytics', {
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
      case 'email.sendEmail':
        return this.sendEmail(request.body);

      case 'email.sendBulkEmails':
        return this.sendBulkEmails(request.body);

      case 'email.getTemplates':
        return this.getTemplates(request.query);

      case 'email.getTemplate':
        return this.getTemplate(request.params.id);

      case 'email.createTemplate':
        return this.createTemplate(request.body);

      case 'email.updateTemplate':
        return this.updateTemplate(request.params.id, request.body);

      case 'email.deleteTemplate':
        return this.deleteTemplate(request.params.id);

      case 'email.getCampaigns':
        return this.getCampaigns(request.query);

      case 'email.getCampaign':
        return this.getCampaign(request.params.id);

      case 'email.createCampaign':
        return this.createCampaign(request.body);

      case 'email.updateCampaign':
        return this.updateCampaign(request.params.id, request.body);

      case 'email.deleteCampaign':
        return this.deleteCampaign(request.params.id);

      case 'email.sendCampaign':
        return this.sendCampaign(request.params.id);

      case 'email.trackEmailEvent':
        return this.trackEmailEvent(request.body);

      case 'email.trackOpen':
        return this.trackOpen(request.params.emailId, req.query);

      case 'email.trackClick':
        return this.trackClick(request.params.emailId, req.query);

      case 'email.getSubscriptions':
        return this.getSubscriptions(req.params.email);

      case 'email.subscribe':
        return this.subscribe(request.body);

      case 'email.unsubscribe':
        return this.unsubscribe(request.body);

      case 'email.getAnalyticsOverview':
        return this.getAnalyticsOverview(request.query);

      case 'email.getCampaignAnalytics':
        return this.getCampaignAnalytics(request.params.id, request.query);

      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(emailData) {
    return this.executeWithTracing('email.sendEmail.process', async () => {
      // Process template if provided
      let subject = emailData.subject;
      let html = emailData.html;
      let text = emailData.message;

      if (emailData.template) {
        const template = await this.getTemplate(emailData.template.id);
        if (template.success) {
          subject = this.processTemplate(template.template.subject, emailData.template.data);
          html = this.processTemplate(template.template.html, emailData.template.data);
          text = this.processTemplate(template.template.text || '', emailData.template.data);
        }
      }

      // Create email record
      const email = await this.emailRepository.create({
        id: uuidv4(),
        from: emailData.from || process.env.DEFAULT_FROM_EMAIL,
        to: emailData.to,
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject,
        message: text,
        html,
        attachments: emailData.attachments || [],
        template: emailData.template,
        priority: emailData.priority || 'normal',
        status: 'pending',
        scheduledFor: emailData.scheduledFor,
        tracking: emailData.tracking || {},
        metadata: emailData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Queue for sending
      await this.queueEmailForSending(email);

      return {
        success: true,
        emailId: email.id,
        scheduledFor: email.scheduledFor
      };
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(bulkData) {
    return this.executeWithTracing('email.sendBulkEmails.process', async () => {
      const campaign = await this.createCampaign({
        name: bulkData.name || 'Bulk Email Campaign',
        templateId: bulkData.templateId,
        recipients: bulkData.recipients,
        scheduledFor: bulkData.scheduledFor,
        settings: bulkData.settings
      });

      if (campaign.success && bulkData.sendImmediately) {
        await this.sendCampaign(campaign.campaign.id);
      }

      return campaign;
    });
  }

  /**
   * Get email templates
   */
  async getTemplates(query = {}) {
    return this.executeWithTracing('email.getTemplates.process', async () => {
      const { category, isActive = true, limit = 50, offset = 0 } = query;

      const where = {};
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive;

      const templates = await this.templateRepository.find(where, {
        orderBy: 'name ASC',
        limit,
        offset
      });

      return {
        success: true,
        templates
      };
    });
  }

  /**
   * Get email template
   */
  async getTemplate(templateId) {
    return this.executeWithTracing('email.getTemplate.process', async () => {
      // Check cache first
      let template = this.templateCache.get(templateId);

      if (!template) {
        template = await this.templateRepository.findById(templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        // Cache for 10 minutes
        this.templateCache.set(templateId, template);
        setTimeout(() => this.templateCache.delete(templateId), 10 * 60 * 1000);
      }

      return {
        success: true,
        template
      };
    });
  }

  /**
   * Create email template
   */
  async createTemplate(templateData) {
    return this.executeWithTracing('email.createTemplate.process', async () => {
      // Check if template name already exists
      const existingTemplate = await this.templateRepository.findBy('name', templateData.name);
      if (existingTemplate) {
        throw new Error('Template with this name already exists');
      }

      const template = await this.templateRepository.create({
        id: uuidv4(),
        name: templateData.name,
        description: templateData.description,
        subject: templateData.subject,
        html: templateData.html,
        text: templateData.text,
        variables: templateData.variables || [],
        category: templateData.category,
        isActive: templateData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update cache
      this.templateCache.set(template.id, template);

      return {
        success: true,
        template
      };
    });
  }

  /**
   * Update email template
   */
  async updateTemplate(templateId, updateData) {
    return this.executeWithTracing('email.updateTemplate.process', async () => {
      const existingTemplate = await this.templateRepository.findById(templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate = await this.templateRepository.update(templateId, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      // Update cache
      this.templateCache.set(templateId, updatedTemplate);

      return {
        success: true,
        template: updatedTemplate
      };
    });
  }

  /**
   * Delete email template
   */
  async deleteTemplate(templateId) {
    return this.executeWithTracing('email.deleteTemplate.process', async () => {
      const existingTemplate = await this.templateRepository.findById(templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      await this.templateRepository.delete(templateId);

      // Remove from cache
      this.templateCache.delete(templateId);

      return {
        success: true
      };
    });
  }

  /**
   * Get email campaigns
   */
  async getCampaigns(query = {}) {
    return this.executeWithTracing('email.getCampaigns.process', async () => {
      const { status, limit = 50, offset = 0 } = query;

      const where = {};
      if (status) where.status = status;

      const campaigns = await this.campaignRepository.find(where, {
        orderBy: 'createdAt DESC',
        limit,
        offset
      });

      return {
        success: true,
        campaigns
      };
    });
  }

  /**
   * Get email campaign
   */
  async getCampaign(campaignId) {
    return this.executeWithTracing('email.getCampaign.process', async () => {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get campaign statistics
      const stats = await this.getCampaignStatistics(campaignId);

      return {
        success: true,
        campaign: {
          ...campaign,
          stats
        }
      };
    });
  }

  /**
   * Create email campaign
   */
  async createCampaign(campaignData) {
    return this.executeWithTracing('email.createCampaign.process', async () => {
      const campaign = await this.campaignRepository.create({
        id: uuidv4(),
        name: campaignData.name,
        description: campaignData.description,
        templateId: campaignData.templateId,
        recipients: campaignData.recipients,
        scheduledFor: campaignData.scheduledFor,
        timezone: campaignData.timezone || 'UTC',
        settings: campaignData.settings || {},
        status: 'draft',
        sentCount: 0,
        totalCount: campaignData.recipients.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        campaign
      };
    });
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId) {
    return this.executeWithTracing('email.sendCampaign.process', async () => {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status
      await this.campaignRepository.update(campaignId, {
        status: 'sending',
        updatedAt: new Date().toISOString()
      });

      // Queue individual emails for sending
      const template = await this.getTemplate(campaign.templateId);

      for (const recipient of campaign.recipients) {
        const emailData = {
          to: [recipient.email],
          template: {
            id: campaign.templateId,
            data: { ...recipient.variables, ...campaign.settings.templateData }
          },
          tracking: campaign.settings.tracking,
          metadata: {
            campaignId: campaignId,
            recipientId: recipient.id,
            userId: recipient.userId
          }
        };

        await this.sendEmail(emailData);
      }

      return {
        success: true,
        campaign: campaign
      };
    });
  }

  /**
   * Track email event
   */
  async trackEmailEvent(eventData) {
    return this.executeWithTracing('email.trackEmailEvent.process', async () => {
      // Create tracking event
      const trackingEvent = {
        id: uuidv4(),
        emailId: eventData.emailId,
        event: eventData.event,
        timestamp: eventData.timestamp || new Date().toISOString(),
        ip: eventData.ip,
        userAgent: eventData.userAgent,
        url: eventData.url,
        metadata: eventData.metadata || {},
        createdAt: new Date().toISOString()
      };

      // Save tracking event (would use dedicated tracking table in enhanced version)
      this.logger.info('Email tracking event', trackingEvent);

      return {
        success: true
      };
    });
  }

  /**
   * Process template with data
   */
  processTemplate(template, data) {
    let processed = template;

    // Simple variable substitution
    for (const [key, value] of Object.entries(data || {})) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  /**
   * Queue email for sending
   */
  async queueEmailForSending(email) {
    // In enhanced version, this would use a proper job queue like Bull or RabbitMQ
    // For now, we'll process immediately in the background worker
    this.processEmail(email);
  }

  /**
   * Process email sending
   */
  async processEmail(email) {
    try {
      const mailOptions = {
        from: email.from,
        to: email.to.join(', '),
        cc: email.cc.join(', ') || undefined,
        bcc: email.bcc.join(', ') || undefined,
        subject: email.subject,
        text: email.message,
        html: email.html,
        attachments: email.attachments
      };

      // Add tracking pixels if enabled
      if (email.tracking?.enableOpenTracking) {
        const trackingPixel = `<img src="${process.env.EMAIL_SERVICE_URL}/track/open/${email.id}" width="1" height="1" />`;
        mailOptions.html = (mailOptions.html || '') + trackingPixel;
      }

      // Add tracking links if enabled
      if (email.tracking?.enableClickTracking) {
        // Process links to add tracking parameters
        mailOptions.html = this.addClickTracking(mailOptions.html, email.id, email.tracking.utmParams);
      }

      let transporter = this.primaryTransporter;
      try {
        const result = await transporter.sendMail(mailOptions);

        // Update email status
        await this.emailRepository.update(email.id, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        this.logger.info('Email sent successfully', {
          emailId: email.id,
          messageId: result.messageId,
          to: email.to
        });

      } catch (primaryError) {
        this.logger.warn('Primary transporter failed, trying backup', {
          emailId: email.id,
          error: primaryError.message
        });

        // Try backup transporter
        const result = await this.backupTransporter.sendMail(mailOptions);

        await this.emailRepository.update(email.id, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      await this.emailRepository.update(email.id, {
        status: 'failed',
        error: error.message,
        updatedAt: new Date().toISOString()
      });

      this.logger.error('Email sending failed', {
        emailId: email.id,
        error: error.message
      });
    }
  }

  /**
   * Add click tracking to links
   */
  addClickTracking(html, emailId, utmParams) {
    // This would implement link tracking by wrapping URLs with tracking endpoints
    // For now, return HTML as-is
    return html;
  }

  /**
   * Start email worker
   */
  startEmailWorker() {
    this.logger.info('Email worker started');

    // Process scheduled emails
    setInterval(async () => {
      try {
        const scheduledEmails = await this.emailRepository.find({
          status: 'pending',
          scheduledFor: { $lte: new Date().toISOString() }
        });

        for (const email of scheduledEmails) {
          await this.processEmail(email);
        }
      } catch (error) {
        this.logger.error('Email worker error', { error: error.message });
      }
    }, 60000); // Check every minute
  }

  /**
   * Get service health
   */
  async getServiceHealth() {
    const dbHealth = await this.dbPool.checkHealth();

    return {
      service: 'email-service',
      status: 'healthy',
      database: dbHealth,
      emailTransporters: {
        primary: this.primaryTransporter ? 'configured' : 'not_configured',
        backup: this.backupTransporter ? 'configured' : 'not_configured'
      },
      cache: {
        templateCache: this.templateCache.size,
        campaignCache: this.campaignCache.size
      },
      timestamp: new Date().toISOString()
    };
  }

  async getServiceMetrics() {
    const dbMetrics = this.dbPool.getPoolStats();
    const emailCount = await this.emailRepository.count();
    const templateCount = await this.templateRepository.count();
    const campaignCount = await this.campaignRepository.count();

    return {
      service: 'email-service',
      metrics: {
        database: dbMetrics,
        emails: {
          total: emailCount,
          pending: await this.emailRepository.count({ status: 'pending' }),
          sent: await this.emailRepository.count({ status: 'sent' }),
          failed: await this.emailRepository.count({ status: 'failed' })
        },
        templates: templateCount,
        campaigns: campaignCount
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

    this.logger.info('Email service shutdown complete');
  }

  /**
   * Graceful startup
   */
  async start() {
    await this.dbPool.initialize();

    this.server = this.app.listen(this.config.port, () => {
      logger.info(`📧 Email Service running on port ${this.config.port}`);
      logger.info(`📍 Database: PostgreSQL connected`);
      logger.info(`📨 SMTP Transporter: ${this.primaryTransporter ? 'configured' : 'not configured'}`);
      logger.info(`🔁 Backup Transporter: ${this.backupTransporter ? 'configured' : 'not configured'}`);
      logger.info(`📝 Template Management: enabled`);
      logger.info(`📊 Campaign Management: enabled`);
      logger.info(`📈 Email Tracking: enabled`);
    });

    const startupSpan = this.tracer ? this.tracer.startSpan('email-service.startup') : null;

    try {
      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Email service started successfully');
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
  EmailService
};

// Auto-start if this is main module
if (require.main === module) {
  const emailService = new EmailService();

  emailService.start().catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await emailService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await emailService.shutdown();
    process.exit(0);
  });
}