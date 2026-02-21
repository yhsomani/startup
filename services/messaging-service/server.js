/**
 * TalentSphere Messaging Service Main Entry Point
 * Initializes messaging service and starts API server
 */

const MessagingService = require('./messaging-service');
const MessagingAPI = require('./api');

async function startMessagingService() {
    console.log('Starting TalentSphere Messaging Service...');

    // Create messaging service instance
    const messagingService = new MessagingService({
        port: process.env.MESSAGING_WS_PORT || 8081,
        maxPayload: process.env.MESSAGING_MAX_PAYLOAD ? parseInt(process.env.MESSAGING_MAX_PAYLOAD) : 1024 * 1024, // 1MB
        messageRetentionDays: process.env.MESSAGE_RETENTION_DAYS ? parseInt(process.env.MESSAGE_RETENTION_DAYS) : 30,
        maxMessageLength: process.env.MAX_MESSAGE_LENGTH ? parseInt(process.env.MAX_MESSAGE_LENGTH) : 10000, // 10KB
        enableAttachments: process.env.ENABLE_ATTACHMENTS === 'true',
        maxAttachmentSize: process.env.MAX_ATTACHMENT_SIZE ? parseInt(process.env.MAX_ATTACHMENT_SIZE) : 10 * 1024 * 1024 // 10MB
    });

    // Initialize WebSocket server
    await messagingService.initialize();

    // Create and start API server
    const messagingAPI = new MessagingAPI(messagingService);
    const apiPort = process.env.MESSAGING_API_PORT || 3008;
    await messagingAPI.start(apiPort);

    console.log(`✅ Messaging Service started successfully`);
    console.log(`✅ WebSocket server on port ${process.env.MESSAGING_WS_PORT || 8081}`);
    console.log(`✅ REST API server on port ${apiPort}`);
    console.log(`✅ Message retention: ${messagingService.options.messageRetentionDays} days`);
    console.log(`✅ Max message length: ${messagingService.options.maxMessageLength} characters`);
    console.log(`✅ Attachments enabled: ${messagingService.options.enableAttachments}`);
    console.log(`✅ Max attachment size: ${messagingService.options.maxAttachmentSize} bytes`);
    console.log(`✅ Available endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   GET  /api/v1/conversations - Get user conversations`);
    console.log(`   GET  /api/v1/conversations/:id/messages - Get conversation messages`);
    console.log(`   POST /api/v1/messages - Send message`);
    console.log(`   POST /api/v1/conversations/direct - Create direct conversation`);
    console.log(`   POST /api/v1/conversations/group - Create group conversation`);
    console.log(`   GET  /api/v1/messages/unread-count/:userId - Get unread count`);
    console.log(`   PUT  /api/v1/messages/mark-as-read - Mark messages as read`);
    console.log(`   GET  /api/v1/messages/search - Search messages`);
    console.log(`   GET  /api/v1/websocket-info - Get WebSocket connection info`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down messaging service...');
        await messagingService.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nShutting down messaging service...');
        await messagingService.close();
        process.exit(0);
    });
}

// If this file is run directly, start the service
if (require.main === module) {
    startMessagingService().catch(error => {
        console.error('Failed to start messaging service:', error);
        process.exit(1);
    });
}

module.exports = {
    MessagingService,
    MessagingAPI,
    startMessagingService
};