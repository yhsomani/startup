/**
 * User Profile Service - Main Entry Point
 * Enhanced user profile management with database integration
 */

const UserProfileService = require("./enhanced-index");

// Initialize and start service
const userProfileService = new UserProfileService();
userProfileService.start();

module.exports = userProfileService;
