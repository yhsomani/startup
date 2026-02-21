/**
 * User Service with MongoDB Integration
 * Complete user management service with CRUD operations, profiles, and preferences
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { MongoClient, ObjectId } = require("mongodb");
const { BaseService } = require("../shared/base-service");

class UserService extends BaseService {
    constructor() {
        super({
            serviceName: "user-service",
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",
            port: process.env.USER_PORT || 3002,
        });

        // User-specific state - Can be MongoDB or in-memory
        this.db = null;
        this.mongodb = null;
        this.isMongoDB = false;

        // In-memory fallback storage
        this.users = new Map();
        this.profiles = new Map();
        this.preferences = new Map();
        this.skills = new Map();
        this.experiences = new Map();
        this.education = new Map();

        this.jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";

        // Initialize service contracts
        this.initializeContracts();

        // Create Express app with tracing middleware
        this.app = express();
        this.server = null;
        this.initializeMiddleware();
        this.initializeRoutes();

        // Initialize database connection asynchronously
        this.initializeDatabase().catch(console.error);
    }

    initializeContracts() {
        // Simple validation schemas for now
        this.validationSchemas = {
            register: {
                required: ["email", "password", "firstName", "lastName"],
                fields: {
                    email: value => value && value.includes("@"),
                    password: value => value && value.length >= 8,
                    firstName: value => value && value.length >= 2,
                    lastName: value => value && value.length >= 2,
                },
            },
            updateProfile: {
                optional: ["firstName", "lastName", "phone", "bio"],
                fields: {
                    firstName: value => !value || value.length >= 2,
                    lastName: value => !value || value.length >= 2,
                    bio: value => !value || value.length <= 1000,
                },
            },
            addSkill: {
                required: ["userId", "skillName", "level"],
                fields: {
                    userId: value => value && typeof value === "string",
                    skillName: value => value && value.length >= 2,
                    level: value =>
                        value && ["beginner", "intermediate", "advanced", "expert"].includes(value),
                },
            },
            addExperience: {
                required: ["userId", "company", "position", "startDate"],
                fields: {
                    userId: value => value && typeof value === "string",
                    company: value => value && value.length >= 2,
                    position: value => value && value.length >= 2,
                    startDate: value => value && typeof value === "string",
                },
            },
        };
    }

    initializeMiddleware() {
        // Basic security
        this.app.use(helmet());
        this.app.use(cors());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);

        // Body parsing
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Request tracing middleware
        this.app.use(this.getTracingMiddleware());

        // Request context middleware
        this.app.use((req, res, next) => {
            req.requestId = uuidv4();
            req.correlationId = req.headers["x-correlation-id"] || req.traceId || uuidv4();
            res.setHeader("x-correlation-id", req.correlationId);
            res.setHeader("x-service", this.config.serviceName);
            next();
        });
    }

    initializeRoutes() {
        // Health check
        this.app.get("/health", async (req, res) => {
            const span = this.tracer
                ? this.tracer.startSpan("user.health", req.traceContext)
                : null;

            if (span) {
                span.setTag("component", "user-service");
                span.setTag("health.check.type", "service");
            }

            try {
                const health = await this.getServiceHealth();

                if (span) {
                    span.setTag("health.status", "healthy");
                    span.finish();
                }

                res.json(health);
            } catch (error) {
                if (span) {
                    span.logError(error);
                    span.finish();
                }

                res.status(503).json({
                    status: "unhealthy",
                    error: error.message,
                });
            }
        });

        // Metrics endpoint
        this.app.get("/metrics", async (req, res) => {
            const span = this.tracer
                ? this.tracer.startSpan("user.metrics", req.traceContext)
                : null;

            try {
                const metrics = this.getTracingMetrics();

                if (span) {
                    span.finish();
                }

                res.json(metrics);
            } catch (error) {
                if (span) {
                    span.logError(error);
                    span.finish();
                }

                res.status(500).json({ error: error.message });
            }
        });

        // User registration
        this.app.post("/register", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.register", {
                validateInput: true,
                validateOutput: true,
            });
        });

        // User login
        this.app.post("/login", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.login", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Get user profile
        this.app.get("/profile/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.getProfile", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Update user profile
        this.app.put("/profile/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.updateProfile", {
                validateInput: true,
                validateOutput: true,
            });
        });

        // Skills management
        this.app.get("/skills/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.getSkills", {
                validateInput: false,
                validateOutput: false,
            });
        });

        this.app.post("/skills", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.addSkill", {
                validateInput: true,
                validateOutput: true,
            });
        });

        this.app.delete("/skills/:skillId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.deleteSkill", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Experience management
        this.app.get("/experience/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.getExperience", {
                validateInput: false,
                validateOutput: false,
            });
        });

        this.app.post("/experience", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.addExperience", {
                validateInput: true,
                validateOutput: true,
            });
        });

        this.app.put("/experience/:experienceId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.updateExperience", {
                validateInput: false,
                validateOutput: false,
            });
        });

        this.app.delete("/experience/:experienceId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.deleteExperience", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Education management
        this.app.post("/education", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.addEducation", {
                validateInput: true,
                validateOutput: true,
            });
        });

        this.app.get("/education/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.getEducation", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // User search
        this.app.get("/search", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.search", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // User preferences
        this.app.get("/preferences/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.getPreferences", {
                validateInput: false,
                validateOutput: false,
            });
        });

        this.app.put("/preferences/:userId", async (req, res) => {
            await this.handleRequestWithTracing(req, res, "user.updatePreferences", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            const span = this.tracer
                ? this.tracer
                      .getActiveSpans()
                      .find(s => s.getContext().spanId === req.traceContext?.spanId)
                : null;

            if (span) {
                span.logError(error);
                span.finish();
            }

            this.logger.error("Unhandled error", {
                error: error.message,
                stack: error.stack,
                requestId: req.requestId,
                correlationId: req.correlationId,
                service: this.config.serviceName,
            });

            res.status(error.statusCode || 500).json({
                success: false,
                error: {
                    code: error.code || "INTERNAL_ERROR",
                    message: error.message || "An internal error occurred",
                },
                meta: {
                    requestId: req.requestId,
                    correlationId: req.correlationId,
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                },
            });
        });
    }

    // Database initialization
    async initializeDatabase() {
        try {
            if (process.env.USE_MONGODB === "true") {
                // Use MongoDB connection string from environment or fallback to local
                const mongoUrl =
                    process.env.MONGODB_URI ||
                    process.env.MONGODB_URL ||
                    "mongodb://localhost:27017/talentsphere";

                this.mongodb = new MongoClient(mongoUrl, {
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                });

                await this.mongodb.connect();
                this.db = this.mongodb.db();
                this.isMongoDB = true;

                // Create indexes for optimal performance
                await this.createIndexes();

                this.logger?.info("🗄️ MongoDB initialized successfully for User Service");
            } else {
                // Use in-memory storage
                this.db = new Map();
                this.isMongoDB = false;
                this.logger?.info("💾 Using in-memory storage for User Service");

                // Seed demo data for in-memory
                await this.seedInMemoryDemoData();
            }
        } catch (error) {
            this.logger?.error("❌ Failed to initialize database:", error);
            // Fall back to in-memory storage
            this.db = new Map();
            this.isMongoDB = false;
            this.logger?.info("💾 Falling back to in-memory storage");
            await this.seedInMemoryDemoData();
        }
    }

    async createIndexes() {
        if (!this.isMongoDB) return;

        try {
            const usersCollection = this.db.collection("users");
            const profilesCollection = this.db.collection("user_profiles");
            const skillsCollection = this.db.collection("user_skills");
            const experiencesCollection = this.db.collection("user_experiences");
            const educationCollection = this.db.collection("user_education");
            const preferencesCollection = this.db.collection("user_preferences");

            // Users collection indexes
            await usersCollection.createIndex({ email: 1 }, { unique: true });
            await usersCollection.createIndex({ role: 1 });
            await usersCollection.createIndex({ isActive: 1 });
            await usersCollection.createIndex({ createdAt: -1 });

            // Profiles collection indexes
            await profilesCollection.createIndex({ userId: 1 }, { unique: true });
            await profilesCollection.createIndex({ visibility: 1 });

            // Skills collection indexes
            await skillsCollection.createIndex({ userId: 1 });
            await skillsCollection.createIndex({ skillName: 1 });
            await skillsCollection.createIndex({ level: 1 });
            await skillsCollection.createIndex({ userId: 1, skillName: 1 });

            // Experiences collection indexes
            await experiencesCollection.createIndex({ userId: 1 });
            await experiencesCollection.createIndex({ company: 1 });
            await experiencesCollection.createIndex({ position: 1 });
            await experiencesCollection.createIndex({ startDate: -1 });
            await experiencesCollection.createIndex({ userId: 1, startDate: -1 });

            // Education collection indexes
            await educationCollection.createIndex({ userId: 1 });
            await educationCollection.createIndex({ institution: 1 });
            await educationCollection.createIndex({ degree: 1 });
            await educationCollection.createIndex({ field: 1 });
            await educationCollection.createIndex({ userId: 1, startDate: -1 });

            // Preferences collection indexes
            await preferencesCollection.createIndex({ userId: 1 }, { unique: true });

            this.logger?.info("🔍 MongoDB indexes created successfully");
        } catch (error) {
            this.logger?.error("❌ Failed to create MongoDB indexes:", error);
            throw error;
        }
    }

    async seedInMemoryDemoData() {
  // Create demo users in memory after database initialization
  async seedInMemoryDemoData() {
    const demoUsers = [
      {
        id: uuidv4(),
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        password: await bcrypt.hash("password123", 10),
        role: "candidate",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        password: await bcrypt.hash("password123", 10),
        role: "candidate",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: "company.hr@example.com",
        firstName: "Company",
        lastName: "HR",
        password: await bcrypt.hash("password123", 10),
        role: "employer",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    demoUsers.forEach(async userData => {
      try {
        this.registerUser(userData);
      } catch (error) {
        // User might already exist
      }
    });

        this.logger?.info("👥 In-memory demo users created successfully");
    }

    // Operation implementations
    async executeOperation(request, options) {
        const operationName = options.operationName || "unknown";

        switch (operationName) {
            case "user.register":
                return this.registerUser(request.body);
            case "user.login":
                return this.loginUser(request.body);
            case "user.getProfile":
                return this.getUserProfile(request.params.userId);
            case "user.updateProfile":
                return this.updateUserProfile(request.params.userId, request.body);
            case "user.addSkill":
                return this.addUserSkill(request.body);
            case "user.getSkills":
                return this.getUserSkills(request.params.userId);
            case "user.deleteSkill":
                return this.deleteUserSkill(request.params.skillId);
            case "user.addExperience":
                return this.addUserExperience(request.body);
            case "user.getExperience":
                return this.getUserExperience(request.params.userId);
            case "user.updateExperience":
                return this.updateUserExperience(request.params.experienceId, request.body);
            case "user.deleteExperience":
                return this.deleteUserExperience(request.params.experienceId);
            case "user.addEducation":
                return this.addUserEducation(request.body);
            case "user.getEducation":
                return this.getUserEducation(request.params.userId);
            case "user.search":
                return this.searchUsers(request.query);
            case "user.getPreferences":
                return this.getUserPreferences(request.params.userId);
            case "user.updatePreferences":
                return this.updateUserPreferences(request.params.userId, request.body);
            default:
                throw new Error(`Unknown operation: ${operationName}`);
        }
    }

    async registerUser(userData) {
        return this.executeWithTracing("user.register.process", async () => {
            // Check if user already exists
            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");
                const existingUser = await usersCollection.findOne({ email: userData.email });
                if (existingUser) {
                    throw new Error("User with this email already exists");
                }
            } else {
                user = this.users.get(userData.email);
                if (user) {
                    throw new Error("User with this email already exists");
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = {
                id: uuidv4(),
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone || null,
                role: userData.role || "candidate",
                password: hashedPassword,
                isActive: true,
                isVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");
                const profilesCollection = this.db.collection("user_profiles");
                const preferencesCollection = this.db.collection("user_preferences");

                const result = await usersCollection.insertOne(user);
                const userId = result.insertedId;

                // Create initial profile
                const profile = {
                    userId: userId,
                    bio: null,
                    location: null,
                    socialLinks: {},
                    avatar: null,
                    resumeUrl: null,
                    visibility: "public",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await profilesCollection.insertOne(profile);

                // Create initial preferences
                const preferences = {
                    userId: userId,
                    emailNotifications: true,
                    pushNotifications: true,
                    jobAlerts: true,
                    profileVisibility: "public",
                    language: "en",
                    timezone: "UTC",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await preferencesCollection.insertOne(preferences);

                return {
                    user: {
                        id: userId.toString(),
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt.toISOString(),
                    },
                };
            } else {
                this.users.set(userData.email, user);

                // Create initial profile
                const profile = {
                    userId: user.id,
                    bio: null,
                    location: null,
                    socialLinks: {},
                    avatar: null,
                    resumeUrl: null,
                    visibility: "public",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                this.profiles.set(user.id, profile);

                // Create initial preferences
                const preferences = {
                    userId: user.id,
                    emailNotifications: true,
                    pushNotifications: true,
                    jobAlerts: true,
                    profileVisibility: "public",
                    language: "en",
                    timezone: "UTC",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                this.preferences.set(user.id, preferences);

                return {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt.toISOString(),
                    },
                };
            }
        });
    }

    async loginUser(credentials) {
        return this.executeWithTracing("user.login.process", async () => {
            let user;

            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");
                user = await usersCollection.findOne({ email: credentials.email });
            } else {
                user = this.users.get(credentials.email);
            }

            if (!user) {
                throw new Error("Invalid credentials");
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error("Account is deactivated");
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(credentials.password, user.password);
            if (!isValidPassword) {
                throw new Error("Invalid credentials");
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: this.isMongoDB ? user._id.toString() : user.id,
                    email: user.email,
                    role: user.role,
                },
                this.jwtSecret,
                { expiresIn: "24h" }
            );

            return {
                token,
                user: {
                    id: this.isMongoDB ? user._id.toString() : user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        });
    }

    async getUserProfile(userId) {
        return this.executeWithTracing("user.getProfile.process", async () => {
            let user;
            let profile;
            let preferences;

            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");
                const profilesCollection = this.db.collection("user_profiles");
                const preferencesCollection = this.db.collection("user_preferences");

                user = await usersCollection.findOne({ _id: new ObjectId(userId) });

                if (!user) {
                    throw new Error("User not found");
                }

                profile =
                    (await profilesCollection.findOne({ userId: new ObjectId(userId) })) || {};
                preferences =
                    (await preferencesCollection.findOne({ userId: new ObjectId(userId) })) || {};
            } else {
                user = Array.from(this.users.values()).find(u => u.id === userId);
                if (!user) {
                    throw new Error("User not found");
                }

                profile = this.profiles.get(userId) || {};
                preferences = this.preferences.get(userId) || {};
            }

            return {
                user: {
                    id: this.isMongoDB ? user._id.toString() : user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt.toISOString(),
                },
                profile,
                preferences,
            };
        });
    }

    async updateUserProfile(userId, profileData) {
        return this.executeWithTracing("user.updateProfile.process", async () => {
            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");
                const profilesCollection = this.db.collection("user_profiles");

                // Find user
                const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
                if (!user) {
                    throw new Error("User not found");
                }

                // Get existing profile or create new one
                const existingProfile = await profilesCollection.findOne({
                    userId: new ObjectId(userId),
                });

                const updatedProfile = {
                    userId: new ObjectId(userId),
                    bio: profileData.bio || existingProfile?.bio || null,
                    location: profileData.location || existingProfile?.location || null,
                    socialLinks:
                        { ...existingProfile?.socialLinks, ...profileData.socialLinks } || {},
                    avatar: profileData.avatar || existingProfile?.avatar || null,
                    resumeUrl: profileData.resumeUrl || existingProfile?.resumeUrl || null,
                    visibility: profileData.visibility || existingProfile?.visibility || "public",
                    updatedAt: new Date(),
                    ...(existingProfile ? {} : { createdAt: new Date() }),
                };

                // Update or insert profile
                if (existingProfile) {
                    await profilesCollection.updateOne(
                        { userId: new ObjectId(userId) },
                        { $set: updatedProfile }
                    );
                } else {
                    await profilesCollection.insertOne(updatedProfile);
                }

                // Update user basic info if provided
                if (profileData.firstName || profileData.lastName || profileData.phone) {
                    const userUpdate = {};
                    if (profileData.firstName) userUpdate.firstName = profileData.firstName;
                    if (profileData.lastName) userUpdate.lastName = profileData.lastName;
                    if (profileData.phone) userUpdate.phone = profileData.phone;
                    userUpdate.updatedAt = new Date();

                    await usersCollection.updateOne(
                        { _id: new ObjectId(userId) },
                        { $set: userUpdate }
                    );
                }

                return {
                    profile: updatedProfile,
                };
            } else {
                const user = Array.from(this.users.values()).find(u => u.id === userId);
                if (!user) {
                    throw new Error("User not found");
                }

                const existingProfile = this.profiles.get(userId) || {
                    userId,
                    bio: null,
                    location: null,
                    socialLinks: {},
                    avatar: null,
                    resumeUrl: null,
                    visibility: "public",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Update profile
                const updatedProfile = {
                    ...existingProfile,
                    ...profileData,
                    updatedAt: new Date(),
                };

                this.profiles.set(userId, updatedProfile);

                // Update user basic info if provided
                if (profileData.firstName || profileData.lastName || profileData.phone) {
                    user.firstName = profileData.firstName || user.firstName;
                    user.lastName = profileData.lastName || user.lastName;
                    user.phone = profileData.phone || user.phone;
                    user.updatedAt = new Date();
                }

                return {
                    profile: updatedProfile,
                };
            }
        });
    }

    async addUserSkill(skillData) {
        return this.executeWithTracing("user.addSkill.process", async () => {
            if (this.isMongoDB) {
                const skillsCollection = this.db.collection("user_skills");
                const result = await skillsCollection.insertOne({
                    userId: new ObjectId(skillData.userId),
                    skillName: skillData.skillName,
                    level: skillData.level,
                    yearsOfExperience: skillData.yearsOfExperience || 0,
                    verified: skillData.verified || false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                return { skill: result };
            } else {
                const skillId = uuidv4();
                const skill = {
                    id: skillId,
                    userId: skillData.userId,
                    skillName: skillData.skillName,
                    level: skillData.level,
                    yearsOfExperience: skillData.yearsOfExperience || 0,
                    verified: skillData.verified || false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.skills.set(skillId, skill);
                return { skill };
            }
        });
    }

    async getUserSkills(userId) {
        return this.executeWithTracing("user.getSkills.process", async () => {
            if (this.isMongoDB) {
                const skillsCollection = this.db.collection("user_skills");
                const skills = await skillsCollection
                    .find({ userId: new ObjectId(userId) })
                    .toArray();
                return { skills };
            } else {
                const skills = Array.from(this.skills.values()).filter(s => s.userId === userId);
                return { skills };
            }
        });
    }

    async deleteUserSkill(skillId) {
        return this.executeWithTracing("user.deleteSkill.process", async () => {
            if (this.isMongoDB) {
                const skillsCollection = this.db.collection("user_skills");
                await skillsCollection.deleteOne({ _id: new ObjectId(skillId) });
                return { success: true };
            } else {
                const skill = this.skills.get(skillId);
                if (!skill) {
                    throw new Error("Skill not found");
                }
                this.skills.delete(skillId);
                return { success: true };
            }
        });
    }

    async addUserExperience(experienceData) {
        return this.executeWithTracing("user.addExperience.process", async () => {
            if (this.isMongoDB) {
                const experiencesCollection = this.db.collection("user_experiences");
                const result = await experiencesCollection.insertOne({
                    userId: new ObjectId(experienceData.userId),
                    company: experienceData.company,
                    position: experienceData.position,
                    startDate: experienceData.startDate,
                    endDate: experienceData.endDate || null,
                    current: experienceData.current || false,
                    description: experienceData.description || null,
                    location: experienceData.location || null,
                    achievements: experienceData.achievements || [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                return { experience: result };
            } else {
                const experienceId = uuidv4();
                const experience = {
                    id: experienceId,
                    userId: experienceData.userId,
                    company: experienceData.company,
                    position: experienceData.position,
                    startDate: experienceData.startDate,
                    endDate: experienceData.endDate || null,
                    current: experienceData.current || false,
                    description: experienceData.description || null,
                    location: experienceData.location || null,
                    achievements: experienceData.achievements || [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.experiences.set(experienceId, experience);
                return { experience };
            }
        });
    }

    async getUserExperience(userId) {
        return this.executeWithTracing("user.getExperience.process", async () => {
            if (this.isMongoDB) {
                const experiencesCollection = this.db.collection("user_experiences");
                const experiences = await experiencesCollection
                    .find({ userId: new ObjectId(userId) })
                    .sort({ startDate: -1 })
                    .toArray();
                return { experiences };
            } else {
                const experiences = Array.from(this.experiences.values()).filter(
                    e => e.userId === userId
                );
                return { experiences };
            }
        });
    }

    async updateUserExperience(experienceId, experienceData) {
        return this.executeWithTracing("user.updateExperience.process", async () => {
            if (this.isMongoDB) {
                const experiencesCollection = this.db.collection("user_experiences");
                const result = await experiencesCollection.updateOne(
                    { _id: new ObjectId(experienceId) },
                    {
                        $set: {
                            ...experienceData,
                            updatedAt: new Date(),
                        },
                    }
                );
                return { experience: result };
            } else {
                const experience = this.experiences.get(experienceId);
                if (!experience) {
                    throw new Error("Experience not found");
                }
                const updatedExperience = {
                    ...experience,
                    ...experienceData,
                    updatedAt: new Date(),
                };
                this.experiences.set(experienceId, updatedExperience);
                return { experience: updatedExperience };
            }
        });
    }

    async deleteUserExperience(experienceId) {
        return this.executeWithTracing("user.deleteExperience.process", async () => {
            if (this.isMongoDB) {
                const experiencesCollection = this.db.collection("user_experiences");
                await experiencesCollection.deleteOne({ _id: new ObjectId(experienceId) });
                return { success: true };
            } else {
                const experience = this.experiences.get(experienceId);
                if (!experience) {
                    throw new Error("Experience not found");
                }
                this.experiences.delete(experienceId);
                return { success: true };
            }
        });
    }

    async addUserEducation(educationData) {
        return this.executeWithTracing("user.addEducation.process", async () => {
            if (this.isMongoDB) {
                const educationCollection = this.db.collection("user_education");
                const result = await educationCollection.insertOne({
                    userId: new ObjectId(educationData.userId),
                    institution: educationData.institution,
                    degree: educationData.degree,
                    field: educationData.field,
                    startDate: educationData.startDate,
                    endDate: educationData.endDate || null,
                    current: educationData.current || false,
                    gpa: educationData.gpa || null,
                    description: educationData.description || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                return { education: result };
            } else {
                const educationId = uuidv4();
                const education = {
                    id: educationId,
                    userId: educationData.userId,
                    institution: educationData.institution,
                    degree: educationData.degree,
                    field: educationData.field,
                    startDate: educationData.startDate,
                    endDate: educationData.endDate || null,
                    current: educationData.current || false,
                    gpa: educationData.gpa || null,
                    description: educationData.description || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.education.set(educationId, education);
                return { education };
            }
        });
    }

    async getUserEducation(userId) {
        return this.executeWithTracing("user.getEducation.process", async () => {
            if (this.isMongoDB) {
                const educationCollection = this.db.collection("user_education");
                const education = await educationCollection
                    .find({ userId: new ObjectId(userId) })
                    .sort({ startDate: -1 })
                    .toArray();
                return { education };
            } else {
                const education = Array.from(this.education.values()).filter(
                    e => e.userId === userId
                );
                return { education };
            }
        });
    }

    async searchUsers(query) {
        return this.executeWithTracing("user.search.process", async () => {
            const { q: searchTerm, role, skills, limit = 20, offset = 0 } = query;

            let users;

            if (this.isMongoDB) {
                const usersCollection = this.db.collection("users");

                // Build search query
                let searchQuery = {};
                if (searchTerm) {
                    searchQuery.$or = [
                        { firstName: { $regex: searchTerm, $options: "i" } },
                        { lastName: { $regex: searchTerm, $options: "i" } },
                        { email: { $regex: searchTerm, $options: "i" } },
                    ];
                }

                if (role) {
                    searchQuery.role = role;
                }

                users = await usersCollection.find(searchQuery).limit(limit).skip(offset).toArray();
                users = users.map(u => ({
                    id: u._id.toString(),
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                }));
            } else {
                users = Array.from(this.users.values());

                // Filter by role
                if (role) {
                    users = users.filter(u => u.role === role);
                }

                // Filter by search term
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    users = users.filter(
                        u =>
                            u.firstName.toLowerCase().includes(term) ||
                            u.lastName.toLowerCase().includes(term) ||
                            u.email.toLowerCase().includes(term)
                    );
                }
            }

            return {
                users: users,
                limit,
                offset,
                total: users.length,
            };
        });
    }

    async getUserPreferences(userId) {
        return this.executeWithTracing("user.getPreferences.process", async () => {
            if (this.isMongoDB) {
                const preferencesCollection = this.db.collection("user_preferences");
                const preferences =
                    (await preferencesCollection.findOne({ userId: new ObjectId(userId) })) || {};
            } else {
                const preferences = this.preferences.get(userId) || {
                    userId,
                    emailNotifications: true,
                    pushNotifications: true,
                    jobAlerts: true,
                    profileVisibility: "public",
                    language: "en",
                    timezone: "UTC",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }

            return { preferences };
        });
    }

    async updateUserPreferences(userId, preferencesData) {
        return this.executeWithTracing("user.updatePreferences.process", async () => {
            if (this.isMongoDB) {
                const preferencesCollection = this.db.collection("user_preferences");
                const result = await preferencesCollection.updateOne(
                    { userId: new ObjectId(userId) },
                    {
                        $set: {
                            ...preferencesData,
                            updatedAt: new Date(),
                        },
                    }
                );
                return { preferences: result };
            } else {
                const preferences = this.preferences.get(userId) || {
                    userId,
                    emailNotifications: true,
                    pushNotifications: true,
                    jobAlerts: true,
                    profileVisibility: "public",
                    language: "en",
                    timezone: "UTC",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const updatedPreferences = {
                    ...preferences,
                    ...preferencesData,
                    updatedAt: new Date(),
                };
                this.preferences.set(userId, updatedPreferences);
                return { preferences: updatedPreferences };
            }
        });
    }

    async start() {
        const startupSpan = this.tracer ? this.tracer.startSpan("user-service.startup") : null;

        try {
            this.server = this.app.listen(this.config.port, () => {
                this.logger?.info(`👤 User Service running on port ${this.config.port}`);
                this.logger?.info(`📍 Environment: ${this.config.environment}`);
                this.logger?.info(
                    `🔍 Tracing: ${this.config.tracing?.enabled || false ? "enabled" : "disabled"}`
                );
                this.logger?.info(`💾 Storage: ${this.isMongoDB ? "MongoDB" : "In-Memory"}`);
            });

            if (startupSpan) {
                startupSpan.setTag("port", this.config.port);
                startupSpan.logEvent("User service started successfully");
                startupSpan.finish();
            }
        } catch (error) {
            if (startupSpan) {
                startupSpan.logError(error);
                startupSpan.finish();
            }
            throw error;
        }
    }

    async stop() {
        const shutdownSpan = this.tracer ? this.tracer.startSpan("user-service.shutdown") : null;

        try {
            if (this.server) {
                await new Promise(resolve => {
                    this.server.close(resolve);
                });
                this.logger?.info("🛑 User Service stopped");
            }

            if (this.mongodb) {
                await this.mongodb.close();
                this.logger?.info("🗄️ MongoDB connection closed");
            }

            if (shutdownSpan) {
                shutdownSpan.finish();
            }
        } catch (error) {
            if (shutdownSpan) {
                shutdownSpan.logError(error);
                shutdownSpan.finish();
            }
            throw error;
        }
    }
}

// Create and export service instance
module.exports = {
    UserService,
};

// Auto-start if this is main module
if (require.main === module) {
    const userService = new UserService();

    userService.start().catch(console.error);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
        console.log("🛑 SIGTERM received, shutting down gracefully...");
        await userService.stop();
        process.exit(0);
    });

    process.on("SIGINT", async () => {
        console.log("🛑 SIGINT received, shutting down gracefully...");
        await userService.stop();
        process.exit(0);
    });
}
