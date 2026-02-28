/**
 * Search Service Unit Tests
 */

// Mock Elasticsearch client
jest.mock("@elastic/elasticsearch", () => {
    return {
        Client: jest.fn().mockImplementation(() => ({
            ping: jest.fn().mockResolvedValue(true),
            indices: {
                exists: jest.fn().mockResolvedValue(false),
                create: jest.fn().mockResolvedValue({}),
                search: jest.fn().mockResolvedValue({
                    hits: { hits: [], total: { value: 0 } },
                }),
            },
            index: jest.fn().mockResolvedValue({ _id: "1", _version: 1, result: "created" }),
            bulk: jest.fn().mockResolvedValue({ errors: false, items: [] }),
            delete: jest.fn().mockResolvedValue({ result: "deleted" }),
        })),
    };
});

const { Client } = require("@elastic/elasticsearch");
const ElasticsearchService = require("../elasticsearch-service");

describe("ElasticsearchService", () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ElasticsearchService({
            node: "http://localhost:9200",
            requestTimeout: 5000,
        });
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const defaultService = new ElasticsearchService();
            expect(defaultService.options.node).toBe("http://localhost:9200");
            expect(defaultService.options.requestTimeout).toBe(30000);
        });

        it("should initialize with custom options", () => {
            expect(service.options.node).toBe("http://localhost:9200");
            expect(service.options.requestTimeout).toBe(5000);
        });

        it("should create an Elasticsearch client", () => {
            expect(service.client).toBeDefined();
            expect(Client).toHaveBeenCalled();
        });

        it("should not be initialized by default", () => {
            expect(service.initialized).toBe(false);
        });
    });

    describe("initialize", () => {
        it("should initialize successfully", async () => {
            await service.initialize();
            expect(service.initialized).toBe(true);
            expect(service.client.ping).toHaveBeenCalled();
        });
    });

    describe("indexDocument", () => {
        it("should index a document successfully", async () => {
            const result = await service.indexDocument("jobs", "1", { title: "Software Engineer" });
            expect(result.success).toBe(true);
            expect(result.id).toBe("1");
        });
    });
});
