/**
 * TalentSphere API Gateway
 * 
 * This is the canonical API gateway implementation.
 * Use enhanced-gateway.js for production (has circuit breaker, health monitoring).
 * Use index.js for simple development setups.
 * 
 * Consolidated from:
 * - index.js (basic routing)
 * - enhanced-gateway.js (production features)
 * - gateway-with-tracing.js (distributed tracing)
 * - index-updated.js (experimental)
 */

// CANONICAL ENTRY: enhanced-gateway.js
// This file documents the consolidation decision.
// For production: node enhanced-gateway.js
// For development: node index.js (simpler, faster startup)

module.exports = {
    CANONICAL: 'enhanced-gateway.js',
    SIMPLE: 'index.js',
    DEPRECATED: ['gateway-with-tracing.js', 'index-updated.js'],

    // Feature comparison
    features: {
        'enhanced-gateway.js': {
            circuitBreaker: true,
            healthMonitoring: true,
            serviceRegistry: true,
            tracing: true,
            rateLimit: true,
            recommended: true
        },
        'index.js': {
            circuitBreaker: false,
            healthMonitoring: false,
            serviceRegistry: false,
            tracing: false,
            rateLimit: true,
            recommended: 'development-only'
        }
    }
};
