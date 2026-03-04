const { SearchService } = require('./index-database.js');

// Mock external dependencies
jest.mock('talentsphere-shared-services/enhanced-service-with-tracing', () => ({
    EnhancedServiceWithTracing: class { }
}));

describe('SearchService Match Logic', () => {
    let searchService;

    beforeEach(() => {
        // Create an instance ignoring most constructor logic to test isolated methods
        searchService = Object.create(SearchService.prototype);
        searchService.calculateDistance = SearchService.prototype.calculateDistance;
        searchService.addRelevanceScores = SearchService.prototype.addRelevanceScores;
    });

    test('addRelevanceScores calculates matchPercentage correctly', async () => {
        const query = {
            query: 'developer',
            skills: ['react', 'node']
        };

        const hits = [
            {
                id: 'dev1',
                title: 'Fullstack Dev',
                skills: [
                    { name: 'react', level: 'advanced' },
                    { name: 'node', level: 'intermediate' }
                ]
            },
            {
                id: 'dev2',
                title: 'Backend Dev',
                skills: [
                    { name: 'node', level: 'beginner' },
                    { name: 'python', level: 'advanced' }
                ]
            }
        ];

        const processed = await searchService.addRelevanceScores(hits, query, {});

        // Max possible points = 2 required skills * 10 base points = 20
        // dev1 overlap = (10+10) + (10+5) = 35 -> cap at 100%
        // dev2 overlap = 10 -> (10/20)*100 = 50%

        expect(processed[0].matchPercentage).toBe(100);
        expect(processed[1].matchPercentage).toBe(50);
    });
});
