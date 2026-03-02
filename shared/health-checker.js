/**
 * Health Check System for TalentSphere Services
 * Provides comprehensive health monitoring for all services
 */

const { configManager } = require('./config-manager');
const { logger } = require('./logging-service');

class HealthChecker {
  constructor(config = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || 5000,
      retryAttempts: config.retryAttempts || 3,
      checkInterval: config.checkInterval || 30000, // 30 seconds
      thresholds: {
        responseTime: 1000,
        uptime: 0.95,
        memoryUsage: 0.85,
        diskSpace: 0.90,
        databaseConnections: 0.8
      }
      }
    };
    
    this.logger = logger;
  }

  /**
   * Perform health check on a service
   * @param {string} serviceUrl - Service URL
   * @param {object} options - Health check options
   * @returns {Promise<object>} - Health check result
   */
  async checkService(serviceUrl, options = {}) {
    const timeout = options.timeoutMs || this.config.timeoutMs;
    const startTime = Date.now();
    
    this.logger.info(`🔍 Starting health check for ${serviceUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      const response = await fetch(`${serviceUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'TalentSphere-HealthChecker/1.0.0'
        },
        signal: controller.signal,
        timeout
      });

      // Clear timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.error(`❌ Health check failed: ${response.status} ${response.statusText}`);
        
        return {
          status: 'unhealthy',
          message: `HTTP ${response.status} - ${response.statusText}`,
          responseTime: Date.now() - startTime,
          checks: []
        };
      }

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < timeout;

      // Parse health check response
      const checks = {};
      
      if (response.ok) {
        this.logger.info(`✅ Health check successful: ${responseTime}ms`);
        
        try {
          const healthData = await response.json();
          checks.database = healthData.database?.status === 'healthy' ? 'healthy' : 'unhealthy';
          checks.memory = healthData.memory?.usage?.percentage < this.config.thresholds.memoryUsage ? 'healthy' : 'critical';
          checks.disk = healthData.disk?.usage?.percentage < this.config.thresholds.diskSpace ? 'healthy' : 'critical';
          checks.responseTime = responseTime < this.config.thresholds.responseTime ? 'healthy' : 'slow';
          checks.uptime = healthData.uptime?.percentage > this.config.thresholds.uptime ? 'healthy' : 'degraded';
          
          // Add individual check results
          if (healthData.database) {
            checks.database = {
              status: healthData.database.status === 'healthy' ? 'healthy' : 'unhealthy',
              message: healthData.database.message || 'Database connection test',
              responseTime: healthData.database.responseTime || 0,
              timestamp: healthData.timestamp || new Date().toISOString()
            };
          }
          
          if (healthData.memory) {
            checks.memory = {
              status: healthData.memory?.usage?.percentage < this.config.thresholds.memoryUsage ? 'healthy' : 'critical',
              message: healthData.memory?.message || `Memory usage: ${healthData.memory?.usage?.percentage || 'unknown'}%`,
              responseTime: healthData.memory?.responseTime || 0,
              timestamp: healthData.timestamp || new Date().toISOString()
            };
          }
          
          if (healthData.disk) {
            checks.disk = {
              status: healthData.disk?.usage?.percentage < this.config.thresholds.diskSpace ? 'healthy' : 'critical',
              message: healthData.disk?.message || `Disk usage: ${healthData.disk?.usage?.percentage || 'unknown'}%`,
              responseTime: healthData.disk?.responseTime || 0,
              timestamp: healthData.disk?.timestamp || new Date().toISOString()
            };
          }
          
          // Database connection health
          checks.database = {
            status: healthData.database?.status === 'healthy' ? 'healthy' : 'unhealthy',
            message: healthData.database?.message || 'Database connection: ' + 
                      (healthData.database?.connected ? 'Connected' : 'Disconnected') + 
                      (healthData.database?.maxConnections ? `${healthData.database.maxConnections}` : 'Unknown') + 
                      `Active: ${healthData.database?.activeConnections || '0'}`,
            responseTime: healthData.database?.responseTime || 0,
            timestamp: healthData.timestamp || new Date().toISOString()
          };
        }
        
        return {
          status: isHealthy ? 'healthy' : 'unhealthy',
          message: healthData.message || 'Health check completed',
          responseTime,
          checks,
          healthScore: this.calculateHealthScore(checks)
        };
      } catch (error) {
        this.logger.error(`❌ Health check error: ${error.message}`);
        
        return {
          status: 'unhealthy',
          message: `Health check failed: ${error.message}`,
          responseTime: Date.now() - startTime,
          checks: []
        };
      }
    }

  /**
   * Calculate health score based on individual checks
   * @param {object} checks - Individual check results
   * @returns {number} - Health score (0-100)
   */
  calculateHealthScore(checks) {
    let score = 100;
    
    Object.values(checks).forEach((status, check) => {
      if (status === 'healthy') {
        score += 0;
      } else if (status === 'warning') {
        score -= 10;
      } else if (status === 'critical') {
        score -= 25;
      } else if (status === 'unhealthy') {
        score -= 50;
      }
    });
    
    return Math.max(0, score);
  }

  calculateSystemHealthScore(results) {
    const services = Object.values(results);
    if (services.length === 0) return 0;
    
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    return Math.round((healthyCount / services.length) * 100);
  }

  /**
   * Check all registered services
   * @returns {object} - Overall system health status
   */
  async checkAllServices() {
    const startTime = Date.now();
    
    // Get all service URLs from environment or configuration
    const serviceUrls = this.getServiceUrls();
    
    const results = {};
    
    for (const [serviceName, serviceUrl] of Object.entries(serviceUrls)) {
      results[serviceName] = await this.checkService(serviceUrl, {
        serviceName,
        timeout: this.config.timeoutMs
      });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    this.logger.info(`🏥 System health check completed in ${totalTime}ms`);
    
    return this.getSystemHealth(results);
  }

  /**
   * Get service URLs from environment variables
   */
  getServiceUrls() {
    return {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:5001',
      'company-service': process.env.COMPANY_SERVICE_URL || 'http://localhost:5002',
      'job-service': process.env.JOB_SERVICE_URL || 'http://localhost:5003',
      'application-service': process.env.APPLICATION_SERVICE_URL || 'http://localhost:5004',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3030',
      'email-service': process.env.EMAIL_SERVICE_URL || 'http://localhost:5005',
      'search-service': process.env.SEARCH_SERVICE_URL || 'http://localhost:5006',
      'analytics-service': process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5007',
      'api-gateway': process.env.API_GATEWAY_URL || 'http://localhost:8000',
      'collaboration-service': process.env.COLLABORATION_SERVICE_URL || 'http://localhost:1234',
      'frontends': {
        'shell': process.env.FRONTEND_SHELL_PORT || 'http://localhost:3000',
        'lms': process.env.LMS_PORT || 'http://localhost:3001',
        'challenge': process.env.CHALLENGE_PORT || 'http://localhost:3002'
      }
    };
  }

  /**
   * Check system health
   */
  getSystemHealth(results) {
    const services = Object.values(results);
    const totalServices = services.length;
    
    let healthyServices = 0;
    let unhealthyServices = 0;
    let degradedServices = 0;
    
    let totalChecks = 0;
    let successfulChecks = 0;
    let failedChecks = 0;
    
    for (const service of services) {
      const result = service;
      
      totalChecks += result.checks ? Object.keys(result.checks).length : 0;
      successfulChecks += Object.values(result.checks).filter(status => status === 'healthy').length : 0;
      failedChecks += Object.values(result.checks).filter(status => status === 'unhealthy').length : 0;
      
      if (result.status === 'healthy') {
        healthyServices++;
      } else if (result.status === 'warning') {
        degradedServices++;
      } else {
        unhealthyServices++;
      }
    }

    // Calculate overall system health
    let overallStatus = 'healthy';
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices > 0 && unhealthyServices === 0) {
      overallStatus = 'healthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      summary: {
        totalServices,
        healthyServices,
        unhealthyServices,
        degradedServices,
        totalChecks,
        successfulChecks,
        failedChecks,
        healthScore: this.calculateSystemHealthScore(results)
      },
      issues: unhealthyServices > 0 ? 
        Array.from({length: unhealthyServices}).map(() => ({
          service: 'service',
          status: 'unhealthy',
          message: 'Service is unhealthy',
          severity: 'error'
        })) : null
    };
  }
}

module.exports = {
  HealthChecker
};