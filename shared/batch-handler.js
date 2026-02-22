/**
 * Batch Request Handler
 *
 * Processes multiple API requests in a single call
 * for improved performance and reduced network overhead.
 */

const { createLogger } = require("./logger");

class BatchHandler {
    constructor(options = {}) {
        this.logger = createLogger("batch");
        this.maxBatchSize = options.maxBatchSize || 100;
        this.timeout = options.timeout || 30000;
    }

    async process(requests, handler) {
        const startTime = Date.now();

        const validRequests = requests.slice(0, this.maxBatchSize).map((req, index) => ({
            id: req.id || `batch_${index}`,
            method: (req.method || "GET").toUpperCase(),
            path: req.path,
            headers: req.headers || {},
            body: req.body || null,
        }));

        const results = [];
        const errors = [];

        const processRequest = async req => {
            try {
                const result = await Promise.race([
                    handler(req),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Batch timeout")), this.timeout)
                    ),
                ]);

                return {
                    id: req.id,
                    status: 200,
                    data: result,
                };
            } catch (error) {
                return {
                    id: req.id,
                    status: error.statusCode || 500,
                    error: error.message,
                };
            }
        };

        const batches = this.createBatches(validRequests, 10);

        for (const batch of batches) {
            const batchResults = await Promise.all(batch.map(processRequest));
            results.push(...batchResults);
        }

        const duration = Date.now() - startTime;

        return {
            results: results.sort((a, b) => {
                const aIndex = validRequests.findIndex(r => r.id === a.id);
                const bIndex = validRequests.findIndex(r => r.id === b.id);
                return aIndex - bIndex;
            }),
            meta: {
                total: validRequests.length,
                successful: results.filter(r => r.status < 400).length,
                failed: results.filter(r => r.status >= 400).length,
                duration,
            },
        };
    }

    createBatches(items, size) {
        const batches = [];
        for (let i = 0; i < items.length; i += size) {
            batches.push(items.slice(i, i + size));
        }
        return batches;
    }

    middleware(handler) {
        const batch = this;

        return async (req, res) => {
            const requests = req.body?.requests || req.body;

            if (!Array.isArray(requests)) {
                return res.status(400).json({
                    error: "Batch requests must be an array",
                });
            }

            if (requests.length > this.maxBatchSize) {
                return res.status(400).json({
                    error: `Maximum batch size is ${this.maxBatchSize}`,
                });
            }

            const result = await batch.process(requests, handler);

            res.json(result);
        };
    }
}

const batchHandler = new BatchHandler({
    maxBatchSize: 100,
    timeout: 30000,
});

module.exports = {
    BatchHandler,
    batchHandler,
};
