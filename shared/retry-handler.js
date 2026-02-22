/**
 * Retry Mechanism
 *
 * Implements exponential backoff for failed operations.
 */

class RetryHandler {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000;
        this.maxDelay = options.maxDelay || 30000;
        this.backoffMultiplier = options.backoffMultiplier || 2;
        this.retryableErrors = options.retryableErrors || [
            "ECONNRESET",
            "ETIMEDOUT",
            "ECONNREFUSED",
            "ENOTFOUND",
            "ENETUNREACH",
            "EHOSTUNREACH",
        ];
        this.retryableStatuses = options.retryableStatuses || [408, 429, 500, 502, 503, 504];
    }

    shouldRetry(error, attempt) {
        if (attempt >= this.maxRetries) return false;

        if (error.code && this.retryableErrors.includes(error.code)) {
            return true;
        }

        if (error.status && this.retryableStatuses.includes(error.status)) {
            return true;
        }

        if (error.response?.status && this.retryableStatuses.includes(error.response.status)) {
            return true;
        }

        return false;
    }

    calculateDelay(attempt) {
        const delay = Math.min(
            this.baseDelay * Math.pow(this.backoffMultiplier, attempt),
            this.maxDelay
        );

        const jitter = Math.random() * 0.3 * delay;
        return Math.floor(delay + jitter);
    }

    async execute(fn, context = {}) {
        let lastError;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn(context);
            } catch (error) {
                lastError = error;

                if (!this.shouldRetry(error, attempt)) {
                    throw error;
                }

                const delay = this.calculateDelay(attempt);

                if (context.logger) {
                    context.logger.warn(`Retry attempt ${attempt + 1}/${this.maxRetries}`, {
                        error: error.message,
                        delay,
                        ...context,
                    });
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    middleware(options = {}) {
        const retry = this;
        const { methods = ["GET", "POST", "PUT", "DELETE"] } = options;

        return async (req, res, next) => {
            if (!methods.includes(req.method)) {
                return next();
            }

            const originalEnd = res.end;
            const startTime = Date.now();

            res.end = async function (...args) {
                if (retry.retryableStatuses.includes(res.statusCode) && req.method !== "GET") {
                    const delay = retry.calculateDelay(0);

                    if (res.statusCode === 429 || res.statusCode >= 500) {
                        res.set("Retry-After", Math.ceil(delay / 1000));
                    }
                }

                originalEnd.apply(this, args);
            };

            next();
        };
    }
}

const retryHandler = new RetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
});

module.exports = {
    RetryHandler,
    retryHandler,
};
