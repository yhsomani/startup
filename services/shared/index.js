/**
 * TalentSphere Shared Services
 * Common utilities and shared functionality across all services
 */

// Core logging utility - always available
const { createLogger } = require('./logger');

// Try to load config-manager, fallback if not available
let createConfig, validateAll;
try {
    const configManager = require('./config-manager');
    createConfig = configManager.createConfig || (() => ({}));
    validateAll = configManager.validateAll || (() => ({}));
} catch (error) {
    // Fallback implementations if config-manager isn't available
    createConfig = (options = {}) => ({ ...options, env: process.env.NODE_ENV || 'development' });
    validateAll = () => ({ isValid: true, errors: [], warnings: [] });
}

module.exports = {
  // Logging utilities
  createLogger,
  
  // Configuration management
  createConfig,
  validateAll,
  
  // Common service utilities
  createHealthCheck: (serviceName) => ({
    status: 'healthy',
    service: serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('../../package.json').version
  }),
  
  // Error handling utilities
  createErrorResponse: (message, code = 500, details = null) => ({
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  }),
  
  // Response formatting utilities
  createSuccessResponse: (data, message = 'Success') => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }),
  
  // Validation utilities
  validateRequest: (schema, data) => {
    const { error, value } = schema.validate(data);
    if (error) {
      return {
        isValid: false,
        errors: error.details
      };
    }
    return {
      isValid: true,
      value
    };
  }
};