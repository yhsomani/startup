/**
 * Stateful Routing Middleware for API Gateway
 *
 * Uses consistent hashing to route requests to specific backend
 * instances based on session/room identifiers.
 *
 * Use cases:
 * - WebSocket connections (collaboration rooms)
 * - Video calls (room IDs)
 * - Real-time collaboration (document IDs)
 */

const { StatefulServiceRouter, ConsistentHashRing } = require("../shared/consistent-hashing");
const { serviceRegistry } = require("../shared/service-registry");

class StatefulRoutingManager {
    constructor() {
        this.routers = new Map();
        this.refreshInterval = null;
    }

    registerStatefulRoute(config) {
        const { serviceName, routePath, routingKey, vnodes = 100 } = config;

        const router = new StatefulServiceRouter({
            serviceName,
            routingKey,
            vnodes,
            fallbackUrl: null,
        });

        this.routers.set(routePath, router);

        console.log(
            `[StatefulRouting] Registered route ${routePath} -> ${serviceName} (key: ${routingKey})`
        );

        return router;
    }

    async refreshNodes() {
        for (const [path, router] of this.routers.entries()) {
            try {
                const nodes = serviceRegistry.getNodesForHashRing(router.serviceName);

                if (nodes.length > 0) {
                    router.setNodes(nodes);
                    console.log(
                        `[StatefulRouting] Updated ${router.serviceName} with ${nodes.length} nodes`
                    );
                }
            } catch (error) {
                console.error(
                    `[StatefulRouting] Failed to refresh nodes for ${router.serviceName}:`,
                    error.message
                );
            }
        }
    }

    startNodeRefresh(intervalMs = 30000) {
        this.refreshInterval = setInterval(() => this.refreshNodes(), intervalMs);
        this.refreshNodes();
    }

    stopNodeRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    getRouter(routePath) {
        return this.routers.get(routePath);
    }

    middleware() {
        const manager = this;

        return async (req, res, next) => {
            for (const [path, router] of manager.routers.entries()) {
                if (req.path.startsWith(path)) {
                    try {
                        const targetUrl = router.getRouteUrl(req);
                        req.statefulRoute = {
                            serviceName: router.serviceName,
                            routingKey: router.routingKey,
                            targetUrl,
                        };
                    } catch (error) {
                        return res.status(503).json({
                            error: "Service unavailable",
                            message: error.message,
                        });
                    }
                }
            }

            next();
        };
    }
}

const routingManager = new StatefulRoutingManager();

function setupStatefulRoutes() {
    routingManager.registerStatefulRoute({
        serviceName: "collaboration-service",
        routePath: "/api/v1/collaboration",
        routingKey: "roomId",
        vnodes: 150,
    });

    routingManager.registerStatefulRoute({
        serviceName: "video-service",
        routePath: "/api/v1/video",
        routingKey: "roomId",
        vnodes: 150,
    });

    routingManager.registerStatefulRoute({
        serviceName: "whiteboard-service",
        routePath: "/api/v1/whiteboard",
        routingKey: "boardId",
        vnodes: 100,
    });

    routingManager.startNodeRefresh(30000);
}

module.exports = {
    StatefulRoutingManager,
    routingManager,
    setupStatefulRoutes,
};
