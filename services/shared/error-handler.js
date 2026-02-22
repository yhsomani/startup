/**
 * TalentSphere Error Handling - Unified Module
 *
 * This module re-exports from the canonical error handler in /backends/shared
 * to maintain a single source of truth for error handling.
 */

const errorHandler = require("../../backends/shared/error-handler");

module.exports = {
    ...errorHandler,
    createErrorHandler: errorHandler.createErrorHandler,
    asyncHandler: errorHandler.asyncHandler,
    AppError: errorHandler.AppError,
    ValidationError: errorHandler.ValidationError,
    AuthenticationError: errorHandler.AuthenticationError,
    AuthorizationError: errorHandler.AuthorizationError,
    NotFoundError: errorHandler.NotFoundError,
    ErrorHandler: errorHandler.ErrorHandler,
};
