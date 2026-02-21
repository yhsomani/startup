/**
 * TalentSphere AI Matching Service Main Entry Point
 * Initializes AI matching service and starts API server
 */

const AIMatchingService = require('./ai-matching-service');
const AIMatchingAPI = require('./api');

async function startAIMatchingService() {
    console.log('Starting TalentSphere AI Matching Service...');

    // Create AI matching service instance
    const aiMatchingService = new AIMatchingService({
        similarityThreshold: process.env.AI_SIMILARITY_THRESHOLD || 0.6,
        maxRecommendations: process.env.AI_MAX_RECOMMENDATIONS || 10,
        weights: {
            skills: process.env.AI_WEIGHT_SKILLS || 0.4,
            experience: process.env.AI_WEIGHT_EXPERIENCE || 0.3,
            education: process.env.AI_WEIGHT_EDUCATION || 0.2,
            location: process.env.AI_WEIGHT_LOCATION || 0.1
        }
    });

    try {
        // Create and start API server
        const aiMatchingAPI = new AIMatchingAPI(aiMatchingService);
        const apiPort = process.env.AI_MATCHING_API_PORT || 3006;
        await aiMatchingAPI.start(apiPort);

        console.log(`✅ AI Matching Service started successfully`);
        console.log(`✅ API server on port ${apiPort}`);
        console.log(`✅ Model configured with weights:`, aiMatchingService.options.weights);
        console.log(`✅ Similarity threshold: ${aiMatchingService.options.similarityThreshold}`);
        console.log(`✅ Max recommendations: ${aiMatchingService.options.maxRecommendations}`);
        console.log(`✅ Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   GET  /api/v1/matching/recommendations/jobs/:userId - Job recommendations`);
        console.log(`   GET  /api/v1/matching/recommendations/users/:jobId - User recommendations`);
        console.log(`   GET  /api/v1/matching/recommendations/hybrid/:userId - Hybrid recommendations`);
        console.log(`   GET  /api/v1/matching/explanation/:userId/:jobId - Recommendation explanation`);
        console.log(`   POST /api/v1/matching/interactions - Record user interaction`);
        console.log(`   POST /api/v1/matching/train - Train model`);
        console.log(`   GET  /api/v1/matching/stats - Get model statistics`);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down AI matching service...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\nShutting down AI matching service...');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start AI matching service:', error);
        process.exit(1);
    }
}

// If this file is run directly, start the service
if (require.main === module) {
    startAIMatchingService().catch(error => {
        console.error('Failed to start AI matching service:', error);
        process.exit(1);
    });
}

module.exports = {
    AIMatchingService,
    AIMatchingAPI,
    startAIMatchingService
};