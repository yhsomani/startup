/**
 * Job Listing Service - Main Entry Point
 * Enhanced job listing management with database integration
 */

const JobListingService = require("./enhanced-index");

// Initialize and start service
const jobListingService = new JobListingService();
jobListingService.start();

module.exports = jobListingService;
