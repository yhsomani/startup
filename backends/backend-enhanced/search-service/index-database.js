/**
 * Production Search Service
 * 
 * Complete search functionality with:
 * - Database persistence
 * - Real-time indexing
 * - Advanced search algorithms
 * - Inter-service communication
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../../../../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../../shared/validation');
const { ServiceContract } = require('../../../../shared/contracts');
const { getServiceClient } = require('../../../../shared/production-service-client');
const BaseRepository = require('../../../../shared/base-repository');
const DatabaseConnectionPool = require('../../../../shared/database-connection-pool');
const { createLogger } = require('../../../../shared/logger');

class SearchService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'search-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.SEARCH_PORT || 3008,
      tracing: {
        enabled: true,
        samplingRate: 1.0
      },
      validation: {
        strict: true,
        autoValidate: true
      },
      circuitBreaker: {
        timeout: 5000,
        maxFailures: 3,
        resetTimeout: 30000
      },
      errorRecovery: {
        maxRetries: 3,
        baseDelay: 1000
      }
    });

    // Initialize database and repositories
    this.dbManager = new DatabaseManager('search-service');
    this.searchIndexRepository = new BaseRepository('search_index', 'search-service');
    this.searchHistoryRepository = new BaseRepository('search_history', 'search-service');
    this.searchAnalyticsRepository = new BaseRepository('search_analytics', 'search-service');

    // Initialize service clients
    this.initializeServiceClients();

    // Initialize service contracts
    this.initializeContracts();

    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();

    this.logger = createLogger('SearchService');
  }

  /**
   * Initialize service clients for inter-service communication
   */
  initializeServiceClients() {
    this.userServiceClient = getServiceClient('user-service');
    this.jobServiceClient = getServiceClient('job-service');
    this.companyServiceClient = getServiceClient('company-service');
    this.notificationServiceClient = getServiceClient('notification-service');
    this.analyticsServiceClient = getServiceClient('analytics-service');
  }

  /**
   * Initialize service contracts
   */
  initializeContracts() {
    this.serviceContract = new ServiceContract('search-service');

    // Search operation schema
    this.serviceContract.defineOperation('search', {
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1 },
          filters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['user', 'job', 'company'],
                default: 'all'
              },
              location: {
                type: 'object',
                properties: {
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  coordinates: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', minimum: -90, maximum: 90 },
                      lng: { type: 'number', minimum: -180, maximum: 180 }
                    }
                  }
                }
              },
              experienceLevel: {
                type: 'string',
                enum: ['entry', 'mid', 'senior', 'executive']
              },
              salaryMin: { type: 'number', minimum: 0 },
              salaryMax: { type: 'number', minimum: 0 },
              skills: {
                type: 'array',
                items: { type: 'string' }
              },
              postedWithin: {
                type: 'string',
                enum: ['1h', '24h', '7d', '30d', '90d']
              },
              companySize: {
                type: 'string',
                enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
              offset: { type: 'number', minimum: 0, default: 0 },
              sortBy: {
                type: 'string',
                enum: ['relevance', 'posted', 'salary', 'title', 'company']
              }
            }
          },
          preferences: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              location: { type: 'object' },
              experienceLevel: { type: 'string' },
              remoteWork: { type: 'boolean', default: false }
            }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: { type: 'object' }
              },
              total: { type: 'number' },
              pagination: {
                type: 'object'
              },
              suggestions: { type: 'array' }
            }
          }
        }
      }
    });
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many search requests'
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();

      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);

      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getServiceHealth();
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Search endpoints
    this.app.post('/search', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'search.search', {
        inputSchema: this.serviceContract.getOperationSchema('search')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('search')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    // Index management
    this.app.post('/index', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'search.index', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.delete('/index/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'search.deleteIndex', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Search analytics
    this.app.get('/analytics', async (req, res) => {
      try {
        const analytics = await this.getSearchAnalytics(req.query);
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Recommendations
    this.app.get('/recommendations/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'search.recommendations', {
        validateInput: false,
        validateOutput: false
      });
    });

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

  // Operation implementations
  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';

    switch (operationName) {
      case 'search.search':
        return this.performSearch(request.body);
      case 'search.index':
        return this.indexContent(request.body);
      case 'search.deleteIndex':
        return this.deleteIndexedContent(request.params.id);
      case 'search.recommendations':
        return this.getRecommendations(request.params.userId, request.query);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  /**
   * Perform search with advanced algorithms
   */
  async performSearch(searchQuery) {
    return this.executeWithTracing('search.perform', async () => {
      const { query, filters, preferences, pagination } = searchQuery;

      // Build search query for database
      const searchSql = this.buildSearchQuery(query, filters, preferences);

      // Execute search with pagination
      const results = await this.searchIndexRepository.query(searchSql);

      // Process and enhance results
      const processedResults = await this.processSearchResults(results, query, preferences);

      // Record search analytics
      await this.recordSearchAnalytics(searchQuery, processedResults);

      return {
        results: processedResults.hits,
        total: processedResults.total,
        pagination: processedResults.pagination,
        suggestions: processedResults.suggestions,
        searchId: uuidv4()
      };
    });
  }

  /**
   * Index content for search
   */
  async indexContent(indexData) {
    return this.executeWithTracing('search.indexContent.process', async () => {
      const { type, id, content, metadata, title } = indexData;

      // Validate index data
      if (!type || !id || !content) {
        throw new Error('Missing required index data: type, id, or content');
      }

      // Parse and analyze content
      const parsedContent = await this.parseContent(content);

      // Create search index record
      const indexRecord = {
        id,
        type,
        title: title || `${type} - ${id}`,
        content,
        parsedContent,
        metadata: metadata || {},
        url: metadata.url || `/content/${type}/${id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        searchWeight: 1.0
      };

      const createdIndex = await this.searchIndexRepository.create(indexRecord);

      // Index in database
      this.logger.info(`Indexed content: ${type} - ${id}`, {
        type,
        id,
        searchWeight: indexRecord.searchWeight
      });

      return { success: true, index: createdIndex };
    });
  }

  /**
   * Delete indexed content
   */
  async deleteIndexedContent(indexId) {
    return this.executeWithTracing('search.deleteIndex.process', async () => {
      // Delete from database
      const deletedIndex = await this.searchIndexRepository.delete(indexId);

      this.logger.info(`Deleted index: ${indexId}`, { indexId });

      return { success: !!deletedIndex };
    });
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(userId, options = {}) {
    return this.executeWithTracing('search.recommendations.process', async () => {
      try {
        // Get user profile and preferences
        const userProfile = await this.userServiceClient.get('user-service', `/profile/${userId}`);

        if (!userProfile || !userProfile.data.success) {
          return {
            recommendations: [],
            total: 0
          };
        }

        const profile = userProfile.data;

        // Get user's recent search history
        const recentSearches = await this.searchHistoryRepository.find(
          { userId: userId },
          { limit: 10, orderBy: 'created_at DESC' }
        );

        // Get active skills from user profile
        const userSkills = profile.skills?.map(s => s.skillName) || [];

        // Get matching jobs based on user profile
        const matchingJobs = await this.findMatchingJobs(userSkills, profile.experienceLevel, profile.location);

        // Get company recommendations
        const companyMatches = await this.findCompanyMatches(profile.preferences, profile.location);

        // Combine and rank recommendations
        const recommendations = this.rankRecommendations(
          matchingJobs,
          companyMatches,
          userSkills,
          recentSearches,
          options
        );

        // Record recommendation analytics
        await this.recordRecommendationAnalytics(userId, recommendations);

        return {
          recommendations,
          total: recommendations.length,
          userId
          generatedAt: new Date().toISOString()
        };

      } catch (error) {
        this.logger.error('Error getting recommendations', {
          userId,
          error: error.message
        });

        return {
          recommendations: [],
          total: 0,
          userId,
          generatedAt: new Date().toISOString()
        };
      }
    });
  }

  /**
   * Process search results with enhancement
   */
  async processSearchResults(results, query, preferences) {
    const { hits, total } = results;

    // Apply filters and sorting
    let processedHits = this.applyFilters(hits, query.filters);
    processedHits = this.applySorting(processedHits, query.sortBy);

    // Add search relevance scoring
    processedHits = await this.addRelevanceScores(processedHits, query.query, preferences);

    // Add location-based scoring if location preference
    if (preferences?.location) {
      processedHits = await this.addLocationScores(processedHits, preferences.location);
    }

    // Paginate results
    const pagination = this.applyPagination(processedHits, query.pagination);

    return {
      hits: processedHits,
      total,
      pagination
    };
  }

  /**
   * Apply filters to search results
   */
  applyFilters(hits, filters = {}) {
    if (!filters) return hits;

    let filteredHits = [...hits];

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      filteredHits = filteredHits.filter(hit => hit.type === filters.type);
    }

    // Filter by location
    if (filters.location) {
      const { city, state, country, coordinates } = filters.location;
      filteredHits = filteredHits.filter(hit => {
        if (city && hit.city !== city) return false;
        if (state && hit.state !== state) return false;
        if (country && hit.country !== country) return false;

        // Filter by distance if coordinates provided
        if (coordinates && coordinates.lat && coordinates.lng && hit.coordinates) {
          const distance = this.calculateDistance(coordinates, hit.coordinates);
          if (filters.maxDistance && distance > filters.maxDistance) return false;
        }
      });
    }

    // Filter by experience level
    if (filters.experienceLevel) {
      filteredHits = filteredHits.filter(hit =>
        this.experienceLevelMatch(hit.experienceLevel, filters.experienceLevel)
      );
    }

    // Filter by salary range
    if (filters.salaryMin || filters.salaryMax) {
      filteredHits = filteredHits.filter(hit => {
        const salary = hit.salary?.min || 0;
        if (filters.salaryMin && salary < filters.salaryMin) return false;
        if (filters.salaryMax && salary > filters.salaryMax) return false;
      });
    }

    // Filter by skills
    if (filters.skills && filters.skills.length > 0) {
      const requiredSkills = filters.skills.map(s => s.toLowerCase());
      filteredHits = filteredHits.filter(hit => {
        const hitSkills = (hit.skills || []).map(s => s.toLowerCase());
        return requiredSkills.some(skill =>
          hitSkills.includes(skill) || hitSkills.some(hitSkill =>
            hitSkill.includes(skill) || skill.includes(hitSkill)
          )
        );
      });
    }

    return filteredHits;
  }

  /**
   * Apply sorting to search results
   */
  applySorting(hits, sortBy) {
    switch (sortBy) {
      case 'relevance':
        return hits.sort((a, b) => b.score - a.score);
      case 'posted':
        return hits.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
      case 'salary':
        return hits.sort((a, b) => (b.salary?.max || 0) - (a.salary?.max || 0));
      case 'title':
        return hits.sort((a, b) => a.title.localeCompare(b.title));
      case 'company':
        return hits.sort((a, b) => a.company.name.localeCompare(b.company.name));
      default:
        return hits.sort((a, b) => b.score - a.score);
    }
    return hits;
  }

  /**
   * Add relevance scoring to search hits
   */
  async addRelevanceScores(hits, query, preferences = {}) {
    return Promise.all(hits.map(async (hit) => {
      let score = 0;

      // Base score from database
      score += hit.searchWeight || 1.0;

      // Query term matching
      if (query) {
        const queryLower = query.toLowerCase();

        // Title matching (high weight)
        if (hit.title && hit.title.toLowerCase().includes(queryLower)) {
          score += 30;
        }

        // Description matching (medium weight)
        if (hit.description && hit.description.toLowerCase().includes(queryLower)) {
          score += 20;
        }

        // Skills matching
        if (query.skills && hit.skills) {
          const querySkills = query.skills.map(s => s.toLowerCase());
          const hitSkills = (hit.skills || []).map(s => s.toLowerCase());
          const skillMatches = querySkills.filter(skill =>
            hitSkills.includes(skill) || skill.includes(skill)
          );
          score += skillMatches.length * 10;
        }
      }

      // Location preference (if location is specified)
      if (preferences.location && hit.location) {
        score += 15;
      }

      // Recent activity boost
      if (hit.isActive && hit.postedAt) {
        const daysSincePosted = (Date.now() - new Date(hit.postedAt)) / (1000 * 60 * 24);
        if (daysSincePosted < 7) score += 10;
      }

      hit.relevanceScore = Math.round(score);
      return hit;
    }));
  }

  /**
   * Add location-based scoring to hits
   */
  async addLocationScores(hits, locationPreference) {
    if (!locationPreference || !hits.length) return hits;

    const { coordinates } = locationPreference;
    if (!coordinates) {
      return hits;
    }

    return Promise.all(hits.map(async (hit) => {
      if (!hit.coordinates || !coordinates) {
        return hit;
      }

      const distance = this.calculateDistance(coordinates, hit.coordinates);
      const maxDistance = 50; // 50km max

      // Score based on distance (closer is better)
      if (distance <= 10) hit.locationScore += 20;
      else if (distance <= 25) hit.locationScore += 10;
      else if (distance <= 50) hit.locationScore += 5;

      return hit;
    }));
  }

  /**
   * Calculate distance between coordinates
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;

    const R = 6371; // Earth's radius in km

    // Haversine formula
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.pow(Math.sin(dLat / 2), 2);
    const c = Math.cos(dLat / 2);
    const d = Math.cos(dLon / 2);

    const distance = R * Math.acos(c) * Math.asin(a) + Math.asin(b) * Math.cos(c));

    return distance;
  }

  /**
   * Experience level matching
   */
  experienceLevelMatch(userLevel, filterLevel) {
    const levels = ['entry', 'mid', 'senior', 'executive'];
    const userIndex = levels.indexOf(userLevel);
    const filterIndex = levels.indexOf(filterLevel);

    if (filterIndex === -1) return true;
    return userIndex >= filterIndex;
  }

  /**
   * Apply pagination
   */
  applyPagination(hits, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    const start = offset;
    const end = start + limit;

    return hits.slice(start, end);
  }

  /**
   * Find matching jobs for user recommendations
   */
  async findMatchingJobs(userSkills, experienceLevel, location) {
    try {
      // Call job service with user criteria
      const response = await this.jobServiceClient.post('job-service', {
        skills: userSkills,
        experienceLevel,
        location,
        limit: 20
      }, '/jobs/match');

      return response.data || [];
    } catch (error) {
      this.logger.error('Error finding matching jobs', {
        error: error.message,
        userSkills,
        experienceLevel,
        location
      });
      return [];
    }
  }

  /**
   * Find matching companies
   */
  async findCompanyMatches(preferences, location) {
    try {
      const response = await this.companyServiceClient.post('company-service', {
        industry: preferences.industry,
        size: preferences.companySize,
        location,
        limit: 10
      }, '/companies/match');

      return response.data || [];
    } catch (error) {
      this.logger.error('Error finding company matches', { error: error.message });
      return [];
    }
  }

  /**
   * Parse content for indexing
   */
  async parseContent(content) {
    try {
      // Parse different content types
      if (typeof content === 'string') {
        return {
          text: content,
          words: content.toLowerCase().split(/\s+/),
          entities: [],
          metadata: {}
        };
      }

      // Parse HTML content
      if (typeof content === 'object' && content.type === 'text/html') {
        return {
          text: this.extractTextFromHTML(content),
          words: [],
          entities: [],
          metadata: {
            title: this.extractTitleFromHTML(content),
            description: this.extractDescriptionFromHTML(content)
          }
        };
      }

      // Parse JSON content
      if (typeof content === 'object') {
        return {
          text: content.text || content.description || '',
          words: (content.text || '').toLowerCase().split(/\s+/),
          entities: content.entities || [],
          metadata: content.metadata || {}
        };
      }

      return {
        text: '',
        words: [],
        entities: [],
        metadata: {}
      };
    } catch (error) {
      this.logger.error('Error parsing content', { error: error.message });
      return {
        text: '',
        words: [],
        entities: [],
        metadata: {}
      };
    }
  }

  /**
   * Extract text from HTML content
   */
  extractTextFromHTML(htmlContent) {
    // Remove HTML tags
    let text = htmlContent.replace(/<[^>]+>/g, '');

    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Extract title from HTML content
   */
  extractTitleFromHTML(htmlContent) {
    // Try to find title tag
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
    return titleMatch ? titleMatch[1] : '';
  }

  /**
   * Extract description from HTML content
   */
  extractDescriptionFromHTML(htmlContent) {
    // Remove HTML tags and script/style content
    const cleanContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '');

    // Look for meta description tag
    const descMatch = cleanContent.match(/<meta[^>]*name=["']([^"']+)["'][^"']+)["']/i);
    if (descMatch) {
      return descMatch[1];
    }

    // Look for description meta tag with property
    const descPropertyMatch = cleanContent.match(/<meta[^>]*property=["']og:description["]([^"]+)["'][^"]+)["']/i);
    if (descPropertyMatch) {
      return descPropertyMatch[1];
    }

    // Extract first paragraph
    const paragraphs = cleanContent.split('\n\n');
    if (paragraphs.length > 0) {
      return paragraphs[0].substring(0, 200); // First 200 chars
    }

    return '';
  }

  /**
   * Record search analytics
   */
  async recordSearchAnalytics(searchQuery, results) {
    return this.executeWithTracing('search.analytics', async () => {
      const analyticsData = {
        query: searchQuery.query,
        filters: searchQuery.filters,
        results: results.hits,
        total: results.total,
        pagination: results.pagination,
        timestamp: new Date().toISOString(),
        userId: searchQuery.preferences?.userId
      };

      await this.searchAnalyticsRepository.create(analyticsData);

      return { success: true };
    });
  }

  /**
   * Record recommendation analytics
   */
  async recordRecommendationAnalytics(userId, recommendations) {
    return this.executeWithTracing('search.recommendations.analytics', async () => {
      const analyticsData = {
        userId,
        recommendations: recommendations.recommendations,
        total: recommendations.total,
        timestamp: new Date().toISOString()
      };

      await this.searchAnalyticsRepository.create(analyticsData);

      return { success: true };
    });
  }

  /**
   * Build search query for database
   */
  buildSearchQuery(query, filters = {}, preferences = {}) {
    let sql = `
      SELECT * FROM search_index 
      WHERE is_active = true
    `;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Text search
    if (query?.query) {
      const searchTerms = query.query.split(' ').filter(term => term.trim());
      const textConditions = searchTerms.map(() => `content_tsvector plainto_tsquery('${searchTerms.join(' | ')}')`);
      conditions.push(`(${textConditions.join(' OR ')})`);
    }

    // Type filter
    if (filters?.type && filters.type !== 'all') {
      const typeConditions = Array.isArray(filters.type)
        ? `type IN (${filters.type.map((_, i) => `$${i + 1}`)`
        : `type = '${filters.type}'`;
      conditions.push(typeConditions);
    }

    // Location filter
    if (filters?.location) {
      const { city, state, country, coordinates } = filters.location;
      
      if (city) {
        conditions.push(`city = $${ paramIndex++} `);
        values.push(city);
      }
      if (state) {
        conditions.push(`state = $${ paramIndex++ } `);
        values.push(state);
      }
      if (country) {
        conditions.push(`country = $${ paramIndex++ } `);
        values.push(country);
      }
      if (coordinates) {
        conditions.push(`ST_DWithin(coordinates, ST_MakePoint(coordinates.lng, coordinates.lat, 50)`);
        values.push(coordinates.lng, coordinates.lat);
        values.push(50); // 50km radius
      }
    }

    // Experience level filter
    if (filters?.experienceLevel) {
      const experienceConditions = Array.isArray(filters.experienceLevel)
        ? `experience_level IN(${
          filters.experienceLevel.map((_, i) => `$${i + 1}`)`)
        : `experience_level = '${filters.experienceLevel}'`;
      conditions.push(experienceConditions);
    }

    // Skills filter
    if (filters?.skills && filters.skills.length > 0) {
      const skillConditions = filters.skills.map((_, i) => `$${ i + 1}`);
      const hasSkillQuery = `EXISTS(
            SELECT 1 FROM unnest(string_to_array(skills)) skills_table 
        WHERE skill = ANY(${ skillConditions.join(' OR ') })
          )`;
      conditions.push(hasSkillQuery);
    }

    // Salary range filter
    if (filters.salaryMin || filters.salaryMax) {
      if (filters.salaryMin) {
        conditions.push(`salary_min = $${ paramIndex++ } `);
        values.push(filters.salaryMin);
      }
      if (filters.salaryMax) {
        conditions.push(`salary_max = $${ paramIndex++ } `);
        values.push(filters.salaryMax);
      }
    }

    // Posted within filter
    if (filters.postedWithin) {
      const timeMap = {
        '1h': '1 hour',
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days'
      };

      if (filters.postedWithin && timeMap[filters.postedWithin]) {
          conditions.push(`created_at >= NOW() - INTERVAL '${timeMap[filters.postedWithin]}'`);
      }
    }

    // Company size filter
    if (filters.companySize && filters.companySize !== 'all') {
      const sizeConditions = Array.isArray(filters.companySize)
        ? `company_size IN(${
            filters.companySize.map((_, i) => `$${i + 1}`)`)
        : `company_size = '${filters.companySize}'`;
      conditions.push(sizeConditions);
    }

    // Active filter
    if (filters.isActive !== undefined) {
      conditions.push(`is_active = ${ filters.isActive !== false }`);
    }

    // Combine all conditions
    if (conditions.length > 0) {
      sql += ` AND ${ conditions.join(' AND ') }`;
    }

    // Add order by
    if (preferences?.sortBy) {
      switch (preferences.sortBy) {
        case 'relevance':
          sql += ' ORDER BY relevance_score DESC, search_weight DESC';
          break;
        case 'posted':
          sql += ' ORDER BY created_at DESC';
          break;
        case 'salary':
          sql += ' ORDER BY (salary_max DESC)';
          break;
        case 'title':
          sql += ' ORDER BY title ASC';
          break;
        case 'company':
          sql += 'ORDER BY company_name ASC';
          break;
        default:
          sql += ' ORDER BY relevance_score DESC, search_weight DESC';
      }
    }

    sql += ` LIMIT ${ preferences?.limit || 20}`;
    sql += ` OFFSET ${ preferences?.offset || 0}`;

    return { sql, values };
  }

  /**
   * Rank recommendations
   */
  rankRecommendations(jobs, companies, userSkills, recentSearches, options = {}) {
    let allRecommendations = [];

    // Add job recommendations
    if (jobs && jobs.length > 0) {
      const jobRecommendations = jobs.map(job => ({
        id: job.id,
        type: 'job',
        title: job.title,
        company: job.companyName,
        location: job.location,
        score: job.matchScore,
        salary: job.salary,
        logo: job.logoUrl,
        url: job.url,
        postedAt: job.postedAt
      }));
      allRecommendations.push(...jobRecommendations);
    }

    // Add company recommendations
    if (companies && companies.length > 0) {
      const companyRecommendations = companies.map(company => ({
        id: company.id,
        type: 'company',
        title: company.name,
        company: company.name,
        logo: company.logoUrl,
        location: company.location,
        score: 70, // Base score for companies
        industry: company.industry,
        size: company.size,
        website: company.website,
        rating: company.rating || 4.0
      }));
      allRecommendations.push(...companyRecommendations);
    }

    // Sort by score
    allRecommendations.sort((a, b) => b.score - a.score);

    // Apply business rules
    allRecommendations = this.applyBusinessRules(allRecommendations, options);

    return allRecommendations.slice(0, options.limit || 10);
  }

  /**
   * Apply business rules to recommendations
   */
  applyBusinessRules(recommendations, options = {}) {
    const { userId } = options;
    
    return recommendations.map(rec => {
      // Give preference boost for companies in user's preferred industries
      if (rec.type === 'company' && options.preferences?.industries?.includes(rec.industry)) {
        rec.score += 10;
      }

      // Give priority to remote work
      if (rec.type === 'job' && rec.remoteWork) {
        rec.score += 5;
      }

      // Boost recently active postings
      const postedAt = rec.postedAt ? new Date(rec.postedAt) : null;
      const hoursSincePosted = postedAt ? (Date.now() - postedAt.getTime()) / (1000 * 60 * 60) : 0;
      if (hoursSincePosted < 7) {
        rec.score += 3;
      }

      return rec;
    });
  }

  // Service lifecycle methods
  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('search-service.startup') : null;
    
    try {
      // Initialize database
      await this.searchIndexRepository.initialize();
      await this.searchHistoryRepository.initialize();
      await this.searchAnalyticsRepository.initialize();

      this.server = this.app.listen(this.config.port, () => {
        logger.info(`🔍 Search Service running on port ${ this.config.port }`);
        logger.info(`📍 Environment: ${ this.config.environment }`);
        logger.info(`🔍 Tracing: ${ this.config.tracing.enabled ? 'enabled' : 'disabled' }`);
        logger.info(`🗄️ Database: PostgreSQL connected`);
        logger.info(`🌐 Service Discovery: enabled`);
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
        await new Promise(resolve => {
          this.server.close(resolve);
        });
        logger.info('🛑 Search Service stopped');
      }

      // Close database connections
      await this.searchIndexRepository.close();
      await this.searchHistoryRepository.close();
      await this.searchAnalyticsRepository.close();

      if (shutdownSpan) {
        shutdownSpan.finish();
      }
    } catch (error) {
      if (shutdownSpan) {
        shutdownSpan.logError(error);
        shutdownSpan.finish();
      }
    }
  }
}

module.exports = {
  SearchService
};

// Auto-start if this is the main module
if (require.main === module) {
  const searchService = new SearchService();

  searchService.start().catch(console.error);

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await searchService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await searchService.stop();
    process.exit(0);
  });
}