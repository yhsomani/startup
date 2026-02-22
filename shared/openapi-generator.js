/**
 * OpenAPI Documentation Generator
 *
 * Generates OpenAPI 3.0 spec from route definitions and aggregates
 * specs from all microservices.
 */

const fs = require("fs");
const path = require("path");

class OpenAPIGenerator {
    constructor(options = {}) {
        this.title = options.title || "TalentSphere API";
        this.version = options.version || "1.0.0";
        this.description = options.description || "TalentSphere Microservices Platform";
        this.servers = options.servers || [
            { url: "https://api.talentsphere.com", description: "Production" },
            { url: "https://staging-api.talentsphere.com", description: "Staging" },
        ];
        this.spec = null;
    }

    generate(routes = []) {
        this.spec = {
            openapi: "3.0.3",
            info: {
                title: this.title,
                version: this.version,
                description: this.description,
                contact: {
                    name: "TalentSphere API Support",
                    email: "api-support@talentsphere.com",
                },
                license: {
                    name: "Proprietary",
                },
            },
            servers: this.servers,
            paths: {},
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                    apiKeyHeader: {
                        type: "apiKey",
                        in: "header",
                        name: "X-API-Key",
                    },
                },
                schemas: this.generateBaseSchemas(),
                responses: {
                    BadRequest: {
                        description: "Bad Request",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },
                    Unauthorized: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },
                    Forbidden: {
                        description: "Forbidden",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },
                    NotFound: {
                        description: "Not Found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },
                    InternalServerError: {
                        description: "Internal Server Error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },
                },
            },
            security: [{ bearerAuth: [] }],
        };

        routes.forEach(route => this.addRoute(route));

        return this.spec;
    }

    generateBaseSchemas() {
        return {
            Error: {
                type: "object",
                properties: {
                    error: { type: "string" },
                    message: { type: "string" },
                    code: { type: "string" },
                    details: { type: "object" },
                },
            },
            PaginatedResponse: {
                type: "object",
                properties: {
                    data: {
                        type: "array",
                        items: { type: "object" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            total: { type: "integer" },
                            total_pages: { type: "integer" },
                        },
                    },
                },
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    is_premium: { type: "boolean" },
                },
            },
            Job: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    company_id: { type: "string", format: "uuid" },
                    location: { type: "object" },
                    salary: { type: "object" },
                    employment_type: { type: "string" },
                    status: { type: "string" },
                },
            },
        };
    }

    addRoute(route) {
        const {
            method,
            path,
            summary,
            description,
            tags,
            parameters,
            requestBody,
            responses,
            security,
        } = route;

        if (!this.spec.paths[path]) {
            this.spec.paths[path] = {};
        }

        const routeSpec = {
            summary: summary || "",
            description: description || "",
            tags: tags || ["General"],
            parameters: this.buildParameters(parameters || []),
            responses: this.buildResponses(responses || {}),
        };

        if (requestBody) {
            routeSpec.requestBody = this.buildRequestBody(requestBody);
        }

        if (security !== undefined) {
            routeSpec.security = security ? [{ bearerAuth: [] }] : [];
        }

        this.spec.paths[path][method.toLowerCase()] = routeSpec;
    }

    buildParameters(params) {
        return params.map(param => ({
            name: param.name,
            in: param.in || "query",
            description: param.description || "",
            required: param.required || false,
            schema: {
                type: param.type || "string",
            },
        }));
    }

    buildRequestBody(body) {
        const content = {};

        if (body.contentTypes) {
            body.contentTypes.forEach(ct => {
                content[ct] = {
                    schema: body.schema || { type: "object" },
                };
            });
        } else {
            content["application/json"] = {
                schema: body.schema || { type: "object" },
            };
        }

        return {
            description: body.description || "",
            required: body.required || true,
            content,
        };
    }

    buildResponses(responses) {
        const result = {};

        Object.entries(responses).forEach(([code, response]) => {
            result[code] = {
                description: response.description || "",
                content: response.content
                    ? {
                          "application/json": {
                              schema: response.schema || { type: "object" },
                          },
                      }
                    : undefined,
            };
        });

        return result;
    }

    async mergeMicroserviceSpecs(specPaths) {
        for (const specPath of specPaths) {
            try {
                const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
                this.mergeSpec(spec);
            } catch (error) {
                console.error(`Failed to merge spec from ${specPath}:`, error.message);
            }
        }

        return this.spec;
    }

    mergeSpec(microserviceSpec) {
        if (!microserviceSpec.paths) return;

        Object.entries(microserviceSpec.paths).forEach(([path, methods]) => {
            if (!this.spec.paths[path]) {
                this.spec.paths[path] = {};
            }

            Object.entries(methods).forEach(([method, spec]) => {
                this.spec.paths[path][method] = spec;
            });
        });

        if (microserviceSpec.components?.schemas) {
            this.spec.components.schemas = {
                ...this.spec.components.schemas,
                ...microserviceSpec.components.schemas,
            };
        }
    }

    save(outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(this.spec, null, 2));
    }

    getSpec() {
        return this.spec;
    }
}

const openAPIGenerator = new OpenAPIGenerator({
    title: "TalentSphere API",
    version: "2.0.0",
    servers: [{ url: "https://api.talentsphere.com", description: "Production" }],
});

module.exports = {
    OpenAPIGenerator,
    openAPIGenerator,
};
