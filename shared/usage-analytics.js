/**
 * API Usage Analytics
 *
 * Tracks API usage patterns for analytics and billing.
 */

class UsageAnalytics {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.prefix = options.prefix || "usage:";
        this.retentionDays = options.retentionDays || 90;
    }

    async track(req, res) {
        if (!this.redisClient) return;

        const timestamp = Date.now();
        const userId = req.user?.id || req.headers["x-user-id"] || "anonymous";
        const endpoint = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        const responseTime = res.get("X-Response-Time") || 0;

        const key = `${this.prefix}${this.getDateKey()}`;

        await Promise.all([
            this.redisClient.hincrby(key, "total_requests", 1),
            this.redisClient.hincrby(key, `method:${method}`, 1),
            this.redisClient.hincrby(key, `status:${Math.floor(statusCode / 100)}xx`, 1),
            this.redisClient.hincrby(key, `user:${userId}`, 1),
            this.redisClient.hincrby(key, `endpoint:${endpoint}`, 1),
            this.redisClient.hincrbyfloat(key, "total_response_time", responseTime),
        ]);

        const ttl = this.retentionDays * 86400;
        await this.redisClient.expire(key, ttl);
    }

    getDateKey() {
        return new Date().toISOString().split("T")[0];
    }

    async getStats(date = null) {
        if (!this.redisClient) return null;

        const key = date ? `${this.prefix}${date}` : `${this.prefix}${this.getDateKey()}`;

        const data = await this.redisClient.hgetall(key);

        const stats = {
            totalRequests: parseInt(data.total_requests) || 0,
            avgResponseTime: 0,
            methods: {},
            statusCodes: {},
            topUsers: [],
            topEndpoints: [],
        };

        if (stats.totalRequests > 0) {
            stats.avgResponseTime =
                (parseFloat(data.total_response_time) || 0) / stats.totalRequests;
        }

        Object.entries(data).forEach(([k, v]) => {
            if (k.startsWith("method:")) {
                stats.methods[k.replace("method:", "")] = parseInt(v);
            } else if (k.startsWith("status:")) {
                stats.statusCodes[k.replace("status:", "")] = parseInt(v);
            } else if (k.startsWith("user:")) {
                stats.topUsers.push({ userId: k.replace("user:"), count: parseInt(v) });
            } else if (k.startsWith("endpoint:")) {
                stats.topEndpoints.push({ endpoint: k.replace("endpoint:"), count: parseInt(v) });
            }
        });

        stats.topUsers.sort((a, b) => b.count - a.count).slice(0, 10);
        stats.topEndpoints.sort((a, b) => b.count - a.count).slice(0, 10);

        return stats;
    }

    async getDailyUsage(days = 30) {
        if (!this.redisClient) return [];

        const results = [];
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split("T")[0];

            const key = `${this.prefix}${dateKey}`;
            const total = await this.redisClient.hget(key, "total_requests");

            results.push({
                date: dateKey,
                requests: parseInt(total) || 0,
            });
        }

        return results.reverse();
    }

    middleware() {
        const analytics = this;

        return (req, res, next) => {
            const startTime = Date.now();

            res.on("finish", async () => {
                res.set("X-Response-Time", Date.now() - startTime);
                await analytics.track(req, res);
            });

            next();
        };
    }
}

const usageAnalytics = new UsageAnalytics();

module.exports = {
    UsageAnalytics,
    usageAnalytics,
};
