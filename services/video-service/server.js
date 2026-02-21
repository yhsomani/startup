/**
 * TalentSphere Video Interview Service Main Entry Point
 * Initializes video interview service and starts API server
 */

const VideoInterviewService = require('./video-interview-service');
const VideoInterviewAPI = require('./api');

async function startVideoInterviewService() {
    console.log('Starting TalentSphere Video Interview Service...');

    // Create video interview service instance
    const videoInterviewService = new VideoInterviewService({
        videoPlatform: process.env.VIDEO_PLATFORM || 'jitsi',
        jitsiConfig: {
            baseUrl: process.env.JITSI_BASE_URL || 'https://meet.jit.si',
            apiKey: process.env.JITSI_API_KEY,
            secret: process.env.JITSI_SECRET
        },
        zoomConfig: {
            apiKey: process.env.ZOOM_API_KEY,
            apiSecret: process.env.ZOOM_API_SECRET,
            accountId: process.env.ZOOM_ACCOUNT_ID
        },
        googleMeetConfig: {
            apiKey: process.env.GOOGLE_MEET_API_KEY,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },
        email: {
            enabled: process.env.EMAIL_ENABLED === 'true',
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            smtpUser: process.env.SMTP_USER,
            smtpPassword: process.env.SMTP_PASSWORD,
            fromEmail: process.env.FROM_EMAIL || 'noreply@talentsphere.com'
        },
        defaultMeetingSettings: {
            duration: process.env.DEFAULT_MEETING_DURATION ? parseInt(process.env.DEFAULT_MEETING_DURATION) : 60,
            autoRecording: process.env.AUTO_RECORDING === 'true',
            waitingRoom: process.env.WAITING_ROOM_ENABLED !== 'false',
            muteParticipantsUponEntry: process.env.MUTE_UPON_ENTRY === 'true'
        }
    });

    try {
        // Create and start API server
        const videoInterviewAPI = new VideoInterviewAPI(videoInterviewService);
        const apiPort = process.env.VIDEO_API_PORT || 3007;
        await videoInterviewAPI.start(apiPort);

        console.log(`✅ Video Interview Service started successfully`);
        console.log(`✅ API server on port ${apiPort}`);
        console.log(`✅ Video platform: ${videoInterviewService.options.videoPlatform}`);
        console.log(`✅ Email notifications: ${videoInterviewService.options.email.enabled ? 'enabled' : 'disabled'}`);
        console.log(`✅ Default meeting duration: ${videoInterviewService.options.defaultMeetingSettings.duration} minutes`);
        console.log(`✅ Waiting room: ${videoInterviewService.options.defaultMeetingSettings.waitingRoom ? 'enabled' : 'disabled'}`);
        console.log(`✅ Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   POST /api/v1/interviews - Create interview`);
        console.log(`   GET  /api/v1/interviews/:id - Get interview`);
        console.log(`   PUT  /api/v1/interviews/:id - Update interview`);
        console.log(`   DELETE /api/v1/interviews/:id - Cancel interview`);
        console.log(`   POST /api/v1/interviews/:id/start - Start interview`);
        console.log(`   POST /api/v1/interviews/:id/complete - Complete interview`);
        console.log(`   GET  /api/v1/interviews/user/:userId - Get user interviews`);
        console.log(`   GET  /api/v1/interviews/status/:status - Get interviews by status`);
        console.log(`   GET  /api/v1/interviews/upcoming - Get upcoming interviews`);
        console.log(`   GET  /api/v1/interviews/:id/participants/:pid/status - Get participant status`);
        console.log(`   POST /api/v1/interviews/:id/participants/:pid/join - Mark participant joined`);
        console.log(`   POST /api/v1/interviews/:id/participants/:pid/leave - Mark participant left`);
        console.log(`   GET  /api/v1/interviews/stats - Get statistics`);
        console.log(`   GET  /api/v1/interviews/availability/:userId - Get user availability`);
        console.log(`   POST /api/v1/interviews/availability/mutual - Find mutual availability`);
        console.log(`   GET  /api/v1/interviews/:id/calendar-invite - Generate calendar invite`);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down video interview service...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\nShutting down video interview service...');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start video interview service:', error);
        process.exit(1);
    }
}

// If this file is run directly, start the service
if (require.main === module) {
    startVideoInterviewService().catch(error => {
        console.error('Failed to start video interview service:', error);
        process.exit(1);
    });
}

module.exports = {
    VideoInterviewService,
    VideoInterviewAPI,
    startVideoInterviewService
};