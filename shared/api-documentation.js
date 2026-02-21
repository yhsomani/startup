/**
 * API Documentation System
 * 
 * Integrated OpenAPI/Swagger documentation for all TalentSphere services
 */

const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

class APIDocumentation {
  constructor() {
    this.app = express();
    this.setupDocumentation();
  }

  /**
   * Setup OpenAPI documentation
   */
  setupDocumentation() {
    // OpenAPI specification
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'TalentSphere API',
          version: '2.0.0',
          description: 'Complete API documentation for TalentSphere learning platform',
          contact: {
            name: 'API Support',
            email: 'api@talentsphere.com',
            url: 'https://talentsphere.com/support'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: 'http://localhost:8000',
            description: 'Development server'
          },
          {
            url: 'https://api.talentsphere.com',
            description: 'Production server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT authentication token'
            }
          },
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Unique user identifier'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address'
                },
                role: {
                  type: 'string',
                  enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
                  description: 'User role'
                },
                is_active: {
                  type: 'boolean',
                  description: 'Whether the user account is active'
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Account creation timestamp'
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last update timestamp'
                }
              }
            },
            Course: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Unique course identifier'
                },
                title: {
                  type: 'string',
                  description: 'Course title'
                },
                description: {
                  type: 'string',
                  description: 'Course description'
                },
                price: {
                  type: 'number',
                  format: 'decimal',
                  description: 'Course price'
                },
                is_published: {
                  type: 'boolean',
                  description: 'Whether the course is published'
                },
                instructor_id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Course instructor ID'
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Course creation timestamp'
                }
              }
            },
            Challenge: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Unique challenge identifier'
                },
                title: {
                  type: 'string',
                  description: 'Challenge title'
                },
                description: {
                  type: 'string',
                  description: 'Challenge description'
                },
                passing_score: {
                  type: 'number',
                  format: 'decimal',
                  description: 'Minimum score to pass'
                },
                is_active: {
                  type: 'boolean',
                  description: 'Whether the challenge is active'
                }
              }
            },
            Notification: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Unique notification identifier'
                },
                type: {
                  type: 'string',
                  enum: ['info', 'success', 'warning', 'error', 'system'],
                  description: 'Notification type'
                },
                title: {
                  type: 'string',
                  description: 'Notification title'
                },
                message: {
                  type: 'string',
                  description: 'Notification message'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'normal', 'high', 'urgent'],
                  description: 'Notification priority'
                },
                data: {
                  type: 'object',
                  description: 'Additional notification data'
                }
              }
            },
            Error: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Error message'
                },
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp'
                },
                request_id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Request identifier for tracing'
                }
              }
            },
            PaginatedResponse: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object'
                  },
                  description: 'Response data array'
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page'
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items'
                    },
                    total_pages: {
                      type: 'integer',
                      description: 'Total number of pages'
                    },
                    has_next: {
                      type: 'boolean',
                      description: 'Whether there is a next page'
                    },
                    has_prev: {
                      type: 'boolean',
                      description: 'Whether there is a previous page'
                    }
                  }
                }
              }
            }
          }
        },
        paths: {
          // Authentication paths
          '/api/auth/register': {
            post: {
              tags: ['Authentication'],
              summary: 'Register a new user',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['email', 'password', 'name'],
                      properties: {
                        email: {
                          type: 'string',
                          format: 'email',
                          description: 'User email address'
                        },
                        password: {
                          type: 'string',
                          minLength: 8,
                          description: 'User password (minimum 8 characters)'
                        },
                        name: {
                          type: 'string',
                          description: 'User full name'
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'User registered successfully',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                },
                400: {
                  description: 'Invalid input data',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                },
                409: {
                  description: 'User already exists',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/auth/login': {
            post: {
              tags: ['Authentication'],
              summary: 'Authenticate user',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['email', 'password'],
                      properties: {
                        email: {
                          type: 'string',
                          format: 'email',
                          description: 'User email address'
                        },
                        password: {
                          type: 'string',
                          description: 'User password'
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'Authentication successful',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          user: {
                            $ref: '#/components/schemas/User'
                          },
                          token: {
                            type: 'string',
                            description: 'JWT authentication token'
                          }
                        }
                      }
                    }
                  }
                },
                401: {
                  description: 'Invalid credentials',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/auth/me': {
            get: {
              tags: ['Authentication'],
              summary: 'Get current user profile',
              security: [
                {
                  bearerAuth: []
                }
              ],
              responses: {
                200: {
                  description: 'User profile retrieved',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                },
                401: {
                  description: 'Unauthorized',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                }
              }
            }
          },
          // Courses paths
          '/api/courses': {
            get: {
              tags: ['Courses'],
              summary: 'Get all courses',
              parameters: [
                {
                  in: 'query',
                  name: 'page',
                  schema: {
                    type: 'integer',
                    default: 1
                  },
                  description: 'Page number for pagination'
                },
                {
                  in: 'query',
                  name: 'limit',
                  schema: {
                    type: 'integer',
                    default: 20,
                    maximum: 100
                  },
                  description: 'Number of courses per page'
                },
                {
                  in: 'query',
                  name: 'category',
                  schema: {
                    type: 'string'
                  },
                  description: 'Filter by category'
                }
              ],
              responses: {
                200: {
                  description: 'Courses retrieved successfully',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/PaginatedResponse'
                      }
                    }
                  }
                }
              }
            },
            post: {
              tags: ['Courses'],
              summary: 'Create new course',
              security: [
                {
                  bearerAuth: []
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['title', 'description'],
                      properties: {
                        title: {
                          type: 'string',
                          description: 'Course title'
                        },
                        description: {
                          type: 'string',
                          description: 'Course description'
                        },
                        price: {
                          type: 'number',
                          format: 'decimal',
                          default: 0
                        },
                        category: {
                          type: 'string',
                          description: 'Course category'
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Course created successfully',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Course'
                      }
                    }
                  }
                },
                400: {
                  description: 'Invalid input data',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                },
                401: {
                  description: 'Unauthorized',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      apis: [
        './backends/backend-enhanced/auth-service/index.js',
        './backends/backend-enhanced/company-service/index.js',
        './backends/backend-enhanced/user-profile-service/index.js',
        './backends/backend-enhanced/job-listing-service/index.js',
        './backends/backend-enhanced/notification-service/enhanced-index.js',
        './backends/backend-enhanced/email-service/enhanced-index.js',
        './backends/backend-enhanced/analytics-service/enhanced-index.js'
      ]
    };

    // Generate OpenAPI specification
    const specs = swaggerJsdoc(options);

    // Setup Swagger UI
    this.app.use('/api-docs', swaggerUi.serve);
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
    this.app.use('/api-docs', swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'TalentSphere API Documentation'
    }));
  }

  /**
   * Get Express app with documentation
   */
  getApp() {
    return this.app;
  }

  /**
   * Add custom endpoint documentation
   */
  addEndpointDocumentation(path, method, documentation) {
    // This method can be used to dynamically add endpoint documentation
    // Implementation would extend the OpenAPI specification
  }

  /**
   * Generate API client SDK
   */
  generateClientSDK() {
    // Generate client SDK based on OpenAPI specification
    // This would create TypeScript/JavaScript clients
  }
}

module.exports = APIDocumentation;