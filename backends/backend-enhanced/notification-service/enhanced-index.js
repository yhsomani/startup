/**
 * Enhanced Notification Service with Production Database
 * 
 * Complete notification system with:
 * - PostgreSQL integration for persistence
 * - Real-time delivery via WebSocket
 * - Email/SMS/Push notification channels
 * - User preferences and templates
 * - Background worker for async processing
 */

const { getServicePort, getServiceUrl } = require('../../../../shared/ports');
const { getServiceConfig } = require('../../../../shared/environment');
const { NotificationService } = require('./index-database');
const DatabaseConnectionPool = require('../../../../shared/database-connection-pool');
const { createLogger } = require('../../../../shared/logger');

class EnhancedNotificationService extends NotificationService {
  constructor() {
    super();
    
    this.dbPool = new DatabaseConnectionPool('notification-service');
    this.logger = createLogger('EnhancedNotificationService');
    
    // Override with database operations
    this.initializeDatabaseOperations();
  }

  /**
   * Initialize database-specific operations
   */
  initializeDatabaseOperations() {
    // Override notification creation with database persistence
    this.createNotification = async (notificationData) => {
      return this.executeWithTracing('notification.createNotification.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          await client.query('BEGIN');
          
          // Insert main notification
          const notificationResult = await client.query(`
            INSERT INTO notifications (
              type, title, message, data, priority, 
              scheduled_for, expires_at, delivery_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `, [
            notificationData.type,
            notificationData.title,
            notificationData.message,
            JSON.stringify(notificationData.data || {}),
            notificationData.priority || 'normal',
            notificationData.scheduledFor,
            notificationData.expiresAt,
            'pending'
          ]);
          
          const notification = notificationResult.rows[0];
          
          // Insert recipients
          const recipientPromises = notificationData.recipients.map(recipient => 
            client.query(`
              INSERT INTO notification_recipients (
                notification_id, user_id, email, device_id, 
                device_token, phone, delivery_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *
            `, [
              notification.id,
              recipient.userId,
              recipient.email,
              recipient.deviceId,
              recipient.deviceToken,
              recipient.phone,
              'pending'
            ])
          );
          
          const recipientResults = await Promise.all(recipientPromises);
          
          // Create notification history entries for each recipient
          const historyPromises = notificationData.recipients.map(recipient =>
            client.query(`
              INSERT INTO notification_history (
                user_id, notification_id, type, title, message, data, is_read
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *
            `, [
              recipient.userId,
              notification.id,
              notificationData.type,
              notificationData.title,
              notificationData.message,
              JSON.stringify(notificationData.data || {}),
              false
            ])
          );
          
          await Promise.all(historyPromises);
          
          // Log metrics
          await client.query(`
            INSERT INTO notification_metrics (
              notification_id, user_id, event_type, metadata
            ) VALUES ($1, $2, $3, $4)
          `, [
            notification.id,
            null,
            'created',
            JSON.stringify({ recipientCount: notificationData.recipients.length })
          ]);
          
          await client.query('COMMIT');
          
          // Queue for background processing
          this.queueNotificationForDelivery({
            ...notification,
            recipients: recipientResults.map(r => r.rows[0])
          });
          
          return {
            success: true,
            notification: {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              createdAt: notification.created_at
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

    // Override user preferences with database
    this.getUserPreferences = async (userId) => {
      return this.executeWithTracing('notification.getPreferences.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          const result = await client.query(`
            SELECT * FROM user_notification_preferences 
            WHERE user_id = $1
          `, [userId]);
          
          if (result.rows.length === 0) {
            // Create default preferences
            await client.query(`
              INSERT INTO user_notification_preferences (
                user_id, email_notifications, push_notifications, 
                sms_notifications, job_alerts, profile_visibility,
                social_notifications, weekly_digest
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *
            `, [
              userId, true, true, false, true, 'public', true, true
            ]);
            
            const newResult = await client.query(`
              SELECT * FROM user_notification_preferences 
              WHERE user_id = $1
            `, [userId]);
            
            return { preferences: newResult.rows[0] };
          }
          
          return { preferences: result.rows[0] };
          
        } finally {
          client.release();
        }
      });
    };

    // Override notification history with database
    this.getNotificationHistory = async (userId, query = {}) => {
      return this.executeWithTracing('notification.getNotificationHistory.process', async () => {
        const { limit = 50, offset = 0, unread = false } = query;
        
        const client = await this.dbPool.getClient();
        
        try {
          let whereClause = 'WHERE nh.user_id = $1';
          const queryParams = [userId, limit + 1, offset];
          
          if (unread === 'true' || unread === true) {
            whereClause += ' AND nh.is_read = FALSE';
          }
          
          const result = await client.query(`
            SELECT 
              nh.id, nh.type, nh.title, nh.message, nh.data,
              nh.is_read, nh.read_at, nh.created_at,
              n.delivery_status, n.priority
            FROM notification_history nh
            LEFT JOIN notifications n ON nh.notification_id = n.id
            ${whereClause}
            ORDER BY nh.created_at DESC
            LIMIT $2 OFFSET $3
          `, queryParams);
          
          const hasMore = result.rows.length > limit;
          if (hasMore) {
            result.rows.pop(); // Remove the extra row used to check for more
          }
          
          // Get total count
          const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM notification_history nh
            ${whereClause}
          `, [userId]);
          
          return {
            notifications: result.rows,
            pagination: {
              limit,
              offset,
              total: parseInt(countResult.rows[0].total),
              hasMore
            }
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Enhanced mark as read with database
    this.markNotificationsAsRead = async (notificationIds, userId) => {
      return this.executeWithTracing('notification.markAsRead.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          await client.query('BEGIN');
          
          const updateResult = await client.query(`
            UPDATE notification_history 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = ANY($1) AND user_id = $2
            RETURNING id, user_id
          `, [notificationIds, userId]);
          
          // Log metrics for each notification
          const metricPromises = updateResult.rows.map(row =>
            client.query(`
              INSERT INTO notification_metrics (
                notification_id, user_id, event_type, metadata
              ) VALUES (
                (SELECT notification_id FROM notification_history WHERE id = $1), 
                $2, $3, $4
              )
            `, [row.id, row.user_id, 'read', '{}'])
          );
          
          await Promise.all(metricPromises);
          
          await client.query('COMMIT');
          
          return {
            success: true,
            markedReadCount: updateResult.rows.length
          };
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced real-time message delivery
    this.sendRealTimeMessage = async (messageData) => {
      return this.executeWithTracing('notification.sendRealTimeMessage.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          // Create in-app notification
          const notification = await this.createNotification({
            type: 'in-app',
            recipients: messageData.recipients,
            title: messageData.title,
            message: messageData.message,
            priority: 'high',
            data: { 
              type: 'realtime', 
              conversationId: messageData.conversationId,
              ...messageData.data
            }
          });
          
          // Send to WebSocket clients
          const notificationData = {
            type: 'notification',
            notification: notification.notification,
            timestamp: new Date().toISOString()
          };
          
          let deliveredCount = 0;
          const deliveryPromises = messageData.recipients.map(async (recipient) => {
            const ws = this.webSocketClients.get(recipient.userId);
            
            if (ws && ws.readyState === 1) { // WebSocket.OPEN
              try {
                ws.send(JSON.stringify(notificationData));
                deliveredCount++;
                
                // Update recipient delivery status
                await client.query(`
                  UPDATE notification_recipients 
                  SET delivery_status = 'delivered', delivered_at = CURRENT_TIMESTAMP
                  WHERE notification_id = $1 AND user_id = $2
                `, [notification.notification.id, recipient.userId]);
                
                return { success: true, userId: recipient.userId };
              } catch (error) {
                return { success: false, userId: recipient.userId, error: error.message };
              }
            } else {
              return { success: false, userId: recipient.userId, reason: 'offline' };
            }
          });
          
          const results = await Promise.all(deliveryPromises);
          
          // Log delivery metrics
          await client.query(`
            INSERT INTO notification_metrics (
              notification_id, user_id, event_type, metadata
            ) VALUES 
            ($1, $2, $3, $4)
          `, [
            notification.notification.id,
            null,
            'delivered',
            JSON.stringify({ 
              deliveredCount, 
              totalRecipients: messageData.recipients.length,
              type: 'realtime'
            })
          ]);
          
          return {
            success: true,
            notification: notification.notification,
            delivery: {
              delivered: deliveredCount,
              total: messageData.recipients.length,
              results
            }
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Background worker enhancement
    this.processNotificationDelivery = async (notification) => {
      return this.executeWithTracing('notification.processDelivery.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          const startTime = Date.now();
          
          // Update delivery attempts
          await client.query(`
            UPDATE notifications 
            SET delivery_attempts = delivery_attempts + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [notification.id]);
          
          // Get recipients with their preferences
          const recipientsResult = await client.query(`
            SELECT 
              nr.*, 
              unp.email_notifications,
              unp.push_notifications,
              unp.sms_notifications
            FROM notification_recipients nr
            LEFT JOIN user_notification_preferences unp ON nr.user_id = unp.user_id
            WHERE nr.notification_id = $1 AND nr.delivery_status = 'pending'
          `, [notification.id]);
          
          let totalDelivered = 0;
          let totalFailed = 0;
          
          for (const recipient of recipientsResult.rows) {
            try {
              // Check user preferences
              const canDeliver = await this.checkDeliveryPermissions(notification, recipient);
              
              if (!canDeliver.allowed) {
                await client.query(`
                  UPDATE notification_recipients 
                  SET delivery_status = 'skipped', 
                      error_message = $2,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                `, [recipient.id, canDeliver.reason]);
                continue;
              }
              
              // Deliver based on notification type and preferences
              let delivered = false;
              
              switch (notification.type) {
                case 'email':
                  if (recipient.email_notifications && recipient.email) {
                    delivered = await this.deliverEmailNotification(notification, recipient);
                  }
                  break;
                  
                case 'sms':
                  if (recipient.sms_notifications && recipient.phone) {
                    delivered = await this.deliverSMSNotification(notification, recipient);
                  }
                  break;
                  
                case 'push':
                  if (recipient.push_notifications && recipient.device_token) {
                    delivered = await this.deliverPushNotification(notification, recipient);
                  }
                  break;
                  
                case 'in-app':
                  delivered = await this.deliverInAppNotification(notification, recipient);
                  break;
              }
              
              if (delivered) {
                totalDelivered++;
                await client.query(`
                  UPDATE notification_recipients 
                  SET delivery_status = 'delivered', 
                      delivered_at = CURRENT_TIMESTAMP,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                `, [recipient.id]);
              } else {
                totalFailed++;
                await client.query(`
                  UPDATE notification_recipients 
                  SET delivery_status = 'failed', 
                      error_message = 'Delivery failed',
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                `, [recipient.id]);
              }
              
            } catch (error) {
              totalFailed++;
              await client.query(`
                UPDATE notification_recipients 
                SET delivery_status = 'failed', 
                    error_message = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
              `, [recipient.id, error.message]);
            }
          }
          
          const processingTime = Date.now() - startTime;
          
          // Update overall notification status
          const overallStatus = totalDelivered > 0 ? 'delivered' : 'failed';
          await client.query(`
            UPDATE notifications 
            SET delivery_status = $1, 
                delivered_at = CURRENT_TIMESTAMP,
                processing_time = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [overallStatus, processingTime, notification.id]);
          
          // Log metrics
          await client.query(`
            INSERT INTO notification_metrics (
              notification_id, user_id, event_type, metadata, processing_time
            ) VALUES 
            ($1, $2, $3, $4, $5)
          `, [
            notification.id,
            null,
            'processed',
            JSON.stringify({ 
              delivered: totalDelivered, 
              failed: totalFailed,
              total: recipientsResult.rows.length 
            }),
            processingTime
          ]);
          
          return {
            delivered: totalDelivered,
            failed: totalFailed,
            total: recipientsResult.rows.length,
            processingTime
          };
          
        } finally {
          client.release();
        }
      });
    };
  }

  /**
   * Check if notification can be delivered based on user preferences
   */
  async checkDeliveryPermissions(notification, recipient) {
    // Check time-based restrictions
    const currentHour = new Date().getHours();
    
    // Don't send high-priority notifications during quiet hours (10 PM - 8 AM)
    if (notification.priority !== 'urgent' && (currentHour >= 22 || currentHour <= 8)) {
      return { allowed: false, reason: 'Quiet hours restriction' };
    }
    
    // Check frequency limits
    const client = await this.dbPool.getClient();
    try {
      const recentNotificationsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM notification_history nh
        JOIN notifications n ON nh.notification_id = n.id
        WHERE nh.user_id = $1 
        AND nh.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        AND n.type = $2
      `, [recipient.user_id, notification.type]);
      
      const recentCount = parseInt(recentNotificationsResult.rows[0].count);
      
      // Limit to 10 notifications of the same type per hour
      if (recentCount >= 10) {
        return { allowed: false, reason: 'Frequency limit exceeded' };
      }
      
      return { allowed: true };
      
    } finally {
      client.release();
    }
  }

  /**
   * Enhanced service health check with database
   */
  async getServiceHealth() {
    const dbHealth = await this.dbPool.checkHealth();
    const queueSize = this.notificationQueue.length;
    const workerRunning = this.isWorkerRunning;
    const webSocketConnections = this.webSocketClients.size;

    // Get database metrics
    const client = await this.dbPool.getClient();
    try {
      const metricsResult = await client.query(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN delivery_status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending
        FROM notifications
        WHERE created_at > CURRENT_DATE - INTERVAL '24 hours'
      `);
      
      const dbMetrics = metricsResult.rows[0];
      
      return {
        service: 'notification-service',
        status: 'healthy',
        database: {
          connected: dbHealth,
          metrics: dbMetrics
        },
        notificationQueue: queueSize,
        workerRunning,
        webSocketConnections,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        service: 'notification-service',
        status: 'degraded',
        database: {
          connected: false,
          error: error.message
        },
        notificationQueue: queueSize,
        workerRunning,
        webSocketConnections,
        timestamp: new Date().toISOString()
      };
    } finally {
      client.release();
    }
  }

  /**
   * Initialize database schema
   */
  async initializeDatabase() {
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
        WHERE service_name = 'notification-service'
      `);
      
      if (migrationResult.rows.length === 0) {
        this.logger.info('Running database migration for notification service');
        // Migration would be run here in production
        await client.query(`
          INSERT INTO service_migrations (service_name, version)
          VALUES ('notification-service', '1.0.0')
        `);
      }
      
      this.logger.info('Database initialized successfully');
      
    } finally {
      client.release();
    }
  }
}

module.exports = {
  EnhancedNotificationService
};

// Auto-start if this is main module
if (require.main === module) {
  const enhancedService = new EnhancedNotificationService();
  
  enhancedService.start().then(async () => {
    await enhancedService.initializeDatabase();
    logger.info('🚀 Enhanced Notification Service with PostgreSQL started successfully');
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