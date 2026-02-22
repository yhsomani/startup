/**
 * Authentication and Authorization Middleware
 *
 * Comprehensive authentication system with JWT validation,
 * session management, and role-based access control
 */

const { createLogger } = require("../../shared/enhanced-logger");
const { AuthenticationError, AuthorizationError } = require("./error-handler");

class AuthMiddleware {
    constructor(securityManager, options = {}) {
        this.securityManager = securityManager;
        this.logger = createLogger("AuthMiddleware");

        // JWT token cache for performance
        this.tokenCache = new Map();
        this.tokenCacheTTL = options.tokenCacheTTL || 300000; // 5 minutes default

        // Role hierarchy (higher number = more permissions)
        this.roleHierarchy = {
            guest: 0,
            user: 1,
            moderator: 2,
            admin: 3,
            super_admin: 4,
        };

        // Permission sets for different roles
        this.rolePermissions = {
            guest: ["read:public"],
            user: ["read:public", "read:own", "create:own", "update:own", "delete:own"],
            moderator: [
                "read:public",
                "read:own",
                "create:own",
                "update:own",
                "delete:own",
                "read:all",
                "moderate:content",
            ],
            admin: [
                "read:public",
                "read:own",
                "create:own",
                "update:own",
                "delete:own",
                "read:all",
                "create:all",
                "update:all",
                "delete:all",
                "manage:users",
                "manage:content",
            ],
            super_admin: ["*"], // All permissions
        };
    }

    /**
     * Get cached token or verify and cache it
     */
    async getCachedToken(token, options = {}) {
        // Create a hash of the token for cache key
        const crypto = require("crypto");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Check cache first
        const cached = this.tokenCache.get(tokenHash);
        if (cached && cached.exp * 1000 > Date.now()) {
            this.logger.debug("Token served from cache");
            return cached;
        }

        // Verify token
        const decoded = this.securityManager.verifyToken(token, options);

        // Cache the result
        this.tokenCache.set(tokenHash, decoded);

        // Clean up old entries periodically
        if (this.tokenCache.size > 1000) {
            this.cleanTokenCache();
        }

        return decoded;
    }

    /**
     * Clean expired entries from token cache
     */
    cleanTokenCache() {
        const now = Date.now();
        for (const [key, value] of this.tokenCache.entries()) {
            if (value.exp * 1000 < now) {
                this.tokenCache.delete(key);
            }
        }
    }

    /**
     * Main authentication middleware
     */
    authenticate(options = {}) {
        return async (req, res, next) => {
            try {
                // Skip authentication for specified paths
                if (this.shouldSkipAuth(req.path, options.skipPaths)) {
                    return next();
                }

                // Extract token from various sources
                const token = this.extractToken(req);

                if (!token) {
                    throw new AuthenticationError("No authentication token provided");
                }

                // Verify token (with caching)
                const decoded = await this.getCachedToken(token, {
                    correlationId: req.correlationId,
                });

                // Check if token is expired
                if (this.isTokenExpired(decoded)) {
                    throw new AuthenticationError("Token has expired", {
                        code: "TOKEN_EXPIRED",
                    });
                }

                // Attach user info to request
                req.user = {
                    id: decoded.sub || decoded.id,
                    email: decoded.email,
                    role: decoded.role || "user",
                    permissions:
                        decoded.permissions || this.rolePermissions[decoded.role || "user"],
                    sessionId: decoded.sessionId,
                    issuedAt: decoded.iat,
                    expiresAt: decoded.exp,
                    issuer: decoded.iss,
                    audience: decoded.aud,
                };

                req.authTime = Date.now();
                req.tokenType = this.getTokenType(req);

                this.logger.debug("Authentication successful", {
                    correlationId: req.correlationId,
                    userId: req.user.id,
                    role: req.user.role,
                    tokenType: req.tokenType,
                });

                next();
            } catch (error) {
                this.logger.warn("Authentication failed", {
                    correlationId: req.correlationId,
                    error: error.message,
                    path: req.path,
                    ip: req.ip,
                });

                const authError =
                    error instanceof AuthenticationError
                        ? error
                        : new AuthenticationError("Invalid authentication token");

                return res.status(401).json({
                    error: authError.code,
                    message: authError.message,
                    correlationId: req.correlationId,
                });
            }
        };
    }

    /**
     * Authorization middleware based on roles
     */
    authorize(requiredRoles = [], requireAll = false) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AuthenticationError("User not authenticated");
                }

                const userRole = req.user.role;
                const userRoleLevel = this.roleHierarchy[userRole] || 0;

                // Check role-based authorization
                const hasRequiredRole = requireAll
                    ? requiredRoles.every(role => this.roleHierarchy[role] <= userRoleLevel)
                    : requiredRoles.some(role => this.roleHierarchy[role] <= userRoleLevel);

                if (!hasRequiredRole) {
                    this.logger.warn("Authorization failed - insufficient role", {
                        correlationId: req.correlationId,
                        userId: req.user.id,
                        userRole,
                        requiredRoles,
                        requireAll,
                    });

                    throw new AuthorizationError("Insufficient permissions for this action", {
                        requiredRoles,
                        userRole,
                    });
                }

                this.logger.debug("Authorization successful", {
                    correlationId: req.correlationId,
                    userId: req.user.id,
                    userRole,
                    requiredRoles,
                });

                next();
            } catch (error) {
                this.logger.warn("Authorization failed", {
                    correlationId: req.correlationId,
                    error: error.message,
                    userId: req.user?.id,
                });

                const authError =
                    error instanceof AuthorizationError
                        ? error
                        : new AuthorizationError("Authorization failed");

                return res.status(403).json({
                    error: authError.code,
                    message: authError.message,
                    correlationId: req.correlationId,
                });
            }
        };
    }

    /**
     * Permission-based authorization
     */
    requirePermission(requiredPermission) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AuthenticationError("User not authenticated");
                }

                const userPermissions = req.user.permissions || [];

                // Check for wildcard permission
                if (userPermissions.includes("*")) {
                    return next();
                }

                // Check for specific permission
                if (!userPermissions.includes(requiredPermission)) {
                    this.logger.warn("Authorization failed - insufficient permission", {
                        correlationId: req.correlationId,
                        userId: req.user.id,
                        userPermissions,
                        requiredPermission,
                    });

                    throw new AuthorizationError(
                        `Permission '${requiredPermission}' is required for this action`,
                        {
                            requiredPermission,
                            userPermissions,
                        }
                    );
                }

                this.logger.debug("Permission check successful", {
                    correlationId: req.correlationId,
                    userId: req.user.id,
                    requiredPermission,
                });

                next();
            } catch (error) {
                const authError =
                    error instanceof AuthorizationError
                        ? error
                        : new AuthorizationError("Permission check failed");

                return res.status(403).json({
                    error: authError.code,
                    message: authError.message,
                    correlationId: req.correlationId,
                });
            }
        };
    }

    /**
     * Resource ownership verification
     */
    requireOwnership(resourceIdParam = "id", resourceType = "resource") {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AuthenticationError("User not authenticated");
                }

                const resourceId = req.params[resourceIdParam];
                const userId = req.user.id;

                if (!resourceId) {
                    throw new Error(`Resource ID parameter '${resourceIdParam}' not found`);
                }

                // Check if user is admin or super admin (can access any resource)
                if (["admin", "super_admin"].includes(req.user.role)) {
                    return next();
                }

                // Check if user owns the resource
                const isOwner = await this.checkResourceOwnership(
                    resourceType,
                    resourceId,
                    userId,
                    req
                );

                if (!isOwner) {
                    this.logger.warn("Ownership check failed", {
                        correlationId: req.correlationId,
                        userId,
                        resourceType,
                        resourceId,
                    });

                    throw new AuthorizationError(`You don't own this ${resourceType}`, {
                        resourceType,
                        resourceId,
                        userId,
                    });
                }

                this.logger.debug("Ownership verified", {
                    correlationId: req.correlationId,
                    userId,
                    resourceType,
                    resourceId,
                });

                next();
            } catch (error) {
                const authError =
                    error instanceof AuthorizationError
                        ? error
                        : new AuthorizationError("Ownership verification failed");

                return res.status(403).json({
                    error: authError.code,
                    message: authError.message,
                    correlationId: req.correlationId,
                });
            }
        };
    }

    /**
     * Extract token from request
     */
    extractToken(req) {
        // Check Authorization header (Bearer token)
        const authHeader = req.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Check X-API-Key header
        const apiKey = req.get("X-API-Key");
        if (apiKey) {
            return apiKey;
        }

        // Check query parameter (for specific use cases)
        if (req.query.token && typeof req.query.token === "string") {
            return req.query.token;
        }

        // Check cookie
        if (req.cookies && req.cookies.auth_token) {
            return req.cookies.auth_token;
        }

        return null;
    }

    /**
     * Get token type based on extraction source
     */
    getTokenType(req) {
        const authHeader = req.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            return "Bearer";
        }

        if (req.get("X-API-Key")) {
            return "API-Key";
        }

        if (req.query.token) {
            return "Query";
        }

        if (req.cookies && req.cookies.auth_token) {
            return "Cookie";
        }

        return "Unknown";
    }

    /**
     * Check if token should be skipped for this path
     */
    shouldSkipAuth(path, skipPaths = []) {
        const defaultSkipPaths = [
            "/health",
            "/api/version",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
        ];

        const allSkipPaths = [...defaultSkipPaths, ...(skipPaths || [])];

        return allSkipPaths.some(skipPath => {
            if (skipPath.endsWith("*")) {
                return path.startsWith(skipPath.slice(0, -1));
            }
            return path === skipPath;
        });
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(decoded) {
        if (!decoded.exp) {
            return false; // No expiration set
        }

        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    }

    /**
     * Check if user owns a resource
     * This would typically involve a database query
     */
    async checkResourceOwnership(resourceType, resourceId, userId, req) {
        try {
            // For demonstration, we'll implement basic checks
            // In a real application, this would query the database

            switch (resourceType) {
                case "user":
                    return resourceId === userId;

                case "profile":
                    return resourceId === userId;

                case "job":
                    // Check if user posted the job or is admin
                    // This would typically query the database
                    return false; // Placeholder

                case "company":
                    // Check if user owns the company
                    // This would typically query the database
                    return false; // Placeholder

                default:
                    // Default to ownership check
                    return resourceId === userId;
            }
        } catch (error) {
            this.logger.error("Error checking resource ownership", {
                error: error.message,
                resourceType,
                resourceId,
                userId,
            });
            return false;
        }
    }

    /**
     * Create authentication middleware with multiple checks
     */
    requireAuth(options = {}) {
        const middlewares = [];

        // Add authentication
        middlewares.push(this.authenticate(options));

        // Add role-based authorization if required
        if (options.roles) {
            middlewares.push(this.authorize(options.roles, options.requireAll));
        }

        // Add permission-based authorization if required
        if (options.permission) {
            middlewares.push(this.requirePermission(options.permission));
        }

        // Add ownership check if required
        if (options.ownership) {
            middlewares.push(
                this.requireOwnership(
                    options.ownership.resourceIdParam,
                    options.ownership.resourceType
                )
            );
        }

        return middlewares;
    }

    /**
     * Optional authentication (doesn't fail if no token)
     */
    optionalAuth(options = {}) {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);

                if (token) {
                    // Try to authenticate, but don't fail if it fails
                    const decoded = this.securityManager.verifyToken(token, {
                        correlationId: req.correlationId,
                    });

                    if (!this.isTokenExpired(decoded)) {
                        req.user = {
                            id: decoded.sub || decoded.id,
                            email: decoded.email,
                            role: decoded.role || "user",
                            permissions:
                                decoded.permissions || this.rolePermissions[decoded.role || "user"],
                        };
                        req.authTime = Date.now();
                        req.tokenType = this.getTokenType(req);
                    }
                }

                next();
            } catch (error) {
                // Optional auth means we continue even if authentication fails
                this.logger.debug("Optional authentication failed", {
                    correlationId: req.correlationId,
                    error: error.message,
                });
                next();
            }
        };
    }
}

module.exports = AuthMiddleware;
