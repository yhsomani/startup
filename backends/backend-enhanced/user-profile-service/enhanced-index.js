/**
 * User Profile Service with Production Database Integration
 * Complete user profile management with skills, experience, and education tracking
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../shared/validation');
const { contracts } = require('../../../shared/contracts');
const { applySecurityMiddleware } = require('../../../shared/security-middleware');
const { getDatabaseManager } = require('../../../shared/database-connection');
const auth = require('../../../shared/middleware/auth');
// const redisClient = require('../shared/redis-client'); // Removed in favor of in-memory cache

class UserProfileService extends EnhancedServiceWithTracing {
    constructor() {
        super({
            serviceName: 'user-profile-service',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            port: process.env.USER_PROFILE_PORT || 3009,
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

        // Initialize database connection
        this.database = getDatabaseManager();

        // Initialize service contracts
        this.initializeContracts();

        // Setup middleware
        this.setupMiddleware();

        // Setup routes
        this.setupRoutes();
    }

    initializeContracts() {
        this.serviceContracts = {
            ...contracts.base,
            userProfile: {
                create: {
                    request: {
                        type: 'object',
                        required: ['userId', 'firstName', 'lastName'],
                        properties: {
                            userId: { type: 'string', format: 'uuid' },
                            firstName: { type: 'string', minLength: 1, maxLength: 50 },
                            lastName: { type: 'string', minLength: 1, maxLength: 50 },
                            headline: { type: 'string', maxLength: 200 },
                            summary: { type: 'string', maxLength: 1000 },
                            location: { type: 'string', maxLength: 100 },
                            industry: { type: 'string', maxLength: 100 },
                            profilePicture: { type: 'string', maxLength: 500 },
                            coverPhoto: { type: 'string', maxLength: 500 },
                            socialLinks: {
                                type: 'object',
                                properties: {
                                    linkedin: { type: 'string', maxLength: 200 },
                                    github: { type: 'string', maxLength: 200 },
                                    twitter: { type: 'string', maxLength: 200 },
                                    website: { type: 'string', maxLength: 200 }
                                }
                            }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['id', 'userId', 'firstName', 'lastName'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            headline: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                get: {
                    request: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'string', format: 'uuid' }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['id', 'userId', 'firstName', 'lastName'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            headline: { type: 'string' },
                            summary: { type: 'string' },
                            location: { type: 'string' },
                            industry: { type: 'string' },
                            profilePicture: { type: 'string' },
                            coverPhoto: { type: 'string' },
                            socialLinks: {
                                type: 'object',
                                properties: {
                                    linkedin: { type: 'string' },
                                    github: { type: 'string' },
                                    twitter: { type: 'string' },
                                    website: { type: 'string' }
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                update: {
                    request: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            firstName: { type: 'string', minLength: 1, maxLength: 50 },
                            lastName: { type: 'string', minLength: 1, maxLength: 50 },
                            headline: { type: 'string', maxLength: 200 },
                            summary: { type: 'string', maxLength: 1000 },
                            location: { type: 'string', maxLength: 100 },
                            industry: { type: 'string', maxLength: 100 },
                            profilePicture: { type: 'string', maxLength: 500 },
                            coverPhoto: { type: 'string', maxLength: 500 },
                            socialLinks: {
                                type: 'object',
                                properties: {
                                    linkedin: { type: 'string', maxLength: 200 },
                                    github: { type: 'string', maxLength: 200 },
                                    twitter: { type: 'string', maxLength: 200 },
                                    website: { type: 'string', maxLength: 200 }
                                }
                            }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['id', 'userId', 'firstName', 'lastName'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            headline: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                listSkills: {
                    request: {
                        type: 'object',
                        required: ['userId'],
                        properties: {
                            userId: { type: 'string', format: 'uuid' }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['skills'],
                        properties: {
                            skills: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    required: ['id', 'name', 'level'],
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        name: { type: 'string' },
                                        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
                                        createdAt: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    setupMiddleware() {
        // Apply security middleware
        applySecurityMiddleware(this.app, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: true
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            }
        });

        // Authentication middleware
        this.app.use('/api/v1/profiles', auth.authenticateToken);
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: this.serviceName,
                version: this.version,
                timestamp: new Date().toISOString()
            });
        });

        // Performance metrics endpoint
        this.app.get('/metrics', (req, res) => {
            const mem = process.memoryUsage();
            const formatBytes = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
            const uptime = process.uptime() * 1000;

            let cacheStats = null;
            if (this.cache) {
                const keys = this.cache.size || 0;
                const hits = this.cacheHits || 0;
                const misses = this.cacheMisses || 0;
                const total = hits + misses;
                cacheStats = {
                    hits,
                    misses,
                    keys,
                    hitRate: total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : '0%'
                };
            }

            res.status(200).json({
                service: this.serviceName,
                version: this.version,
                health: { status: 'healthy', uptime },
                performance: {
                    uptime,
                    requestCount: this.requestCount || 0,
                    errorCount: this.errorCount || 0,
                    errorRate: this.requestCount
                        ? ((this.errorCount / this.requestCount) * 100).toFixed(2)
                        : '0.00',
                    memory: {
                        rss: formatBytes(mem.rss),
                        heapUsed: formatBytes(mem.heapUsed),
                        heapTotal: formatBytes(mem.heapTotal)
                    }
                },
                cache: cacheStats,
                timestamp: new Date().toISOString()
            });
        });

        // API routes
        this.app.use('/api/v1', this.router);

        // User profile endpoints
        this.router.post('/profiles', this.createProfile.bind(this));
        this.router.get('/profiles/:id', this.getProfile.bind(this));
        this.router.put('/profiles/:id', this.updateProfile.bind(this));
        this.router.delete('/profiles/:id', this.deleteProfile.bind(this));
        this.router.get('/profiles/user/:userId', this.getProfileByUser.bind(this));

        // Skills endpoints
        this.router.post('/profiles/:id/skills', this.addSkill.bind(this));
        this.router.get('/profiles/:id/skills', this.listSkills.bind(this));
        this.router.put('/skills/:skillId', this.updateSkill.bind(this));
        this.router.delete('/skills/:skillId', this.deleteSkill.bind(this));

        // Experience endpoints
        this.router.post('/profiles/:id/experiences', this.addExperience.bind(this));
        this.router.get('/profiles/:id/experiences', this.listExperiences.bind(this));
        this.router.put('/experiences/:experienceId', this.updateExperience.bind(this));
        this.router.delete('/experiences/:experienceId', this.deleteExperience.bind(this));

        // Education endpoints
        this.router.post('/profiles/:id/educations', this.addEducation.bind(this));
        this.router.get('/profiles/:id/educations', this.listEducations.bind(this));
        this.router.put('/educations/:educationId', this.updateEducation.bind(this));
        this.router.delete('/educations/:educationId', this.deleteEducation.bind(this));
    }

    async createProfile(req, res) {
        try {
            const { userId, firstName, lastName, headline, summary, location, industry, profilePicture, coverPhoto, socialLinks } = req.body;
            const authenticatedUserId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.userProfile.create.request, req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: validation.errors
                });
            }

            // Verify that the user creating the profile is the same user or an admin
            if (userId !== authenticatedUserId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only create your own profile'
                });
            }

            // Check if profile already exists for this user
            const existingProfile = await this.database.query(
                'SELECT id FROM user_profiles WHERE user_id = $1',
                [userId]
            );

            if (existingProfile.rows.length > 0) {
                return res.status(409).json({
                    error: 'CONFLICT',
                    message: 'Profile already exists for this user'
                });
            }

            const profileId = uuidv4();
            const createdAt = new Date().toISOString();

            const query = `
        INSERT INTO user_profiles (
          id, user_id, first_name, last_name, headline, summary, 
          location, industry, profile_picture, cover_photo, social_links, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        RETURNING id, user_id, first_name, last_name, headline, created_at
      `;

            const values = [
                profileId, userId, firstName, lastName, headline, summary,
                location, industry, profilePicture, coverPhoto,
                JSON.stringify(socialLinks || {}), createdAt
            ];

            const result = await this.database.query(query, values);

            // Validate response
            const responseValidation = validateResponse(this.serviceContracts.userProfile.create.response, result.rows[0]);
            if (!responseValidation.valid) {
                this.logger.warn('Response validation failed', { errors: responseValidation.errors });
            }

            // Invalidate cache
            // Invalidate cache
            this.invalidateCache(`profile:user:${userId}`);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error creating user profile', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to create user profile'
            });
        }
    }

    async getProfile(req, res) {
        try {
            const { id } = req.params;
            const cacheKey = `profile:${id}`;

            const profile = await this.withCache(cacheKey, 60, async () => {
                // Validate request
                const validation = validateRequest(this.serviceContracts.userProfile.get.request, { id });
                if (!validation.valid) {
                    throw new ValidationError('Invalid profile ID', { details: validation.errors });
                }

                const query = `
            SELECT 
            id, user_id, first_name, last_name, headline, summary, 
            location, industry, profile_picture, cover_photo, social_links,
            created_at, updated_at
            FROM user_profiles 
            WHERE id = $1
            `;

                const result = await this.traceDatabaseQuery('getProfile', () =>
                    this.database.query(query, [id])
                );

                if (result.rows.length === 0) {
                    return null;
                }

                // Validate response
                const responseValidation = validateResponse(this.serviceContracts.userProfile.get.response, result.rows[0]);
                if (!responseValidation.valid) {
                    this.logger.warn('Response validation failed', { errors: responseValidation.errors });
                }

                return result.rows[0];
            });

            if (!profile) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'User profile not found'
                });
            }

            // Check authorization
            if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You do not have permission to view this profile'
                });
            }

            res.status(200).json(profile);
        } catch (error) {
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: error.message,
                    details: error.details
                });
            }
            this.logger.error('Error fetching user profile', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to fetch user profile'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const { id } = req.params;
            const { firstName, lastName, headline, summary, location, industry, profilePicture, coverPhoto, socialLinks } = req.body;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.userProfile.update.request, { ...req.body, id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: validation.errors
                });
            }

            // Verify that the user is updating their own profile or is an admin
            const profileCheck = await this.database.query(
                'SELECT user_id FROM user_profiles WHERE id = $1',
                [id]
            );

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Profile not found'
                });
            }

            if (profileCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only update your own profile'
                });
            }

            const updatedAt = new Date().toISOString();

            const query = `
        UPDATE user_profiles 
        SET first_name = $1, last_name = $2, headline = $3, summary = $4, 
            location = $5, industry = $6, profile_picture = $7, cover_photo = $8, 
            social_links = $9, updated_at = $10
        WHERE id = $11
        RETURNING id, user_id, first_name, last_name, headline, created_at, updated_at
      `;

            const values = [
                firstName, lastName, headline, summary, location, industry,
                profilePicture, coverPhoto, JSON.stringify(socialLinks || {}),
                updatedAt, id
            ];

            const result = await this.database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'User profile not found'
                });
            }

            // Invalidate cache
            this.invalidateCache(`profile:${id}`);
            if (profileCheck.rows[0]) {
                this.invalidateCache(`profile:user:${profileCheck.rows[0].user_id}`);
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error updating user profile', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to update user profile'
            });
        }
    }

    async deleteProfile(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.userProfile.get.request, { id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid profile ID',
                    details: validation.errors
                });
            }

            // Verify that the user is deleting their own profile or is an admin
            const profileCheck = await this.database.query(
                'SELECT user_id FROM user_profiles WHERE id = $1',
                [id]
            );

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Profile not found'
                });
            }

            if (profileCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only delete your own profile'
                });
            }

            // Start a transaction to delete the profile and all related data
            const client = await this.database.client;
            await client.query('BEGIN');

            try {
                // Delete skills, experiences, educations (on delete cascade in table)
                await client.query('DELETE FROM user_profiles WHERE id = $1', [id]);

                await client.query('COMMIT');

                // Invalidate cache
                this.invalidateCache(`profile:${id}`);
                if (profileCheck.rows[0]) {
                    this.invalidateCache(`profile:user:${profileCheck.rows[0].user_id}`);
                }

                res.status(200).json({ message: 'User profile deleted successfully' });
            } catch (deleteError) {
                await client.query('ROLLBACK');
                throw deleteError;
            }
        } catch (error) {
            this.logger.error('Error deleting user profile', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete user profile'
            });
        }
    }

    async getProfileByUser(req, res) {
        try {
            const { userId } = req.params;
            const cacheKey = `profile:user:${userId}`;

            const profile = await this.withCache(cacheKey, 60, async () => {
                const query = `
                SELECT 
                id, user_id, first_name, last_name, headline, summary, 
                location, industry, profile_picture, cover_photo, social_links,
                created_at, updated_at
                FROM user_profiles 
                WHERE user_id = $1
                `;

                const result = await this.traceDatabaseQuery('getProfileByUser', () =>
                    this.database.query(query, [userId])
                );

                if (result.rows.length === 0) {
                    return null;
                }

                return result.rows[0];
            });

            if (!profile) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'User profile not found'
                });
            }

            // Verify that the user is accessing their own profile or is an admin
            if (userId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You do not have permission to view this profile'
                });
            }

            res.status(200).json(profile);
        } catch (error) {
            this.logger.error('Error fetching user profile by user id', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to fetch user profile'
            });
        }
    }

    // Skills Management
    async addSkill(req, res) {
        try {
            const { id: profileId } = req.params;
            const { name, level } = req.body;
            const userId = req.user.id;

            // Verify that the user owns the profile
            const profileCheck = await this.database.query(
                'SELECT user_id FROM user_profiles WHERE id = $1',
                [profileId]
            );

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Profile not found'
                });
            }

            if (profileCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only add skills to your own profile'
                });
            }

            const skillId = uuidv4();
            const createdAt = new Date().toISOString();

            const query = `
        INSERT INTO user_skills (id, profile_id, name, level, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING id, profile_id, name, level, created_at
      `;

            const values = [skillId, profileId, name, level, createdAt];
            const result = await this.database.query(query, values);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error adding skill', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to add skill'
            });
        }
    }

    async listSkills(req, res) {
        try {
            const { id: profileId } = req.params;

            const query = `
        SELECT id, profile_id, name, level, created_at
        FROM user_skills 
        WHERE profile_id = $1
        ORDER BY created_at DESC
      `;

            const result = await this.database.query(query, [profileId]);

            const response = {
                skills: result.rows
            };

            // Validate response
            const responseValidation = validateResponse(this.serviceContracts.userProfile.listSkills.response, response);
            if (!responseValidation.valid) {
                this.logger.warn('Response validation failed', { errors: responseValidation.errors });
            }

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('Error listing skills', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to list skills'
            });
        }
    }

    async updateSkill(req, res) {
        try {
            const { skillId } = req.params;
            const { name, level } = req.body;
            const userId = req.user.id;

            // Verify that the user owns the skill
            const skillCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_skills us
        JOIN user_profiles up ON us.profile_id = up.id
        WHERE us.id = $1
      `, [skillId]);

            if (skillCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Skill not found'
                });
            }

            if (skillCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only update your own skills'
                });
            }

            const updatedAt = new Date().toISOString();

            const query = `
        UPDATE user_skills 
        SET name = $1, level = $2, updated_at = $3
        WHERE id = $4
        RETURNING id, profile_id, name, level, created_at, updated_at
      `;

            const values = [name, level, updatedAt, skillId];
            const result = await this.database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Skill not found'
                });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error updating skill', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to update skill'
            });
        }
    }

    async deleteSkill(req, res) {
        try {
            const { skillId } = req.params;
            const userId = req.user.id;

            // Verify that the user owns the skill
            const skillCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_skills us
        JOIN user_profiles up ON us.profile_id = up.id
        WHERE us.id = $1
      `, [skillId]);

            if (skillCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Skill not found'
                });
            }

            if (skillCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only delete your own skills'
                });
            }

            const query = 'DELETE FROM user_skills WHERE id = $1 RETURNING id';
            const result = await this.database.query(query, [skillId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Skill not found'
                });
            }

            res.status(200).json({ message: 'Skill deleted successfully' });
        } catch (error) {
            this.logger.error('Error deleting skill', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete skill'
            });
        }
    }

    // Experience Management (stub implementations)
    async addExperience(req, res) {
        try {
            const { id: profileId } = req.params;
            const experienceData = req.body;
            const userId = req.user.id;

            // Verify that the user owns the profile
            const profileCheck = await this.database.query(
                'SELECT user_id FROM user_profiles WHERE id = $1',
                [profileId]
            );

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Profile not found'
                });
            }

            if (profileCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only add experiences to your own profile'
                });
            }

            const experienceId = uuidv4();
            const createdAt = new Date().toISOString();

            const query = `
        INSERT INTO user_experiences (
          id, profile_id, company, title, location, start_date, end_date, 
          description, is_current, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        RETURNING id, profile_id, company, title, location, start_date, end_date, is_current, created_at
      `;

            const values = [
                experienceId, profileId, experienceData.company, experienceData.title,
                experienceData.location, experienceData.startDate, experienceData.endDate,
                experienceData.description, experienceData.isCurrent || false, createdAt
            ];

            const result = await this.database.query(query, values);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error adding experience', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to add experience'
            });
        }
    }

    async listExperiences(req, res) {
        try {
            const { id: profileId } = req.params;

            const query = `
        SELECT 
          id, profile_id, company, title, location, start_date, end_date, 
          description, is_current, created_at, updated_at
        FROM user_experiences 
        WHERE profile_id = $1
        ORDER BY start_date DESC
      `;

            const result = await this.database.query(query, [profileId]);

            res.status(200).json({
                experiences: result.rows
            });
        } catch (error) {
            this.logger.error('Error listing experiences', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to list experiences'
            });
        }
    }

    async updateExperience(req, res) {
        try {
            const { experienceId } = req.params;
            const experienceData = req.body;
            const userId = req.user.id;

            // Verify that the user owns the experience
            const experienceCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_experiences ue
        JOIN user_profiles up ON ue.profile_id = up.id
        WHERE ue.id = $1
      `, [experienceId]);

            if (experienceCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Experience not found'
                });
            }

            if (experienceCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only update your own experiences'
                });
            }

            const updatedAt = new Date().toISOString();

            const query = `
        UPDATE user_experiences 
        SET company = $1, title = $2, location = $3, start_date = $4, 
            end_date = $5, description = $6, is_current = $7, updated_at = $8
        WHERE id = $9
        RETURNING id, profile_id, company, title, location, start_date, end_date, is_current, created_at, updated_at
      `;

            const values = [
                experienceData.company, experienceData.title, experienceData.location,
                experienceData.startDate, experienceData.endDate, experienceData.description,
                experienceData.isCurrent || false, updatedAt, experienceId
            ];

            const result = await this.database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Experience not found'
                });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error updating experience', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to update experience'
            });
        }
    }

    async deleteExperience(req, res) {
        try {
            const { experienceId } = req.params;
            const userId = req.user.id;

            // Verify that the user owns the experience
            const experienceCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_experiences ue
        JOIN user_profiles up ON ue.profile_id = up.id
        WHERE ue.id = $1
      `, [experienceId]);

            if (experienceCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Experience not found'
                });
            }

            if (experienceCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only delete your own experiences'
                });
            }

            const query = 'DELETE FROM user_experiences WHERE id = $1 RETURNING id';
            const result = await this.database.query(query, [experienceId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Experience not found'
                });
            }

            res.status(200).json({ message: 'Experience deleted successfully' });
        } catch (error) {
            this.logger.error('Error deleting experience', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete experience'
            });
        }
    }

    // Education Management (stub implementations)
    async addEducation(req, res) {
        try {
            const { id: profileId } = req.params;
            const educationData = req.body;
            const userId = req.user.id;

            // Verify that the user owns the profile
            const profileCheck = await this.database.query(
                'SELECT user_id FROM user_profiles WHERE id = $1',
                [profileId]
            );

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Profile not found'
                });
            }

            if (profileCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only add education to your own profile'
                });
            }

            const educationId = uuidv4();
            const createdAt = new Date().toISOString();

            const query = `
        INSERT INTO user_educations (
          id, profile_id, institution, degree, field_of_study, start_date, 
          end_date, grade, description, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        RETURNING id, profile_id, institution, degree, field_of_study, start_date, end_date, created_at
      `;

            const values = [
                educationId, profileId, educationData.institution, educationData.degree,
                educationData.fieldOfStudy, educationData.startDate, educationData.endDate,
                educationData.grade, educationData.description, createdAt
            ];

            const result = await this.database.query(query, values);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error adding education', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to add education'
            });
        }
    }

    async listEducations(req, res) {
        try {
            const { id: profileId } = req.params;

            const query = `
        SELECT 
          id, profile_id, institution, degree, field_of_study, start_date, 
          end_date, grade, description, created_at, updated_at
        FROM user_educations 
        WHERE profile_id = $1
        ORDER BY start_date DESC
      `;

            const result = await this.database.query(query, [profileId]);

            res.status(200).json({
                educations: result.rows
            });
        } catch (error) {
            this.logger.error('Error listing educations', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to list educations'
            });
        }
    }

    async updateEducation(req, res) {
        try {
            const { educationId } = req.params;
            const educationData = req.body;
            const userId = req.user.id;

            // Verify that the user owns the education
            const educationCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_educations ue
        JOIN user_profiles up ON ue.profile_id = up.id
        WHERE ue.id = $1
      `, [educationId]);

            if (educationCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Education not found'
                });
            }

            if (educationCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only update your own education'
                });
            }

            const updatedAt = new Date().toISOString();

            const query = `
        UPDATE user_educations 
        SET institution = $1, degree = $2, field_of_study = $3, start_date = $4, 
            end_date = $5, grade = $6, description = $7, updated_at = $8
        WHERE id = $9
        RETURNING id, profile_id, institution, degree, field_of_study, start_date, end_date, created_at, updated_at
      `;

            const values = [
                educationData.institution, educationData.degree, educationData.fieldOfStudy,
                educationData.startDate, educationData.endDate, educationData.grade,
                educationData.description, updatedAt, educationId
            ];

            const result = await this.database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Education not found'
                });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error updating education', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to update education'
            });
        }
    }

    async deleteEducation(req, res) {
        try {
            const { educationId } = req.params;
            const userId = req.user.id;

            // Verify that the user owns the education
            const educationCheck = await this.database.query(`
        SELECT up.user_id 
        FROM user_educations ue
        JOIN user_profiles up ON ue.profile_id = up.id
        WHERE ue.id = $1
      `, [educationId]);

            if (educationCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Education not found'
                });
            }

            if (educationCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only delete your own education'
                });
            }

            const query = 'DELETE FROM user_educations WHERE id = $1 RETURNING id';
            const result = await this.database.query(query, [educationId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Education not found'
                });
            }

            res.status(200).json({ message: 'Education deleted successfully' });
        } catch (error) {
            this.logger.error('Error deleting education', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete education'
            });
        }
    }
}

// Start the service
const service = new UserProfileService();
service.start();

module.exports = UserProfileService;