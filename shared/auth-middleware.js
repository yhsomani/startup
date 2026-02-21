/**
 * TalentSphere Authentication Middleware
 * Standardized authentication and authorization for all services
 */

const jwt = require("jsonwebtoken");
const { promisify } = require("util");

class AuthMiddleware {
    constructor(options = {}) {
        this.options = {
            secret: options.secret || process.env.JWT_SECRET,
            algorithms: ["HS256"],
            requestProperty: "user",
            getToken: this.getTokenFromRequest,
            ...options,
        };

        if (!this.options.secret) {
            throw new Error("JWT secret is required");
        }
    }

    /**
     * Get JWT token from request
     */
    getTokenFromRequest(req) {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
            return req.headers.authorization.split(" ")[1];
        }

        if (req.query && req.query.token) {
            return req.query.token;
        }

        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }

        return null;
    }

    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const decoded = await promisify(jwt.verify)(token, this.options.secret, {
                algorithms: this.options.algorithms,
            });
            return decoded;
        } catch (error) {
            throw new Error(`Invalid token: ${error.message}`);
        }
    }

    /**
     * Authentication middleware
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const token = this.options.getToken(req);

                if (!token) {
                    return res.status(401).json({
                        error: "Unauthorized",
                        message: "No token provided",
                        requestId: req.requestId,
                    });
                }

                const decoded = await this.verifyToken(token);
                req[this.options.requestProperty] = decoded;

                // Add user context to request
                req.userContext = {
                    id: decoded.sub,
                    email: decoded.email,
                    role: decoded.role,
                    permissions: decoded.permissions || [],
                    companyId: decoded.companyId,
                };

                next();
            } catch (error) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: error.message,
                    requestId: req.requestId,
                });
            }
        };
    }

    /**
     * Authorization middleware factory
     */
    authorize(requiredPermissions = [], requiredRoles = []) {
        return (req, res, next) => {
            const user = req.userContext;

            if (!user) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required",
                    requestId: req.requestId,
                });
            }

            // Check role-based authorization
            if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "Insufficient role permissions",
                    requiredRoles,
                    userRole: user.role,
                    requestId: req.requestId,
                });
            }

            // Check permission-based authorization
            if (requiredPermissions.length > 0) {
                const hasPermission = requiredPermissions.every(permission =>
                    user.permissions.includes(permission)
                );

                if (!hasPermission) {
                    return res.status(403).json({
                        error: "Forbidden",
                        message: "Insufficient permissions",
                        requiredPermissions,
                        userPermissions: user.permissions,
                        requestId: req.requestId,
                    });
                }
            }

            // Add authorization context
            req.authContext = {
                authorized: true,
                permissions: user.permissions,
                role: user.role,
                companyId: user.companyId,
            };

            next();
        };
    }

    /**
     * Optional authentication (doesn't fail if no token)
     */
    optional() {
        return async (req, res, next) => {
            try {
                const token = this.options.getToken(req);

                if (token) {
                    const decoded = await this.verifyToken(token);
                    req[this.options.requestProperty] = decoded;
                    req.userContext = {
                        id: decoded.sub,
                        email: decoded.email,
                        role: decoded.role,
                        permissions: decoded.permissions || [],
                        companyId: decoded.companyId,
                    };
                }

                next();
            } catch (error) {
                // Log error but don't fail the request
                console.warn(`Optional auth failed: ${error.message}`);
                next();
            }
        };
    }

    /**
     * Company-specific authorization
     */
    authorizeCompany(companyIdParam = "companyId") {
        return (req, res, next) => {
            const user = req.userContext;
            const requestedCompanyId = req.params[companyIdParam] || req.body[companyIdParam];

            if (!user) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required",
                    requestId: req.requestId,
                });
            }

            // Admin users can access any company
            if (user.role === "admin") {
                req.authContext = { authorized: true, companyId: requestedCompanyId };
                return next();
            }

            // Check if user belongs to the requested company
            if (user.companyId !== requestedCompanyId) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "Access denied to company resources",
                    userCompanyId: user.companyId,
                    requestedCompanyId,
                    requestId: req.requestId,
                });
            }

            req.authContext = { authorized: true, companyId: requestedCompanyId };
            next();
        };
    }
}

module.exports = AuthMiddleware;
