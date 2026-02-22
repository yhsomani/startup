/**
 * TalentSphere Logger - Unified Logging
 *
 * This module re-exports from the canonical logger in /shared
 * to maintain a single source of truth for logging functionality.
 */

const { createLogger, performanceMonitor } = require("../../shared/logger");

module.exports = {
    createLogger,
    performanceMonitor,
};
