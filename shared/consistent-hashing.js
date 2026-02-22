/**
 * Consistent Hashing Ring
 *
 * Provides deterministic node selection with minimal redistribution
 * when nodes are added or removed.
 *
 * Uses virtual nodes (vnodes) for even load distribution.
 */

const crypto = require("crypto");

class ConsistentHashRing {
    constructor(options = {}) {
        this.vnodes = options.vnodes || 100;
        this.ring = new Map();
        this.sortedKeys = [];
        this.nodes = new Set();
    }

    _hash(key) {
        return crypto.createHash("md5").update(key.toString()).digest("hex");
    }

    addNode(node) {
        if (this.nodes.has(node)) return;

        this.nodes.add(node);

        for (let i = 0; i < this.vnodes; i++) {
            const vnodeKey = this._hash(`${node}:vnode:${i}`);
            this.ring.set(vnodeKey, node);
            this.sortedKeys.push(vnodeKey);
        }

        this.sortedKeys.sort();
    }

    removeNode(node) {
        if (!this.nodes.has(node)) return;

        this.nodes.delete(node);

        for (let i = 0; i < this.vnodes; i++) {
            const vnodeKey = this._hash(`${node}:vnode:${i}`);
            this.ring.delete(vnodeKey);
        }

        this.sortedKeys = this.sortedKeys.filter(
            k => !k.startsWith(this._hash(`${node}:vnode:`).substring(0, 8))
        );
        this.sortedKeys.sort();
    }

    getNode(key) {
        if (this.sortedKeys.length === 0) return null;

        const hash = this._hash(key.toString());

        for (let i = 0; i < this.sortedKeys.length; i++) {
            if (this.sortedKeys[i] >= hash) {
                return this.ring.get(this.sortedKeys[i]);
            }
        }

        return this.ring.get(this.sortedKeys[0]);
    }

    getNodes(key, count = 1) {
        if (this.sortedKeys.length === 0) return [];

        const results = [];
        const hash = this._hash(key.toString());

        let startIndex = this.sortedKeys.findIndex(k => k >= hash);
        if (startIndex === -1) startIndex = 0;

        const seenNodes = new Set();

        for (let i = 0; i < this.sortedKeys.length && results.length < count; i++) {
            const index = (startIndex + i) % this.sortedKeys.length;
            const node = this.ring.get(this.sortedKeys[index]);

            if (!seenNodes.has(node)) {
                seenNodes.add(node);
                results.push(node);
            }
        }

        return results;
    }

    getAllNodes() {
        return Array.from(this.nodes);
    }

    getNodeCount() {
        return this.nodes.size;
    }

    getDistributionStats() {
        const stats = {};

        for (const node of this.nodes) {
            stats[node] = 0;
        }

        const testKeys = Array.from({ length: 10000 }, (_, i) => `test-key-${i}`);

        for (const key of testKeys) {
            const node = this.getNode(key);
            if (node) stats[node]++;
        }

        return stats;
    }
}

class StatefulServiceRouter {
    constructor(options = {}) {
        this.serviceName = options.serviceName || "stateful-service";
        this.routingKey = options.routingKey || "roomId";
        this.ring = new ConsistentHashRing({ vnodes: options.vnodes || 100 });
        this.fallbackUrl = options.fallbackUrl || null;
    }

    setNodes(nodes) {
        this.ring = new ConsistentHashRing({ vnodes: this.ring.vnodes });
        nodes.forEach(node => this.ring.addNode(node));
    }

    addNode(node) {
        this.ring.addNode(node);
    }

    removeNode(node) {
        this.ring.removeNode(node);
    }

    getRouteUrl(req) {
        const routingValue =
            req.query[this.routingKey] ||
            req.headers[`x-${this.routingKey}`] ||
            req.params[this.routingKey];

        if (!routingValue && !this.fallbackUrl) {
            throw new Error(`Routing key '${this.routingKey}' is required`);
        }

        if (!routingValue) {
            return this.fallbackUrl;
        }

        const node = this.ring.getNode(routingValue);

        if (!node && this.fallbackUrl) {
            return this.fallbackUrl;
        }

        if (!node) {
            throw new Error(`No healthy nodes available for ${this.serviceName}`);
        }

        return node;
    }

    middleware() {
        const router = this;

        return async (req, res, next) => {
            try {
                const targetUrl = router.getRouteUrl(req);
                req.statefulTarget = targetUrl;
                req.routingKey =
                    req.query[router.routingKey] || req.headers[`x-${router.routingKey}`];
                next();
            } catch (error) {
                res.status(503).json({
                    error: "Service unavailable",
                    message: error.message,
                });
            }
        };
    }
}

module.exports = {
    ConsistentHashRing,
    StatefulServiceRouter,
};
