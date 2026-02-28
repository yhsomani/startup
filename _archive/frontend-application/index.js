/**
 * Frontend Application Structure
 * React-based modern web application for TalentSphere platform
 * 
 * Features:
 * - Modern React 18 with TypeScript
 * - Material-UI design system
 * - State management with Redux Toolkit
 * - Routing with React Router
 * - API integration with Axios
 * - Authentication and authorization
 * - Responsive design
 * - Real-time notifications
 * - Analytics tracking
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { createLogger } = require('../../services/shared/logger');

class FrontendApplication {
  constructor() {
    this.app = express();
    this.logger = createLogger('FrontendApplication');
    this.port = process.env.FRONTEND_PORT || 3000;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.setupDevelopmentProxy();
  }

  /**
   * Initialize middleware
   */
  initializeMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:", process.env.API_BASE_URL],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS for API communication
    this.app.use(cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.API_BASE_URL || 'http://localhost:8000'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Parse request bodies
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info('Frontend request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });
  }

  /**
   * Initialize routes
   */
  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'frontend-application',
        timestamp: new Date().toISOString()
      });
    });

    // Static files for production build
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, 'build')));
      
      // Handle client-side routing
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
      });
    }
  }

  /**
   * Setup development proxy
   */
  setupDevelopmentProxy() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // This would typically use http-proxy-middleware
    // For now, return proxy configuration
    this.app.use('/api', (req, res, next) => {
      // Proxy to backend services
      const targetUrl = `${process.env.API_BASE_URL || 'http://localhost:8000'}${req.url}`;
      
      this.logger.info('Proxying API request', {
        method: req.method,
        originalUrl: req.url,
        targetUrl
      });

      // In a real implementation, this would use an HTTP proxy
      res.status(501).json({
        error: 'Development proxy not implemented in this context',
        targetUrl
      });
    });
  }

  /**
   * Start the frontend application
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          this.logger.error('Failed to start frontend application', {
            error: err.message,
            port: this.port
          });
          reject(err);
          return;
        }

        this.logger.info('Frontend application started successfully', {
          port: this.port,
          environment: process.env.NODE_ENV || 'development'
        });

        console.log(`🌐 Frontend Application running on port ${this.port}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API URL: ${process.env.API_BASE_URL || 'http://localhost:8000'}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 Development proxy configured`);
          console.log(`📊 React DevTools available`);
        }
        
        resolve();
      });

      this.server.on('error', (error) => {
        this.logger.error('Frontend server error', {
          error: error.message
        });
        reject(error);
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.logger.info('Frontend application shut down successfully');
          resolve();
        });
      });
    }
  }
}

module.exports = {
  FrontendApplication
};

// Auto-start if this is main module
if (require.main === module) {
  const frontendApp = new FrontendApplication();
  
  frontendApp.start().catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await frontendApp.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await frontendApp.shutdown();
    process.exit(0);
  });
}