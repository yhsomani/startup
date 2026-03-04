/**
 * Health Check - Re-export from comprehensive health-checks
 * 
 * This module re-exports from the canonical health-checks.js
 * to maintain a single source of truth for health check functionality.
 */

const { HealthCheck, HealthChecker, createHealthCheckMiddleware } = require('./health-checks');

module.exports = {
    HealthCheck,
    HealthChecker,
    createHealthCheckMiddleware,
};
