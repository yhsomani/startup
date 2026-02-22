/**
 * Service Dependency Graph
 *
 * Generates Mermaid diagram showing service dependencies
 * based on service registry and configuration.
 */

class ServiceDependencyGraph {
    constructor() {
        this.services = new Map();
        this.dependencies = new Map();
    }

    addService(name, config) {
        this.services.set(name, {
            name,
            type: config.type || "backend",
            language: config.language || "unknown",
            port: config.port,
            dependencies: config.dependencies || [],
        });

        if (!this.dependencies.has(name)) {
            this.dependencies.set(name, new Set());
        }

        (config.dependencies || []).forEach(dep => {
            if (!this.dependencies.has(dep)) {
                this.dependencies.set(dep, new Set());
            }
            this.dependencies.get(dep).add(name);
        });
    }

    getGraph() {
        const nodes = [];
        const edges = [];

        this.services.forEach((service, name) => {
            const color = this.getColorForType(service.type);
            nodes.push(`${name}[${name}]`);
        });

        this.dependencies.forEach((dependents, provider) => {
            dependents.forEach(consumer => {
                edges.push(`${consumer} --> ${provider}`);
            });
        });

        return { nodes, edges };
    }

    getColorForType(type) {
        const colors = {
            gateway: "stroke:#1976D2,fill:#E3F2FD",
            backend: "stroke:#388E3C,fill:#E8F5E9",
            worker: "stroke:#F57C00,fill:#FFF3E0",
            database: "stroke:#7B1FA2,fill:#F3E5F5",
            cache: "stroke:#D32F2F,fill:#FFEBEE",
            queue: "stroke:#00796B,fill:#E0F2F1",
        };
        return colors[type] || "stroke:#757575,fill:#FAFAFA";
    }

    toMermaid() {
        const { nodes, edges } = this.getGraph();

        return `flowchart TD
    ${nodes.map(n => `    ${n}`).join("\n")}
    ${edges.map(e => `    ${e}`).join("\n")}`;
    }

    toJSON() {
        return {
            nodes: Array.from(this.services.entries()).map(([name, config]) => ({
                id: name,
                ...config,
            })),
            edges: Array.from(this.dependencies.entries()).flatMap(([provider, dependents]) =>
                Array.from(dependents).map(consumer => ({
                    from: consumer,
                    to: provider,
                }))
            ),
        };
    }

    findCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const circular = [];

        const dfs = (node, path) => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const deps = this.services.get(node)?.dependencies || [];

            for (const dep of deps) {
                if (!visited.has(dep)) {
                    const cycle = dfs(dep, [...path]);
                    if (cycle) return cycle;
                } else if (recursionStack.has(dep)) {
                    const cycleStart = path.indexOf(dep);
                    return path.slice(cycleStart);
                }
            }

            recursionStack.delete(node);
            return null;
        };

        for (const service of this.services.keys()) {
            if (!visited.has(service)) {
                const cycle = dfs(service, []);
                if (cycle) circular.push(cycle);
            }
        }

        return circular;
    }

    getTopologicalOrder() {
        const inDegree = new Map();
        const result = [];

        this.services.forEach((_, name) => inDegree.set(name, 0));

        this.dependencies.forEach(dependents => {
            dependents.forEach(consumer => {
                inDegree.set(consumer, (inDegree.get(consumer) || 0) + 1);
            });
        });

        const queue = [];
        inDegree.forEach((degree, node) => {
            if (degree === 0) queue.push(node);
        });

        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node);

            const consumers = this.dependencies.get(node) || new Set();
            consumers.forEach(consumer => {
                const newDegree = (inDegree.get(consumer) || 1) - 1;
                inDegree.set(consumer, newDegree);
                if (newDegree === 0) queue.push(consumer);
            });
        }

        return result;
    }
}

const dependencyGraph = new ServiceDependencyGraph();

dependencyGraph.addService("api-gateway", {
    type: "gateway",
    port: 3000,
    dependencies: ["auth-service", "job-service", "lms-service", "challenge-service"],
});

dependencyGraph.addService("auth-service", {
    type: "backend",
    port: 3001,
    dependencies: ["database", "redis"],
});

dependencyGraph.addService("job-service", {
    type: "backend",
    port: 3002,
    dependencies: ["database", "redis", "search-service"],
});

dependencyGraph.addService("lms-service", {
    type: "backend",
    language: "java",
    port: 3003,
    dependencies: ["database", "redis", "rabbitmq"],
});

dependencyGraph.addService("challenge-service", {
    type: "backend",
    language: "dotnet",
    port: 3006,
    dependencies: ["database", "redis"],
});

dependencyGraph.addService("database", { type: "database" });
dependencyGraph.addService("redis", { type: "cache" });
dependencyGraph.addService("rabbitmq", { type: "queue" });
dependencyGraph.addService("search-service", { type: "backend" });

module.exports = {
    ServiceDependencyGraph,
    dependencyGraph,
};
