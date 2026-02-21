/**
 * TalentSphere N+1 Query Optimization Library
 * Provides utilities to prevent and fix N+1 query problems
 */

class N1QueryOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.batchQueries = new Map();
        this.optimizationStrategies = new Map();
        this.metrics = {
            queries: new Map(),
            batches: new Map(),
            optimizations: new Map(),
        };
    }

    /**
     * Batch loader for preventing N+1 queries
     */
    createBatchLoader(batchFunction, options = {}) {
        const {
            cacheKey = id => id,
            cacheTimeout = 300000, // 5 minutes
            maxBatchSize = 100,
            batchDelay = 10, // milliseconds
        } = options;

        let pendingRequests = new Map();
        let timeoutId = null;

        return async ids => {
            // Normalize ids to array
            const idArray = Array.isArray(ids) ? ids : [ids];
            const uniqueIds = [...new Set(idArray)];

            // Check cache first
            const cached = new Map();
            const uncached = [];

            for (const id of uniqueIds) {
                const key = cacheKey(id);
                const cachedItem = this.queryCache.get(key);

                if (cachedItem && Date.now() - cachedItem.timestamp < cacheTimeout) {
                    cached.set(id, cachedItem.data);
                } else {
                    uncached.push(id);
                }
            }

            // Return cached results immediately if all are cached
            if (uncached.length === 0) {
                return uniqueIds.map(id => cached.get(id));
            }

            // Create promise for uncached items
            const promise = new Promise((resolve, reject) => {
                for (const id of uncached) {
                    pendingRequests.set(cacheKey(id), { resolve, reject, id });
                }

                // Schedule batch execution
                if (!timeoutId) {
                    timeoutId = setTimeout(() => {
                        this.executeBatch(batchFunction, pendingRequests, cacheKey, cacheTimeout);
                        pendingRequests = new Map();
                        timeoutId = null;
                    }, batchDelay);
                }
            });

            // Wait for batch to complete
            await promise;

            // Return results in original order
            return uniqueIds.map(id => {
                const key = cacheKey(id);
                const cached = this.queryCache.get(key);
                return cached ? cached.data : null;
            });
        };
    }

    /**
     * Execute batch query
     */
    async executeBatch(batchFunction, pendingRequests, cacheKey, cacheTimeout) {
        if (pendingRequests.size === 0) {return;}

        const ids = Array.from(pendingRequests.values()).map(req => req.id);
        const startTime = Date.now();

        try {
            const results = await batchFunction(ids);
            const resultMap = this.createResultMap(results);

            // Resolve all pending requests
            for (const [key, request] of pendingRequests.entries()) {
                const result = resultMap.get(request.id);

                if (result) {
                    // Cache the result
                    this.queryCache.set(key, {
                        data: result,
                        timestamp: Date.now(),
                    });
                    request.resolve(result);
                } else {
                    request.resolve(null);
                }
            }

            // Record metrics
            this.recordBatch(ids.length, Date.now() - startTime);
        } catch (error) {
            // Reject all pending requests
            for (const request of pendingRequests.values()) {
                request.reject(error);
            }
        }
    }

    /**
     * Create result map from batch query results
     */
    createResultMap(results) {
        const map = new Map();

        if (Array.isArray(results)) {
            // Assume results have an 'id' field
            for (const result of results) {
                if (result && typeof result === "object" && "id" in result) {
                    map.set(result.id, result);
                }
            }
        } else if (results && typeof results === "object") {
            // Assume results is already a map-like object
            for (const [key, value] of Object.entries(results)) {
                map.set(key, value);
            }
        }

        return map;
    }

    /**
     * GraphQL DataLoader-style batch loader
     */
    createDataLoader(loadFn, options = {}) {
        const {
            cacheKeyFn = key => key,
            cache = true,
            cacheMap = new Map(),
            batchScheduleFn = callback => setTimeout(callback, 0),
        } = options;

        const promiseMap = new Map();

        return async key => {
            // Check cache first
            if (cache) {
                const cachedPromise = cacheMap.get(cacheKeyFn(key));
                if (cachedPromise) {
                    return cachedPromise;
                }
            }

            // Check if there's already a pending request for this key
            const existingPromise = promiseMap.get(cacheKeyFn(key));
            if (existingPromise) {
                return existingPromise;
            }

            // Create new promise
            const promise = new Promise((resolve, reject) => {
                // Add to pending queue
                if (!promiseMap.has("queue")) {
                    promiseMap.set("queue", []);
                }
                promiseMap.get("queue").push({ key, resolve, reject });

                // Schedule batch if this is the first item
                if (promiseMap.get("queue").length === 1) {
                    batchScheduleFn(async () => {
                        const queue = promiseMap.get("queue");
                        promiseMap.set("queue", []);

                        if (queue.length === 0) {return;}

                        const keys = queue.map(item => item.key);
                        const startTime = Date.now();

                        try {
                            const results = await loadFn(keys);
                            const resultMap = this.createResultMap(results);

                            for (const item of queue) {
                                const result = resultMap.get(item.key);
                                const promise = promiseMap.get(cacheKeyFn(item.key));

                                if (cache) {
                                    cacheMap.set(cacheKeyFn(item.key), promise);
                                }

                                item.resolve(result);
                            }

                            this.recordBatch(keys.length, Date.now() - startTime);
                        } catch (error) {
                            for (const item of queue) {
                                item.reject(error);
                            }
                        }
                    });
                }
            });

            promiseMap.set(cacheKeyFn(key), promise);
            return promise;
        };
    }

    /**
     * Eager loading strategy for Sequelize-like ORMs
     */
    eagerLoading(query, includeRelations = []) {
        if (!query || typeof query.include === "undefined") {
            return query;
        }

        // Transform relations to include format
        const includes = includeRelations.map(relation => {
            if (typeof relation === "string") {
                return {
                    model: relation,
                    as: relation,
                    required: false,
                };
            }
            return relation;
        });

        // Apply includes to query
        if (query.include) {
            query.include = Array.isArray(query.include)
                ? [...query.include, ...includes]
                : includes;
        } else {
            query.include = includes;
        }

        this.recordOptimization("eager_loading", includeRelations.length);
        return query;
    }

    /**
     * Join strategy for raw SQL queries
     */
    createJoinQuery(baseQuery, joins = []) {
        let query = baseQuery;

        for (const join of joins) {
            const { table, on, type = "LEFT" } = join;
            query += ` ${type} JOIN ${table} ON ${on}`;
        }

        this.recordOptimization("join_query", joins.length);
        return query;
    }

    /**
     * IN clause optimization
     */
    createInClauseQuery(baseQuery, ids, field = "id") {
        if (!ids || ids.length === 0) {
            return baseQuery;
        }

        const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
        const query = `${baseQuery} WHERE ${field} IN (${placeholders})`;

        this.recordOptimization("in_clause", ids.length);
        return { query, params: ids };
    }

    /**
     * Bulk insert/update operations
     */
    createBulkInsert(table, records, conflictStrategy = "IGNORE") {
        if (!records || records.length === 0) {
            return { query: "", params: [] };
        }

        const columns = Object.keys(records[0]);
        const placeholders = records
            .map((record, recordIndex) =>
                columns
                    .map((_, columnIndex) => `$${recordIndex * columns.length + columnIndex + 1}`)
                    .join(", ")
            )
            .join("), (");

        const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
        const params = records.flatMap(record => columns.map(col => record[col]));

        this.recordOptimization("bulk_insert", records.length);
        return { query, params };
    }

    /**
     * Query analyzer to detect potential N+1 problems
     */
    analyzeQuery(query, context = {}) {
        const analysis = {
            hasN1Problem: false,
            patterns: [],
            suggestions: [],
            severity: "low",
        };

        // Check for patterns that indicate N+1 problems
        const patterns = [
            {
                name: "Loop with query",
                regex: /for.*\{[\s\S]*?(SELECT|find|get)[\s\S]*?}/i,
                suggestion: "Use batch loading or eager loading instead of queries in loops",
            },
            {
                name: "Multiple similar queries",
                regex: /(SELECT|find|get)[\s\S]*?WHERE[\s\S]*?id[\s\S]*?=[\s\S]*?\$\d+/gi,
                suggestion: "Combine into single query with IN clause",
            },
            {
                name: "Missing eager loading",
                regex: /(SELECT|find)[\s\S]*?(users|posts|comments)[\s\S]*?(WHERE|ORDER BY)/i,
                suggestion: "Consider eager loading related associations",
            },
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(query)) {
                analysis.patterns.push(pattern.name);
                analysis.suggestions.push(pattern.suggestion);
                analysis.hasN1Problem = true;
            }
        }

        // Determine severity
        if (analysis.patterns.length >= 2) {
            analysis.severity = "high";
        } else if (analysis.patterns.length === 1) {
            analysis.severity = "medium";
        }

        return analysis;
    }

    /**
     * Auto-fix detected N+1 problems
     */
    autoFixQuery(query, analysis) {
        let fixedQuery = query;

        for (const pattern of analysis.patterns) {
            switch (pattern) {
                case "Loop with query":
                    fixedQuery = this.suggestBatchLoading(fixedQuery);
                    break;
                case "Multiple similar queries":
                    fixedQuery = this.suggestInClause(fixedQuery);
                    break;
                case "Missing eager loading":
                    fixedQuery = this.suggestEagerLoading(fixedQuery);
                    break;
            }
        }

        return fixedQuery;
    }

    /**
     * Suggest batch loading pattern
     */
    suggestBatchLoading(query) {
        // This would return a refactored query pattern
        return {
            original: query,
            suggested: "Use batch loader pattern",
            example: `
const loadUsers = createBatchLoader(async (userIds) => {
    return await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
});

// Instead of loop
for (const user of users) {
    const posts = await loadPosts(user.id);
    user.posts = posts;
}
            `.trim(),
        };
    }

    /**
     * Suggest IN clause optimization
     */
    suggestInClause(query) {
        // Transform multiple queries to single IN clause
        return {
            original: query,
            suggested: "Use IN clause instead of multiple queries",
            example: "SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5)",
        };
    }

    /**
     * Suggest eager loading pattern
     */
    suggestEagerLoading(query) {
        return {
            original: query,
            suggested: "Add eager loading for related data",
            example: "User.findAll({ include: [{ model: Post, as: 'posts' }] })",
        };
    }

    /**
     * Performance monitoring
     */
    recordBatch(batchSize, duration) {
        const key = `batch_${batchSize}`;
        if (!this.metrics.batches.has(key)) {
            this.metrics.batches.set(key, { count: 0, totalTime: 0, avgTime: 0 });
        }

        const metric = this.metrics.batches.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
    }

    recordOptimization(type, count) {
        const key = type;
        if (!this.metrics.optimizations.has(key)) {
            this.metrics.optimizations.set(key, { count: 0, items: 0 });
        }

        const metric = this.metrics.optimizations.get(key);
        metric.count++;
        metric.items += count;
    }

    recordQuery(type, duration) {
        const key = type;
        if (!this.metrics.queries.has(key)) {
            this.metrics.queries.set(key, { count: 0, totalTime: 0, avgTime: 0 });
        }

        const metric = this.metrics.queries.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
    }

    /**
     * Get optimization metrics
     */
    getMetrics() {
        return {
            queries: Object.fromEntries(this.metrics.queries),
            batches: Object.fromEntries(this.metrics.batches),
            optimizations: Object.fromEntries(this.metrics.optimizations),
            cacheSize: this.queryCache.size,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.queryCache.clear();
    }
}

module.exports = {
    N1QueryOptimizer,
    n1Optimizer: new N1QueryOptimizer(),
};
