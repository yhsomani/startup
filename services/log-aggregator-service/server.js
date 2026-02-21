/**
 * TalentSphere Log Aggregator Service Main Entry Point
 * Initializes log aggregation and API server
 */

const LogAggregatorAPI = require('./api');
const { createLogger } = require('../shared/logger');

async function startLogAggregatorService() {
    const logger = createLogger('log-aggregator-server', {
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        logLevel: process.env.LOG_LEVEL || 'info'
    });
    
    logger.info('Starting TalentSphere Log Aggregator Service...');

    // Create and start API server
    const logAggregatorAPI = new LogAggregatorAPI();
    const apiPort = process.env.LOG_AGGREGATOR_PORT || 3012;
    await logAggregatorAPI.start(apiPort);

    logger.info('Log Aggregator Service started successfully', {
        api_port: apiPort,
        environment: process.env.NODE_ENV,
        log_level: process.env.LOG_LEVEL
    });
    
    logger.info('Available endpoints:', {
        endpoints: [
            'GET  /health - Health check',
            'POST /api/v1/logs - Ingest logs',
            'GET  /api/v1/logs/stats - Get aggregation statistics',
            'GET  /api/v1/logs/search - Search logs',
            'GET  /api/v1/logs/service/:serviceName - Get service logs',
            'GET  /api/v1/logs/level/:level - Get logs by level',
            'POST /api/v1/logs/flush - Manual flush',
            'POST /api/v1/logs/cleanup - Trigger cleanup',
            'GET  /api/v1/logs/export - Export logs'
        ]
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        logger.info('Shutting down log aggregator service...', { signal: 'SIGINT' });
        logAggregatorAPI.stop().then(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
        logger.info('Shutting down log aggregator service...', { signal: 'SIGTERM' });
        logAggregatorAPI.stop().then(() => process.exit(0));
    });
}

// If this file is run directly, start service
if (require.main === module) {
    startLogAggregatorService().catch(error => {
        console.error('Failed to start log aggregator service:', error);
        process.exit(1);
    });
}

module.exports = {
    LogAggregatorAPI,
    startLogAggregatorService
};