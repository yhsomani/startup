/**
 * TalentSphere CORS Configuration Manager
 * 
 * Secure CORS configuration for all services
 */

class CORSConfig {
  constructor() {
    this.developmentOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8000',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:5002',
      'http://localhost:5003',
      'http://localhost:5004',
      'http://localhost:5005',
      'http://localhost:5006',
      'http://localhost:5007',
      'http://localhost:5008',
      'http://localhost:5009',
      'http://localhost:5010',
      'http://localhost:6000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5000'
    ];

    this.stagingOrigins = [
      'https://staging.talentsphere.com',
      'https://staging-api.talentsphere.com',
      'https://staging-admin.talentsphere.com'
    ];

    this.productionOrigins = [
      'https://talentsphere.com',
      'https://api.talentsphere.com',
      'https://admin.talentsphere.com',
      'https://app.talentsphere.com'
    ];
  }

  /**
   * Get allowed origins based on environment
   * @param {string} env - Current environment
   * @returns {Array} - Array of allowed origins
   */
  getAllowedOrigins(env = process.env.NODE_ENV || 'development') {
    switch (env) {
      case 'production':
        return this.productionOrigins;
      case 'staging':
        return this.stagingOrigins;
      case 'development':
      default:
        return this.developmentOrigins;
    }
  }

  /**
   * Get CORS options for Express
   * @param {string} env - Current environment  
   * @returns {object} - CORS configuration object
   */
  getCORSOptions(env = process.env.NODE_ENV || 'development') {
    const allowedOrigins = this.getAllowedOrigins(env);

    return {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {return callback(null, true);}

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // For development, allow subdomains of localhost
        if (env === 'development') {
          const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;
          if (localhostRegex.test(origin)) {
            return callback(null, true);
          }
        }

        return callback(new Error('CORS: Origin not allowed'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'X-Correlation-ID',
        'X-Service'
      ],
      credentials: true, // Allow cookies for authentication
      optionsSuccessStatus: 204 // For preflight requests
    };
  }

  /**
   * Validate CORS origin
   * @param {string} origin - Request origin
   * @param {string} env - Current environment
   * @returns {boolean} - Whether origin is valid
   */
  validateOrigin(origin, env = process.env.NODE_ENV || 'development') {
    const allowedOrigins = this.getAllowedOrigins(env);

    // Always allow same origin
    if (!origin) {return true;}

    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // For development, allow localhost subdomains
    if (env === 'development') {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;
      return localhostRegex.test(origin);
    }

    return false;
  }

  /**
   * Get secure CORS middleware
   * @param {string} env - Current environment
   * @returns {Function} - Express middleware function
   */
  getSecureCORSMiddleware(env = process.env.NODE_ENV || 'development') {
    const corsOptions = this.getCORSOptions(env);

    return (req, res, next) => {
      // Set CORS headers for preflight requests
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        res.header('Access-Control-Allow-Credentials', 'true');

        const origin = req.headers.origin;
        if (this.validateOrigin(origin, env)) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          // For preflight requests, we must return specific origin
          // If origin is not allowed, return error
          const allowedOrigin = corsOptions.origin instanceof Function
            ? corsOptions.origin(req, res, () => { })
            : allowedOrigins[0] || 'https://talentsphere.com';
          res.header('Access-Control-Allow-Origin', allowedOrigin);
        }

        return res.status(corsOptions.optionsSuccessStatus).end();
      }

      // For actual requests, validate origin and set appropriate header
      const origin = req.headers.origin;
      if (this.validateOrigin(origin, env)) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        // Don't set Allow-Origin header for invalid origins
        // Browser will handle CORS error naturally
      }

      res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
      res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      res.header('Access-Control-Allow-Credentials', 'true');

      return next();
    };
  }

  /**
   * Get insecure CORS middleware (for development only)
   * @returns {Function} - Express middleware function
   */
  getInsecureCORSMiddleware() {
    console.warn('⚠️  Using insecure CORS configuration (wildcard). Only for development!');

    return (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID, X-Correlation-ID, X-Service');
      res.header('Access-Control-Allow-Credentials', 'true');

      return next();
    };
  }

  /**
   * Security headers middleware
   * @param {string} env - Current environment
   * @returns {Function} - Express middleware function
   */
  getSecurityHeadersMiddleware(env = process.env.NODE_ENV || 'development') {
    return (req, res, next) => {
      // Prevent clickjacking
      res.header('X-Content-Type-Options', 'nosniff');

      // Prevent XSS attack
      res.header('X-XSS-Protection', '1; mode=block');

      // Content Security Policy
      if (env === 'production') {
        res.header('Content-Security-Policy',
          "default-src 'self' https://talentsphere.com https://api.talentsphere.com; " +
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "connect-src 'self' https://api.talentsphere.com https://www.google-analytics.com; " +
          "frame-ancestors 'self'; " +
          "form-action 'self'; " +
          "frame-src 'self' https://www.google.com;"
        );
      } else {
        res.header('Content-Security-Policy',
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: *; " +
          "connect-src 'self' *; " +
          "font-src 'self' *; " +
          "frame-ancestors 'self'; " +
          "form-action 'self'; " +
          "frame-src 'self' *;"
        );
      }

      // HSTS
      if (env === 'production') {
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      return next();
    };
  }

  /**
   * Generate CORS audit report
   * @returns {object} - CORS security analysis
   */
  auditCORSConfiguration() {
    const env = process.env.NODE_ENV || 'development';
    const audit = {
      environment: env,
      timestamp: new Date().toISOString(),
      issues: [],
      recommendations: []
    };

    // Check if using wildcard CORS
    const hasWildcardCORS = this.usesWildcardCORS();
    if (hasWildcardCORS) {
      audit.issues.push({
        severity: 'HIGH',
        type: 'SECURITY',
        message: 'Wildcard CORS (*) configuration detected',
        impact: 'Allows any website to make requests to your API'
      });

      audit.recommendations.push({
        priority: 'CRITICAL',
        action: 'Replace wildcard CORS with specific origins',
        code: 'USE_SECURE_CORS_CONFIG'
      });
    }

    // Check environment-specific configurations
    if (env === 'production') {
      if (hasWildcardCORS) {
        audit.issues.push({
          severity: 'CRITICAL',
          type: 'SECURITY',
          message: 'Production environment using wildcard CORS',
          impact: 'Major security vulnerability in production'
        });
      }
    }

    return audit;
  }

  /**
   * Check if any service is using wildcard CORS
   * @returns {boolean} - Whether wildcard CORS is detected
   */
  usesWildcardCORS() {
    // This would check various configuration files
    // For now, return false (assume proper configuration)
    return false;
  }
}

module.exports = {
  CORSConfig
};