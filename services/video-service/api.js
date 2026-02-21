/**
 * TalentSphere Video Interview Service API
 * REST API for video interview scheduling and management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const VideoInterviewService = require('./video-interview-service');

class VideoInterviewAPI {
    constructor(videoInterviewService) {
        this.videoInterviewService = videoInterviewService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.'
            }
        });

        this.app.use(limiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const stats = this.videoInterviewService.getStatistics();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'video-interview-service',
                statistics: stats
            });
        });

        // Create a new interview
        this.app.post('/api/v1/interviews', async (req, res) => {
            try {
                const interviewData = req.body;

                if (!interviewData.jobId || !interviewData.applicantId || !interviewData.interviewerId || !interviewData.scheduledTime) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields: jobId, applicantId, interviewerId, scheduledTime'
                    });
                }

                const interview = await this.videoInterviewService.createInterview(interviewData);

                res.json({
                    success: true,
                    data: interview,
                    message: 'Interview created successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error creating interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create interview',
                    message: error.message
                });
            }
        });

        // Get interview by ID
        this.app.get('/api/v1/interviews/:interviewId', (req, res) => {
            try {
                const { interviewId } = req.params;

                const interview = this.videoInterviewService.getInterview(interviewId);

                res.json({
                    success: true,
                    data: interview,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get interview',
                    message: error.message
                });
            }
        });

        // Update interview
        this.app.put('/api/v1/interviews/:interviewId', async (req, res) => {
            try {
                const { interviewId } = req.params;
                const updateData = req.body;

                const interview = await this.videoInterviewService.updateInterview(interviewId, updateData);

                res.json({
                    success: true,
                    data: interview,
                    message: 'Interview updated successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error updating interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update interview',
                    message: error.message
                });
            }
        });

        // Cancel interview
        this.app.delete('/api/v1/interviews/:interviewId', async (req, res) => {
            try {
                const { interviewId } = req.params;
                const { cancellationReason } = req.body;

                const interview = await this.videoInterviewService.cancelInterview(interviewId, cancellationReason);

                res.json({
                    success: true,
                    data: interview,
                    message: 'Interview cancelled successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error cancelling interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to cancel interview',
                    message: error.message
                });
            }
        });

        // Start interview
        this.app.post('/api/v1/interviews/:interviewId/start', async (req, res) => {
            try {
                const { interviewId } = req.params;

                const interview = await this.videoInterviewService.startInterview(interviewId);

                res.json({
                    success: true,
                    data: interview,
                    message: 'Interview started successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error starting interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to start interview',
                    message: error.message
                });
            }
        });

        // Complete interview
        this.app.post('/api/v1/interviews/:interviewId/complete', async (req, res) => {
            try {
                const { interviewId } = req.params;

                const interview = await this.videoInterviewService.completeInterview(interviewId);

                res.json({
                    success: true,
                    data: interview,
                    message: 'Interview completed successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error completing interview:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to complete interview',
                    message: error.message
                });
            }
        });

        // Get interviews for a user
        this.app.get('/api/v1/interviews/user/:userId', (req, res) => {
            try {
                const { userId } = req.params;
                const { role } = req.query;

                const interviews = this.videoInterviewService.getUserInterviews(userId, role);

                res.json({
                    success: true,
                    data: interviews,
                    count: interviews.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting user interviews:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user interviews',
                    message: error.message
                });
            }
        });

        // Get interviews by status
        this.app.get('/api/v1/interviews/status/:status', (req, res) => {
            try {
                const { status } = req.params;

                const interviews = this.videoInterviewService.getInterviewsByStatus(status);

                res.json({
                    success: true,
                    data: interviews,
                    count: interviews.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting interviews by status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get interviews by status',
                    message: error.message
                });
            }
        });

        // Get upcoming interviews
        this.app.get('/api/v1/interviews/upcoming', (req, res) => {
            try {
                const { hours } = req.query;

                const interviews = this.videoInterviewService.getUpcomingInterviews(parseInt(hours) || 24);

                res.json({
                    success: true,
                    data: interviews,
                    count: interviews.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting upcoming interviews:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get upcoming interviews',
                    message: error.message
                });
            }
        });

        // Get participant status
        this.app.get('/api/v1/interviews/:interviewId/participants/:participantId/status', (req, res) => {
            try {
                const { interviewId, participantId } = req.params;

                const status = this.videoInterviewService.getParticipantStatus(interviewId, participantId);

                res.json({
                    success: true,
                    data: status,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting participant status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get participant status',
                    message: error.message
                });
            }
        });

        // Mark participant as joined
        this.app.post('/api/v1/interviews/:interviewId/participants/:participantId/join', (req, res) => {
            try {
                const { interviewId, participantId } = req.params;

                const status = this.videoInterviewService.markParticipantJoined(interviewId, participantId);

                res.json({
                    success: true,
                    data: status,
                    message: 'Participant marked as joined',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error marking participant as joined:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to mark participant as joined',
                    message: error.message
                });
            }
        });

        // Mark participant as left
        this.app.post('/api/v1/interviews/:interviewId/participants/:participantId/leave', (req, res) => {
            try {
                const { interviewId, participantId } = req.params;

                const status = this.videoInterviewService.markParticipantLeft(interviewId, participantId);

                res.json({
                    success: true,
                    data: status,
                    message: 'Participant marked as left',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error marking participant as left:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to mark participant as left',
                    message: error.message
                });
            }
        });

        // Get interview statistics
        this.app.get('/api/v1/interviews/stats', (req, res) => {
            try {
                const stats = this.videoInterviewService.getStatistics();

                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting interview stats:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get interview statistics',
                    message: error.message
                });
            }
        });

        // Get user availability
        this.app.get('/api/v1/interviews/availability/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { startDate, endDate } = req.query;

                if (!startDate || !endDate) {
                    return res.status(400).json({
                        success: false,
                        error: 'startDate and endDate are required'
                    });
                }

                const availability = await this.videoInterviewService.getUserAvailability(
                    userId,
                    startDate,
                    endDate
                );

                res.json({
                    success: true,
                    data: availability,
                    count: availability.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting user availability:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user availability',
                    message: error.message
                });
            }
        });

        // Find mutual availability
        this.app.post('/api/v1/interviews/availability/mutual', async (req, res) => {
            try {
                const { userIds, startDate, endDate } = req.body;

                if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
                    return res.status(400).json({
                        success: false,
                        error: 'userIds array with at least 2 users is required'
                    });
                }

                if (!startDate || !endDate) {
                    return res.status(400).json({
                        success: false,
                        error: 'startDate and endDate are required'
                    });
                }

                const availability = await this.videoInterviewService.findMutualAvailability(
                    userIds,
                    startDate,
                    endDate
                );

                res.json({
                    success: true,
                    data: availability,
                    count: availability.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error finding mutual availability:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to find mutual availability',
                    message: error.message
                });
            }
        });

        // Generate calendar invite
        this.app.get('/api/v1/interviews/:interviewId/calendar-invite', (req, res) => {
            try {
                const { interviewId } = req.params;

                const interview = this.videoInterviewService.getInterview(interviewId);
                const calendarInvite = this.videoInterviewService.generateCalendarInvite(interview);

                res.set('Content-Type', 'text/calendar');
                res.set('Content-Disposition', `attachment; filename="interview-${interviewId}.ics"`);
                res.send(calendarInvite);
            } catch (error) {
                console.error('Error generating calendar invite:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate calendar invite',
                    message: error.message
                });
            }
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3007) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`Video Interview API server running on port ${port}`);
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

module.exports = VideoInterviewAPI;