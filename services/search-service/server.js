/**
 * TalentSphere Search Service Main Entry Point
 * Initializes Elasticsearch service and starts API server with Service Discovery
 */

const ElasticsearchService = require("./elasticsearch-service");
const SearchServiceAPI = require("./api");
const { createServiceRegistry } = require("../shared/service-registry");

async function startSearchService() {
    console.log("Starting TalentSphere Search Service...");

    // Initialize Service Registry
    const serviceRegistry = createServiceRegistry("search-service", {
        port: process.env.SEARCH_API_PORT || 3004,
        version: "1.0.0",
        tags: ["search", "elasticsearch", "full-text-search"],
        metadata: {
            description: "Full-text search service powered by Elasticsearch",
            features: ["full-text-search", "faceted-search", "autocomplete", "indexing"],
            elasticsearchNode: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
        },
        healthCheckPath: "/health",
    });

    // Initialize service registration
    await serviceRegistry.initialize();

    // Create Elasticsearch service instance
    const elasticsearchService = new ElasticsearchService({
        node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
        username: process.env.ELASTICSEARCH_USERNAME || "elastic",
        password: process.env.ELASTICSEARCH_PASSWORD || "changeme",
    });

    try {
        // Initialize Elasticsearch service
        await elasticsearchService.initialize();

        // Create and start API server
        const searchAPI = new SearchServiceAPI(elasticsearchService, serviceRegistry);
        const apiPort = process.env.SEARCH_API_PORT || 3004;
        await searchAPI.start(apiPort);

        // Update service metadata with Elasticsearch status
        await serviceRegistry.updateMetadata({
            elasticsearchStatus: "connected",
            apiPort: apiPort,
            endpoints: [
                "/api/v1/search/jobs",
                "/api/v1/search/users",
                "/api/v1/search/facets",
                "/api/v1/search/autocomplete",
            ],
            status: "running",
        });

        console.log(`✅ Search Service started successfully`);
        console.log(
            `✅ Service Registry: ${serviceRegistry.getInstanceInfo().isRegistered ? "Registered" : "Offline"}`
        );
        console.log(`✅ API server on port ${apiPort}`);
        console.log(
            `✅ Connected to Elasticsearch: ${process.env.ELASTICSEARCH_NODE || "http://localhost:9200"}`
        );
        console.log(`✅ Service Instance ID: ${serviceRegistry.getInstanceInfo().instanceId}`);
        console.log(`✅ Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   GET  /api/v1/search/jobs - Search jobs`);
        console.log(`   GET  /api/v1/search/users - Search users`);
        console.log(`   POST /api/v1/search/jobs - Index job`);
        console.log(`   POST /api/v1/search/users - Index user`);
        console.log(`   GET  /api/v1/search/facets - Get search facets`);
        console.log(`   GET  /api/v1/search/autocomplete - Get autocomplete suggestions`);

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
            console.log("\nShutting down search service...");
            await elasticsearchService.close();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            console.log("\nShutting down search service...");
            await elasticsearchService.close();
            process.exit(0);
        });
    } catch (error) {
        console.error("Failed to start search service:", error);
        process.exit(1);
    }
}

// If this file is run directly, start the service
if (require.main === module) {
    startSearchService().catch(error => {
        console.error("Failed to start search service:", error);
        process.exit(1);
    });
}

module.exports = {
    ElasticsearchService,
    SearchServiceAPI,
    startSearchService,
};
