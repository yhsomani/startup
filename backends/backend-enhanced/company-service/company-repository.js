/**
 * Enhanced Company Repository with Connection Pooling
 *
 * Database integration for Company Service using:
 * - DatabaseConnectionPool for efficient connection management
 * - SQL injection protection
 * - Enhanced caching and performance monitoring
 * - Transaction support
 */

const EnhancedBaseRepository = require("../../services/shared/enhanced-base-repository");

class CompanyRepository extends EnhancedBaseRepository {
    constructor(serviceName = "company-service") {
        super("companies", serviceName, {
            cacheEnabled: true,
            cacheTimeout: 10 * 60 * 1000, // 10 minutes cache for company data
            slowQueryThreshold: 500, // 500ms threshold for company queries
        });

        // Company-specific indexes for optimization
        this.indexes = [
            "idx_companies_name",
            "idx_companies_industry",
            "idx_companies_size",
            "idx_companies_is_active",
            "idx_companies_is_verified",
            "idx_companies_created_at",
        ];
    }

    /**
     * Create new company with enhanced validation and security
     */
    async createCompany(companyData, options = {}) {
        try {
            // Validate required fields
            this.validateCompanyData(companyData, true);

            // Sanitize and prepare data
            const sanitizedData = {
                name: this.sanitizeString(companyData.name),
                description: this.sanitizeString(companyData.description),
                industry: this.sanitizeString(companyData.industry),
                size: this.validateSize(companyData.size),
                founded_year: this.validateYear(companyData.foundedYear),
                website: this.validateWebsite(companyData.website),
                headquarters: this.sanitizeString(companyData.headquarters),
                logo_url: this.validateUrl(companyData.logoUrl),
                is_verified: false, // Companies need verification
                is_active: true,
                created_at: new Date(),
                metadata: companyData.metadata || {},
            };

            const result = await this.create(sanitizedData, options);

            // Update cache with company count by industry
            await this.updateIndustryCache(companyData.industry, 1);

            return result;
        } catch (error) {
            this.logger.error("Failed to create company", {
                companyName: companyData.name,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get company by ID with enhanced caching
     */
    async getCompany(companyId, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const result = await this.findById(companyId, {
                ...options,
                fields: options.includeDeleted
                    ? "*"
                    : "id, name, description, industry, size, founded_year, website, headquarters, logo_url, is_verified, is_active, created_at, updated_at, metadata",
            });

            return result;
        } catch (error) {
            this.logger.error("Failed to get company", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Update company with field validation
     */
    async updateCompany(companyId, updateData, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            // Validate update data
            this.validateCompanyData(updateData, false);

            const sanitizedData = {};

            // Only update provided fields
            if (updateData.name !== undefined) {
                sanitizedData.name = this.sanitizeString(updateData.name);
            }
            if (updateData.description !== undefined) {
                sanitizedData.description = this.sanitizeString(updateData.description);
            }
            if (updateData.industry !== undefined) {
                const oldCompany = await this.getCompany(companyId);
                sanitizedData.industry = this.sanitizeString(updateData.industry);

                // Update industry cache if industry changed
                if (oldCompany && oldCompany.industry !== updateData.industry) {
                    await this.updateIndustryCache(oldCompany.industry, -1);
                    await this.updateIndustryCache(updateData.industry, 1);
                }
            }
            if (updateData.size !== undefined) {
                sanitizedData.size = this.validateSize(updateData.size);
            }
            if (updateData.foundedYear !== undefined) {
                sanitizedData.founded_year = this.validateYear(updateData.foundedYear);
            }
            if (updateData.website !== undefined) {
                sanitizedData.website = this.validateWebsite(updateData.website);
            }
            if (updateData.headquarters !== undefined) {
                sanitizedData.headquarters = this.sanitizeString(updateData.headquarters);
            }
            if (updateData.logoUrl !== undefined) {
                sanitizedData.logo_url = this.validateUrl(updateData.logoUrl);
            }
            if (updateData.isVerified !== undefined) {
                sanitizedData.is_verified = Boolean(updateData.isVerified);
            }
            if (updateData.isActive !== undefined) {
                sanitizedData.is_active = Boolean(updateData.isActive);
            }
            if (updateData.metadata !== undefined) {
                sanitizedData.metadata = updateData.metadata;
            }

            const result = await this.update(companyId, sanitizedData, options);
            return result;
        } catch (error) {
            this.logger.error("Failed to update company", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    // Delete company (soft delete)
    async deleteCompany(companyId) {
        await this.database.initialize();

        return await this.database.update("companies", companyId, {
            is_active: false,
            updated_at: new Date(),
        });
    }

    // Search companies
    async searchCompanies(query = {}) {
        await this.database.initialize();

        const {
            q: searchTerm,
            industry,
            size,
            location,
            limit = 20,
            offset = 0,
            sortBy = "name",
        } = query;

        // Build WHERE clause
        const whereConditions = ["is_active = TRUE"];
        const queryParams = [];
        let paramIndex = 1;

        // Text search
        if (searchTerm) {
            whereConditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
            queryParams.push(searchTerm);
            paramIndex++;
        }

        // Industry filter
        if (industry) {
            whereConditions.push(`industry = $${paramIndex}`);
            queryParams.push(industry);
            paramIndex++;
        }

        // Size filter
        if (size) {
            whereConditions.push(`size = $${paramIndex}`);
            queryParams.push(size);
            paramIndex++;
        }

        // Location filter
        if (location) {
            whereConditions.push(`headquarters ILIKE $${paramIndex}`);
            queryParams.push(`%${location}%`);
            paramIndex++;
        }

        // Build ORDER BY clause
        let orderBy = "name ASC";
        switch (sortBy) {
            case "name":
                orderBy = "name ASC";
                break;
            case "founded":
                orderBy = "founded_year DESC NULLS LAST";
                break;
            case "size":
                orderBy = "size DESC";
                break;
            case "created":
                orderBy = "created_at DESC";
                break;
            default:
                orderBy = "name ASC";
        }

        // Build final query
        const whereClause = whereConditions.join(" AND ");
        const searchQuery = `
      SELECT * FROM companies
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

        queryParams.push(limit, offset);

        // Execute query
        const result = await this.database.query(searchQuery, queryParams);

        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total FROM companies
      WHERE ${whereClause}
    `;

        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await this.database.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        return {
            companies: result.rows,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total,
                totalPages: Math.ceil(total / limit),
                currentPage: Math.floor(offset / limit) + 1,
            },
        };
    }

    // Get company jobs
    async getCompanyJobs(companyId, options = {}) {
        await this.database.initialize();

        const { limit = 20, offset = 0, includeExpired = false } = options;

        const result = await this.database.query(
            `SELECT 
        j.id,
        j.title,
        j.description,
        j.location,
        j.employment_type,
        j.experience_level,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.is_active,
        j.posted_at,
        j.expires_at
      FROM jobs j
      WHERE j.company_id = $1 
        AND j.is_active = TRUE
        ${includeExpired ? "" : "AND (j.expires_at IS NULL OR j.expires_at > NOW())"}
      ORDER BY j.posted_at DESC
      LIMIT $2 OFFSET $3`,
            [companyId, limit, offset]
        );

        // Get total count
        const countResult = await this.database.query(
            `SELECT COUNT(*) as total FROM jobs 
       WHERE company_id = $1 
         AND is_active = TRUE 
         ${includeExpired ? "" : "AND (expires_at IS NULL OR expires_at > NOW())"}`,
            [companyId]
        );

        const total = parseInt(countResult.rows[0].total);

        return {
            jobs: result.rows,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total,
                totalPages: Math.ceil(total / limit),
                currentPage: Math.floor(offset / limit) + 1,
            },
        };
    }

    // Company reviews
    async getCompanyReviews(companyId, options = {}) {
        await this.database.initialize();

        const { limit = 10, offset = 0, rating } = options;

        let whereClause = "company_id = $1 AND is_verified = TRUE";
        const params = [companyId, limit, offset];

        if (rating) {
            whereClause += " AND rating = $4";
            params.push(rating);
        }

        const result = await this.database.query(
            `SELECT 
        cr.*,
        u.name as reviewer_name,
        u.avatar_url as reviewer_avatar
      FROM company_reviews cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT $2 OFFSET $3`,
            params
        );

        return {
            reviews: result.rows,
            pagination: {
                limit,
                offset,
            },
        };
    }

    // Company followers
    async getCompanyFollowers(companyId, options = {}) {
        await this.database.initialize();

        const { limit = 20, offset = 0 } = options;

        const result = await this.database.query(
            `SELECT 
        u.id,
        u.name,
        u.avatar_url,
        u.headline,
        cf.followed_at
      FROM company_followers cf
      JOIN users u ON cf.user_id = u.id
      WHERE cf.company_id = $1
      ORDER BY cf.followed_at DESC
      LIMIT $2 OFFSET $3`,
            [companyId, limit, offset]
        );

        return {
            followers: result.rows,
            pagination: {
                limit,
                offset,
            },
        };
    }

    // Company analytics
    async getCompanyAnalytics(companyId, dateRange = "30d") {
        await this.database.initialize();

        let dateCondition = "created_at >= NOW() - INTERVAL '30 days'";

        switch (dateRange) {
            case "7d":
                dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
                break;
            case "30d":
                dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
                break;
            case "90d":
                dateCondition = "created_at >= NOW() - INTERVAL '90 days'";
                break;
            case "1y":
                dateCondition = "created_at >= NOW() - INTERVAL '1 year'";
                break;
        }

        const result = await this.database.query(
            `SELECT 
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT CASE WHEN j.is_active = TRUE THEN j.id END) as active_jobs,
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT ja.user_id) as unique_applicants,
        COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END) as pending_applications,
        COUNT(DISTINCT CASE WHEN ja.status = 'interviewing' THEN ja.id END) as interviewing_applications,
        COUNT(DISTINCT cf.user_id) as total_followers,
        COUNT(DISTINCT cr.id) as total_reviews,
        AVG(cr.rating) as average_rating
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      LEFT JOIN company_followers cf ON c.id = cf.company_id
      LEFT JOIN company_reviews cr ON c.id = cr.company_id
      WHERE c.id = $1 AND ${dateCondition}
      GROUP BY c.id`,
            [companyId]
        );

        return result.rows[0] || {};
    }

    /**
     * Delete company (soft delete)
     */
    async deleteCompany(companyId, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const result = await this.softDelete(companyId, options);

            if (result) {
                // Update industry cache
                await this.updateIndustryCache(result.industry, -1);
            }

            return result;
        } catch (error) {
            this.logger.error("Failed to delete company", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Search companies with enhanced filtering and full-text search
     */
    async searchCompanies(query = {}, options = {}) {
        try {
            const {
                q: searchTerm,
                industry,
                size,
                location,
                isVerified,
                limit = 20,
                offset = 0,
                sortBy = "name",
                sortDirection = "ASC",
            } = query;

            const filters = { is_active: true };

            if (searchTerm) {
                filters.search_vector = {
                    operation: "@@",
                    value: `plainto_tsquery('english', '${searchTerm}')`,
                };
            }

            if (industry) {
                filters.industry = industry;
            }

            if (size) {
                filters.size = size;
            }

            if (location) {
                filters.headquarters = { operation: "ILIKE", value: `%${location}%` };
            }

            if (isVerified !== undefined) {
                filters.is_verified = Boolean(isVerified);
            }

            const result = await this.find(filters, {
                limit,
                offset,
                orderBy: sortBy,
                orderDirection: sortDirection,
                fields: "id, name, description, industry, size, founded_year, website, headquarters, logo_url, is_verified, created_at, metadata",
            });

            return {
                companies: result.data,
                pagination: result.pagination,
            };
        } catch (error) {
            this.logger.error("Failed to search companies", {
                query,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get company jobs with enhanced filtering
     */
    async getCompanyJobs(companyId, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const { limit = 20, offset = 0, includeExpired = false, isActive = true } = options;

            const filters = { company_id: companyId };

            if (isActive !== undefined) {
                filters.is_active = Boolean(isActive);
            }

            if (!includeExpired) {
                filters.expires_at = { operation: "IS NULL OR expires_at > NOW()" };
            }

            const result = await this.find(filters, {
                limit,
                offset,
                orderBy: "posted_at",
                orderDirection: "DESC",
                fields: "id, title, description, location, employment_type, experience_level, salary_min, salary_max, salary_currency, is_active, posted_at, expires_at",
            });

            return {
                jobs: result.data,
                pagination: result.pagination,
            };
        } catch (error) {
            this.logger.error("Failed to get company jobs", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get company reviews with user information
     */
    async getCompanyReviews(companyId, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const { limit = 10, offset = 0, rating, isVerified = true } = options;

            let query = `
                SELECT 
                    cr.*,
                    u.name as reviewer_name,
                    u.avatar_url as reviewer_avatar
                FROM company_reviews cr
                LEFT JOIN users u ON cr.user_id = u.id
                WHERE cr.company_id = $1
            `;

            const params = [companyId, limit, offset];
            let paramIndex = 4;

            if (isVerified !== undefined) {
                query += ` AND cr.is_verified = $${paramIndex}`;
                params.push(Boolean(isVerified));
                paramIndex++;
            }

            if (rating) {
                query += ` AND cr.rating = $${paramIndex}`;
                params.push(rating);
                paramIndex++;
            }

            query += ` ORDER BY cr.created_at DESC LIMIT $2 OFFSET $3`;

            const result = await this.executeQuery(query, params);

            return {
                reviews: result.rows,
                pagination: { limit, offset },
            };
        } catch (error) {
            this.logger.error("Failed to get company reviews", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get company followers with user details
     */
    async getCompanyFollowers(companyId, options = {}) {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const { limit = 20, offset = 0 } = options;

            const query = `
                SELECT 
                    u.id,
                    u.name,
                    u.avatar_url,
                    u.headline,
                    cf.followed_at
                FROM company_followers cf
                JOIN users u ON cf.user_id = u.id
                WHERE cf.company_id = $1
                ORDER BY cf.followed_at DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await this.executeQuery(query, [companyId, limit, offset]);

            return {
                followers: result.rows,
                pagination: { limit, offset },
            };
        } catch (error) {
            this.logger.error("Failed to get company followers", {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get company analytics with date range support
     */
    async getCompanyAnalytics(companyId, dateRange = "30d") {
        try {
            if (!companyId) {
                throw new Error("Company ID is required");
            }

            const dateCondition = this.getDateCondition(dateRange);

            const query = `
                SELECT 
                    COUNT(DISTINCT j.id) as total_jobs,
                    COUNT(DISTINCT CASE WHEN j.is_active = TRUE THEN j.id END) as active_jobs,
                    COUNT(DISTINCT ja.id) as total_applications,
                    COUNT(DISTINCT ja.user_id) as unique_applicants,
                    COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END) as pending_applications,
                    COUNT(DISTINCT CASE WHEN ja.status = 'interviewing' THEN ja.id END) as interviewing_applications,
                    COUNT(DISTINCT cf.user_id) as total_followers,
                    COUNT(DISTINCT cr.id) as total_reviews,
                    AVG(cr.rating) as average_rating
                FROM companies c
                LEFT JOIN jobs j ON c.id = j.company_id
                LEFT JOIN job_applications ja ON j.id = ja.job_id
                LEFT JOIN company_followers cf ON c.id = cf.company_id
                LEFT JOIN company_reviews cr ON c.id = cr.company_id
                WHERE c.id = $1 AND ${dateCondition}
                GROUP BY c.id
            `;

            const result = await this.executeQuery(query, [companyId]);
            return result.rows[0] || {};
        } catch (error) {
            this.logger.error("Failed to get company analytics", {
                companyId,
                dateRange,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Validation helper methods
     */
    validateCompanyData(data, isCreate = false) {
        const errors = [];

        if (isCreate && !data.name) {
            errors.push("Company name is required");
        }

        if (data.name && typeof data.name !== "string") {
            errors.push("Company name must be a string");
        }

        if (data.industry && typeof data.industry !== "string") {
            errors.push("Industry must be a string");
        }

        if (
            data.size &&
            !["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].includes(data.size)
        ) {
            errors.push("Invalid company size");
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(", ")}`);
        }
    }

    sanitizeString(str) {
        if (!str) return null;
        return str.trim().replace(/[<>]/g, "");
    }

    validateSize(size) {
        if (!size) return null;
        const validSizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
        return validSizes.includes(size) ? size : null;
    }

    validateYear(year) {
        if (!year) return null;
        const yearNum = parseInt(year);
        const currentYear = new Date().getFullYear();
        return yearNum >= 1800 && yearNum <= currentYear ? yearNum : null;
    }

    validateWebsite(url) {
        if (!url) return null;
        try {
            new URL(url);
            return url;
        } catch {
            return null;
        }
    }

    validateUrl(url) {
        return this.validateWebsite(url);
    }

    getDateCondition(dateRange) {
        switch (dateRange) {
            case "7d":
                return "created_at >= NOW() - INTERVAL '7 days'";
            case "30d":
                return "created_at >= NOW() - INTERVAL '30 days'";
            case "90d":
                return "created_at >= NOW() - INTERVAL '90 days'";
            case "1y":
                return "created_at >= NOW() - INTERVAL '1 year'";
            default:
                return "created_at >= NOW() - INTERVAL '30 days'";
        }
    }

    async updateIndustryCache(industry, delta) {
        if (!industry) return;

        // This could integrate with Redis for distributed cache
        const cacheKey = `industry:${industry}:count`;
        const current = this.getCachedResult(cacheKey) || 0;
        this.setCachedResult(cacheKey, Math.max(0, current + delta));
    }

    /**
     * Get companies by industry with caching
     */
    async getCompaniesByIndustry(industry, options = {}) {
        try {
            const cacheKey = this.getCacheKey("byIndustry", { industry, options });
            const cached = this.getCachedResult(cacheKey);
            if (cached) {
                return cached;
            }

            const result = await this.find(
                { industry, is_active: true },
                { ...options, orderBy: "name", orderDirection: "ASC" }
            );

            this.setCachedResult(cacheKey, result);
            return result;
        } catch (error) {
            this.logger.error("Failed to get companies by industry", {
                industry,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get verified companies
     */
    async getVerifiedCompanies(options = {}) {
        try {
            return await this.find(
                { is_verified: true, is_active: true },
                { ...options, orderBy: "created_at", orderDirection: "DESC" }
            );
        } catch (error) {
            this.logger.error("Failed to get verified companies", {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Batch operations for performance
     */
    async batchCreate(companiesData, options = {}) {
        try {
            if (!Array.isArray(companiesData) || companiesData.length === 0) {
                throw new Error("Companies data must be a non-empty array");
            }

            return await this.transaction(async tx => {
                const results = [];

                for (const companyData of companiesData) {
                    this.validateCompanyData(companyData, true);

                    const sanitizedData = {
                        name: this.sanitizeString(companyData.name),
                        description: this.sanitizeString(companyData.description),
                        industry: this.sanitizeString(companyData.industry),
                        size: this.validateSize(companyData.size),
                        founded_year: this.validateYear(companyData.foundedYear),
                        website: this.validateWebsite(companyData.website),
                        headquarters: this.sanitizeString(companyData.headquarters),
                        logo_url: this.validateUrl(companyData.logoUrl),
                        is_verified: false,
                        is_active: true,
                        created_at: new Date(),
                        metadata: companyData.metadata || {},
                    };

                    const result = await this.create(sanitizedData, { transaction: tx });
                    results.push(result);
                }

                return results;
            });
        } catch (error) {
            this.logger.error("Failed to batch create companies", {
                count: companiesData.length,
                error: error.message,
            });
            throw error;
        }
    }
}

module.exports = CompanyRepository;
