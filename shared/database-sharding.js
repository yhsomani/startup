/**
 * Database Sharding Router using Consistent Hashing
 *
 * Alternative to Citus - application-level sharding across
 * multiple physical database instances.
 */

const { ConsistentHashRing } = require("./consistent-hashing");
const { Pool } = require("pg");

class DatabaseShardingRouter {
    constructor(options = {}) {
        this.vnodes = options.vnodes || 160;
        this.shards = options.shards || [];
        this.ring = null;
        this.pools = new Map();
        this.initRing();
    }

    initRing() {
        this.ring = new ConsistentHashRing({ vnodes: this.vnodes });
        this.shards.forEach(shard => this.ring.addNode(shard.url));
    }

    addShard(shard) {
        this.shards.push(shard);
        this.ring.addNode(shard.url);
    }

    removeShard(shardUrl) {
        this.shards = this.shards.filter(s => s.url !== shardUrl);
        this.ring.removeNode(shardUrl);
        this.pools.delete(shardUrl);
    }

    getPoolForKey(key) {
        const shardUrl = this.ring.getNode(key);

        if (!shardUrl) {
            throw new Error("No database shards available");
        }

        if (!this.pools.has(shardUrl)) {
            const shard = this.shards.find(s => s.url === shardUrl);
            this.pools.set(
                shardUrl,
                new Pool({
                    host: shard.host,
                    port: shard.port,
                    database: shard.database,
                    user: shard.user,
                    password: shard.password,
                    max: shard.maxConnections || 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 10000,
                })
            );
        }

        return this.pools.get(shardUrl);
    }

    getPoolForUser(userId) {
        return this.getPoolForKey(userId.toString());
    }

    getPoolForTenant(tenantId) {
        return this.getPoolForKey(tenantId);
    }

    async query(key, text, params) {
        const pool = this.getPoolForKey(key);
        return pool.query(text, params);
    }

    async close() {
        for (const pool of this.pools.values()) {
            await pool.end();
        }
        this.pools.clear();
    }

    getStats() {
        const stats = {};

        for (const shard of this.shards) {
            const pool = this.pools.get(shard.url);
            stats[shard.url] = {
                totalConnections: pool?.totalCount || 0,
                idleConnections: pool?.idleCount || 0,
                waitingClients: pool?.waitingClients || 0,
            };
        }

        return stats;
    }
}

const analyticsShards = [
    {
        url: "analytics-shard-1",
        host: process.env.ANALYTICS_DB_HOST_1 || "db-analytics-1",
        port: parseInt(process.env.ANALYTICS_DB_PORT_1) || 5432,
        database: process.env.ANALYTICS_DB_NAME || "analytics",
        user: process.env.ANALYTICS_DB_USER || "postgres",
        password: process.env.ANALYTICS_DB_PASSWORD || "",
    },
    {
        url: "analytics-shard-2",
        host: process.env.ANALYTICS_DB_HOST_2 || "db-analytics-2",
        port: parseInt(process.env.ANALYTICS_DB_PORT_2) || 5432,
        database: process.env.ANALYTICS_DB_NAME || "analytics",
        user: process.env.ANALYTICS_DB_USER || "postgres",
        password: process.env.ANALYTICS_DB_PASSWORD || "",
    },
    {
        url: "analytics-shard-3",
        host: process.env.ANALYTICS_DB_HOST_3 || "db-analytics-3",
        port: parseInt(process.env.ANALYTICS_DB_PORT_3) || 5432,
        database: process.env.ANALYTICS_DB_NAME || "analytics",
        user: process.env.ANALYTICS_DB_USER || "postgres",
        password: process.env.ANALYTICS_DB_PASSWORD || "",
    },
];

const analyticsDbRouter = new DatabaseShardingRouter({
    vnodes: 160,
    shards: analyticsShards,
});

module.exports = {
    DatabaseShardingRouter,
    analyticsDbRouter,
};
