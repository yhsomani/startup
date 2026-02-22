/**
 * API Response Wrapper
 *
 * Standardized response format for all API endpoints.
 */

class ApiResponse {
    static success(data, meta = {}) {
        return {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };
    }

    static created(data, location = null) {
        return {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                location,
            },
        };
    }

    static paginated(data, pagination) {
        return {
            success: true,
            data,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                total: pagination.total || 0,
                totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static error(message, code = "ERROR", details = null) {
        return {
            success: false,
            error: {
                code,
                message,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static validationError(errors) {
        return {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: errors,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static notFound(resource) {
        return {
            success: false,
            error: {
                code: "NOT_FOUND",
                message: `${resource} not found`,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static unauthorized(message = "Unauthorized") {
        return {
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static forbidden(message = "Forbidden") {
        return {
            success: false,
            error: {
                code: "FORBIDDEN",
                message,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    static tooManyRequests(retryAfter = 60) {
        return {
            success: false,
            error: {
                code: "RATE_LIMITED",
                message: "Too many requests",
            },
            meta: {
                timestamp: new Date().toISOString(),
                retryAfter,
            },
        };
    }
}

const responseMiddleware = (req, res, next) => {
    res.apiSuccess = (data, meta) => res.json(ApiResponse.success(data, meta));
    res.apiCreated = (data, location) => res.status(201).json(ApiResponse.created(data, location));
    res.apiPaginated = (data, pagination) => res.json(ApiResponse.paginated(data, pagination));
    res.apiError = (message, code, details) =>
        res.status(400).json(ApiResponse.error(message, code, details));
    res.apiValidationError = errors => res.status(400).json(ApiResponse.validationError(errors));
    res.apiNotFound = resource => res.status(404).json(ApiResponse.notFound(resource));
    res.apiUnauthorized = message => res.status(401).json(ApiResponse.unauthorized(message));
    res.apiForbidden = message => res.status(403).json(ApiResponse.forbidden(message));
    res.apiTooManyRequests = retryAfter =>
        res.status(429).json(ApiResponse.tooManyRequests(retryAfter));
    next();
};

module.exports = {
    ApiResponse,
    responseMiddleware,
};
