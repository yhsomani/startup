/**
 * TalentSphere Search Service
 * Unified search service for jobs, profiles, companies, and content
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const auth = require('../shared/middleware/auth');
const { getDatabaseManager } = require('../shared/database-connection');

class SearchService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'search-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.SEARCH_PORT || 3005,
      tracing: {
        enabled: true,
        samplingRate: 1.0
      },
      circuitBreaker: {
        timeout: 5000,
        maxFailures: 3,
        resetTimeout: 30000
      }
    });

    // Initialize database connection
    this.database = getDatabaseManager();
    
    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200 // limit each IP to 200 requests per windowMs (search is high frequency)
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || req.traceId || uuidv4();
      
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);
      
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('search.health', req.traceContext) : null;
      
      try {
        const health = await this.getServiceHealth();
        
        if (span) {
          span.setTag('health.status', 'healthy');
          span.finish();
        }

        res.json(health);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Universal search endpoint
    this.app.get('/search', 
      auth.optional, // Allow public search with enhanced results for authenticated users
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.universal');
      }
    );

    // Specific search endpoints
    this.app.get('/search/jobs', 
      auth.optional,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.jobs');
      }
    );

    this.app.get('/search/profiles', 
      auth.required, // Profile search requires authentication
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.profiles');
      }
    );

    this.app.get('/search/companies', 
      auth.optional,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.companies');
      }
    );

    this.app.get('/search/content', 
      auth.optional,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.content');
      }
    );

    // Search suggestions and autocomplete
    this.app.get('/suggestions', 
      auth.optional,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.suggestions');
      }
    );

    // Search analytics (authenticated only)
    this.app.get('/search/analytics', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.analytics');
      }
    );

    // Saved searches
    this.app.get('/searches/saved', 
      auth.required,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.getSaved');
      }
    );

    this.app.post('/searches/saved', 
      auth.required,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.saveSearch');
      }
    );

    this.app.delete('/searches/saved/:searchId', 
      auth.required,
      async (req, res) => {
        await this.handleRequestWithTracing(req, res, 'search.deleteSaved');
      }
    );

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      const span = this.tracer ? this.tracer.getActiveSpans().find(s => s.getContext().spanId === req.traceContext?.spanId) : null;
      
      if (span) {
        span.logError(error);
        span.finish();
      }

      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        correlationId: req.correlationId,
        service: this.config.serviceName
      });

      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An internal error occurred'
        },
        meta: {
          requestId: req.requestId,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          service: this.config.serviceName
        }
      });
    });
  }

  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';
    
    switch (operationName) {
      case 'search.universal':
        return this.universalSearch(request.query, request.user);
      case 'search.jobs':
        return this.searchJobs(request.query, request.user);
      case 'search.profiles':
        return this.searchProfiles(request.query, request.user);
      case 'search.companies':
        return this.searchCompanies(request.query, request.user);
      case 'search.content':
        return this.searchContent(request.query, request.user);
      case 'search.suggestions':
        return this.getSuggestions(request.query);
      case 'search.analytics':
        return this.getSearchAnalytics(request.query, request.user);
      case 'search.getSaved':
        return this.getSavedSearches(request.user.userId);
      case 'search.saveSearch':
        return this.saveSearch(request.user.userId, request.body);
      case 'search.deleteSaved':
        return this.deleteSavedSearch(request.params.searchId, request.user.userId);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  // Universal search implementation
  async universalSearch(query, user) {
    return this.executeWithTracing('search.universal.process', async () => {
      await this.database.initialize();

      const { q: searchTerm, types = ['jobs', 'profiles', 'companies'], limit = 20, offset = 0 } = query;

      if (!searchTerm || searchTerm.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      const results = {};
      const searchVector = `plainto_tsquery('english', $1)`;

      // Search jobs
      if (types.includes('jobs')) {
        const jobResults = await this.database.query(`
          SELECT 
            id,
            title,
            description,
            company_id,
            location,
            employment_type,
            salary_min,
            salary_max,
            posted_at,
            ts_rank(search_vector, ${searchVector}) as relevance_score
          FROM jobs 
          WHERE search_vector @@ ${searchVector} AND is_active = TRUE
          ORDER BY relevance_score DESC, posted_at DESC
          LIMIT $2 OFFSET $3
        `, [searchTerm, limit, offset]);

        results.jobs = {
          items: jobResults.rows,
          total: jobResults.rows.length,
          type: 'jobs'
        };
      }

      // Search profiles (authenticated users only)
      if (types.includes('profiles') && user) {
        const profileResults = await this.database.query(`
          SELECT 
            id,
            first_name,
            last_name,
            headline,
            bio,
            location,
            company_id,
            ts_rank(search_vector, ${searchVector}) as relevance_score
          FROM users 
          WHERE search_vector @@ ${searchVector} AND id != $1
          ORDER BY relevance_score DESC
          LIMIT $2 OFFSET $3
        `, [user.userId, limit, offset]);

        results.profiles = {
          items: profileResults.rows,
          total: profileResults.rows.length,
          type: 'profiles'
        };
      }

      // Search companies
      if (types.includes('companies')) {
        const companyResults = await this.database.query(`
          SELECT 
            id,
            name,
            description,
            industry,
            size,
            headquarters,
            ts_rank(search_vector, ${searchVector}) as relevance_score
          FROM companies 
          WHERE search_vector @@ ${searchVector}
          ORDER BY relevance_score DESC
          LIMIT $2 OFFSET $3
        `, [searchTerm, limit, offset]);

        results.companies = {
          items: companyResults.rows,
          total: companyResults.rows.length,
          type: 'companies'
        };
      }

      // Record search analytics
      await this.recordSearch(searchTerm, types, user?.userId);

      return {
        query: searchTerm,
        results,
        totalCounts: Object.keys(results).reduce((acc, type) => {
          acc[type] = results[type].total;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
    });
  }

  async searchJobs(query, user) {
    return this.executeWithTracing('search.jobs.process', async () => {
      await this.database.initialize();

      const {
        q: searchTerm,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        company,
        limit = 20,
        offset = 0,
        sortBy = 'relevance'
      } = query;

      const whereConditions = ['is_active = TRUE'];
      const queryParams = [];
      let paramIndex = 1;

      // Text search
      if (searchTerm) {
        whereConditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // Location filter
      if (location) {
        whereConditions.push(`location ILIKE $${paramIndex}`);
        queryParams.push(`%${location}%`);
        paramIndex++;
      }

      // Employment type filter
      if (employmentType) {
        whereConditions.push(`employment_type = $${paramIndex}`);
        queryParams.push(employmentType);
        paramIndex++;
      }

      // Experience level filter
      if (experienceLevel) {
        whereConditions.push(`experience_level = $${paramIndex}`);
        queryParams.push(experienceLevel);
        paramIndex++;
      }

      // Salary range filter
      if (salaryMin) {
        whereConditions.push(`salary_min >= $${paramIndex}`);
        queryParams.push(salaryMin);
        paramIndex++;
      }

      if (salaryMax) {
        whereConditions.push(`salary_max <= $${paramIndex}`);
        queryParams.push(salaryMax);
        paramIndex++;
      }

      // Company filter
      if (company) {
        whereConditions.push(`company_id IN (SELECT id FROM companies WHERE name ILIKE $${paramIndex})`);
        queryParams.push(`%${company}%`);
        paramIndex++;
      }

      // Order by
      let orderBy = 'posted_at DESC';
      if (searchTerm && sortBy === 'relevance') {
        orderBy = `ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, posted_at DESC`;
      } else if (sortBy === 'salary') {
        orderBy = 'salary_max DESC NULLS LAST';
      }

      const searchQuery = `
        SELECT 
          id,
          title,
          description,
          company_id,
          location,
          employment_type,
          experience_level,
          salary_min,
          salary_max,
          salary_currency,
          posted_at,
          CASE 
            WHEN search_vector @@ plainto_tsquery('english', $1) THEN 
              ts_rank(search_vector, plainto_tsquery('english', $1))
            ELSE 0
          END as relevance_score
        FROM jobs
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await this.database.query(searchQuery, queryParams);

      return {
        jobs: result.rows,
        query: { ...query, limit: parseInt(limit), offset: parseInt(offset) },
        total: result.rows.length,
        timestamp: new Date().toISOString()
      };
    });
  }

  async searchProfiles(query, user) {
    return this.executeWithTracing('search.profiles.process', async () => {
      if (!user) {
        throw new Error('Authentication required for profile search');
      }

      await this.database.initialize();

      const {
        q: searchTerm,
        location,
        company,
        skills,
        limit = 20,
        offset = 0
      } = query;

      const whereConditions = ['u.id != $1'];
      const queryParams = [user.userId];
      let paramIndex = 2;

      // Text search
      if (searchTerm) {
        whereConditions.push(`u.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // Location filter
      if (location) {
        whereConditions.push(`u.location ILIKE $${paramIndex}`);
        queryParams.push(`%${location}%`);
        paramIndex++;
      }

      // Company filter
      if (company) {
        whereConditions.push(`c.name ILIKE $${paramIndex}`);
        queryParams.push(`%${company}%`);
        paramIndex++;
      }

      // Skills filter
      if (skills && skills.length > 0) {
        const skillConditions = skills.map(() => `u.skills && $${paramIndex}`).join(' OR ');
        whereConditions.push(`(${skillConditions})`);
        skills.forEach(skill => {
          queryParams.push(skill);
          paramIndex++;
        });
      }

      const searchQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.headline,
          u.bio,
          u.location,
          u.avatar_url,
          c.name as company_name,
          u.created_at,
          CASE 
            WHEN u.search_vector @@ plainto_tsquery('english', $2) THEN 
              ts_rank(u.search_vector, plainto_tsquery('english', $2))
            ELSE 0
          END as relevance_score
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY relevance_score DESC, u.first_name, u.last_name
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await this.database.query(searchQuery, queryParams);

      return {
        profiles: result.rows,
        query: { ...query, limit: parseInt(limit), offset: parseInt(offset) },
        total: result.rows.length,
        timestamp: new Date().toISOString()
      };
    });
  }

  async searchCompanies(query, user) {
    return this.executeWithTracing('search.companies.process', async () => {
      await this.database.initialize();

      const {
        q: searchTerm,
        industry,
        size,
        location,
        limit = 20,
        offset = 0
      } = query;

      const whereConditions = [];
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

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const searchQuery = `
        SELECT 
          id,
          name,
          description,
          industry,
          size,
          headquarters,
          website,
          founded_year,
          CASE 
            WHEN search_vector @@ plainto_tsquery('english', $1) THEN 
              ts_rank(search_vector, plainto_tsquery('english', $1))
            ELSE 0
          END as relevance_score
        FROM companies
        ${whereClause}
        ORDER BY relevance_score DESC, name ASC
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await this.database.query(searchQuery, queryParams);

      return {
        companies: result.rows,
        query: { ...query, limit: parseInt(limit), offset: parseInt(offset) },
        total: result.rows.length,
        timestamp: new Date().toISOString()
      };
    });
  }

  async searchContent(query, user) {
    return this.executeWithTracing('search.content.process', async () => {
      // This would search through user-generated content like posts, articles, etc.
      // For now, return a placeholder
      
      return {
        content: [],
        query: { ...query },
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'Content search coming soon'
      };
    });
  }

  async getSuggestions(query) {
    return this.executeWithTracing('search.suggestions.process', async () => {
      const { q: partialTerm, type = 'all', limit = 10 } = query;

      if (!partialTerm || partialTerm.length < 2) {
        return { suggestions: [] };
      }

      const suggestions = [];

      // Job title suggestions
      if (type === 'all' || type === 'jobs') {
        const jobTitles = await this.database.query(`
          SELECT DISTINCT title 
          FROM jobs 
          WHERE title ILIKE $1 AND is_active = TRUE
          ORDER BY COUNT(*) DESC
          LIMIT $2
        `, [`%${partialTerm}%`, limit]);

        suggestions.push(...jobTitles.rows.map(row => ({
          text: row.title,
          type: 'job_title'
        })));
      }

      // Company suggestions
      if (type === 'all' || type === 'companies') {
        const companies = await this.database.query(`
          SELECT name 
          FROM companies 
          WHERE name ILIKE $1
          ORDER BY name ASC
          LIMIT $2
        `, [`%${partialTerm}%`, limit]);

        suggestions.push(...companies.rows.map(row => ({
          text: row.name,
          type: 'company'
        })));
      }

      return {
        suggestions: suggestions.slice(0, limit),
        query: partialTerm,
        type
      };
    });
  }

  async getSearchAnalytics(query, user) {
    return this.executeWithTracing('search.analytics.process', async () => {
      await this.database.initialize();

      const { period = '7d', type = 'all' } = query;

      // Get analytics data
      const analyticsQuery = `
        SELECT 
          DATE(searched_at) as date,
          COUNT(*) as searches,
          COUNT(DISTINCT user_id) as unique_users
        FROM search_analytics
        WHERE searched_at >= NOW() - INTERVAL '${period}'
        ${type !== 'all' ? "AND search_type = $1" : ''}
        GROUP BY DATE(searched_at)
        ORDER BY date DESC
      `;

      const result = await this.database.query(
        analyticsQuery, 
        type !== 'all' ? [type] : []
      );

      return {
        analytics: result.rows,
        period,
        type,
        timestamp: new Date().toISOString()
      };
    });
  }

  async getSavedSearches(userId) {
    return this.executeWithTracing('search.getSaved.process', async () => {
      await this.database.initialize();

      const result = await this.database.query(`
        SELECT * FROM saved_searches
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);

      return {
        savedSearches: result.rows,
        total: result.rows.length
      };
    });
  }

  async saveSearch(userId, searchData) {
    return this.executeWithTracing('search.save.process', async () => {
      await this.database.initialize();

      const { name, query, filters } = searchData;

      const savedSearch = await this.database.insert('saved_searches', {
        user_id: userId,
        name,
        query,
        filters,
        created_at: new Date()
      });

      return {
        savedSearch: {
          id: savedSearch.id,
          name,
          query,
          filters,
          createdAt: savedSearch.created_at
        }
      };
    });
  }

  async deleteSavedSearch(searchId, userId) {
    return this.executeWithTracing('search.deleteSaved.process', async () => {
      await this.database.initialize();

      const result = await this.database.query(`
        DELETE FROM saved_searches
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [searchId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Saved search not found');
      }

      return {
        success: true
      };
    });
  }

  async recordSearch(searchTerm, types, userId) {
    try {
      await this.database.query(`
        INSERT INTO search_analytics (search_term, search_type, user_id, searched_at)
        VALUES ($1, $2, $3, NOW())
      `, [searchTerm, types.join(','), userId]);
    } catch (error) {
      // Log error but don't fail the search
      this.logger.warn('Failed to record search analytics:', error.message);
    }
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('search-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        this.logger.info(`🔍 Search Service running on port ${this.config.port}`);
        this.logger.info(`📍 Environment: ${this.config.environment}`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Search service started successfully');
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
    const shutdownSpan = this.tracer ? this.tracer.startSpan('search-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        this.logger.info('🛑 Search Service stopped');
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

module.exports = { SearchService };

// Auto-start if this is the main module
if (require.main === module) {
  const searchService = new SearchService();

  searchService.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    this.logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await searchService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    this.logger.info('🛑 SIGINT received, shutting down gracefully...');
    await searchService.stop();
    process.exit(0);
  });
}