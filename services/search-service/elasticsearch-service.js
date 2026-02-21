/**
 * TalentSphere Elasticsearch Service
 * Advanced search and indexing service with Elasticsearch integration
 */

const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
    constructor(options = {}) {
        this.options = {
            node: options.node || process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
            auth: {
                username: options.username || process.env.ELASTICSEARCH_USERNAME || 'elastic',
                password: options.password || process.env.ELASTICSEARCH_PASSWORD || 'changeme'
            },
            requestTimeout: options.requestTimeout || 30000,
            pingTimeout: options.pingTimeout || 3000,
            ...options
        };

        this.client = new Client({
            node: this.options.node,
            auth: this.options.auth,
            requestTimeout: this.options.requestTimeout,
            pingTimeout: this.options.pingTimeout
        });

        this.initialized = false;
    }

    /**
     * Initialize the Elasticsearch service
     */
    async initialize() {
        try {
            // Test connection
            await this.client.ping();

            // Create indices if they don't exist
            await this.createIndices();

            this.initialized = true;
            console.log('✅ Elasticsearch service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Elasticsearch service:', error.message);
            throw error;
        }
    }

    /**
     * Create indices with proper mappings
     */
    async createIndices() {
        const indices = {
            jobs: {
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        title: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' },
                                autocomplete: {
                                    type: 'completion',
                                    analyzer: 'simple'
                                }
                            }
                        },
                        description: { type: 'text', analyzer: 'standard' },
                        requirements: { type: 'text', analyzer: 'standard' },
                        company: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' }
                            }
                        },
                        location: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' },
                                geopoint: { type: 'geo_point' }
                            }
                        },
                        salary: { type: 'float' },
                        employmentType: { type: 'keyword' },
                        experienceLevel: { type: 'keyword' },
                        skills: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' }
                            }
                        },
                        postedDate: { type: 'date' },
                        deadline: { type: 'date' },
                        status: { type: 'keyword' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                },
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1,
                    analysis: {
                        analyzer: {
                            autocomplete_analyzer: {
                                type: 'custom',
                                tokenizer: 'standard',
                                filter: ['lowercase', 'edge_ngram']
                            }
                        },
                        filter: {
                            edge_ngram: {
                                type: 'edge_ngram',
                                min_gram: 2,
                                max_gram: 20,
                                token_chars: ['letter']
                            }
                        }
                    }
                }
            },
            users: {
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        firstName: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' }
                            }
                        },
                        lastName: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' }
                            }
                        },
                        email: { type: 'keyword' },
                        skills: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' }
                            }
                        },
                        experience: {
                            type: 'nested', properties: {
                                company: { type: 'text' },
                                position: { type: 'text' },
                                startDate: { type: 'date' },
                                endDate: { type: 'date' },
                                description: { type: 'text' }
                            }
                        },
                        education: {
                            type: 'nested', properties: {
                                institution: { type: 'text' },
                                degree: { type: 'text' },
                                fieldOfStudy: { type: 'text' },
                                startDate: { type: 'date' },
                                endDate: { type: 'date' }
                            }
                        },
                        location: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                raw: { type: 'keyword' },
                                geopoint: { type: 'geo_point' }
                            }
                        },
                        bio: { type: 'text', analyzer: 'standard' },
                        availability: { type: 'boolean' },
                        status: { type: 'keyword' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                }
            },
            applications: {
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        jobId: { type: 'keyword' },
                        userId: { type: 'keyword' },
                        status: { type: 'keyword' },
                        coverLetter: { type: 'text', analyzer: 'standard' },
                        resume: { type: 'text', analyzer: 'standard' },
                        appliedDate: { type: 'date' },
                        reviewedDate: { type: 'date' },
                        reviewedBy: { type: 'keyword' },
                        notes: { type: 'text', analyzer: 'standard' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                }
            }
        };

        for (const [indexName, indexConfig] of Object.entries(indices)) {
            const exists = await this.client.indices.exists({ index: indexName });

            if (!exists) {
                await this.client.indices.create({
                    index: indexName,
                    body: indexConfig
                });
                console.log(`✅ Created index: ${indexName}`);
            } else {
                console.log(`ℹ️  Index ${indexName} already exists`);
            }
        }
    }

    /**
     * Index a document
     */
    async indexDocument(index, id, document) {
        try {
            const result = await this.client.index({
                index,
                id,
                body: document,
                refresh: true // Make document immediately searchable
            });

            return {
                success: true,
                id: result._id,
                version: result._version,
                result: result.result
            };
        } catch (error) {
            console.error(`Error indexing document in ${index}/${id}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Index multiple documents
     */
    async bulkIndex(index, documents) {
        const body = [];

        for (const doc of documents) {
            body.push({ index: { _index: index, _id: doc.id } });
            body.push(doc);
        }

        try {
            const result = await this.client.bulk({
                body,
                refresh: true
            });

            return {
                success: true,
                took: result.took,
                errors: result.errors,
                items: result.items
            };
        } catch (error) {
            console.error(`Error bulk indexing documents in ${index}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search documents with advanced query
     */
    async search(index, query, options = {}) {
        try {
            const searchQuery = {
                index,
                body: {
                    query: query,
                    from: options.from || 0,
                    size: options.size || 20,
                    sort: options.sort || [{ _score: { order: 'desc' } }],
                    highlight: options.highlight || {
                        fields: {
                            '*': {} // Highlight all fields
                        }
                    }
                }
            };

            if (options.aggregations) {
                searchQuery.body.aggs = options.aggregations;
            }

            if (options.source) {
                searchQuery.body._source = options.source;
            }

            const result = await this.client.search(searchQuery);

            return {
                success: true,
                hits: result.hits.hits.map(hit => ({
                    id: hit._id,
                    score: hit._score,
                    source: hit._source,
                    highlight: hit.highlight
                })),
                total: result.hits.total.value,
                aggregations: result.aggregations,
                took: result.took
            };
        } catch (error) {
            console.error(`Error searching in ${index}:`, error.message);
            return {
                success: false,
                error: error.message,
                hits: [],
                total: 0
            };
        }
    }

    /**
     * Advanced job search with multiple criteria
     */
    async searchJobs(criteria = {}) {
        const {
            query,
            location,
            salaryMin,
            salaryMax,
            employmentType,
            experienceLevel,
            skills,
            company,
            datePosted,
            sortBy = '_score',
            page = 1,
            limit = 20
        } = criteria;

        // Build query
        const boolQuery = {
            bool: {
                must: [],
                should: [],
                filter: []
            }
        };

        // Add text search
        if (query) {
            boolQuery.bool.must.push({
                multi_match: {
                    query: query,
                    fields: ['title^3', 'description^2', 'requirements', 'company^2', 'skills'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                }
            });
        }

        // Add location filter
        if (location) {
            boolQuery.bool.filter.push({
                match_phrase_prefix: {
                    location: location
                }
            });
        }

        // Add salary range filter
        if (salaryMin || salaryMax) {
            const rangeQuery = { range: { salary: {} } };
            if (salaryMin) {rangeQuery.range.salary.gte = salaryMin;}
            if (salaryMax) {rangeQuery.range.salary.lte = salaryMax;}
            boolQuery.bool.filter.push(rangeQuery);
        }

        // Add employment type filter
        if (employmentType) {
            boolQuery.bool.filter.push({
                term: { employmentType: employmentType }
            });
        }

        // Add experience level filter
        if (experienceLevel) {
            boolQuery.bool.filter.push({
                term: { experienceLevel: experienceLevel }
            });
        }

        // Add skills filter
        if (skills && Array.isArray(skills) && skills.length > 0) {
            boolQuery.bool.must.push({
                terms: { 'skills.raw': skills }
            });
        }

        // Add company filter
        if (company) {
            boolQuery.bool.filter.push({
                match_phrase: { company: company }
            });
        }

        // Add date posted filter
        if (datePosted) {
            boolQuery.bool.filter.push({
                range: {
                    postedDate: {
                        gte: `now-${datePosted}`
                    }
                }
            });
        }

        // Add default match-all if no specific criteria
        if (boolQuery.bool.must.length === 0 && boolQuery.bool.should.length === 0) {
            boolQuery.bool.must.push({ match_all: {} });
        }

        // Define sort order
        const sort = [];
        switch (sortBy) {
            case 'salary_desc':
                sort.push({ salary: { order: 'desc' } });
                break;
            case 'date_desc':
                sort.push({ postedDate: { order: 'desc' } });
                break;
            case 'date_asc':
                sort.push({ postedDate: { order: 'asc' } });
                break;
            default:
                sort.push({ _score: { order: 'desc' } });
                break;
        }

        const result = await this.search('jobs', boolQuery, {
            from: (page - 1) * limit,
            size: limit,
            sort,
            highlight: {
                fields: {
                    title: {},
                    description: {},
                    requirements: {}
                }
            },
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

        return result;
    }

    /**
     * Advanced user search
     */
    async searchUsers(criteria = {}) {
        const {
            query,
            skills,
            location,
            experienceLevel,
            availability,
            sortBy = '_score',
            page = 1,
            limit = 20
        } = criteria;

        const boolQuery = {
            bool: {
                must: [],
                should: [],
                filter: []
            }
        };

        // Add text search
        if (query) {
            boolQuery.bool.must.push({
                multi_match: {
                    query: query,
                    fields: ['firstName', 'lastName', 'email', 'bio', 'skills'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                }
            });
        }

        // Add skills filter
        if (skills && Array.isArray(skills) && skills.length > 0) {
            boolQuery.bool.must.push({
                terms: { 'skills.raw': skills }
            });
        }

        // Add location filter
        if (location) {
            boolQuery.bool.filter.push({
                match_phrase_prefix: {
                    location: location
                }
            });
        }

        // Add experience level filter
        if (experienceLevel) {
            boolQuery.bool.filter.push({
                term: { experienceLevel: experienceLevel }
            });
        }

        // Add availability filter
        if (typeof availability !== 'undefined') {
            boolQuery.bool.filter.push({
                term: { availability: availability }
            });
        }

        // Add default match-all if no specific criteria
        if (boolQuery.bool.must.length === 0 && boolQuery.bool.should.length === 0) {
            boolQuery.bool.must.push({ match_all: {} });
        }

        const sort = [];
        switch (sortBy) {
            case 'name':
                sort.push({ 'firstName.keyword': { order: 'asc' } });
                break;
            case 'date_desc':
                sort.push({ createdAt: { order: 'desc' } });
                break;
            default:
                sort.push({ _score: { order: 'desc' } });
                break;
        }

        const result = await this.search('users', boolQuery, {
            from: (page - 1) * limit,
            size: limit,
            sort,
            highlight: {
                fields: {
                    firstName: {},
                    lastName: {},
                    bio: {},
                    skills: {}
                }
            }
        });

        return result;
    }

    /**
     * Get document by ID
     */
    async getDocument(index, id) {
        try {
            const result = await this.client.get({
                index,
                id
            });

            return {
                success: true,
                id: result._id,
                source: result._source,
                version: result._version
            };
        } catch (error) {
            if (error.statusCode === 404) {
                return {
                    success: false,
                    found: false,
                    error: 'Document not found'
                };
            }
            console.error(`Error getting document from ${index}/${id}:`, error.message);
            return {
                success: false,
                found: false,
                error: error.message
            };
        }
    }

    /**
     * Update document
     */
    async updateDocument(index, id, document) {
        try {
            const result = await this.client.update({
                index,
                id,
                body: {
                    doc: document,
                    doc_as_upsert: true
                },
                refresh: true
            });

            return {
                success: true,
                id: result._id,
                version: result._version,
                result: result.result
            };
        } catch (error) {
            console.error(`Error updating document in ${index}/${id}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(index, id) {
        try {
            const result = await this.client.delete({
                index,
                id,
                refresh: true
            });

            return {
                success: true,
                result: result.result
            };
        } catch (error) {
            console.error(`Error deleting document from ${index}/${id}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Refresh index
     */
    async refreshIndex(index) {
        try {
            await this.client.indices.refresh({ index });
            return { success: true };
        } catch (error) {
            console.error(`Error refreshing index ${index}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get index statistics
     */
    async getIndexStats(index) {
        try {
            const stats = await this.client.indices.stats({ index });
            return {
                success: true,
                stats: stats.indices[index]
            };
        } catch (error) {
            console.error(`Error getting stats for index ${index}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close the Elasticsearch client
     */
    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = ElasticsearchService;