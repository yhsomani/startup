/**
 * TalentSphere Application Cache Service
 *
 * Specialized caching for:
 * - User profiles and authentication data
 * - Job listings and search results
 * - Company information and analytics
 * - Application and recruitment data
 *
 * Uses intelligent caching strategies based on data access patterns
 */

const RedisCacheManager = require("./redis-cache-manager");
const { createLogger } = require("../../shared/enhanced-logger");
const { v4: uuidv4 } = require("uuid");

class TalentSphereCache {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(`TalentSphereCache-${serviceName}`);

        // Initialize cache manager
        this.cache = new RedisCacheManager(serviceName, {
            defaultTTL: options.defaultTTL || 300, // 5 minutes default
            enableMetrics: options.enableMetrics !== false,
            enableCompression: options.enableCompression !== false,
            enableFallback: options.enableFallback !== false,
            ...options,
        });

        // Cache configuration for different data types
        this.cacheConfig = {
            // User-related caches
            user: {
                profile: { ttl: 600 }, // 10 minutes
                preferences: { ttl: 1800 }, // 30 minutes
                permissions: { ttl: 900 }, // 15 minutes
                session: { ttl: 3600 }, // 1 hour
                activity: { ttl: 300 }, // 5 minutes
            },

            // Job-related caches
            job: {
                listing: { ttl: 1800 }, // 30 minutes
                search: { ttl: 900 }, // 15 minutes
                applications: { ttl: 600 }, // 10 minutes
                recommendations: { ttl: 3600 }, // 1 hour
                saved: { ttl: 3600 }, // 1 hour
            },

            // Company-related caches
            company: {
                profile: { ttl: 1800 }, // 30 minutes
                analytics: { ttl: 900 }, // 15 minutes
                reviews: { ttl: 3600 }, // 1 hour
                jobs: { ttl: 900 }, // 15 minutes
            },

            // System caches
            system: {
                config: { ttl: 7200 }, // 2 hours
                stats: { ttl: 300 }, // 5 minutes
                notifications: { ttl: 1800 }, // 30 minutes
            },
        };

        this.isInitialized = false;
    }

    /**
     * Initialize the cache service
     */
    async initialize() {
        try {
            await this.cache.initialize();
            this.isInitialized = true;

            this.logger.info("TalentSphere Cache initialized", {
                serviceName: this.serviceName,
                cacheTypes: Object.keys(this.cacheConfig),
            });
        } catch (error) {
            this.logger.error("Failed to initialize TalentSphere Cache", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * USER PROFILE CACHING METHODS
     */

    /**
     * Cache user profile
     */
    async cacheUserProfile(userId, profileData, options = {}) {
        if (!userId || !profileData) {
            throw new Error("User ID and profile data are required");
        }

        const key = `user:profile:${userId}`;
        const ttl = options.ttl || this.cacheConfig.user.profile.ttl;

        // Sanitize and prepare profile data
        const sanitizedProfile = this.sanitizeUserProfile(profileData);

        await this.cache.set(key, sanitizedProfile, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("User profile cached", { userId, ttl });

        // Invalidate related caches
        await this.invalidateUserRelatedCaches(userId);
    }

    /**
     * Get cached user profile
     */
    async getUserProfile(userId, options = {}) {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const key = `user:profile:${userId}`;

        return await this.cache.get(key, {
            parseJson: true,
            compressed: true,
        });
    }

    /**
     * Cache user preferences
     */
    async cacheUserPreferences(userId, preferences, options = {}) {
        const key = `user:preferences:${userId}`;
        const ttl = options.ttl || this.cacheConfig.user.preferences.ttl;

        await this.cache.set(key, preferences, ttl);
        this.logger.debug("User preferences cached", { userId });
    }

    /**
     * Get cached user preferences
     */
    async getUserPreferences(userId) {
        const key = `user:preferences:${userId}`;
        return await this.cache.get(key);
    }

    /**
     * Cache user session
     */
    async cacheUserSession(sessionId, sessionData, options = {}) {
        const key = `user:session:${sessionId}`;
        const ttl = options.ttl || this.cacheConfig.user.session.ttl;

        await this.cache.set(key, sessionData, ttl);
        this.logger.debug("User session cached", { sessionId });
    }

    /**
     * Get cached user session
     */
    async getUserSession(sessionId) {
        const key = `user:session:${sessionId}`;
        return await this.cache.get(key);
    }

    /**
     * Invalidate all user-related caches
     */
    async invalidateUserRelatedCaches(userId) {
        const pattern = `user:*:${userId}`;
        await this.cache.invalidatePattern(pattern);

        this.logger.debug("User caches invalidated", { userId });
    }

    /**
     * JOB LISTING CACHING METHODS
     */

    /**
     * Cache job listing
     */
    async cacheJobListing(jobId, jobData, options = {}) {
        if (!jobId || !jobData) {
            throw new Error("Job ID and job data are required");
        }

        const key = `job:listing:${jobId}`;
        const ttl = options.ttl || this.cacheConfig.job.listing.ttl;

        const sanitizedJob = this.sanitizeJobListing(jobData);

        await this.cache.set(key, sanitizedJob, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        // Update company job cache
        if (jobData.company_id) {
            await this.updateCompanyJobsCache(jobData.company_id);
        }

        this.logger.debug("Job listing cached", { jobId, companyId: jobData.company_id });
    }

    /**
     * Get cached job listing
     */
    async getJobListing(jobId, options = {}) {
        if (!jobId) {
            throw new Error("Job ID is required");
        }

        const key = `job:listing:${jobId}`;

        return await this.cache.get(key, {
            parseJson: true,
            compressed: true,
        });
    }

    /**
     * Cache job search results
     */
    async cacheJobSearch(searchQuery, searchResults, options = {}) {
        const searchHash = this.generateSearchHash(searchQuery);
        const key = `job:search:${searchHash}`;
        const ttl = options.ttl || this.cacheConfig.job.search.ttl;

        await this.cache.set(key, searchResults, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("Job search cached", { searchHash, resultCount: searchResults.length });
    }

    /**
     * Get cached job search results
     */
    async getJobSearch(searchQuery, options = {}) {
        const searchHash = this.generateSearchHash(searchQuery);
        const key = `job:search:${searchHash}`;

        return await this.cache.get(key, {
            parseJson: true,
            compressed: true,
        });
    }

    /**
     * Cache job applications
     */
    async cacheJobApplications(jobId, applications, options = {}) {
        const key = `job:applications:${jobId}`;
        const ttl = options.ttl || this.cacheConfig.job.applications.ttl;

        await this.cache.set(key, applications, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("Job applications cached", { jobId, count: applications.length });
    }

    /**
     * Get cached job applications
     */
    async getJobApplications(jobId) {
        const key = `job:applications:${jobId}`;
        return await this.cache.get(key);
    }

    /**
     * Cache job recommendations
     */
    async cacheJobRecommendations(userId, recommendations, options = {}) {
        const key = `job:recommendations:${userId}`;
        const ttl = options.ttl || this.cacheConfig.job.recommendations.ttl;

        await this.cache.set(key, recommendations, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("Job recommendations cached", { userId, count: recommendations.length });
    }

    /**
     * Get cached job recommendations
     */
    async getJobRecommendations(userId) {
        const key = `job:recommendations:${userId}`;
        return await this.cache.get(key);
    }

    /**
     * COMPANY CACHING METHODS
     */

    /**
     * Cache company profile
     */
    async cacheCompanyProfile(companyId, companyData, options = {}) {
        if (!companyId || !companyData) {
            throw new Error("Company ID and company data are required");
        }

        const key = `company:profile:${companyId}`;
        const ttl = options.ttl || this.cacheConfig.company.profile.ttl;

        const sanitizedCompany = this.sanitizeCompanyProfile(companyData);

        await this.cache.set(key, sanitizedCompany, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("Company profile cached", { companyId });
    }

    /**
     * Get cached company profile
     */
    async getCompanyProfile(companyId) {
        if (!companyId) {
            throw new Error("Company ID is required");
        }

        const key = `company:profile:${companyId}`;
        return await this.cache.get(key, {
            parseJson: true,
            compressed: true,
        });
    }

    /**
     * Cache company analytics
     */
    async cacheCompanyAnalytics(companyId, analyticsData, options = {}) {
        const key = `company:analytics:${companyId}`;
        const ttl = options.ttl || this.cacheConfig.company.analytics.ttl;

        await this.cache.set(key, analyticsData, ttl, {
            stringifyJson: true,
            compressed: true,
        });

        this.logger.debug("Company analytics cached", { companyId });
    }

    /**
     * Get cached company analytics
     */
    async getCompanyAnalytics(companyId) {
        const key = `company:analytics:${companyId}`;
        return await this.cache.get(key, {
            parseJson: true,
            compressed: true,
        });
    }

    /**
     * Update company jobs cache
     */
    async updateCompanyJobsCache(companyId) {
        // This would typically fetch fresh jobs from database
        // For now, we'll invalidate the existing cache
        const key = `company:jobs:${companyId}`;
        await this.cache.delete(key);

        this.logger.debug("Company jobs cache updated", { companyId });
    }

    /**
     * UTILITY METHODS
     */

    /**
     * Generate search hash for caching
     */
    generateSearchHash(searchQuery) {
        const crypto = require("crypto");
        const normalizedQuery = JSON.stringify(
            Object.keys(searchQuery)
                .sort()
                .reduce((result, key) => {
                    result[key] = searchQuery[key];
                    return result;
                }, {})
        );

        return crypto.createHash("md5").update(normalizedQuery).digest("hex");
    }

    /**
     * Sanitize user profile data
     */
    sanitizeUserProfile(profile) {
        if (!profile || typeof profile !== "object") {
            return {};
        }

        // Remove sensitive data from cache
        const { password, two_factor_secret, ...sanitized } = profile;

        return {
            ...sanitized,
            cached_at: new Date().toISOString(),
            cache_version: "1.0",
        };
    }

    /**
     * Sanitize job listing data
     */
    sanitizeJobListing(job) {
        if (!job || typeof job !== "object") {
            return {};
        }

        return {
            id: job.id,
            title: job.title,
            description: job.description,
            company_id: job.company_id,
            location: job.location,
            employment_type: job.employment_type,
            experience_level: job.experience_level,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency,
            is_active: job.is_active,
            posted_at: job.posted_at,
            expires_at: job.expires_at,
            requirements: job.requirements,
            benefits: job.benefits,
            cached_at: new Date().toISOString(),
            cache_version: "1.0",
        };
    }

    /**
     * Sanitize company profile data
     */
    sanitizeCompanyProfile(company) {
        if (!company || typeof company !== "object") {
            return {};
        }

        return {
            id: company.id,
            name: company.name,
            description: company.description,
            industry: company.industry,
            size: company.size,
            founded_year: company.founded_year,
            website: company.website,
            headquarters: company.headquarters,
            logo_url: company.logo_url,
            is_verified: company.is_verified,
            is_active: company.is_active,
            cached_at: new Date().toISOString(),
            cache_version: "1.0",
        };
    }

    /**
     * Get or set pattern with automatic cache population
     */
    async getOrSetUserProfile(userId, dataFunction, options = {}) {
        return await this.cache.getOrSet(
            `user:profile:${userId}`,
            dataFunction,
            options.ttl || this.cacheConfig.user.profile.ttl,
            {
                parseJson: true,
                compressed: true,
                stringifyJson: true,
            }
        );
    }

    /**
     * Get or set job listing with automatic cache population
     */
    async getOrSetJobListing(jobId, dataFunction, options = {}) {
        return await this.cache.getOrSet(
            `job:listing:${jobId}`,
            dataFunction,
            options.ttl || this.cacheConfig.job.listing.ttl,
            {
                parseJson: true,
                compressed: true,
                stringifyJson: true,
            }
        );
    }

    /**
     * Get cache metrics
     */
    getMetrics() {
        return this.cache.getMetrics();
    }

    /**
     * Warm up cache with commonly accessed data
     */
    async warmupCache(warmupData = {}) {
        try {
            this.logger.info("Starting cache warm-up");

            const warmupTasks = [];

            // Warm up user profiles
            if (warmupData.users) {
                for (const [userId, profile] of Object.entries(warmupData.users)) {
                    warmupTasks.push(this.cacheUserProfile(userId, profile));
                }
            }

            // Warm up job listings
            if (warmupData.jobs) {
                for (const [jobId, job] of Object.entries(warmupData.jobs)) {
                    warmupTasks.push(this.cacheJobListing(jobId, job));
                }
            }

            // Warm up company profiles
            if (warmupData.companies) {
                for (const [companyId, company] of Object.entries(warmupData.companies)) {
                    warmupTasks.push(this.cacheCompanyProfile(companyId, company));
                }
            }

            await Promise.all(warmupTasks);

            this.logger.info("Cache warm-up completed", {
                users: warmupData.users?.length || 0,
                jobs: warmupData.jobs?.length || 0,
                companies: warmupData.companies?.length || 0,
            });
        } catch (error) {
            this.logger.error("Cache warm-up failed", { error: error.message });
            throw error;
        }
    }

    /**
     * Invalidate cache by category
     */
    async invalidateCategory(category, identifier = null) {
        let pattern;

        switch (category) {
            case "user":
                pattern = identifier ? `user:*:${identifier}` : "user:*";
                break;
            case "job":
                pattern = identifier ? `job:${identifier}:*` : "job:*";
                break;
            case "company":
                pattern = identifier ? `company:${identifier}:*` : "company:*";
                break;
            case "system":
                pattern = "system:*";
                break;
            default:
                throw new Error(`Invalid cache category: ${category}`);
        }

        return await this.cache.invalidatePattern(pattern);
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down TalentSphere Cache...");
        await this.cache.shutdown();
        this.logger.info("TalentSphere Cache shutdown completed");
    }
}

module.exports = TalentSphereCache;
