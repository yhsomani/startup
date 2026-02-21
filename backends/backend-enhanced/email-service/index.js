/**
 * Email Service - Main Entry Point
 * Enhanced email management with database integration
 */

const EnhancedEmailService = require("./enhanced-index");

// Initialize and start the service
const emailService = new EnhancedEmailService();
emailService.start();

module.exports = emailService;
