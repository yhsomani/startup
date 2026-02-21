/**
 * Swagger API Documentation Configuration
 * Generates OpenAPI 3.0 specification for TalentSphere APIs
 */

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "TalentSphere API",
            version: "1.0.0",
            description: "Talent recruitment and management platform API documentation",
            contact: {
                name: "TalentSphere Support",
                email: "support@talentsphere.com",
            },
            license: {
                name: "MIT",
                url: "https://opensource.org/licenses/MIT",
            },
        },
        servers: [
            {
                url: process.env.API_BASE_URL || "http://localhost:3000",
                description: "Development server",
            },
            {
                url: "https://api.talentsphere.com",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["email", "firstName", "lastName"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User unique identifier",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        firstName: {
                            type: "string",
                            description: "User first name",
                        },
                        lastName: {
                            type: "string",
                            description: "User last name",
                        },
                        role: {
                            type: "string",
                            enum: ["user", "admin", "recruiter"],
                            description: "User role",
                        },
                        profile: {
                            type: "object",
                            properties: {
                                headline: {
                                    type: "string",
                                    description: "Professional headline",
                                },
                                summary: {
                                    type: "string",
                                    description: "Professional summary",
                                },
                            },
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Account creation date",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Last update date",
                        },
                    },
                },
                Job: {
                    type: "object",
                    required: ["title", "company", "location", "type"],
                    properties: {
                        id: {
                            type: "string",
                            description: "Job unique identifier",
                        },
                        title: {
                            type: "string",
                            description: "Job title",
                        },
                        company: {
                            type: "string",
                            description: "Company name",
                        },
                        location: {
                            type: "string",
                            description: "Job location",
                        },
                        type: {
                            type: "string",
                            enum: ["full-time", "part-time", "contract", "internship"],
                            description: "Employment type",
                        },
                        remote: {
                            type: "boolean",
                            description: "Remote work available",
                        },
                        description: {
                            type: "string",
                            description: "Job description",
                        },
                        requirements: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Job requirements",
                        },
                        salary: {
                            type: "string",
                            description: "Salary range",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Job posting date",
                        },
                    },
                },
                Application: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Application unique identifier",
                        },
                        jobId: {
                            type: "string",
                            description: "Job identifier",
                        },
                        userId: {
                            type: "string",
                            description: "User identifier",
                        },
                        status: {
                            type: "string",
                            enum: ["pending", "reviewed", "accepted", "rejected"],
                            description: "Application status",
                        },
                        coverLetter: {
                            type: "string",
                            description: "Cover letter content",
                        },
                        resume: {
                            type: "string",
                            description: "Resume file URL",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Application date",
                        },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                        },
                        code: {
                            type: "string",
                            description: "Error code",
                        },
                        details: {
                            type: "object",
                            description: "Additional error details",
                        },
                    },
                },
                Pagination: {
                    type: "object",
                    properties: {
                        page: {
                            type: "integer",
                            description: "Current page number",
                        },
                        limit: {
                            type: "integer",
                            description: "Items per page",
                        },
                        total: {
                            type: "integer",
                            description: "Total number of items",
                        },
                        pages: {
                            type: "integer",
                            description: "Total number of pages",
                        },
                    },
                },
                PaginatedResponse: {
                    type: "object",
                    properties: {
                        items: {
                            type: "array",
                            items: {
                                oneOf: [
                                    { $ref: "#/components/schemas/User" },
                                    { $ref: "#/components/schemas/Job" },
                                    { $ref: "#/components/schemas/Application" },
                                ],
                            },
                        },
                        pagination: {
                            $ref: "#/components/schemas/Pagination",
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/middleware/*.js"],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: "none",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
    },
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
    customSiteTitle: "TalentSphere API Documentation",
};

// Middleware functions
const setupSwagger = app => {
    // Swagger UI endpoint
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // JSON specification endpoint
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
};

// API documentation examples and annotations
/**
 * @swagger
 * components:
 *   examples:
 *     UserExample:
 *       value:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         email: "john.doe@example.com"
 *         firstName: "John"
 *         lastName: "Doe"
 *         role: "user"
 *         profile:
 *           headline: "Software Engineer"
 *           summary: "Experienced software engineer with 5+ years"
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 *
 *     JobExample:
 *       value:
 *         id: "123e4567-e89b-12d3-a456-426614174001"
 *         title: "Senior Software Engineer"
 *         company: "Tech Corp"
 *         location: "San Francisco, CA"
 *         type: "full-time"
 *         remote: true
 *         description: "Senior software engineering position with focus on React and Node.js"
 *         requirements: ["5+ years experience", "React knowledge", "Node.js knowledge"]
 *         salary: "$120k-$180k"
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *
 *     ErrorResponseExample:
 *       value:
 *         error: "Resource not found"
 *         code: "NOT_FOUND"
 *         details:
 *           resource: "User"
 *           id: "invalid-id"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: "JWT authentication token"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '401':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid email or password"
 *               code: "INVALID_CREDENTIALS"
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user profile
 *     description: Retrieve current user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               $ref: '#/components/examples/UserExample'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               profile:
 *                 type: object
 *                 properties:
 *                   headline:
 *                     type: string
 *                     example: "Software Engineer"
 *                   summary:
 *                     type: string
 *                     example: "Experienced software engineer"
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {
    setupSwagger,
    swaggerSpec,
    swaggerOptions,
    swaggerUiOptions,
};
