/**
 * TalentSphere Notification Service Main Entry Point
 * Sets up both WebSocket server and REST API with Service Discovery integration
 */

const NotificationService = require("./index");
const NotificationAPI = require("./api");
const { createServiceRegistry } = require("../shared/service-registry");

async function startNotificationService() {
    console.log("Starting TalentSphere Notification Service...");

    // Initialize Service Registry
    const serviceRegistry = createServiceRegistry("notification-service", {
        port: process.env.NOTIFICATION_API_PORT || 3005,
        version: "1.0.0",
        tags: ["notifications", "websocket", "real-time"],
        metadata: {
            description: "Real-time notification service with WebSocket support",
            features: ["websocket", "real-time", "push-notifications", "multi-tenant"],
            wsPort: process.env.NOTIFICATION_WS_PORT || 8080,
        },
        healthCheckPath: "/health",
    });

    // Initialize service registration
    await serviceRegistry.initialize();

    // Create notification service instance
    const notificationService = new NotificationService({
        port: process.env.NOTIFICATION_WS_PORT || 8080,
    });

    // Initialize WebSocket server
    await notificationService.initialize();

    // Create and start API server
    const notificationAPI = new NotificationAPI(notificationService, serviceRegistry);
    const apiPort = process.env.NOTIFICATION_API_PORT || 3005;
    await notificationAPI.start(apiPort);

    // Update service metadata with actual ports
    await serviceRegistry.updateMetadata({
        wsPort: process.env.NOTIFICATION_WS_PORT || 8080,
        apiPort: apiPort,
        websocketEndpoint: `ws://localhost:${process.env.NOTIFICATION_WS_PORT || 8080}/ws/notifications`,
        status: "running",
    });

    console.log(`✅ Notification Service started successfully`);
    console.log(
        `✅ Service Registry: ${serviceRegistry.getInstanceInfo().isRegistered ? "Registered" : "Offline"}`
    );
    console.log(`✅ WebSocket server on port ${process.env.NOTIFICATION_WS_PORT || 8080}`);
    console.log(`✅ REST API server on port ${apiPort}`);
    console.log(
        `✅ WebSocket endpoint: ws://localhost:${process.env.NOTIFICATION_WS_PORT || 8080}/ws/notifications`
    );
    console.log(`✅ Service Instance ID: ${serviceRegistry.getInstanceInfo().instanceId}`);

    // Handle graceful shutdown
    const gracefulShutdown = async signal => {
        console.log(`\nReceived ${signal}, shutting down notification service...`);

        try {
            await notificationService.close();
            await serviceRegistry.shutdown();
            console.log("✅ Service shut down gracefully");
            process.exit(0);
        } catch (error) {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
        }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

// If this file is run directly, start the service
if (require.main === module) {
    startNotificationService().catch(error => {
        console.error("Failed to start notification service:", error);
        process.exit(1);
    });
}

module.exports = {
    NotificationService,
    NotificationAPI,
    startNotificationService,
};
