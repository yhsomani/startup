/**
 * Service Contracts System
 * 
 * API contract validation and documentation system
 * with automated schema generation and validation
 */

const Joi = require('joi');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('ServiceContracts');

/**
 * Service Contract class for API validation
 */
class ServiceContract {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.operations = new Map();
    this.schemas = new Map();
    this.options = {
      strict: true,
      autoGenerate: true,
      validateResponses: options.validateResponses !== false,
      generateDocs: options.generateDocs !== false,
      ...options
    };
    
    this.logger = createLogger(`ServiceContract-${serviceName}`);
  }

  /**
   * Define an API operation with input/output schemas
   * @param {string} operationName - Name of the operation
   * @param {Object} definition - Operation definition
   * @returns {ServiceContract} This instance for chaining
   */
  defineOperation(operationName, definition) {
    const contract = {
      name: operationName,
      method: definition.method || 'POST',
      path: definition.path || `/${operationName}`,
      description: definition.description || `Operation: ${operationName}`,
      version: definition.version || '1.0.0',
      inputSchema: definition.inputSchema || {},
      outputSchema: definition.outputSchema || {},
      inputValidation: null,
      outputValidation: null,
      metadata: {
        deprecated: definition.deprecated || false,
        experimental: definition.experimental || false,
        requiresAuth: definition.requiresAuth !== false,
        rateLimit: definition.rateLimit,
        tags: definition.tags || [],
        examples: definition.examples || [],
        ...definition.metadata
      }
    };

    // Compile Joi schemas for validation
    if (definition.inputSchema && typeof definition.inputSchema === 'object') {
      contract.inputValidation = Joi.object(definition.inputSchema);
      contract.compiledInputSchema = this.compileSchema(definition.inputSchema);
    }

    if (definition.outputSchema && typeof definition.outputSchema === 'object') {
      contract.outputValidation = Joi.object(definition.outputSchema);
      contract.compiledOutputSchema = this.compileSchema(definition.outputSchema);
    }

    // Add security requirements
    if (contract.metadata.requiresAuth) {
      contract.security = [{
        type: 'bearer',
        scheme: 'jwt',
        description: 'JWT Bearer token required'
      }];
    }

    this.operations.set(operationName, contract);
    this.schemas.set(operationName, contract);

    this.logger.debug(`Defined operation contract: ${operationName}`, {
      method: contract.method,
      path: contract.path,
      hasInputValidation: !!contract.inputValidation,
      hasOutputValidation: !!contract.outputValidation
    });

    if (this.options.generateDocs) {
      this.generateOperationDocs(operationName, contract);
    }

    return this;
  }

  /**
   * Validate operation input
   * @param {string} operationName - Operation name
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateInput(operationName, data, options = {}) {
    const operation = this.operations.get(operationName);
    if (!operation) {
      throw new Error(`Operation ${operationName} not found in contract`);
    }

    if (!operation.inputValidation) {
      return {
        isValid: true,
        errors: null,
        data
      };
    }

    const { abortEarly = false, allowUnknown = false } = options;
    const validationOptions = {
      abortEarly,
      allowUnknown,
      stripUnknown: !allowUnknown
    };

    const { error, value } = operation.inputValidation.validate(data, validationOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
        value: detail.context?.value
      }));

      this.logger.warn(`Input validation failed for ${operationName}`, {
        operation: operationName,
        errors,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      });

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    this.logger.debug(`Input validation successful for ${operationName}`, {
      operation: operationName,
      validatedFields: Object.keys(value)
    });

    return {
      isValid: true,
      errors: null,
      data: value
    };
  }

  /**
   * Validate operation output
   * @param {string} operationName - Operation name
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateOutput(operationName, data, options = {}) {
    const operation = this.operations.get(operationName);
    if (!operation) {
      throw new Error(`Operation ${operationName} not found in contract`);
    }

    if (!operation.outputValidation) {
      return {
        isValid: true,
        errors: null,
        data
      };
    }

    const { abortEarly = false, allowUnknown = false } = options;
    const validationOptions = {
      abortEarly,
      allowUnknown,
      stripUnknown: !allowUnknown
    };

    const { error, value } = operation.outputValidation.validate(data, validationOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
        value: detail.context?.value
      }));

      this.logger.warn(`Output validation failed for ${operationName}`, {
        operation: operationName,
        errors,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      });

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    return {
      isValid: true,
      errors: null,
      data: value
    };
  }

  /**
   * Get operation contract
   * @param {string} operationName - Operation name
   * @returns {Object} Operation contract
   */
  getOperation(operationName) {
    return this.operations.get(operationName);
  }

  /**
   * Get all operation contracts
   * @returns {Array} Array of all operations
   */
  getAllOperations() {
    return Array.from(this.operations.values());
  }

  /**
   * Generate OpenAPI documentation for this service
   * @returns {Object} OpenAPI specification
   */
  generateOpenAPISpec() {
    const operations = Array.from(this.operations.values());
    
    const spec = {
      openapi: '3.0.0',
      info: {
        title: `${this.serviceName} API`,
        description: `API specification for ${this.serviceName} service`,
        version: '1.0.0',
        contact: {
          name: 'TalentSphere Team',
          email: 'api@talentsphere.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: `http://localhost:3000`,
          description: 'Development server'
        },
        {
          url: `https://api.talentsphere.com`,
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token authentication'
          }
        }
      },
      security: [],
      tags: []
    };

    // Build paths from operations
    operations.forEach(operation => {
      const pathItem = this.buildPathItem(operation);
      
      if (!spec.paths[operation.path]) {
        spec.paths[operation.path] = {};
      }
      
      spec.paths[operation.path][operation.method.toLowerCase()] = pathItem;
      
      // Add security requirements if auth is required
      if (operation.metadata.requiresAuth) {
        if (!spec.security.some(sec => sec.bearerAuth)) {
          spec.security.push({ bearerAuth: [] });
        }
      }
      
      // Extract and add components schemas
      this.extractSchemasFromOperation(operation, spec.components.schemas);
      
      // Add tags
      operation.metadata.tags.forEach(tag => {
        if (!spec.tags.some(t => t.name === tag)) {
          spec.tags.push({
            name: tag,
            description: `Operations related to ${tag}`
          });
        }
      });
    });

    return spec;
  }

  /**
   * Build OpenAPI path item from operation
   * @param {Object} operation - Operation contract
   * @returns {Object} OpenAPI path item
   */
  buildPathItem(operation) {
    const pathItem = {
      summary: operation.name,
      description: operation.description,
      operationId: operation.name,
      tags: operation.metadata.tags,
      responses: {
        '200': {
          description: 'Successful response'
        },
        '400': {
          description: 'Bad request - validation failed'
        },
        '401': {
          description: 'Unauthorized - authentication required'
        },
        '403': {
          description: 'Forbidden - insufficient permissions'
        },
        '404': {
          description: 'Not found'
        },
        '500': {
          description: 'Internal server error'
        }
      },
      parameters: []
    };

    // Add request body if input schema exists
    if (operation.inputValidation) {
      pathItem.requestBody = {
        description: 'Request body',
        required: true,
        content: {
          'application/json': {
            schema: this.convertJoiToJSONSchema(operation.inputValidation)
          }
        }
      };
    }

    // Add response schemas
    if (operation.outputValidation) {
      pathItem.responses['200'].content = {
        'application/json': {
          schema: this.convertJoiToJSONSchema(operation.outputValidation)
        }
      };
    }

    // Add deprecated flag
    if (operation.metadata.deprecated) {
      pathItem.deprecated = true;
    }

    return pathItem;
  }

  /**
   * Convert Joi schema to JSON Schema
   * @param {Object} joiSchema - Joi schema to convert
   * @returns {Object} JSON Schema
   */
  convertJoiToJSONSchema(joiSchema) {
    const describe = joiSchema.describe();
    return this.joiDescribeToJSONSchema(describe);
  }

  /**
   * Convert Joi describe object to JSON Schema
   * @param {Object} describe - Joi describe object
   * @returns {Object} JSON Schema
   */
  joiDescribeToJSONSchema(describe) {
    if (describe.type === 'object' && describe.keys) {
      const properties = {};
      const required = [];

      Object.keys(describe.keys).forEach(key => {
        const keySchema = describe.keys[key];
        properties[key] = this.joiDescribeToJSONSchema(keySchema);
        
        if (keySchema.flags?.presence === 'required') {
          required.push(key);
        }
      });

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }

    switch (describe.type) {
      case 'string':
        return {
          type: 'string',
          minLength: describe.rules?.find(r => r.name === 'min')?.args?.limit,
          maxLength: describe.rules?.find(r => r.name === 'max')?.args?.limit,
          pattern: describe.rules?.find(r => r.name === 'pattern')?.args?.regex?.source
        };
      
      case 'number':
        return {
          type: 'number',
          minimum: describe.rules?.find(r => r.name === 'min')?.args?.limit,
          maximum: describe.rules?.find(r => r.name === 'max')?.args?.limit
        };
      
      case 'boolean':
        return {
          type: 'boolean'
        };
      
      case 'array':
        return {
          type: 'array',
          items: describe.items ? this.joiDescribeToJSONSchema(describe.items) : {},
          minItems: describe.rules?.find(r => r.name === 'min')?.args?.limit,
          maxItems: describe.rules?.find(r => r.name === 'max')?.args?.limit
        };
      
      default:
        return {};
    }
  }

  /**
   * Extract schemas from operation and add to components
   * @param {Object} operation - Operation contract
   * @param {Object} schemas - Schemas object to update
   */
  extractSchemasFromOperation(operation, schemas) {
    if (!operation.inputSchema) return;

    const schemaName = `${operation.name}Input`;
    schemas[schemaName] = this.convertJoiToJSONSchema(operation.inputValidation);

    if (operation.outputSchema) {
      const outputSchemaName = `${operation.name}Output`;
      schemas[outputSchemaName = this.convertJoiToJSONSchema(operation.outputValidation);
    }
  }

  /**
   * Generate documentation for specific operation
   * @param {string} operationName - Operation name
   * @param {Object} operation - Operation contract
   */
  generateOperationDocs(operationName, operation) {
    const docs = {
      name: operationName,
      method: operation.method,
      path: operation.path,
      description: operation.description,
      inputSchema: operation.inputSchema,
      outputSchema: operation.outputSchema,
      examples: operation.metadata.examples || [],
      tags: operation.metadata.tags || [],
      security: operation.metadata.requiresAuth || false
    };

    this.logger.info(`Generated documentation for operation: ${operationName}`);
    return docs;
  }

  /**
   * Compile schema for validation performance
   * @param {Object} schema - Joi schema
   * @returns {Object} Compiled schema
   */
  compileSchema(schema) {
    try {
      return Joi.object(schema);
    } catch (error) {
      this.logger.error('Failed to compile schema', {
        error: error.message,
        schema
      });
      return null;
    }
  }

  /**
   * Validate contract integrity
   * @returns {Object} Validation results
   */
  validateContract() {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    this.operations.forEach((operation, name) => {
      // Check for required fields
      if (!operation.name || !operation.path) {
        results.errors.push({
          operation: name,
          message: 'Operation missing required name or path'
        });
        results.isValid = false;
      }

      // Check for duplicate paths
      const duplicatePath = Array.from(this.operations.values())
        .filter(op => op.name !== name && op.path === operation.path);
      
      if (duplicatePath.length > 0) {
        results.errors.push({
          operation: name,
          message: `Duplicate path: ${operation.path}`
        });
        results.isValid = false;
      }

      // Validate schemas
      if (operation.inputSchema && !operation.inputValidation) {
        results.warnings.push({
          operation: name,
          message: 'Input schema defined but not compiled'
        });
      }
    });

    return results;
  }

  /**
   * Export contract to JSON
   * @returns {Object} Contract export
   */
  exportToJSON() {
    return {
      serviceName: this.serviceName,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      operations: Array.from(this.operations.entries()).map(([name, contract]) => ({
        name,
        ...contract,
        inputSchema: contract.inputSchema,
        outputSchema: contract.outputSchema
      })),
      openapiSpec: this.generateOpenAPISpec()
    };
  }
}

/**
 * Contract registry for managing multiple service contracts
 */
class ContractRegistry {
  constructor() {
    this.contracts = new Map();
    this.logger = createLogger('ContractRegistry');
  }

  /**
   * Register a service contract
   * @param {string} serviceName - Service name
   * @param {ServiceContract} contract - Service contract instance
   */
  register(serviceName, contract) {
    if (!(contract instanceof ServiceContract)) {
      throw new Error('Contract must be an instance of ServiceContract');
    }

    this.contracts.set(serviceName, contract);
    this.logger.info(`Registered contract for service: ${serviceName}`);
  }

  /**
   * Get contract by service name
   * @param {string} serviceName - Service name
   * @returns {ServiceContract} Service contract
   */
  getContract(serviceName) {
    return this.contracts.get(serviceName);
  }

  /**
   * Get all registered contracts
   * @returns {Array} Array of all contracts
   */
  getAllContracts() {
    return Array.from(this.contracts.entries()).map(([name, contract]) => ({
      serviceName: name,
      contract
    }));
  }

  /**
   * Generate combined OpenAPI spec for all services
   * @returns {Object} Combined OpenAPI specification
   */
  generateCombinedOpenAPISpec() {
    const allContracts = this.getAllContracts();
    
    const combinedSpec = {
      openapi: '3.0.0',
      info: {
        title: 'TalentSphere API',
        description: 'Combined API specification for all TalentSphere services',
        version: '1.0.0',
        contact: {
          name: 'TalentSphere Team',
          email: 'api@talentsphere.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://api.talentsphere.com',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token authentication'
          }
        }
      },
      security: [],
      tags: []
    };

    // Combine all operation paths
    allContracts.forEach(({ serviceName, contract }) => {
      const spec = contract.generateOpenAPISpec();
      
      // Add service-specific prefix to paths
      Object.keys(spec.paths).forEach(path => {
        const prefixedPath = `/api/${serviceName}${path}`;
        combinedSpec.paths[prefixedPath] = spec.paths[path];
      });
      
      // Combine schemas
      Object.assign(combinedSpec.components.schemas, spec.components.schemas);
      
      // Add service tags
      const serviceTags = spec.tags.map(tag => ({
        ...tag,
        description: `${tag} operations for ${serviceName}`
      }));
      combinedSpec.tags.push(...serviceTags);
    });

    return combinedSpec;
  }

  /**
   * Validate all registered contracts
   * @returns {Object} Combined validation results
   */
  validateAllContracts() {
    const results = {
      isValid: true,
      services: {},
      totalErrors: 0,
      totalWarnings: 0
    };

    this.contracts.forEach((contract, serviceName) => {
      const contractResults = contract.validateContract();
      results.services[serviceName] = contractResults;
      results.totalErrors += contractResults.errors.length;
      results.totalWarnings += contractResults.warnings.length;
      
      if (!contractResults.isValid) {
        results.isValid = false;
      }
    });

    return results;
  }
}

// Create global registry instance
const globalRegistry = new ContractRegistry();

module.exports = {
  ServiceContract,
  ContractRegistry,
  globalRegistry
};