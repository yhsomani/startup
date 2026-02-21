/**
 * Real-time Notification Service
 * 
 * Comprehensive notification management with:
 * - WebSocket support for real-time delivery
 * - Push notifications (email, SMS, in-app)
 * - User preferences and subscription management
 * - Notification history and analytics
 * - Scheduled and recurring notifications
 */

const express = require('express');
const { Server } = require('socket.io');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const { getServicePort, getServiceUrl } = require('../../shared/ports');
const { getServiceConfig } = require('../../shared/environment');
const { createLogger } = require('../../shared/logger');
const { DatabaseConnectionPool } = require('../../shared/database-connection-pool');
const Joi = require('joi');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.dbPool = new DatabaseConnectionPool('notification-service');
    this.logger = createLogger('NotificationService');
    this.redisClient = null;
    this.connectedUsers = new Map(); // Connected WebSocket clients
    
    // Initialize
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeScheduledTasks();
  }

  /**
   * Initialize Express middleware
   */
  initializeMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // CORS configuration
    this.app.use((req, res, next) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
      const origin = req.headers.origin;
      
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  /**
   * Initialize API routes
   */
  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        connectedUsers: this.connectedUsers.size
      });
    });

    // Get user notifications
    this.app.get('/notifications/:userId', this.authenticate.bind(this), async (req, res) => {
      try {
        const { userId } = req.params;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
        const result = await this.getUserNotifications(userId, { page, limit, unreadOnly });
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        this.logger.error('Error getting user notifications:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Create notification
    this.app.post('/notifications', this.authenticate.bind(this), async (req, res) => {
      try {
        const notificationData = await this.validateNotificationData(req.body);
        
        const notification = await this.createNotification(notificationData);
        
        // Send real-time to connected users
        await this.sendRealtimeNotification(notification);
        
        res.status(201).json({
          success: true,
          data: { notification }
        });
      } catch (error) {
        this.logger.error('Error creating notification:', error);
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Mark notification as read
    this.app.put('/notifications/:notificationId/read', this.authenticate.bind(this), async (req, res) => {
      try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        await this.markNotificationAsRead(notificationId, userId);
        
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } catch (error) {
        this.logger.error('Error marking notification as read:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Mark all notifications as read
    this.app.put('/notifications/read-all', this.authenticate.bind(this), async (req, res) => {
      try {
        const userId = req.user.id;
        
        await this.markAllNotificationsAsRead(userId);
        
        res.json({
          success: true,
          message: 'All notifications marked as read'
        });
      } catch (error) {
        this.logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get user preferences
    this.app.get('/preferences/:userId', this.authenticate.bind(this), async (req, res) => {
      try {
        const { userId } = req.params;
        
        const preferences = await this.getUserPreferences(userId);
        
        res.json({
          success: true,
          data: preferences
        });
      } catch (error) {
        this.logger.error('Error getting user preferences:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Update user preferences
    this.app.put('/preferences/:userId', this.authenticate.bind(this), async (req, res) => {
      try {
        const { userId } = req.params;
        const preferencesData = await this.validatePreferencesData(req.body);
        
        await this.updateUserPreferences(userId, preferencesData);
        
        res.json({
          success: true,
          message: 'Preferences updated successfully'
        });
      } catch (error) {
        this.logger.error('Error updating user preferences:', error);
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get notification subscriptions
    this.app.get('/subscriptions/:userId', this.authenticate.bind(this), async (req, res) => {
      try {
        const { userId } = req.params;
        
        const subscriptions = await this.getUserSubscriptions(userId);
        
        res.json({
          success: true,
          data: subscriptions
        });
      } catch (error) {
        this.logger.error('Error getting user subscriptions:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Subscribe to notifications
    this.app.post('/subscriptions', this.authenticate.bind(this), async (req, res) => {
      try {
        const subscriptionData = await this.validateSubscriptionData(req.body);
        const userId = req.user.id;
        
        await this.createSubscription(userId, subscriptionData);
        
        res.status(201).json({
          success: true,
          message: 'Subscription created successfully'
        });
      } catch (error) {
        this.logger.error('Error creating subscription:', error);
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Unsubscribe from notifications
    this.app.delete('/subscriptions/:subscriptionId', this.authenticate.bind(this), async (req, res) => {
      try {
        const { subscriptionId } = req.params;
        const userId = req.user.id;
        
        await this.deleteSubscription(subscriptionId, userId);
        
        res.json({
          success: true,
          message: 'Subscription removed successfully'
        });
      } catch (error) {
        this.logger.error('Error removing subscription:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get notification analytics
    this.app.get('/analytics/notifications', this.authenticate.bind(this), async (req, res) => {
      try {
        const { startDate, endDate, userId } = req.query;
        
        const analytics = await this.getNotificationAnalytics(startDate, endDate, userId);
        
        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        this.logger.error('Error getting notification analytics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Initialize WebSocket server for real-time notifications
   */
  initializeWebSocket() {
    this.server = require('http').createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    });

    // WebSocket authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const user = await this.verifyWebSocketToken(token);
        if (!user) {
          return next(new Error('Invalid authentication token'));
        }

        socket.user = user;
        socket.userId = user.id;
        next();
      } catch (error) {
        this.logger.error('WebSocket authentication error:', error);
        socket.disconnect(true);
      }
    });

    // Handle WebSocket connections
    this.io.on('connection', (socket) => {
      this.logger.info(`User connected: ${socket.user.email} (${socket.userId})`);
      
      // Add to connected users
      this.connectedUsers.set(socket.userId, {
        socket: socket,
        user: socket.user,
        connectedAt: new Date()
      });

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Send pending notifications
      this.sendPendingNotifications(socket);
      
      // Handle events
      socket.on('mark_read', async (data) => {
        try {
          await this.markNotificationAsRead(data.notificationId, socket.userId);
          socket.emit('notification_updated', { notificationId: data.notificationId, read: true });
        } catch (error) {
          this.logger.error('Error marking notification as read via WebSocket:', error);
        }
      });

      socket.on('get_preferences', async () => {
        try {
          const preferences = await this.getUserPreferences(socket.userId);
          socket.emit('preferences_updated', preferences);
        } catch (error) {
          this.logger.error('Error getting preferences via WebSocket:', error);
        }
      });

      socket.on('disconnect', () => {
        this.logger.info(`User disconnected: ${socket.user.email} (${socket.userId})`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  /**
   * Initialize scheduled tasks
   */
  initializeScheduledTasks() {
    // Process notifications queue every minute
    cron.schedule('* * * * *', async () => {
      await this.processNotificationQueue();
    });

    // Clean up old notifications daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNotifications();
    });

    // Generate analytics report daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.generateDailyAnalytics();
    });
  }

  /**
   * Authentication middleware
   */
  async authenticate(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await this.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or missing authentication token'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    const client = await this.dbPool.getClient();
    
    try {
      const result = await client.query(`
        SELECT u.*, up.preferences 
        FROM users u 
        LEFT JOIN user_preferences up ON u.id = up.user_id 
        WHERE u.token = $1 AND u.is_active = TRUE AND u.token_expires > NOW()
      `, [token]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      user.preferences = user.preferences ? JSON.parse(user.preferences) : {};
      
      return user;
    } finally {
      client.release();
    }
  }

  /**
   * Verify WebSocket token (simplified version)
   */
  async verifyWebSocketToken(token) {
    // For WebSocket, we'll accept the token without database validation for now
    // In production, this should verify against the database
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback-secret');
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate notification data
   */
  async validateNotificationData(data) {
    const schema = Joi.object({
      userId: Joi.string().uuid().required(),
      type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
      title: Joi.string().max(200).required(),
      message: Joi.string().max(2000).required(),
      data: Joi.object().default({}),
      metadata: Joi.object().default({}),
      channels: Joi.array().items(Joi.string()).default(['in-app']),
      scheduledFor: Joi.date().optional(),
      priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
      expiresAt: Joi.date().optional()
    });

    const { error } = schema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    return data;
  }

  /**
   * Validate preferences data
   */
  async validatePreferencesData(data) {
    const schema = Joi.object({
      emailNotifications: Joi.boolean().default(true),
      smsNotifications: Joi.boolean().default(false),
      pushNotifications: Joi.boolean().default(true),
      digestEmail: Joi.boolean().default(true),
      quietHours: Joi.object().default({
        start: '22:00',
        end: '08:00'
      }),
      categories: Joi.object().default({})
    });

    const { error } = schema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    return data;
  }

  /**
   * Validate subscription data
   */
  async validateSubscriptionData(data) {
    const schema = Joi.object({
      category: Joi.string().required(),
      channels: Joi.array().items(Joi.string()).min(1).required(),
      criteria: Joi.object().default({})
    });

    const { error } = schema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    return data;
  }

  /**
   * Database operations
   */
  async createNotification(notificationData) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        INSERT INTO notifications (
          id, user_id, type, title, message, data, metadata,
          channels, scheduled_for, priority, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `, [
        uuidv4(),
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        JSON.stringify(notificationData.data || {}),
        JSON.stringify(notificationData.metadata || {}),
        JSON.stringify(notificationData.channels || ['in-app']),
        notificationData.scheduledFor,
        notificationData.priority,
        notificationData.expiresAt
      ]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserNotifications(userId, options = {}) {
    const client = await this.dbPool.getClient();
    
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE user_id = $1';
      const queryParams = [userId];
      
      if (unreadOnly) {
        whereClause += ' AND is_read = FALSE';
      }
      
      const result = await client.query(`
        SELECT * FROM notifications 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [...queryParams, limit, offset]);
      
      const countResult = await client.query(`
        SELECT COUNT(*) as total 
        FROM notifications 
        ${whereClause}
      `, queryParams);
      
      return {
        notifications: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } finally {
      client.release();
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  async markAllNotificationsAsRead(userId) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = $1 AND is_read = FALSE
      `, [userId]);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Real-time notification methods
   */
  async sendRealtimeNotification(notification) {
    const channels = notification.channels || ['in-app'];
    
    for (const channel of channels) {
      switch (channel) {
        case 'in-app':
          // Send to connected user via WebSocket
          if (this.connectedUsers.has(notification.user_id)) {
            const userConnection = this.connectedUsers.get(notification.user_id);
            userConnection.socket.emit('notification', {
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              id: notification.id,
              timestamp: notification.created_at
            });
          }
          break;
        
        case 'email':
          await this.sendEmailNotification(notification);
          break;
        
        case 'sms':
          await this.sendSMSNotification(notification);
          break;
        
        case 'push':
          await this.sendPushNotification(notification);
          break;
      }
    }
  }

  async sendPendingNotifications(socket) {
    try {
      const pendingNotifications = await this.getUserNotifications(socket.userId, { unreadOnly: true, limit: 50 });
      
      for (const notification of pendingNotifications.notifications) {
        socket.emit('notification', {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          id: notification.id,
          timestamp: notification.created_at,
          unread: true
        });
      }
    } catch (error) {
      this.logger.error('Error sending pending notifications:', error);
    }
  }

  async sendEmailNotification(notification) {
    // This would integrate with the email service
    // For now, we'll just log it
    this.logger.info(`Email notification: ${notification.title} to user ${notification.user_id}`);
  }

  async sendSMSNotification(notification) {
    // SMS sending implementation would go here
    // For now, we'll just log it
    this.logger.info(`SMS notification: ${notification.title} to user ${notification.user_id}`);
  }

  async sendPushNotification(notification) {
    // Push notification implementation would go here
    // For now, we'll just log it
    this.logger.info(`Push notification: ${notification.title} to user ${notification.user_id}`);
  }

  /**
   * User preferences management
   */
  async getUserPreferences(userId) {
    const client = await this.dbPool.getClient();
    
    try {
      const result = await client.query(`
        SELECT preferences FROM user_preferences WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length === 0) {
        return this.getDefaultPreferences();
      }
      
      return JSON.parse(result.rows[0].preferences || '{}');
    } finally {
      client.release();
    }
  }

  async updateUserPreferences(userId, preferencesData) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        INSERT INTO user_preferences (user_id, preferences, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET preferences = $2, updated_at = NOW()
      `, [userId, JSON.stringify(preferencesData)]);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  getDefaultPreferences() {
    return {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      digestEmail: true,
      quietHours: {
        start: '22:00',
        end: '08:00'
      },
      categories: {
        jobApplications: true,
        networkUpdates: true,
        systemUpdates: true,
        marketing: false
      }
    };
  }

  /**
   * Subscription management
   */
  async getUserSubscriptions(userId) {
    const client = await this.dbPool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM notification_subscriptions WHERE user_id = $1 AND is_active = TRUE
        ORDER BY created_at DESC
      `, [userId]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createSubscription(userId, subscriptionData) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        INSERT INTO notification_subscriptions (
          id, user_id, category, channels, criteria, created_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)
      `, [
        uuidv4(),
        userId,
        subscriptionData.category,
        JSON.stringify(subscriptionData.channels),
        JSON.stringify(subscriptionData.criteria || {})
      ]);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  async deleteSubscription(subscriptionId, userId) {
    const client = await this.dbPool.getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE notification_subscriptions 
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [subscriptionId, userId]);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Queue processing
   */
  async processNotificationQueue() {
    const client = await this.dbPool.getClient();
    
    try {
      // Get queued notifications
      const result = await client.query(`
        SELECT * FROM notifications 
        WHERE status = 'queued' 
        ORDER BY priority DESC, created_at ASC 
        LIMIT 100
      `);
      
      for (const notification of result.rows) {
        try {
          // Process each notification
          await this.sendRealtimeNotification(notification);
          
          // Update status
          await client.query(`
            UPDATE notifications 
            SET status = 'sent', sent_at = NOW()
            WHERE id = $1
          `, [notification.id]);
            
        } catch (error) {
          this.logger.error(`Error processing notification ${notification.id}:`, error);
          
          // Mark as failed
          await client.query(`
            UPDATE notifications 
            SET status = 'failed', error_message = $1, failed_at = NOW()
            WHERE id = $1
          `, [notification.id, error.message]);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup operations
   */
  async cleanupOldNotifications() {
    const client = await this.dbPool.getClient();
    
    try {
      // Delete notifications older than 30 days
      const result = await client.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `, []);
      
      this.logger.info(`Cleaned up ${result.rowCount || 0} old notifications`);
    } finally {
      client.release();
    }
  }

  async generateDailyAnalytics() {
    const client = await this.dbPool.getClient();
    
    try {
      // Generate daily analytics summary
      const result = await client.query(`
        INSERT INTO notification_analytics (
          date, total_sent, total_delivered, total_opened, total_clicked, total_failed
        )
        SELECT 
          DATE(NOW()) as date,
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered,
          COUNT(CASE WHEN is_read = TRUE THEN 1 END) as total_opened,
          COUNT(CASE WHEN metadata->>'type' = 'clicked' THEN 1 END) as total_clicked,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed
        FROM notifications 
        WHERE DATE(created_at) = CURRENT_DATE
      `, []);
      
      this.logger.info(`Daily notification analytics generated: ${result.rowCount || 0} records`);
    } finally {
      client.release();
    }
  }

  /**
   * Analytics methods
   */
  async getNotificationAnalytics(startDate, endDate, userId) {
    const client = await this.dbPool.getClient();
    
    try {
      let whereClause = 'WHERE DATE(created_at) BETWEEN $1 AND $2';
      const queryParams = [startDate, endDate];
      
      if (userId) {
        whereClause += ' AND user_id = $3';
        queryParams.push(userId);
      }
      
      const result = await client.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN is_read = TRUE THEN 1 END) as opened,
          COUNT(CASE WHEN metadata->>'type' = 'clicked' THEN 1 END) as clicked,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM notifications 
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, queryParams);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Health check and graceful shutdown
   */
  async start() {
    const port = getServicePort('notification-service', 3005);
    const url = getServiceUrl('notification-service');
    
    // Initialize database
    await this.initializeDatabase();
    
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.redisClient = redis.createClient(process.env.REDIS_URL);
      this.redisClient.on('connect', () => {
        this.logger.info('Connected to Redis');
      });
    }
    
    this.server.listen(port, () => {
      this.logger.info(`🔔 Notification Service started successfully on port ${port}`);
      this.logger.info(`📊 Health check available at: ${url}/health`);
      this.logger.info(`🔌 WebSocket server running on same port`);
    });
  }

  async initializeDatabase() {
    const client = await this.dbPool.getClient();
    
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          channels TEXT[] DEFAULT ARRAY['in-app'],
          status VARCHAR(20) DEFAULT 'pending',
          is_read BOOLEAN DEFAULT FALSE,
          priority VARCHAR(10) DEFAULT 'normal',
          scheduled_for TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          preferences JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS notification_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          channels TEXT[] NOT NULL,
          criteria JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS notification_analytics (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          total_sent INTEGER DEFAULT 0,
          total_delivered INTEGER DEFAULT 0,
          total_opened INTEGER DEFAULT 0,
          total_clicked INTEGER DEFAULT 0,
          total_failed INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, is_read);
        
        CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_active ON notification_subscriptions(is_active);
        
        CREATE INDEX IF NOT EXISTS idx_notification_analytics_date ON notification_analytics(date);
      `);
      
      this.logger.info('Database initialized successfully');
    } finally {
      client.release();
    }
  }

  async shutdown() {
    this.logger.info('🛑 Shutting down Notification Service...');
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.io) {
      this.io.close();
    }
    
    if (this.redisClient) {
      this.redisClient.quit();
    }
    
    if (this.dbPool) {
      await this.dbPool.shutdown();
    }
    
    this.logger.info('Notification Service shut down complete');
  }
}

// Auto-start if this is the main module
if (require.main === module) {
  const notificationService = new NotificationService();
  
  notificationService.start().then(() => {
    logger.info('🔔 Notification Service started successfully');
  }).catch(error => {
    logger.error('Failed to start Notification Service:', error);
    process.exit(1);
  });
  
  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await notificationService.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await notificationService.shutdown();
    process.exit(0);
  });
}

module.exports = NotificationService;