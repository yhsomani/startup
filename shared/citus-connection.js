/**
 * Citus Database Connection Manager
 *
 * Extends standard database connection with Citus-specific features:
 * - Coordinator/worker routing
 * - Distributed query optimization
 * - Shard awareness for query routing
 * - Colocation hints for JOIN performance
 */

const { Pool } = require("pg");
const { getDatabaseConfig } = require("./environment");
const { createLogger } = require("./logger");

class CitusConnection {
    constructor(options = {}) {
        this.pool = null;
        this.logger = createLogger("CitusConnection");
        this.isCitus = options.isCitus !== false;
        this.coordinatorHost = options.coordinatorHost || process.env.CITUS_COORDINATOR_HOST;
        this.coordinatorPort =
            options.coordinatorPort || process.env.CITUS_COORDINATOR_PORT || 5432;

        try {
            this.config = getDatabaseConfig();
        } catch (err) {
            this.logger.warn("Failed to load database config:", err.message);
            this.config = {};
        }
    }

    async initialize() {
        if (this.pool) return;

        try {
            if (!this.config || Object.keys(this.config).length === 0) {
                this.config = getDatabaseConfig();
            }

            this.config.host = this.coordinatorHost || this.config.host;
            this.config.port = this.coordinatorPort;

            this.pool = new Pool(this.config);

            if (this.isCitus) {
                await this.verifyCitus();
            }

            this.logger.info("Citus connection initialized", {
                host: this.config.host,
                port: this.config.port,
            });
        } catch (error) {
            this.logger.error("Failed to initialize Citus connection:", error);
            throw error;
        }
    }

    async verifyCitus() {
        try {
            const result = await this.pool.query(`
                SELECT * FROM citus_get_active_worker_nodes()
            `);
            this.logger.info("Citus cluster verified", {
                workers: result.rows.length,
            });
        } catch (error) {
            this.logger.warn("Citus extension not available, using standard PostgreSQL");
            this.isCitus = false;
        }
    }

    async getClusterInfo() {
        if (!this.isCitus) return null;

        try {
            const workers = await this.pool.query(`
                SELECT * FROM citus_get_active_worker_nodes()
            `);

            const shards = await this.pool.query(`
                SELECT * FROM citus_shards WHERE shardid > 0 LIMIT 100
            `);

            return {
                workers: workers.rows,
                shards: shards.rows,
            };
        } catch (error) {
            this.logger.error("Failed to get cluster info:", error.message);
            return null;
        }
    }

    async query(text, params = []) {
        if (!this.pool) await this.initialize();

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;

            this.logger.debug(`Query executed in ${duration}ms`, {
                rows: result.rowCount,
            });

            return result;
        } catch (error) {
            this.logger.error("Query failed:", {
                error: error.message,
                code: error.code,
            });
            throw error;
        }
    }

    async insert(table, data) {
        if (!this.pool) await this.initialize();

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

        const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;

        try {
            const result = await this.query(query, values);
            return result.rows[0];
        } catch (error) {
            this.logger.error(`Insert failed for table ${table}:`, error.message);
            throw error;
        }
    }

    async update(table, id, data) {
        if (!this.pool) await this.initialize();

        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");

        const query = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;

        try {
            const result = await this.query(query, [id, ...values]);
            return result.rows[0];
        } catch (error) {
            this.logger.error(`Update failed for table ${table}:`, error.message);
            throw error;
        }
    }

    async delete(table, id) {
        if (!this.pool) await this.initialize();

        const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;

        try {
            const result = await this.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            this.logger.error(`Delete failed for table ${table}:`, error.message);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async getShardInfo(tableName) {
        if (!this.isCitus) return null;

        try {
            const result = await this.pool.query(
                `
                SELECT 
                    shardid, 
                    shardname, 
                    nodename, 
                    nodeport
                FROM citus_shards
                WHERE tablename = $1
            `,
                [tableName]
            );

            return result.rows;
        } catch (error) {
            this.logger.error("Failed to get shard info:", error.message);
            return null;
        }
    }

    async rebalanceShards() {
        if (!this.isCitus) return;

        try {
            await this.query("SELECT citus_rebalance_start()");
            this.logger.info("Shard rebalancing started");
        } catch (error) {
            this.logger.error("Failed to start shard rebalancing:", error.message);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

const citusInstance = new CitusConnection();

const getCitusConnection = () => citusInstance;

module.exports = {
    getCitusConnection,
    CitusConnection,
};
