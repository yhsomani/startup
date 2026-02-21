/**
 * TalentSphere AI Matching Service API
 * REST API for AI-powered job matching and recommendations
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const AIMatchingService = require('./ai-matching-service');

class AIMatchingAPI {
    constructor(aiMatchingService) {
        this.aiMatchingService = aiMatchingService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50, // limit each IP to 50 requests per windowMs for AI endpoints
            message: {
                error: 'Too many AI requests from this IP, please try again later.'
            }
        });

        this.app.use('/api/v1/matching', limiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const stats = this.aiMatchingService.getModelStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'ai-matching-service',
                modelStats: stats
            });
        });

        // Get job recommendations for a user
        this.app.get('/api/v1/matching/recommendations/jobs/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { threshold, limit } = req.query;

                const recommendations = await this.aiMatchingService.getJobRecommendations(userId, {
                    threshold: threshold ? parseFloat(threshold) : undefined,
                    limit: limit ? parseInt(limit) : undefined
                });

                res.json({
                    success: true,
                    data: recommendations,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting job recommendations:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get job recommendations',
                    message: error.message
                });
            }
        });

        // Get user recommendations for a job
        this.app.get('/api/v1/matching/recommendations/users/:jobId', async (req, res) => {
            try {
                const { jobId } = req.params;
                const { threshold, limit } = req.query;

                const recommendations = await this.aiMatchingService.getUserRecommendations(jobId, {
                    threshold: threshold ? parseFloat(threshold) : undefined,
                    limit: limit ? parseInt(limit) : undefined
                });

                res.json({
                    success: true,
                    data: recommendations,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting user recommendations:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user recommendations',
                    message: error.message
                });
            }
        });

        // Get collaborative recommendations for a user
        this.app.get('/api/v1/matching/recommendations/collaborative/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { limit } = req.query;

                const recommendations = await this.aiMatchingService.getCollaborativeRecommendations(userId, {
                    limit: limit ? parseInt(limit) : undefined
                });

                res.json({
                    success: true,
                    data: recommendations,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting collaborative recommendations:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get collaborative recommendations',
                    message: error.message
                });
            }
        });

        // Get hybrid recommendations for a user
        this.app.get('/api/v1/matching/recommendations/hybrid/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { threshold, limit } = req.query;

                const recommendations = await this.aiMatchingService.getHybridRecommendations(userId, {
                    threshold: threshold ? parseFloat(threshold) : undefined,
                    limit: limit ? parseInt(limit) : undefined
                });

                res.json({
                    success: true,
                    data: recommendations,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting hybrid recommendations:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get hybrid recommendations',
                    message: error.message
                });
            }
        });

        // Get recommendation explanation
        this.app.get('/api/v1/matching/explanation/:userId/:jobId', async (req, res) => {
            try {
                const { userId, jobId } = req.params;

                const explanation = await this.aiMatchingService.getRecommendationExplanation(userId, jobId);

                if (!explanation) {
                    return res.status(404).json({
                        success: false,
                        error: 'Could not generate explanation for the given user and job'
                    });
                }

                res.json({
                    success: true,
                    data: explanation,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting recommendation explanation:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get recommendation explanation',
                    message: error.message
                });
            }
        });

        // Record user interaction
        this.app.post('/api/v1/matching/interactions', async (req, res) => {
            try {
                const { userId, jobId, action, metadata } = req.body;

                if (!userId || !jobId || !action) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId, jobId, and action are required'
                    });
                }

                const interactionId = this.aiMatchingService.recordInteraction(userId, jobId, action, metadata);

                res.json({
                    success: true,
                    interactionId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error recording interaction:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to record interaction',
                    message: error.message
                });
            }
        });

        // Train the model
        this.app.post('/api/v1/matching/train', async (req, res) => {
            try {
                const { users, jobs, interactions } = req.body;

                if (!users || !jobs || !interactions) {
                    return res.status(400).json({
                        success: false,
                        error: 'users, jobs, and interactions data are required'
                    });
                }

                const result = await this.aiMatchingService.trainModel(users, jobs, interactions);

                res.json({
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error training model:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to train model',
                    message: error.message
                });
            }
        });

        // Get model statistics
        this.app.get('/api/v1/matching/stats', (req, res) => {
            try {
                const stats = this.aiMatchingService.getModelStats();

                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting model stats:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get model stats',
                    message: error.message
                });
            }
        });

        // Update user profile
        this.app.put('/api/v1/matching/profiles/user/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const profileUpdates = req.body;

                const updatedProfile = await this.aiMatchingService.updateUserProfile(userId, profileUpdates);

                res.json({
                    success: true,
                    data: updatedProfile,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error updating user profile:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update user profile',
                    message: error.message
                });
            }
        });

        // Update job profile
        this.app.put('/api/v1/matching/profiles/job/:jobId', async (req, res) => {
            try {
                const { jobId } = req.params;
                const profileUpdates = req.body;

                const updatedProfile = await this.aiMatchingService.updateJobProfile(jobId, profileUpdates);

                res.json({
                    success: true,
                    data: updatedProfile,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error updating job profile:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update job profile',
                    message: error.message
                });
            }
        });

        // Calculate match score between user and job
        this.app.post('/api/v1/matching/score', async (req, res) => {
            try {
                const { user, job } = req.body;

                if (!user || !job) {
                    return res.status(400).json({
                        success: false,
                        error: 'Both user and job objects are required'
                    });
                }

                // Create temporary profiles for calculation
                const matchResult = this.aiMatchingService.calculateMatchScore(user, job);

                res.json({
                    success: true,
                    data: {
                        matchScore: matchResult.totalScore,
                        breakdown: matchResult.breakdown,
                        user: user.id || 'temporary',
                        job: job.id || 'temporary',
                        calculatedAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Error calculating match score:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to calculate match score',
                    message: error.message
                });
            }
        });

        // Get similar users
        this.app.get('/api/v1/matching/similar-users/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { limit } = req.query;

                const similarUsers = this.aiMatchingService.findSimilarUsers(userId, parseInt(limit) || 10);

                res.json({
                    success: true,
                    data: similarUsers,
                    count: similarUsers.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error finding similar users:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to find similar users',
                    message: error.message
                });
            }
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3006) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`AI Matching API server running on port ${port}`);
                resolve();
            });
        });
    }

    /**
     * Get the express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = AIMatchingAPI;