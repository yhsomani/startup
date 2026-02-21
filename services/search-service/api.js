/**
 * TalentSphere Search Service API
 * REST API for advanced search functionality
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ElasticsearchService = require('./elasticsearch-service');

class SearchServiceAPI {
    constructor(elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.'
            }
        });

        this.app.use(limiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'search-service',
                dependencies: {
                    elasticsearch: this.elasticsearchService.initialized ? 'connected' : 'disconnected'
                }
            });
        });

        // Search jobs
        this.app.get('/api/v1/search/jobs', async (req, res) => {
            try {
                const criteria = {
                    query: req.query.q || req.query.query,
                    location: req.query.location,
                    salaryMin: req.query.salary_min ? parseFloat(req.query.salary_min) : undefined,
                    salaryMax: req.query.salary_max ? parseFloat(req.query.salary_max) : undefined,
                    employmentType: req.query.employment_type,
                    experienceLevel: req.query.experience_level,
                    skills: req.query.skills ? req.query.skills.split(',') : undefined,
                    company: req.query.company,
                    datePosted: req.query.date_posted,
                    sortBy: req.query.sort_by,
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20
                };

                const result = await this.elasticsearchService.searchJobs(criteria);

                res.json({
                    success: result.success,
                    data: result.hits,
                    pagination: {
                        page: criteria.page,
                        limit: criteria.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / criteria.limit)
                    },
                    aggregations: result.aggregations,
                    took: result.took
                });
            } catch (error) {
                console.error('Error in job search:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during job search',
                    message: error.message
                });
            }
        });

        // Search users
        this.app.get('/api/v1/search/users', async (req, res) => {
            try {
                const criteria = {
                    query: req.query.q || req.query.query,
                    skills: req.query.skills ? req.query.skills.split(',') : undefined,
                    location: req.query.location,
                    experienceLevel: req.query.experience_level,
                    availability: req.query.availability ? req.query.availability === 'true' : undefined,
                    sortBy: req.query.sort_by,
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20
                };

                const result = await this.elasticsearchService.searchUsers(criteria);

                res.json({
                    success: result.success,
                    data: result.hits,
                    pagination: {
                        page: criteria.page,
                        limit: criteria.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / criteria.limit)
                    },
                    took: result.took
                });
            } catch (error) {
                console.error('Error in user search:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during user search',
                    message: error.message
                });
            }
        });

        // Index job
        this.app.post('/api/v1/search/jobs', async (req, res) => {
            try {
                const { id, ...jobData } = req.body;

                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Job ID is required'
                    });
                }

                const result = await this.elasticsearchService.indexDocument('jobs', id, jobData);

                res.json({
                    success: result.success,
                    id: result.id,
                    version: result.version,
                    result: result.result
                });
            } catch (error) {
                console.error('Error indexing job:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during job indexing',
                    message: error.message
                });
            }
        });

        // Index user
        this.app.post('/api/v1/search/users', async (req, res) => {
            try {
                const { id, ...userData } = req.body;

                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'User ID is required'
                    });
                }

                const result = await this.elasticsearchService.indexDocument('users', id, userData);

                res.json({
                    success: result.success,
                    id: result.id,
                    version: result.version,
                    result: result.result
                });
            } catch (error) {
                console.error('Error indexing user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during user indexing',
                    message: error.message
                });
            }
        });

        // Index application
        this.app.post('/api/v1/search/applications', async (req, res) => {
            try {
                const { id, ...applicationData } = req.body;

                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Application ID is required'
                    });
                }

                const result = await this.elasticsearchService.indexDocument('applications', id, applicationData);

                res.json({
                    success: result.success,
                    id: result.id,
                    version: result.version,
                    result: result.result
                });
            } catch (error) {
                console.error('Error indexing application:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during application indexing',
                    message: error.message
                });
            }
        });

        // Bulk index jobs
        this.app.post('/api/v1/search/jobs/bulk', async (req, res) => {
            try {
                const jobs = req.body;

                if (!Array.isArray(jobs)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Request body must be an array of jobs'
                    });
                }

                const result = await this.elasticsearchService.bulkIndex('jobs', jobs);

                res.json({
                    success: result.success,
                    took: result.took,
                    errors: result.errors,
                    items: result.items
                });
            } catch (error) {
                console.error('Error bulk indexing jobs:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during bulk job indexing',
                    message: error.message
                });
            }
        });

        // Get job by ID
        this.app.get('/api/v1/search/jobs/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await this.elasticsearchService.getDocument('jobs', id);

                if (!result.success) {
                    if (result.found === false) {
                        return res.status(404).json({
                            success: false,
                            error: 'Job not found'
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }

                res.json({
                    success: result.success,
                    data: result.source
                });
            } catch (error) {
                console.error('Error getting job:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during job retrieval',
                    message: error.message
                });
            }
        });

        // Get user by ID
        this.app.get('/api/v1/search/users/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await this.elasticsearchService.getDocument('users', id);

                if (!result.success) {
                    if (result.found === false) {
                        return res.status(404).json({
                            success: false,
                            error: 'User not found'
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }

                res.json({
                    success: result.success,
                    data: result.source
                });
            } catch (error) {
                console.error('Error getting user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during user retrieval',
                    message: error.message
                });
            }
        });

        // Update job
        this.app.put('/api/v1/search/jobs/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const jobData = req.body;

                const result = await this.elasticsearchService.updateDocument('jobs', id, jobData);

                res.json({
                    success: result.success,
                    id: result.id,
                    version: result.version,
                    result: result.result
                });
            } catch (error) {
                console.error('Error updating job:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during job update',
                    message: error.message
                });
            }
        });

        // Update user
        this.app.put('/api/v1/search/users/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const userData = req.body;

                const result = await this.elasticsearchService.updateDocument('users', id, userData);

                res.json({
                    success: result.success,
                    id: result.id,
                    version: result.version,
                    result: result.result
                });
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during user update',
                    message: error.message
                });
            }
        });

        // Delete job
        this.app.delete('/api/v1/search/jobs/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await this.elasticsearchService.deleteDocument('jobs', id);

                res.json({
                    success: result.success,
                    result: result.result
                });
            } catch (error) {
                console.error('Error deleting job:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during job deletion',
                    message: error.message
                });
            }
        });

        // Delete user
        this.app.delete('/api/v1/search/users/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await this.elasticsearchService.deleteDocument('users', id);

                res.json({
                    success: result.success,
                    result: result.result
                });
            } catch (error) {
                console.error('Error deleting user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during user deletion',
                    message: error.message
                });
            }
        });

        // Faceted search endpoint
        this.app.get('/api/v1/search/facets', async (req, res) => {
            try {
                const query = req.query.q || req.query.query || '*';

                // Perform a search with aggregations to get facets
                const searchQuery = {
                    query: {
                        multi_match: {
                            query: query,
                            fields: ['title^3', 'description^2', 'requirements', 'company^2', 'skills'],
                            type: 'best_fields',
                            fuzziness: 'AUTO'
                        }
                    }
                };

                const result = await this.elasticsearchService.search('jobs', searchQuery, {
                    size: 0, // Don't return actual results, just aggregations
                    aggregations: {
                        employment_types: {
                            terms: { field: 'employmentType' }
                        },
                        experience_levels: {
                            terms: { field: 'experienceLevel' }
                        },
                        companies: {
                            terms: { field: 'company.raw' }
                        },
                        locations: {
                            terms: { field: 'location.raw' }
                        },
                        salary_ranges: {
                            range: {
                                field: 'salary',
                                ranges: [
                                    { to: 50000 },
                                    { from: 50000, to: 75000 },
                                    { from: 75000, to: 100000 },
                                    { from: 100000 }
                                ]
                            }
                        }
                    }
                });

                res.json({
                    success: result.success,
                    facets: result.aggregations,
                    total: result.total
                });
            } catch (error) {
                console.error('Error in facet search:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during facet search',
                    message: error.message
                });
            }
        });

        // Autocomplete endpoint
        this.app.get('/api/v1/search/autocomplete', async (req, res) => {
            try {
                const { q, type = 'job' } = req.query;

                if (!q) {
                    return res.status(400).json({
                        success: false,
                        error: 'Query parameter "q" is required'
                    });
                }

                let index;
                let field;

                switch (type) {
                    case 'job':
                    case 'jobs':
                        index = 'jobs';
                        field = 'title.autocomplete';
                        break;
                    case 'company':
                    case 'companies':
                        index = 'jobs';
                        field = 'company.autocomplete';
                        break;
                    default:
                        index = 'jobs';
                        field = 'title.autocomplete';
                }

                // Use Elasticsearch's completion suggester
                const result = await this.elasticsearchService.client.search({
                    index,
                    body: {
                        suggest: {
                            text: q,
                            completion_suggest: {
                                completion: {
                                    field,
                                    size: 10,
                                    skip_duplicates: true
                                }
                            }
                        }
                    }
                });

                const suggestions = result.suggest.completion_suggest[0]?.options?.map(option => ({
                    text: option.text,
                    score: option.score
                })) || [];

                res.json({
                    success: true,
                    suggestions,
                    query: q,
                    type
                });
            } catch (error) {
                console.error('Error in autocomplete search:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during autocomplete search',
                    message: error.message
                });
            }
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3004) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`Search API server running on port ${port}`);
                resolve();
            });
        });
    }

    /**
     * Get the express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = SearchServiceAPI;