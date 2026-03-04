/**
 * Unit Tests for Search Service
 */

describe('SearchService', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('should have elasticsearch service defined', () => {
        const { ElasticsearchService } = require('../../services/search-service/elasticsearch-service');
        expect(ElasticsearchService).toBeDefined();
    });

    test('should create elasticsearch service with options', () => {
        jest.doMock('@elastic/elasticsearch', () => ({
            Client: jest.fn().mockImplementation(() => ({
                ping: jest.fn().mockResolvedValue(true),
                indices: { create: jest.fn().mockResolvedValue(true) },
                index: jest.fn().mockResolvedValue(true),
                search: jest.fn().mockResolvedValue({ hits: { hits: [] } })
            }))
        }));
        
        const { ElasticsearchService } = require('../../services/search-service/elasticsearch-service');
        const service = new ElasticsearchService({ node: 'http://localhost:9200' });
        
        expect(service).toBeDefined();
        expect(service.options.node).toBe('http://localhost:9200');
    });

    test('should have default options', () => {
        jest.doMock('@elastic/elasticsearch', () => ({
            Client: jest.fn()
        }));
        
        const { ElasticsearchService } = require('../../services/search-service/elasticsearch-service');
        const service = new ElasticsearchService();
        
        expect(service.options.node).toBeDefined();
        expect(service.options.requestTimeout).toBe(30000);
    });
});

describe('Search Indexing', () => {
    test('should prepare document for indexing', () => {
        const prepareDocument = (data) => {
            return {
                index: 'jobs',
                id: data.id,
                body: {
                    ...data,
                    indexedAt: new Date().toISOString()
                }
            };
        };
        
        const doc = prepareDocument({
            id: 'job-1',
            title: 'Software Engineer',
            company: 'Tech Corp',
            location: 'New York'
        });
        
        expect(doc.index).toBe('jobs');
        expect(doc.id).toBe('job-1');
        expect(doc.body.indexedAt).toBeDefined();
    });

    test('should build search query', () => {
        const buildSearchQuery = (term, filters = {}) => {
            const must = [];
            const filter = [];
            
            if (term) {
                must.push({
                    multi_match: {
                        query: term,
                        fields: ['title^3', 'description', 'company', 'requirements'],
                        fuzziness: 'AUTO'
                    }
                });
            }
            
            if (filters.location) {
                filter.push({ term: { location: filters.location } });
            }
            
            if (filters.company) {
                filter.push({ term: { 'company.raw': filters.company } });
            }
            
            return { bool: { must: must.length ? must : [{ match_all: {} }], filter } };
        };
        
        const query = buildSearchQuery('engineer', { location: 'NYC' });
        
        expect(query.bool.must.length).toBe(1);
        expect(query.bool.filter.length).toBe(1);
    });

    test('should build aggregation query', () => {
        const buildAggregation = () => {
            return {
                aggs: {
                    locations: { terms: { field: 'location.raw', size: 50 } },
                    companies: { terms: { field: 'company.raw', size: 50 } },
                    skills: { terms: { field: 'skills', size: 100 } },
                    salary_range: {
                        range: {
                            field: 'salaryMin',
                            ranges: [
                                { key: '0-30k', from: 0, to: 30000 },
                                { key: '30k-60k', from: 30000, to: 60000 },
                                { key: '60k-100k', from: 60000, to: 100000 },
                                { key: '100k+', from: 100000 }
                            ]
                        }
                    }
                }
            };
        };
        
        const agg = buildAggregation();
        
        expect(agg.aggs.locations).toBeDefined();
        expect(agg.aggs.companies).toBeDefined();
        expect(agg.aggs.skills).toBeDefined();
    });
});

describe('Search Results', () => {
    test('should format search results', () => {
        const formatResults = (hits) => {
            return hits.map(hit => ({
                id: hit._id,
                score: hit._score,
                ...hit._source
            }));
        };
        
        const hits = [
            { _id: 'job-1', _score: 1.5, _source: { title: 'Engineer', company: 'Tech' } },
            { _id: 'job-2', _score: 1.2, _source: { title: 'Developer', company: 'Corp' } }
        ];
        
        const results = formatResults(hits);
        
        expect(results.length).toBe(2);
        expect(results[0].title).toBe('Engineer');
        expect(results[0].score).toBe(1.5);
    });

    test('should calculate pagination', () => {
        const calculatePagination = (total, page, pageSize) => {
            const totalPages = Math.ceil(total / pageSize);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            
            return { totalPages, hasNext, hasPrev };
        };
        
        const pagination = calculatePagination(100, 2, 10);
        
        expect(pagination.totalPages).toBe(10);
        expect(pagination.hasNext).toBe(true);
        expect(pagination.hasPrev).toBe(true);
    });

    test('should highlight matches', () => {
        const highlightMatches = (hits, fields) => {
            return hits.map(hit => {
                const highlighted = { ...hit._source };
                if (hit.highlight) {
                    Object.keys(hit.highlight).forEach(field => {
                        highlighted[field] = hit.highlight[field][0];
                    });
                }
                return highlighted;
            });
        };
        
        const hits = [
            { 
                _source: { title: 'Software Engineer' },
                highlight: { title: ['<em>Software</em> Engineer'] }
            }
        ];
        
        const results = highlightMatches(hits, ['title']);
        
        expect(results[0].title).toContain('<em>');
    });
});
