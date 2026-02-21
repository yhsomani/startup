/**
 * Inter-Service Authentication Module
 * 
 * Provides secure authentication mechanisms for service-to-service communication
 * including JWT tokens, API keys, and mutual TLS support
 */

import { createLogger, type Logger } from './logger.js';
import type { MetricsCollector } from './metrics.js';

export interface ServiceCredentials {
  /** Service ID */
  serviceId: string;
  /** Service name */
  serviceName: string;
  /** Service secret key */
  secretKey: string;
  /** Service permissions */
  permissions: string[];
  /** Service roles */
  roles: string[];
  /** Token expiration time */
  tokenExpiration?: number;
}

export interface AuthToken {
  /** JWT token */
  token: string;
  /** Token type */
  type: 'jwt' | 'api-key' | 'mtls';
  /** Token expiration */
  expiresAt: Date;
  /** Issued at */
  issuedAt: Date;
  /** Issuer service */
  issuer: string;
  /** Audience (target service) */
  audience?: string;
}

export interface InterServiceAuthConfig {
  /** JWT secret key */
  jwtSecret?: string;
  /** Default token expiration in seconds */
  defaultTokenExpiration?: number;
  /** API key header name */
  apiKeyHeader?: string;
  /** Enable mutual TLS */
  enableMtls?: boolean;
  /** Certificate path for mTLS */
  mtlsCertPath?: string;
  /** Private key path for mTLS */
  mtlsKeyPath?: string;
  /** CA path for mTLS */
  mtlsCaPath?: string;
  /** Enable token caching */
  enableTokenCaching?: boolean;
  /** Token cache TTL in seconds */
  tokenCacheTtl?: number;
}

/**
 * Inter-Service Authentication Manager
 */
export class InterServiceAuth {
  private readonly logger: Logger;
  private readonly config: Required<InterServiceAuthConfig>;
  private readonly credentials: Map<string, ServiceCredentials> = new Map();
  private readonly tokenCache: Map<string, AuthToken> = new Map();
  private tokenCleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly metrics: MetricsCollector,
    config: InterServiceAuthConfig = {}
  ) {
    this.logger = createLogger('InterServiceAuth');
    this.config = {
      jwtSecret: process.env.INTER_SERVICE_JWT_SECRET || 'default-inter-service-secret-change-in-production',
      defaultTokenExpiration: 3600, // 1 hour
      apiKeyHeader: 'X-Service-API-Key',
      enableMtls: false,
      mtlsCertPath: process.env.MTLS_CERT_PATH || '',
      mtlsKeyPath: process.env.MTLS_KEY_PATH || '',
      mtlsCaPath: process.env.MTLS_CA_PATH || '',
      enableTokenCaching: true,
      tokenCacheTtl: 3000, // 50 minutes (slightly less than token expiration)
      ...config
    };

    if (this.config.enableTokenCaching) {
      this.startTokenCleanupTimer();
    }

    this.logger.info('Inter-Service Authentication initialized', {
      tokenExpiration: this.config.defaultTokenExpiration,
      enableMtls: this.config.enableMtls,
      enableTokenCaching: this.config.enableTokenCaching
    });
  }

  /**
   * Register service credentials
   */
  registerServiceCredentials(credentials: ServiceCredentials): void {
    this.credentials.set(credentials.serviceId, credentials);

    this.logger.info('Service credentials registered', {
      serviceId: credentials.serviceId,
      serviceName: credentials.serviceName,
      permissions: credentials.permissions.length,
      roles: credentials.roles.length
    });

    if (this.metrics) {
      this.metrics.incrementCounter('auth.credentials.registered', {
        service: credentials.serviceName
      });
    }
  }

  /**
   * Unregister service credentials
   */
  unregisterServiceCredentials(serviceId: string): boolean {
    const removed = this.credentials.delete(serviceId);
    
    if (removed) {
      this.logger.info('Service credentials unregistered', { serviceId });
      
      // Clear cached tokens for this service
      const keysToDelete: string[] = [];
      this.tokenCache.forEach((token, key) => {
        if (key.startsWith(`${serviceId}:`) || token.issuer === serviceId) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.tokenCache.delete(key));

      if (this.metrics) {
        this.metrics.incrementCounter('auth.credentials.unregistered', {
          serviceId
        });
      }
    }

    return removed;
  }

  /**
   * Generate authentication token for service-to-service communication
   */
  async generateToken(
    serviceId: string,
    audience?: string,
    customExpiration?: number
  ): Promise<AuthToken> {
    const credentials = this.credentials.get(serviceId);
    if (!credentials) {
      throw new Error(`Credentials not found for service: ${serviceId}`);
    }

    // Check cache first
    if (this.config.enableTokenCaching) {
      const cacheKey = `${serviceId}:${audience || 'default'}`;
      const cachedToken = this.tokenCache.get(cacheKey);
      
      if (cachedToken && cachedToken.expiresAt > new Date()) {
        this.logger.debug('Using cached token', { serviceId, audience });
        
        if (this.metrics) {
          this.metrics.incrementCounter('auth.tokens.cache.hit', {
            service: credentials.serviceName
          });
        }
        
        return cachedToken;
      }

      if (this.metrics) {
        this.metrics.incrementCounter('auth.tokens.cache.miss', {
          service: credentials.serviceName
        });
      }
    }

    const now = new Date();
    const expiration = customExpiration || this.config.defaultTokenExpiration;
    const expiresAt = new Date(now.getTime() + expiration * 1000);

    // JWT payload
    const payload = {
      sub: serviceId,
      iss: credentials.serviceName,
      aud: audience || 'talentsphere-services',
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      jti: `${serviceId}-${Date.now()}`,
      permissions: credentials.permissions,
      roles: credentials.roles,
      type: 'inter-service'
    };

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
      issuer: credentials.serviceName,
      audience: audience || 'talentsphere-services'
    });

    const authToken: AuthToken = {
      token,
      type: 'jwt',
      expiresAt,
      issuedAt: now,
      issuer: credentials.serviceName,
      audience
    };

    // Cache token
    if (this.config.enableTokenCaching) {
      const cacheKey = `${serviceId}:${audience || 'default'}`;
      this.tokenCache.set(cacheKey, authToken);
    }

    this.logger.debug('Authentication token generated', {
      serviceId,
      serviceName: credentials.serviceName,
      audience,
      expiresAt
    });

    if (this.metrics) {
      this.metrics.incrementCounter('auth.tokens.generated', {
        service: credentials.serviceName,
        audience: audience || 'default'
      });
    }

    return authToken;
  }

  /**
   * Validate authentication token
   */
  async validateToken(
    token: string,
    expectedAudience?: string
  ): Promise<{
    valid: boolean;
    serviceId?: string;
    serviceName?: string;
    permissions?: string[];
    roles?: string[];
    error?: string;
  }> {
    try {
      const jwt = require('jsonwebtoken');
      
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
        audience: expectedAudience || 'talentsphere-services'
      }) as any;

      // Verify service is registered
      const credentials = this.credentials.get(decoded.sub);
      if (!credentials) {
        return {
          valid: false,
          error: 'Service not registered'
        };
      }

      // Verify issuer matches service name
      if (decoded.iss !== credentials.serviceName) {
        return {
          valid: false,
          error: 'Token issuer mismatch'
        };
      }

      this.logger.debug('Token validated successfully', {
        serviceId: decoded.sub,
        serviceName: credentials.serviceName,
        permissions: decoded.permissions?.length || 0,
        roles: decoded.roles?.length || 0
      });

      if (this.metrics) {
        this.metrics.incrementCounter('auth.tokens.validated', {
          service: credentials.serviceName,
          status: 'valid'
        });
      }

      return {
        valid: true,
        serviceId: decoded.sub,
        serviceName: credentials.serviceName,
        permissions: decoded.permissions,
        roles: decoded.roles
      };

    } catch (error) {
      this.logger.warn('Token validation failed', {
        error: error.message,
        expectedAudience
      });

      if (this.metrics) {
        this.metrics.incrementCounter('auth.tokens.validated', {
          status: 'invalid',
          error: error.name
        });
      }

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Check if service has permission
   */
  async hasPermission(serviceId: string, permission: string): Promise<boolean> {
    const credentials = this.credentials.get(serviceId);
    if (!credentials) {
      return false;
    }

    return credentials.permissions.includes(permission) || 
           credentials.permissions.includes('*') || // Wildcard permission
           credentials.permissions.includes(`${permission.split('.')[0]}.*`); // Namespace wildcard
  }

  /**
   * Check if service has role
   */
  async hasRole(serviceId: string, role: string): Promise<boolean> {
    const credentials = this.credentials.get(serviceId);
    if (!credentials) {
      return false;
    }

    return credentials.roles.includes(role) || credentials.roles.includes('admin');
  }

  /**
   * Get authorization headers for service request
   */
  async getAuthHeaders(
    serviceId: string,
    targetService?: string
  ): Promise<Record<string, string>> {
    const token = await this.generateToken(serviceId, targetService);
    
    return {
      'Authorization': `Bearer ${token.token}`,
      'X-Service-ID': serviceId,
      'X-Request-Time': new Date().toISOString()
    };
  }

  /**
   * Extract and validate token from request headers
   */
  async extractTokenFromHeaders(headers: Record<string, string>): Promise<{
    valid: boolean;
    serviceId?: string;
    serviceName?: string;
    permissions?: string[];
    roles?: string[];
    error?: string;
  }> {
    // Check Authorization header first
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.validateToken(token);
    }

    // Check API key header
    const apiKey = headers[this.config.apiKeyHeader];
    if (apiKey) {
      // For API key validation, we would implement a different validation logic
      // For now, return invalid
      return {
        valid: false,
        error: 'API key validation not implemented'
      };
    }

    return {
      valid: false,
      error: 'No authentication token found'
    };
  }

  /**
   * Create authentication middleware for Express
   */
  createAuthMiddleware(requiredPermissions?: string[], requiredRoles?: string[]) {
    return async (req: any, res: any, next: any) => {
      try {
        const validation = await this.extractTokenFromHeaders(req.headers);

        if (!validation.valid) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: validation.error || 'Invalid authentication token'
          });
        }

        // Check required permissions
        if (requiredPermissions && requiredPermissions.length > 0) {
          const hasAllPermissions = requiredPermissions.every(permission =>
            (validation.permissions || []).includes(permission)
          );

          if (!hasAllPermissions) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient permissions'
            });
          }
        }

        // Check required roles
        if (requiredRoles && requiredRoles.length > 0) {
          const hasAnyRole = requiredRoles.some(role =>
            (validation.roles || []).includes(role)
          );

          if (!hasAnyRole) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient roles'
            });
          }
        }

        // Add service info to request
        req.service = {
          id: validation.serviceId,
          name: validation.serviceName,
          permissions: validation.permissions,
          roles: validation.roles
        };

        next();

      } catch (error) {
        this.logger.error('Authentication middleware error', {
          error: error.message,
          stack: error.stack
        });

        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication error'
        });
      }
    };
  }

  /**
   * Start token cleanup timer
   */
  private startTokenCleanupTimer(): void {
    this.tokenCleanupTimer = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60000); // Every minute

    this.logger.debug('Token cleanup timer started');
  }

  /**
   * Cleanup expired tokens from cache
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    this.tokenCache.forEach((token, key) => {
      if (token.expiresAt <= now) {
        keysToDelete.push(key);
      }
    });

    if (keysToDelete.length > 0) {
      keysToDelete.forEach(key => this.tokenCache.delete(key));
      
      this.logger.debug('Expired tokens cleaned up', {
        count: keysToDelete.length
      });

      if (this.metrics) {
        this.metrics.incrementCounter('auth.tokens.cleanup', {
          count: keysToDelete.length.toString()
        });
      }
    }
  }

  /**
   * Get authentication statistics
   */
  getAuthStats(): {
    registeredServices: number;
    cachedTokens: number;
    services: Array<{
      serviceId: string;
      serviceName: string;
      permissions: string[];
      roles: string[];
    }>;
  } {
    const services = Array.from(this.credentials.values()).map(cred => ({
      serviceId: cred.serviceId,
      serviceName: cred.serviceName,
      permissions: cred.permissions,
      roles: cred.roles
    }));

    return {
      registeredServices: this.credentials.size,
      cachedTokens: this.tokenCache.size,
      services
    };
  }

  /**
   * Revoke all tokens for a service
   */
  async revokeTokens(serviceId: string): Promise<number> {
    const keysToDelete: string[] = [];
    
    this.tokenCache.forEach((token, key) => {
      if (key.startsWith(`${serviceId}:`) || token.issuer === serviceId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.tokenCache.delete(key));

    this.logger.info('Tokens revoked for service', {
      serviceId,
      count: keysToDelete.length
    });

    if (this.metrics) {
      this.metrics.incrementCounter('auth.tokens.revoked', {
        serviceId,
        count: keysToDelete.length.toString()
      });
    }

    return keysToDelete.length;
  }

  /**
   * Shutdown authentication manager
   */
  async shutdown(): Promise<void> {
    if (this.tokenCleanupTimer) {
      clearInterval(this.tokenCleanupTimer);
      this.tokenCleanupTimer = undefined;
    }

    this.credentials.clear();
    this.tokenCache.clear();

    this.logger.info('Inter-Service Authentication shutdown complete');
  }
}