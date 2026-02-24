/**
 * Enhanced Email Service with Production Database
 * 
 * Complete email management system with:
 * - PostgreSQL integration for persistence
 * - Advanced email template management with versioning
 * - Campaign management and segmentation
 * - Comprehensive tracking and analytics
 * - Multiple delivery providers and fallback
 */

const { getServicePort, getServiceUrl } = require('../../../shared/ports');
const { getServiceConfig } = require('../../../shared/environment');
const { EmailService } = require('./index-database');
const DatabaseConnectionPool = require('../../../services/shared/database-connection-pool');
const { createLogger } = require('../../../shared/logger');

class EnhancedEmailService extends EmailService {
  constructor() {
    super();

    this.dbPool = new DatabaseConnectionPool('email-service');
    this.logger = createLogger('EnhancedEmailService');

    // Override with database operations
    this.initializeDatabaseOperations();
  }

  /**
   * Initialize database-specific operations
   */
  initializeDatabaseOperations() {
    // Override email creation with database persistence
    this.sendEmail = async (emailData) => {
      return this.executeWithTracing('email.sendEmail.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          await client.query('BEGIN');

          // Process template if provided
          let subject = emailData.subject;
          let html = emailData.html;
          let text = emailData.message;
          let templateInfo = null;

          if (emailData.template) {
            const templateResult = await client.query(`
              SELECT * FROM email_templates WHERE id = $1 AND is_active = TRUE
            `, [emailData.template.id]);

            if (templateResult.rows.length > 0) {
              const template = templateResult.rows[0];
              templateInfo = {
                id: template.id,
                name: template.name,
                version: template.version
              };

              subject = this.processTemplate(template.subject_template, emailData.template.data);
              html = this.processTemplate(template.html_template, emailData.template.data);
              text = this.processTemplate(template.text_template || '', emailData.template.data);
            }
          }

          // Create email record
          const emailResult = await client.query(`
            INSERT INTO emails (
              from_email, reply_to, to_emails, cc_emails, bcc_emails,
              subject, text_content, html_content, template_id, template_data,
              priority, status, scheduled_for, tracking_enabled,
              open_tracking_enabled, click_tracking_enabled, campaign_id,
              user_id, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
          `, [
            emailData.from || process.env.DEFAULT_FROM_EMAIL,
            emailData.replyTo,
            emailData.to,
            emailData.cc || [],
            emailData.bcc || [],
            subject,
            text,
            html,
            templateInfo?.id,
            JSON.stringify(emailData.template?.data || {}),
            emailData.priority || 'normal',
            emailData.scheduledFor ? 'scheduled' : 'pending',
            emailData.scheduledFor,
            emailData.tracking?.enableOpenTracking || false,
            emailData.tracking?.enableClickTracking || false,
            emailData.metadata?.campaignId,
            emailData.metadata?.userId,
            JSON.stringify(emailData.metadata || {})
          ]);

          const email = emailResult.rows[0];

          // Create tracking event for email creation
          await client.query(`
            INSERT INTO email_tracking_events (
              email_id, event_type, timestamp, metadata
            ) VALUES ($1, $2, $3, $4)
          `, [
            email.id,
            'created',
            new Date().toISOString(),
            JSON.stringify({
              template: templateInfo,
              recipients: emailData.to.length,
              hasAttachments: (emailData.attachments?.length || 0) > 0
            })
          ]);

          // Update performance metrics
          await this.updateDailyMetrics(client, new Date().toISOString(), 'created', 1);

          await client.query('COMMIT');

          // Queue for sending
          await this.queueEmailForSending(email);

          return {
            success: true,
            emailId: email.id,
            template: templateInfo,
            scheduledFor: email.scheduled_for,
            status: email.status
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced template management with versioning
    this.createTemplate = async (templateData) => {
      return this.executeWithTracing('email.createTemplate.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          await client.query('BEGIN');

          // Check if template name already exists
          const existingTemplateResult = await client.query(`
            SELECT id FROM email_templates WHERE name = $1
          `, [templateData.name]);

          if (existingTemplateResult.rows.length > 0) {
            throw new Error('Template with this name already exists');
          }

          // Create template
          const templateResult = await client.query(`
            INSERT INTO email_templates (
              name, description, category, subject_template, text_template,
              html_template, variables, default_data, is_active, version, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `, [
            templateData.name,
            templateData.description,
            templateData.category,
            templateData.subject,
            templateData.text,
            templateData.html,
            JSON.stringify(templateData.variables || []),
            JSON.stringify(templateData.defaultData || {}),
            templateData.isActive !== false,
            1,
            templateData.createdBy
          ]);

          const template = templateResult.rows[0];

          // Create initial version record
          await client.query(`
            INSERT INTO email_template_versions (
              template_id, version, subject_template, text_template,
              html_template, variables, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            template.id,
            1,
            template.subject_template,
            template.text_template,
            template.html_template,
            JSON.stringify(template.variables || []),
            templateData.createdBy
          ]);

          await client.query('COMMIT');

          // Update cache
          this.templateCache.set(template.id, template);

          return {
            success: true,
            template
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced campaign management with segmentation
    this.createCampaign = async (campaignData) => {
      return this.executeWithTracing('email.createCampaign.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          await client.query('BEGIN');

          // Resolve recipient segment if provided
          let resolvedRecipients = campaignData.recipients;
          if (campaignData.segmentId) {
            const segmentResult = await client.query(`
              SELECT usm.user_id, u.email
              FROM user_segment_members usm
              JOIN users u ON usm.user_id = u.id
              WHERE usm.segment_id = $1 AND u.is_active = TRUE
            `, [campaignData.segmentId]);

            resolvedRecipients = segmentResult.rows.map(row => ({
              email: row.email,
              userId: row.user_id,
              variables: {}
            }));
          }

          // Create campaign
          const campaignResult = await client.query(`
            INSERT INTO email_campaigns (
              name, description, template_id, campaign_type, recipients,
              segment_id, scheduled_for, timezone, settings, total_recipients,
              created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `, [
            campaignData.name,
            campaignData.description,
            campaignData.templateId,
            campaignData.campaignType || 'newsletter',
            JSON.stringify(resolvedRecipients),
            campaignData.segmentId,
            campaignData.scheduledFor,
            campaignData.timezone || 'UTC',
            JSON.stringify(campaignData.settings || {}),
            resolvedRecipients.length,
            campaignData.createdBy
          ]);

          const campaign = campaignResult.rows[0];

          await client.query('COMMIT');

          // Update cache
          this.campaignCache.set(campaign.id, campaign);

          return {
            success: true,
            campaign
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced campaign sending with rate limiting
    this.sendCampaign = async (campaignId) => {
      return this.executeWithTracing('email.sendCampaign.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          await client.query('BEGIN');

          // Get campaign details
          const campaignResult = await client.query(`
            SELECT ec.*, et.subject_template, et.html_template, et.text_template
            FROM email_campaigns ec
            JOIN email_templates et ON ec.template_id = et.id
            WHERE ec.id = $1
          `, [campaignId]);

          if (campaignResult.rows.length === 0) {
            throw new Error('Campaign not found');
          }

          const campaign = campaignResult.rows[0];
          const settings = JSON.parse(campaign.settings);
          const recipients = JSON.parse(campaign.recipients);

          // Update campaign status
          await client.query(`
            UPDATE email_campaigns 
            SET status = 'sending', started_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [campaignId]);

          await client.query('COMMIT');

          // Process recipients with rate limiting
          const sendRate = settings.sendRate || 100; // emails per minute
          const delayMs = Math.floor(60000 / sendRate); // delay between emails

          for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            const emailData = {
              to: [recipient.email],
              template: {
                id: campaign.template_id,
                data: { ...recipient.variables, ...settings.templateData }
              },
              tracking: {
                enableOpenTracking: settings.enableOpenTracking,
                enableClickTracking: settings.enableClickTracking
              },
              metadata: {
                campaignId: campaignId,
                recipientIndex: i,
                userId: recipient.userId
              }
            };

            await this.sendEmail(emailData);

            // Add delay between emails (except for the last one)
            if (i < recipients.length - 1 && sendRate > 0) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }

          // Update campaign completion
          await client.query(`
            UPDATE email_campaigns 
            SET status = 'sent', completed_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [campaignId]);

          return {
            success: true,
            campaign: {
              ...campaign,
              status: 'sent',
              completed_at: new Date().toISOString()
            }
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced tracking with detailed analytics
    this.trackEmailEvent = async (eventData) => {
      return this.executeWithTracing('email.trackEmailEvent.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          // Get email details for context
          const emailResult = await client.query(`
            SELECT e.*, ec.id as campaign_id
            FROM emails e
            LEFT JOIN email_campaigns ec ON e.campaign_id = ec.id
            WHERE e.id = $1
          `, [eventData.emailId]);

          if (emailResult.rows.length === 0) {
            throw new Error('Email not found');
          }

          const email = emailResult.rows[0];

          // Create tracking event
          await client.query(`
            INSERT INTO email_tracking_events (
              email_id, event_type, timestamp, ip_address, user_agent,
              url, geolocation, device, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            eventData.emailId,
            eventData.event,
            eventData.timestamp || new Date().toISOString(),
            eventData.ip,
            eventData.userAgent,
            eventData.url,
            JSON.stringify(eventData.geolocation || {}),
            JSON.stringify(eventData.device || {}),
            JSON.stringify(eventData.metadata || {})
          ]);

          // Update email status based on event
          let updateFields = {};
          switch (eventData.event) {
            case 'delivered':
              updateFields = {
                status: 'delivered',
                delivered_at: eventData.timestamp || new Date().toISOString()
              };
              break;
            case 'bounced':
              updateFields = {
                status: 'bounced',
                failed_at: eventData.timestamp || new Date().toISOString()
              };
              // Add to suppression list
              await this.addToSuppressionList(email.to_emails[0], 'bounce', eventData);
              break;
            case 'complained':
              updateFields = {
                status: 'complained',
                failed_at: eventData.timestamp || new Date().toISOString()
              };
              // Add to suppression list
              await this.addToSuppressionList(email.to_emails[0], 'complaint', eventData);
              break;
          }

          if (Object.keys(updateFields).length > 0) {
            await client.query(`
              UPDATE emails 
              SET ${Object.keys(updateFields).map((key, index) => `${key} = $${index + 2}`).join(', ')}
              WHERE id = $1
            `, [eventData.emailId, ...Object.values(updateFields)]);
          }

          // Update campaign statistics if applicable
          if (email.campaign_id) {
            await this.updateCampaignStats(client, email.campaign_id, eventData.event);
          }

          // Update daily metrics
          await this.updateDailyMetrics(client, eventData.timestamp, eventData.event, 1);

          // Update subscription status for unsubscribes
          if (eventData.event === 'unsubscribed') {
            await this.updateSubscriptionStatus(client, email.to_emails[0], 'unsubscribed', eventData);
          }

          return {
            success: true
          };

        } finally {
          client.release();
        }
      });
    };

    // Enhanced analytics with comprehensive reporting
    this.getAnalyticsOverview = async (query = {}) => {
      return this.executeWithTracing('email.getAnalyticsOverview.process', async () => {
        const client = await this.dbPool.getClient();

        try {
          const {
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate = new Date().toISOString()
          } = query;

          // Get overall statistics
          const statsResult = await client.query(`
            SELECT 
              COUNT(*) as total_sent,
              COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
              COUNT(CASE WHEN EXISTS(
                SELECT 1 FROM email_tracking_events ete 
                WHERE ete.email_id = e.id AND ete.event_type = 'opened'
              ) THEN 1 END) as opened,
              COUNT(CASE WHEN EXISTS(
                SELECT 1 FROM email_tracking_events ete 
                WHERE ete.email_id = e.id AND ete.event_type = 'clicked'
              ) THEN 1 END) as clicked,
              COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
              COUNT(CASE WHEN status = 'complained' THEN 1 END) as complained
            FROM emails e
            WHERE e.created_at BETWEEN $1 AND $2
          `, [startDate, endDate]);

          // Get daily metrics for trend analysis
          const dailyMetricsResult = await client.query(`
            SELECT 
              DATE_TRUNC('day', metric_date) as date,
              SUM(sent_count) as sent,
              SUM(delivered_count) as delivered,
              SUM(opened_count) as opened,
              SUM(clicked_count) as clicked,
              SUM(bounced_count) as bounced
            FROM email_performance_metrics
            WHERE metric_date BETWEEN DATE($1) AND DATE($2)
            GROUP BY DATE_TRUNC('day', metric_date)
            ORDER BY date DESC
          `, [startDate, endDate]);

          // Get template performance
          const templatePerformanceResult = await client.query(`
            SELECT 
              et.name,
              et.category,
              COUNT(e.id) as sent,
              COUNT(CASE WHEN e.status = 'delivered' THEN 1 END) as delivered,
              COUNT(CASE WHEN EXISTS(
                SELECT 1 FROM email_tracking_events ete 
                WHERE ete.email_id = e.id AND ete.event_type = 'opened'
              ) THEN 1 END) as opened
            FROM email_templates et
            LEFT JOIN emails e ON et.id = e.template_id
            WHERE e.created_at BETWEEN $1 AND $2 OR e.created_at IS NULL
            GROUP BY et.id, et.name, et.category
            ORDER BY sent DESC
            LIMIT 10
          `, [startDate, endDate]);

          const stats = statsResult.rows[0];

          return {
            success: true,
            overview: {
              period: { startDate, endDate },
              metrics: {
                totalSent: parseInt(stats.total_sent),
                delivered: parseInt(stats.delivered),
                opened: parseInt(stats.opened),
                clicked: parseInt(stats.clicked),
                bounced: parseInt(stats.bounced),
                complained: parseInt(stats.complained),
                deliveryRate: stats.total_sent > 0 ?
                  parseFloat((stats.delivered / stats.total_sent * 100).toFixed(2)) : 0,
                openRate: stats.delivered > 0 ?
                  parseFloat((stats.opened / stats.delivered * 100).toFixed(2)) : 0,
                clickRate: stats.opened > 0 ?
                  parseFloat((stats.clicked / stats.opened * 100).toFixed(2)) : 0,
                bounceRate: stats.total_sent > 0 ?
                  parseFloat((stats.bounced / stats.total_sent * 100).toFixed(2)) : 0
              }
            },
            dailyMetrics: dailyMetricsResult.rows,
            templatePerformance: templatePerformanceResult.rows
          };

        } finally {
          client.release();
        }
      });
    };

    // Add email to suppression list
    this.addToSuppressionList = async (email, reason, eventData) => {
      const client = await this.dbPool.getClient();
      try {
        await client.query(`
          INSERT INTO email_suppression_list (email, reason, description, source)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            reason = EXCLUDED.reason,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
        `, [
          email,
          reason,
          `${reason} - ${new Date().toISOString()}`,
          eventData.event || 'manual'
        ]);
      } finally {
        client.release();
      }
    };

    // Update campaign statistics
    this.updateCampaignStats = async (client, campaignId, eventType) => {
      const updateField = `${eventType}_count`;
      await client.query(`
        UPDATE email_campaigns 
        SET ${updateField} = ${updateField} + 1
        WHERE id = $1
      `, [campaignId]);
    };

    // Update daily metrics
    this.updateDailyMetrics = async (client, timestamp, eventType, count = 1) => {
      const date = new Date(timestamp).toISOString().split('T')[0];
      const metricField = `${eventType}_count`;

      await client.query(`
        INSERT INTO email_performance_metrics (metric_date, metric_type, ${metricField})
        VALUES ($1, 'daily', $2)
        ON CONFLICT (metric_date, metric_type) 
        DO UPDATE SET ${metricField} = email_performance_metrics.${metricField} + EXCLUDED.${metricField}
      `, [date, count]);
    };

    // Update subscription status
    this.updateSubscriptionStatus = async (client, email, status, eventData) => {
      await client.query(`
        UPDATE email_subscriptions 
        SET status = $1, updated_at = CURRENT_TIMESTAMP,
            unsubscribe_reason = $2
        WHERE email = $3
      `, [status, eventData.metadata?.reason || 'User unsubscribed', email]);
    };

    // Enhanced service health check with database
    this.getServiceHealth = async () => {
      const dbHealth = await this.dbPool.checkHealth();

      const client = await this.dbPool.getClient();
      try {
        const metricsResult = await client.query(`
          SELECT 
            COUNT(*) as total_emails,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
            COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered_emails,
            COUNT(*) as total_templates,
            COUNT(*) FILTER (WHERE is_active = TRUE) as active_templates,
            COUNT(*) as total_campaigns,
            COUNT(*) FILTER (WHERE status = 'sending' OR status = 'scheduled') as active_campaigns
          FROM emails, email_templates, email_campaigns
          WHERE 1=1
        `);

        const dbMetrics = metricsResult.rows[0];

        return {
          service: 'email-service',
          status: 'healthy',
          database: {
            connected: dbHealth,
            metrics: dbMetrics
          },
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

      } catch (error) {
        return {
          service: 'email-service',
          status: 'degraded',
          database: {
            connected: false,
            error: error.message
          },
          timestamp: new Date().toISOString()
        };
      } finally {
        client.release();
      }
    };

    // Initialize database schema
    this.initializeDatabase = async () => {
      const client = await this.dbPool.getClient();
      try {
        // Run migration if needed
        await client.query(`
          CREATE TABLE IF NOT EXISTS service_migrations (
            service_name VARCHAR(100) PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check if migration has been applied
        const migrationResult = await client.query(`
          SELECT version FROM service_migrations 
          WHERE service_name = 'email-service'
        `);

        if (migrationResult.rows.length === 0) {
          this.logger.info('Running database migration for email service');
          // Migration would be run here in production
          await client.query(`
            INSERT INTO service_migrations (service_name, version)
            VALUES ('email-service', '1.0.0')
          `);
        }

        this.logger.info('Database initialized successfully');

      } finally {
        client.release();
      }
    };
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId, query = {}) {
    return this.executeWithTracing('email.getCampaignAnalytics.process', async () => {
      const client = await this.dbPool.getClient();

      try {
        // Get campaign details
        const campaignResult = await client.query(`
          SELECT * FROM email_campaigns WHERE id = $1
        `, [campaignId]);

        if (campaignResult.rows.length === 0) {
          throw new Error('Campaign not found');
        }

        const campaign = campaignResult.rows[0];

        // Get detailed statistics
        const statsResult = await client.query(`
          SELECT 
            e.status,
            COUNT(*) as count
          FROM emails e
          WHERE e.campaign_id = $1
          GROUP BY e.status
        `, [campaignId]);

        // Get tracking events breakdown
        const trackingResult = await client.query(`
          SELECT 
            event_type,
            COUNT(*) as count,
            COUNT(DISTINCT email_id) as unique_emails
          FROM email_tracking_events
          WHERE email_id IN (
            SELECT id FROM emails WHERE campaign_id = $1
          )
          GROUP BY event_type
        `, [campaignId]);

        // Get hourly performance
        const hourlyResult = await client.query(`
          SELECT 
            DATE_TRUNC('hour', timestamp) as hour,
            COUNT(*) as events,
            event_type
          FROM email_tracking_events
          WHERE email_id IN (
            SELECT id FROM emails WHERE campaign_id = $1
          )
            AND timestamp >= NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('hour', timestamp), event_type
          ORDER BY hour DESC
        `, [campaignId]);

        return {
          success: true,
          campaign: {
            ...campaign,
            stats: {
              byStatus: statsResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
              }, {}),
              tracking: trackingResult.rows.reduce((acc, row) => {
                acc[row.event_type] = {
                  total: parseInt(row.count),
                  unique: parseInt(row.unique_emails)
                };
                return acc;
              }, {}),
              hourlyPerformance: hourlyResult.rows
            }
          }
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Get user email subscriptions
   */
  async getSubscriptions(email) {
    return this.executeWithTracing('email.getSubscriptions.process', async () => {
      const client = await this.dbPool.getClient();

      try {
        const result = await client.query(`
          SELECT * FROM email_subscriptions 
          WHERE email = $1
          ORDER BY category
        `, [email]);

        return {
          success: true,
          subscriptions: result.rows
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Subscribe user to email category
   */
  async subscribe(subscriptionData) {
    return this.executeWithTracing('email.subscribe.process', async () => {
      const client = await this.dbPool.getClient();

      try {
        await client.query('BEGIN');

        // Check if on suppression list
        const suppressionResult = await client.query(`
          SELECT * FROM email_suppression_list WHERE email = $1
        `, [subscriptionData.email]);

        if (suppressionResult.rows.length > 0 && suppressionResult.rows[0].is_permanent) {
          throw new Error('Email is permanently suppressed');
        }

        // Create or update subscription
        await client.query(`
          INSERT INTO email_subscriptions (email, user_id, category, status, subscription_source)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email, category) 
          DO UPDATE SET 
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP,
            unsubscribe_reason = NULL
        `, [
          subscriptionData.email,
          subscriptionData.userId,
          subscriptionData.category || 'general',
          'subscribed',
          subscriptionData.source || 'user_request'
        ]);

        // Remove from suppression list if exists and not permanent
        if (suppressionResult.rows.length > 0 && !suppressionResult.rows[0].is_permanent) {
          await client.query(`
            DELETE FROM email_suppression_list WHERE email = $1 AND is_permanent = FALSE
          `, [subscriptionData.email]);
        }

        await client.query('COMMIT');

        return {
          success: true,
          message: 'Successfully subscribed'
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Unsubscribe user from email category
   */
  async unsubscribe(subscriptionData) {
    return this.executeWithTracing('email.unsubscribe.process', async () => {
      const client = await this.dbPool.getClient();

      try {
        await client.query('BEGIN');

        // Update subscription
        await client.query(`
          UPDATE email_subscriptions 
          SET status = 'unsubscribed', 
              updated_at = CURRENT_TIMESTAMP,
              unsubscribe_reason = $1
          WHERE email = $2 AND category = $3
        `, [
          subscriptionData.reason || 'User unsubscribed',
          subscriptionData.email,
          subscriptionData.category || 'all'
        ]);

        // Add to suppression list
        await client.query(`
          INSERT INTO email_suppression_list (email, reason, description, source)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            reason = EXCLUDED.reason,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
        `, [
          subscriptionData.email,
          subscriptionData.reason || 'unsubscribed',
          `Unsubscribed from ${subscriptionData.category || 'all'}`,
          'unsubscribe_request'
        ]);

        await client.query('COMMIT');

        return {
          success: true,
          message: 'Successfully unsubscribed'
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  }
}

module.exports = {
  EnhancedEmailService
};

// Auto-start if this is main module
if (require.main === module) {
  const enhancedService = new EnhancedEmailService();

  enhancedService.start().then(async () => {
    await enhancedService.initializeDatabase();
    logger.info('🚀 Enhanced Email Service with PostgreSQL started successfully');
  }).catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await enhancedService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await enhancedService.shutdown();
    process.exit(0);
  });
}