/**
 * TalentSphere Network Service
 * Professional networking, connections, and messaging service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
// Import from backend-enhanced/shared
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
// Import from backends/shared (Legacy/Shared utils)
const auth = require('../../shared/middleware/auth');
const { getDatabaseManager } = require('../../shared/database-connection');

class NetworkService extends EnhancedServiceWithTracing {
    constructor() {
        super({
            serviceName: 'network-service',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            port: process.env.NETWORK_PORT || 3004,
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
            const span = this.tracer ? this.tracer.startSpan('network.health', req.traceContext) : null;

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

        // Connection management
        this.app.get('/connections',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.getConnections');
            }
        );

        this.app.post('/connections',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.createConnection');
            }
        );

        this.app.put('/connections/:connectionId',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.updateConnection');
            }
        );

        this.app.delete('/connections/:connectionId',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.deleteConnection');
            }
        );

        // Messaging
        this.app.get('/conversations',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.getConversations');
            }
        );

        this.app.post('/conversations',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.createConversation');
            }
        );

        this.app.get('/conversations/:conversationId/messages',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.getMessages');
            }
        );

        this.app.post('/conversations/:conversationId/messages',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.sendMessage');
            }
        );

        // Professional network
        this.app.get('/network',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.getNetwork');
            }
        );

        this.app.get('/recommendations',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.getRecommendations');
            }
        );

        // Profile interactions
        this.app.post('/profiles/:profileId/follow',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.followProfile');
            }
        );

        this.app.delete('/profiles/:profileId/follow',
            auth.required,
            async (req, res) => {
                await this.handleRequestWithTracing(req, res, 'network.unfollowProfile');
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
            case 'network.getConnections':
                return this.getConnections(request.user.userId);
            case 'network.createConnection':
                return this.createConnection(request.user.userId, request.body);
            case 'network.updateConnection':
                return this.updateConnection(request.params.connectionId, request.user.userId, request.body);
            case 'network.deleteConnection':
                return this.deleteConnection(request.params.connectionId, request.user.userId);
            case 'network.getConversations':
                return this.getConversations(request.user.userId);
            case 'network.createConversation':
                return this.createConversation(request.user.userId, request.body);
            case 'network.getMessages':
                return this.getMessages(request.params.conversationId, request.user.userId);
            case 'network.sendMessage':
                return this.sendMessage(request.params.conversationId, request.user.userId, request.body);
            case 'network.getNetwork':
                return this.getNetwork(request.user.userId);
            case 'network.getRecommendations':
                return this.getRecommendations(request.user.userId);
            case 'network.followProfile':
                return this.followProfile(request.user.userId, request.params.profileId);
            case 'network.unfollowProfile':
                return this.unfollowProfile(request.user.userId, request.params.profileId);
            default:
                throw new Error(`Unknown operation: ${operationName}`);
        }
    }

    // Connection operations
    async getConnections(userId) {
        return this.executeWithTracing('network.getConnections.process', async () => {
            await this.database.initialize();

            const result = await this.database.query(`
        SELECT 
          c.*,
          u.first_name,
          u.last_name,
          u.email,
          u.headline,
          u.avatar_url,
          u.company_id,
          comp.name as company_name
        FROM connections c
        JOIN users u ON (c.user_id_1 = u.id OR c.user_id_2 = u.id)
        LEFT JOIN companies comp ON u.company_id = comp.id
        WHERE (c.user_id_1 = $1 OR c.user_id_2 = $1) 
          AND c.status = 'accepted'
          AND u.id != $1
        ORDER BY c.updated_at DESC
      `, [userId]);

            return {
                connections: result.rows,
                total: result.rows.length
            };
        });
    }

    async createConnection(userId, connectionData) {
        return this.executeWithTracing('network.createConnection.process', async () => {
            await this.database.initialize();

            const { targetUserId, message } = connectionData;

            // Check if connection already exists
            const existingConnection = await this.database.query(`
        SELECT id FROM connections 
        WHERE (user_id_1 = $1 AND user_id_2 = $2) 
           OR (user_id_1 = $2 AND user_id_2 = $1)
      `, [userId, targetUserId]);

            if (existingConnection.rows.length > 0) {
                throw new Error('Connection already exists');
            }

            // Create connection request
            const connection = await this.database.insert('connections', {
                user_id_1: userId,
                user_id_2: targetUserId,
                status: 'pending',
                message: message || '',
                requested_at: new Date()
            });

            return {
                connection: {
                    id: connection.id,
                    userId: targetUserId,
                    status: 'pending',
                    message,
                    requestedAt: connection.requested_at
                }
            };
        });
    }

    async updateConnection(connectionId, userId, updateData) {
        return this.executeWithTracing('network.updateConnection.process', async () => {
            await this.database.initialize();

            const { status } = updateData;

            // Verify user is part of the connection
            const connection = await this.database.query(`
        SELECT * FROM connections 
        WHERE id = $1 AND (user_id_1 = $2 OR user_id_2 = $2)
      `, [connectionId, userId]);

            if (connection.rows.length === 0) {
                throw new Error('Connection not found');
            }

            // Update connection
            await this.database.query(`
        UPDATE connections 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `, [status, connectionId]);

            return {
                connection: {
                    id: connectionId,
                    status,
                    updatedAt: new Date().toISOString()
                }
            };
        });
    }

    async deleteConnection(connectionId, userId) {
        return this.executeWithTracing('network.deleteConnection.process', async () => {
            await this.database.initialize();

            // Verify user is part of the connection
            const connection = await this.database.query(`
        SELECT * FROM connections 
        WHERE id = $1 AND (user_id_1 = $2 OR user_id_2 = $2)
      `, [connectionId, userId]);

            if (connection.rows.length === 0) {
                throw new Error('Connection not found');
            }

            // Delete connection
            await this.database.query('DELETE FROM connections WHERE id = $1', [connectionId]);

            return {
                success: true
            };
        });
    }

    // Messaging operations
    async getConversations(userId) {
        return this.executeWithTracing('network.getConversations.process', async () => {
            await this.database.initialize();

            const result = await this.database.query(`
        SELECT DISTINCT ON (c.id) 
          c.*,
          m.content as last_message,
          m.created_at as last_message_at,
          u.first_name,
          u.last_name,
          u.avatar_url
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.user_id = $1 AND u.id != $1
        ORDER BY c.id, m.created_at DESC
      `, [userId]);

            return {
                conversations: result.rows,
                total: result.rows.length
            };
        });
    }

    async createConversation(userId, conversationData) {
        return this.executeWithTracing('network.createConversation.process', async () => {
            await this.database.initialize();

            const { participantIds, title } = conversationData;
            const allParticipants = [userId, ...participantIds];

            // Create conversation
            const conversation = await this.database.insert('conversations', {
                title: title || '',
                created_by: userId,
                created_at: new Date()
            });

            // Add participants
            for (const participantId of allParticipants) {
                await this.database.insert('conversation_participants', {
                    conversation_id: conversation.id,
                    user_id: participantId,
                    joined_at: new Date()
                });
            }

            return {
                conversation: {
                    id: conversation.id,
                    title,
                    participants: allParticipants,
                    createdAt: conversation.created_at
                }
            };
        });
    }

    async getMessages(conversationId, userId) {
        return this.executeWithTracing('network.getMessages.process', async () => {
            await this.database.initialize();

            // Verify user is participant
            const participant = await this.database.query(`
        SELECT * FROM conversation_participants 
        WHERE conversation_id = $1 AND user_id = $2
      `, [conversationId, userId]);

            if (participant.rows.length === 0) {
                throw new Error('Access denied');
            }

            // Get messages
            const result = await this.database.query(`
        SELECT 
          m.*,
          u.first_name,
          u.last_name,
          u.avatar_url
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conversationId]);

            return {
                messages: result.rows,
                total: result.rows.length
            };
        });
    }

    async sendMessage(conversationId, userId, messageData) {
        return this.executeWithTracing('network.sendMessage.process', async () => {
            await this.database.initialize();

            const { content, type = 'text' } = messageData;

            // Verify user is participant
            const participant = await this.database.query(`
        SELECT * FROM conversation_participants 
        WHERE conversation_id = $1 AND user_id = $2
      `, [conversationId, userId]);

            if (participant.rows.length === 0) {
                throw new Error('Access denied');
            }

            // Create message
            const message = await this.database.insert('messages', {
                conversation_id: conversationId,
                sender_id: userId,
                content,
                type,
                created_at: new Date()
            });

            // Update conversation last activity
            await this.database.query(`
        UPDATE conversations 
        SET updated_at = NOW()
        WHERE id = $1
      `, [conversationId]);

            return {
                message: {
                    id: message.id,
                    conversationId,
                    senderId: userId,
                    content,
                    type,
                    createdAt: message.created_at
                }
            };
        });
    }

    // Network and recommendations
    async getNetwork(userId) {
        return this.executeWithTracing('network.getNetwork.process', async () => {
            await this.database.initialize();

            const result = await this.database.query(`
        SELECT 
          u.*,
          c.name as company_name,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM connections conn 
              WHERE (conn.user_id_1 = $1 AND conn.user_id_2 = u.id)
                 OR (conn.user_id_1 = u.id AND conn.user_id_2 = $1)
            ) THEN 'connected'
            WHEN EXISTS (
              SELECT 1 FROM connections conn 
              WHERE conn.user_id_1 = $1 AND conn.user_id_2 = u.id AND conn.status = 'pending'
            ) THEN 'pending'
            ELSE 'not_connected'
          END as connection_status
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id != $1
        ORDER BY connection_status DESC, u.first_name, u.last_name
      `, [userId]);

            return {
                network: result.rows,
                total: result.rows.length
            };
        });
    }

    async getRecommendations(userId) {
        return this.executeWithTracing('network.getRecommendations.process', async () => {
            await this.database.initialize();

            // This is a simplified recommendation algorithm
            // In production, this would use ML and complex heuristics
            const result = await this.database.query(`
        SELECT DISTINCT
          u.*,
          c.name as company_name,
          COUNT(DISTINCT conn1.user_id_2) as mutual_connections
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN connections conn1 ON conn1.user_id_1 = $1 AND conn1.status = 'accepted'
        LEFT JOIN connections conn2 ON conn2.user_id_1 = conn1.user_id_2 
                                 AND conn2.user_id_2 = u.id 
                                 AND conn2.status = 'accepted'
        WHERE u.id != $1
          AND NOT EXISTS (
            SELECT 1 FROM connections conn3 
            WHERE (conn3.user_id_1 = $1 AND conn3.user_id_2 = u.id)
               OR (conn3.user_id_1 = u.id AND conn3.user_id_2 = $1)
          )
        GROUP BY u.id, c.name
        ORDER BY mutual_connections DESC, u.first_name, u.last_name
        LIMIT 10
      `, [userId]);

            return {
                recommendations: result.rows,
                total: result.rows.length
            };
        });
    }

    // Profile following
    async followProfile(userId, profileId) {
        return this.executeWithTracing('network.followProfile.process', async () => {
            await this.database.initialize();

            // Check if already following
            const existing = await this.database.query(`
        SELECT * FROM profile_follows 
        WHERE follower_id = $1 AND following_id = $2
      `, [userId, profileId]);

            if (existing.rows.length > 0) {
                throw new Error('Already following this profile');
            }

            // Create follow relationship
            await this.database.insert('profile_follows', {
                follower_id: userId,
                following_id: profileId,
                followed_at: new Date()
            });

            return {
                following: {
                    userId: profileId,
                    followedAt: new Date().toISOString()
                }
            };
        });
    }

    async unfollowProfile(userId, profileId) {
        return this.executeWithTracing('network.unfollowProfile.process', async () => {
            await this.database.initialize();

            // Remove follow relationship
            const result = await this.database.query(`
        DELETE FROM profile_follows 
        WHERE follower_id = $1 AND following_id = $2
        RETURNING *
      `, [userId, profileId]);

            if (result.rows.length === 0) {
                throw new Error('Not following this profile');
            }

            return {
                success: true
            };
        });
    }

    async start() {
        const startupSpan = this.tracer ? this.tracer.startSpan('network-service.startup') : null;

        try {
            this.server = this.app.listen(this.config.port, () => {
                this.logger.info(`🌐 Network Service running on port ${this.config.port}`);
                this.logger.info(`📍 Environment: ${this.config.environment}`);
            });

            if (startupSpan) {
                startupSpan.setTag('port', this.config.port);
                startupSpan.logEvent('Network service started successfully');
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
        const shutdownSpan = this.tracer ? this.tracer.startSpan('network-service.shutdown') : null;

        try {
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
                this.logger.info('🛑 Network Service stopped');
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

module.exports = { NetworkService };

// Auto-start if this is the main module
if (require.main === module) {
    const networkService = new NetworkService();

    networkService.start().catch(console.error);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        // this.logger is instance property, might fail if accessed statically? 
        // Wait, it is inside 'if', so 'this' is global. 'networkService.logger' is better.
        // Fixed below:
        console.log('🛑 SIGTERM received, shutting down gracefully...');
        await networkService.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('🛑 SIGINT received, shutting down gracefully...');
        await networkService.stop();
        process.exit(0);
    });
}
