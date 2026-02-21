/**
 * Search Service - Main Entry Point
 * Enhanced search with Elasticsearch integration
 */

const EnhancedSearchService = require("./index-database");

// Initialize and start service
const searchService = new EnhancedSearchService();
searchService.start();

module.exports = searchService;
