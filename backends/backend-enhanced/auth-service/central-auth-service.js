/**
 * TalentSphere Centralized Authentication Service
 * Complete authentication and authorization with RBAC
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { BaseService } = require("../../shared/base-service");
const { AuthMiddleware } = require("../../shared/auth-middleware");
const { getDatabaseManager } = require("../../shared/database-connection");
const config = require("../../shared/config-manager");

class CentralAuthService extends BaseService {
    constructor() {
        super({
            serviceName: "central-auth-service",
            version: "1.0.0",
            port: config.getServicePort("authService"),
            enableCors: true,
            enableSecurity: true,
            enableRateLimit: true,
        });

        this.authMiddleware = new AuthMiddleware(config.getAuthConfig());
        this.database = getDatabaseManager();
        this.tokenBlacklist = new Set();

        this.setupRoutes();
    }

    setupRoutes() {
        // Authentication routes
        this.addRoute("post", "/auth/register", this.register.bind(this));
        this.addRoute("post", "/auth/login", this.login.bind(this));
        this.addRoute("post", "/auth/logout", this.logout.bind(this));
        this.addRoute("post", "/auth/refresh", this.refreshToken.bind(this));
        this.addRoute("post", "/auth/forgot-password", this.forgotPassword.bind(this));
        this.addRoute("post", "/auth/reset-password", this.resetPassword.bind(this));
        this.addRoute("get", "/auth/verify-email/:token", this.verifyEmail.bind(this));

        // User management routes (protected)
        this.addRoute(
            "get",
            "/users/profile",
            this.authMiddleware.authenticate(),
            this.getUserProfile.bind(this)
        );
        this.addRoute(
            "put",
            "/users/profile",
            this.authMiddleware.authenticate(),
            this.updateUserProfile.bind(this)
        );
        this.addRoute(
            "post",
            "/users/change-password",
            this.authMiddleware.authenticate(),
            this.changePassword.bind(this)
        );
        this.addRoute(
            "post",
            "/users/upload-avatar",
            this.authMiddleware.authenticate(),
            this.uploadAvatar.bind(this)
        );

        // Admin routes (admin role required)
        this.addRoute(
            "get",
            "/admin/users",
            this.authMiddleware.authorize([], ["admin"]),
            this.getAllUsers.bind(this)
        );
        this.addRoute(
            "post",
            "/admin/users/:id/disable",
            this.authMiddleware.authorize([], ["admin"]),
            this.disableUser.bind(this)
        );
        this.addRoute(
            "post",
            "/admin/users/:id/enable",
            this.authMiddleware.authorize([], ["admin"]),
            this.enableUser.bind(this)
        );
        this.addRoute(
            "post",
            "/admin/roles",
            this.authMiddleware.authorize([], ["admin"]),
            this.createRole.bind(this)
        );
        this.addRoute(
            "get",
            "/admin/roles",
            this.authMiddleware.authorize([], ["admin"]),
            this.getRoles.bind(this)
        );

        // Permission management
        this.addRoute(
            "get",
            "/permissions",
            this.authMiddleware.authenticate(),
            this.getUserPermissions.bind(this)
        );
        this.addRoute(
            "post",
            "/admin/permissions/grant",
            this.authMiddleware.authorize(["manage_permissions"], ["admin"]),
            this.grantPermission.bind(this)
        );
        this.addRoute(
            "post",
            "/admin/permissions/revoke",
            this.authMiddleware.authorize(["manage_permissions"], ["admin"]),
            this.revokePermission.bind(this)
        );

        // Session management
        this.addRoute(
            "get",
            "/auth/sessions",
            this.authMiddleware.authenticate(),
            this.getActiveSessions.bind(this)
        );
        this.addRoute(
            "delete",
            "/auth/sessions/:sessionId",
            this.authMiddleware.authenticate(),
            this.revokeSession.bind(this)
        );
        this.addRoute(
            "delete",
            "/auth/sessions",
            this.authMiddleware.authenticate(),
            this.revokeAllSessions.bind(this)
        );
    }

    async register(req, res) {
        try {
            const { email, password, firstName, lastName, role = "user" } = req.body;

            // Validate input
            await this.validateRegistrationInput({ email, password, firstName, lastName, role });

            // Check if user exists
            const existingUser = await this.database.query(
                "SELECT id FROM users WHERE email = $1",
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    error: "User already exists",
                    message: "An account with this email already exists",
                    requestId: req.requestId,
                });
            }

            // Hash password
            const saltRounds = config.getNestedConfig("auth.bcryptRounds", 12);
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Create user
            const userId = crypto.randomUUID();
            const result = await this.database.query(
                `
                INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_verified, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id, email, first_name, last_name, role, is_verified
            `,
                [userId, email.toLowerCase(), passwordHash, firstName, lastName, role, false]
            );

            // Create default permissions based on role
            await this.createDefaultPermissions(result.rows[0].id, role);

            // Generate verification token
            const verificationToken = this.generateVerificationToken(result.rows[0].id);

            // Send verification email (async)
            this.sendVerificationEmail(email, verificationToken);

            res.status(201).json({
                message: "User registered successfully. Please check your email for verification.",
                user: {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    firstName: result.rows[0].first_name,
                    lastName: result.rows[0].last_name,
                    role: result.rows[0].role,
                    isVerified: result.rows[0].is_verified,
                },
                requestId: req.requestId,
            });
        } catch (error) {
            console.error(`[${req.requestId}] Registration error:`, error);
            res.status(500).json({
                error: "Registration failed",
                message: "Unable to register user",
                requestId: req.requestId,
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password, rememberMe = false } = req.body;

            // Rate limiting check
            await this.checkLoginAttempts(req.ip, email);

            // Get user from database
            const userQuery = await this.database.query(
                `
                SELECT id, email, password_hash, first_name, last_name, role, 
                       permissions, is_active, is_verified, company_id, last_login
                FROM users 
                WHERE email = $1 AND is_active = true
            `,
                [email.toLowerCase()]
            );

            if (userQuery.rows.length === 0) {
                await this.recordFailedLoginAttempt(req.ip, email);
                return res.status(401).json({
                    error: "Invalid credentials",
                    message: "Email or password is incorrect",
                    requestId: req.requestId,
                });
            }

            const user = userQuery.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                await this.recordFailedLoginAttempt(req.ip, email);
                return res.status(401).json({
                    error: "Invalid credentials",
                    message: "Email or password is incorrect",
                    requestId: req.requestId,
                });
            }

            // Check if email is verified
            if (!user.is_verified) {
                return res.status(403).json({
                    error: "Email not verified",
                    message: "Please verify your email before logging in",
                    requestId: req.requestId,
                });
            }

            // Update last login
            await this.database.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
                user.id,
            ]);

            // Clear failed login attempts
            await this.clearFailedLoginAttempts(req.ip, email);

            // Generate tokens
            const tokens = await this.generateTokens(user, rememberMe);

            // Record session
            await this.recordSession(user.id, req.ip, req.get("User-Agent"));

            res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    permissions: user.permissions,
                    companyId: user.company_id,
                    isVerified: user.is_verified,
                },
                tokens,
                requestId: req.requestId,
            });
        } catch (error) {
            console.error(`[${req.requestId}] Login error:`, error);
            res.status(500).json({
                error: "Login failed",
                message: "Unable to process login",
                requestId: req.requestId,
            });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                // Add refresh token to blacklist
                this.tokenBlacklist.add(refreshToken);

                // Remove session from database
                const decoded = jwt.decode(refreshToken);
                if (decoded && decoded.sub) {
                    await this.database.query(
                        "DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token = $2",
                        [decoded.sub, refreshToken]
                    );
                }
            }

            res.json({
                message: "Logout successful",
                requestId: req.requestId,
            });
        } catch (error) {
            console.error(`[${req.requestId}] Logout error:`, error);
            res.status(500).json({
                error: "Logout failed",
                message: "Unable to process logout",
                requestId: req.requestId,
            });
        }
    }

    async generateTokens(user, rememberMe = false) {
        const authConfig = config.getAuthConfig();

        // Access token (short-lived)
        const accessTokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            companyId: user.company_id,
            type: "access",
        };

        const accessToken = jwt.sign(accessTokenPayload, authConfig.jwtSecret, {
            expiresIn: authConfig.jwtExpiresIn,
            algorithm: "HS256",
            issuer: "talentsphere-auth",
        });

        // Refresh token (long-lived)
        const refreshTokenExpiry = rememberMe ? authConfig.jwtRefreshExpiresIn : "7d";
        const refreshTokenPayload = {
            sub: user.id,
            type: "refresh",
            rememberMe,
        };

        const refreshToken = jwt.sign(refreshTokenPayload, authConfig.jwtSecret, {
            expiresIn: refreshTokenExpiry,
            algorithm: "HS256",
            issuer: "talentsphere-auth",
        });

        return {
            accessToken,
            refreshToken,
            tokenType: "Bearer",
            expiresIn: authConfig.jwtExpiresIn,
        };
    }

    async createDefaultPermissions(userId, role) {
        const rolePermissions = {
            admin: [
                "read",
                "write",
                "delete",
                "manage_users",
                "manage_permissions",
                "manage_system",
            ],
            hr: ["read", "write", "manage_applications", "manage_jobs"],
            manager: ["read", "write", "manage_team", "view_analytics"],
            user: ["read", "write_profile", "apply_jobs"],
            guest: ["read"],
        };

        const permissions = rolePermissions[role] || rolePermissions.user;

        await this.database.query(
            "INSERT INTO user_permissions (user_id, permission) VALUES ($1, UNNEST($2::text[]))",
            [userId, permissions]
        );
    }

    generateVerificationToken(userId) {
        return crypto.randomBytes(32).toString("hex");
    }

    async sendVerificationEmail(email, token) {
        // Integrate with email service
        // This would call the email service asynchronously
        console.log(`Verification email sent to ${email} with token ${token}`);
    }

    async validateRegistrationInput(data) {
        const errors = [];

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push("Valid email is required");
        }

        // Password validation
        if (!data.password || data.password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }

        // Name validation
        if (!data.firstName || data.firstName.length < 2) {
            errors.push("First name must be at least 2 characters long");
        }

        if (!data.lastName || data.lastName.length < 2) {
            errors.push("Last name must be at least 2 characters long");
        }

        // Role validation
        const validRoles = ["user", "hr", "manager", "admin"];
        if (data.role && !validRoles.includes(data.role)) {
            errors.push("Invalid role specified");
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(", ")}`);
        }
    }

    async checkLoginAttempts(ip, email) {
        const lockoutDuration = config.getNestedConfig("auth.lockoutDuration", 900000); // 15 minutes
        const maxAttempts = config.getNestedConfig("auth.maxLoginAttempts", 5);

        const attempts = await this.database.query(
            `
            SELECT COUNT(*) as count 
            FROM login_attempts 
            WHERE ip_address = $1 AND email = $2 AND created_at > NOW() - INTERVAL '${lockoutDuration}ms' MILLISECONDS
        `,
            [ip, email.toLowerCase()]
        );

        if (attempts.rows[0].count >= maxAttempts) {
            throw new Error("Account temporarily locked due to too many failed attempts");
        }
    }

    async recordFailedLoginAttempt(ip, email) {
        await this.database.query(
            `
            INSERT INTO login_attempts (ip_address, email, attempted_at) 
            VALUES ($1, $2, NOW())
        `,
            [ip, email.toLowerCase()]
        );
    }

    async clearFailedLoginAttempts(ip, email) {
        await this.database.query(
            `
            DELETE FROM login_attempts 
            WHERE ip_address = $1 AND email = $2
        `,
            [ip, email.toLowerCase()]
        );
    }

    async recordSession(userId, ip, userAgent) {
        const sessionId = crypto.randomUUID();
        const refreshToken = await this.generateTokens({ id: userId }, false).refreshToken;

        await this.database.query(
            `
            INSERT INTO user_sessions (id, user_id, ip_address, user_agent, refresh_token, created_at, last_accessed)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
            [sessionId, userId, ip, userAgent, refreshToken]
        );

        return sessionId;
    }

    async getUserPermissions(req, res) {
        try {
            const user = req.userContext;

            const permissions = await this.database.query(
                `
                SELECT permission FROM user_permissions WHERE user_id = $1
                UNION 
                SELECT rp.permission FROM role_permissions rp
                JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = $1
            `,
                [user.id]
            );

            res.json({
                permissions: permissions.rows.map(row => row.permission),
                role: user.role,
                requestId: req.requestId,
            });
        } catch (error) {
            console.error(`[${req.requestId}] Get permissions error:`, error);
            res.status(500).json({
                error: "Failed to get permissions",
                requestId: req.requestId,
            });
        }
    }

    // Add more methods for forgot password, reset password, etc.
}

module.exports = CentralAuthService;
