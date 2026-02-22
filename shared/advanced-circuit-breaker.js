/**
 * Circuit Breaker with Half-Open State
 *
 * States: CLOSED (normal), OPEN (failing), HALF-OPEN (testing recovery)
 */

class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.successThreshold = options.successThreshold || 3;
        this.timeout = options.timeout || 30000;
        this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;

        this.state = "CLOSED";
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = Date.now();
        this.halfOpenCalls = 0;

        this.stateChangeListeners = [];
    }

    async execute(fn) {
        if (this.state === "OPEN") {
            if (Date.now() < this.nextAttempt) {
                throw new Error("Circuit breaker is OPEN");
            }
            this.state = "HALF_OPEN";
            this.halfOpenCalls = 0;
            this.notifyStateChange("HALF_OPEN");
        }

        if (this.state === "HALF_OPEN") {
            if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
                throw new Error("Circuit breaker HALF_OPEN max calls reached");
            }
            this.halfOpenCalls++;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        if (this.state === "HALF_OPEN") {
            this.successes++;
            if (this.successes >= this.successThreshold) {
                this.state = "CLOSED";
                this.failures = 0;
                this.successes = 0;
                this.notifyStateChange("CLOSED");
            }
        } else if (this.state === "CLOSED") {
            this.failures = 0;
        }
    }

    onFailure() {
        this.failures++;

        if (this.state === "HALF_OPEN") {
            this.state = "OPEN";
            this.nextAttempt = Date.now() + this.timeout;
            this.notifyStateChange("OPEN");
        } else if (this.state === "CLOSED" && this.failures >= this.failureThreshold) {
            this.state = "OPEN";
            this.nextAttempt = Date.now() + this.timeout;
            this.notifyStateChange("OPEN");
        }
    }

    getState() {
        return this.state;
    }

    reset() {
        this.state = "CLOSED";
        this.failures = 0;
        this.successes = 0;
        this.halfOpenCalls = 0;
        this.notifyStateChange("CLOSED");
    }

    onStateChange(listener) {
        this.stateChangeListeners.push(listener);
    }

    notifyStateChange(newState) {
        this.stateChangeListeners.forEach(listener => {
            try {
                listener(newState, this);
            } catch (e) {}
        });
    }

    middleware(options = {}) {
        const breaker = this;

        return async (req, res, next) => {
            const endpoint = options.keyFn ? options.keyFn(req) : req.path;

            try {
                const result = await breaker.execute(async () => {
                    return new Promise((resolve, reject) => {
                        const originalEnd = res.end;
                        res.end = function (...args) {
                            if (res.statusCode >= 500) {
                                reject(new Error(`HTTP ${res.statusCode}`));
                            } else {
                                resolve();
                            }
                            originalEnd.apply(this, args);
                        };
                        next();
                    });
                });
            } catch (error) {
                if (breaker.getState() === "OPEN") {
                    res.status(503).json({
                        error: "Service Unavailable",
                        message: "Circuit breaker is open, please try again later",
                    });
                } else {
                    next(error);
                }
            }
        };
    }
}

const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
});

module.exports = {
    CircuitBreaker,
    circuitBreaker,
};
