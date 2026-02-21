/**
 * TalentSphere Shared Services Entry Point
 * Provides shared utilities and common functionality
 */

const { createLogger } = require('./index');
const path = require('path');

// Try to load config-manager with proper path resolution
let createConfig;
try {
    createConfig = require(path.join(__dirname, 'config-manager'));
    if (typeof createConfig === 'function') {
        createConfig = createConfig.createConfig;
    }
} catch (error) {
    console.warn('Could not load config-manager, using fallback');
    createConfig = (options = {}) => ({ ...options, env: process.env.NODE_ENV || 'development' });
}

const logger = createLogger('shared-services');
const packageJson = require('./package.json');

logger.info('Starting TalentSphere shared services', {
    version: packageJson.version,
    nodeVersion: process.version,
    platform: process.platform
});

// Health check endpoint for the shared services
const healthCheck = {
    status: 'healthy',
    service: 'shared-services',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    modules: [
        'logger',
        'config-manager',
        'test-helpers'
    ]
};

// Export all shared modules for easy access
module.exports = {
    ...require('./index'),
    healthCheck,
    
    // Service information
    getServiceInfo: () => ({
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        modules: Object.keys(require('./index'))
    })
};