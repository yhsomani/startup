/**
 * Simple Logger for API Gateway
 */

const createLogger = serviceName => {
    return {
        info: (message, meta = {}) => {
            console.log(`[INFO] ${serviceName}: ${message}`, meta);
        },
        error: (message, meta = {}) => {
            console.error(`[ERROR] ${serviceName}: ${message}`, meta);
        },
        warn: (message, meta = {}) => {
            console.warn(`[WARN] ${serviceName}: ${message}`, meta);
        },
        debug: (message, meta = {}) => {
            console.debug(`[DEBUG] ${serviceName}: ${message}`, meta);
        },
    };
};

module.exports = {
    createLogger,
};
