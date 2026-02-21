/**
 * TalentSphere Security Auditor
 * Comprehensive security audit logging and monitoring for all services
 */

const { createLogger, transports, format } = require('winston');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SecurityAuditor {
  constructor(options = {}) {
    this.options = {
      enableAuditLogging: options.enableAuditLogging !== false,
      enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
      enableAlerting: options.enableAlerting !== false,
      logLevel: options.logLevel || 'info',
      auditLogPath: options.auditLogPath || './logs/security/security-audit.log',
      maxLogSize: options.maxLogSize || '20m',
      maxFiles: options.maxFiles || '14d',
      enableDatabaseStorage: options.enableDatabaseStorage !== false,
      enableSuspiciousActivityDetection: options.enableSuspiciousActivityDetection !== false,
      alertThresholds: {
        failedLogins: options.alertThresholds?.failedLogins || 5,
        apiRateLimit: options.alertThresholds?.apiRateLimit || 100,
        concurrentSessions: options.alertThresholds?.concurrentSessions || 5,
        suspiciousIPAccess: options.alertThresholds?.suspiciousIPAccess || 10
      },
      ...options
    };

    // Initialize audit logger
    this.auditLogger = this.createAuditLogger();

    // Initialize security event tracking
    this.securityEvents = new Map();
    this.suspiciousActivities = new Map();
    this.sessionTracker = new Map();
    this.rateLimitTracker = new Map();

    // Initialize monitoring intervals
    this.monitoringInterval = null;
    this.startMonitoring();
  }

  /**
   * Create audit logger with security-specific configuration
   */
  createAuditLogger() {
    const logDir = path.dirname(this.options.auditLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    return createLogger({
      level: this.options.logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: { service: 'security-auditor' },
      transports: [
        new transports.File({
          filename: this.options.auditLogPath,
          maxsize: this.options.maxLogSize,
          maxFiles: this.options.maxFiles,
          format: format.combine(
            format.timestamp(),
            format.printf(info => {
              return `${info.timestamp} [${info.level}] ${JSON.stringify(info.message)} ${info.meta ? JSON.stringify(info.meta) : ''}`;
            })
          )
        }),
        // Also log to console in development
        ...(process.env.NODE_ENV !== 'production' ? [new transports.Console()] : [])
      ]
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, eventData, req = null) {
    if (!this.options.enableAuditLogging) { return; }

    const event = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      userId: eventData.userId || (req?.user?.id),
      sessionId: eventData.sessionId || (req?.session?.id),
      ip: eventData.ip || req?.ip || req?.connection?.remoteAddress,
      userAgent: eventData.userAgent || req?.headers?.['user-agent'],
      url: eventData.url || req?.originalUrl,
      method: eventData.method || req?.method,
      ...eventData
    };

    // Log to audit log
    this.auditLogger.info('SECURITY_EVENT', event);

    // Store in memory for monitoring
    if (!this.securityEvents.has(eventType)) {
      this.securityEvents.set(eventType, []);
    }
    this.securityEvents.get(eventType).push(event);

    // Track for suspicious activity detection
    this.trackForSuspiciousActivity(event);

    return event.eventId;
  }

  /**
   * Track for suspicious activity
   */
  trackForSuspiciousActivity(event) {
    if (!this.options.enableSuspiciousActivityDetection) { return; }

    const ip = event.ip;
    if (!ip) { return; }

    // Track failed login attempts
    if (event.eventType === 'AUTHENTICATION_FAILED') {
      if (!this.suspiciousActivities.has(ip)) {
        this.suspiciousActivities.set(ip, { failedLogins: 0, events: [] });
      }
      const ipData = this.suspiciousActivities.get(ip);
      ipData.failedLogins++;
      ipData.events.push(event);

      // Trigger alert if threshold exceeded
      if (ipData.failedLogins >= this.options.alertThresholds.failedLogins) {
        this.triggerSecurityAlert('BRUTE_FORCE_ATTEMPT', {
          ip,
          failedAttempts: ipData.failedLogins,
          events: ipData.events
        });
      }
    }

    // Track rapid API requests
    if (event.eventType === 'RATE_LIMIT_EXCEEDED') {
      if (!this.rateLimitTracker.has(ip)) {
        this.rateLimitTracker.set(ip, { count: 0, events: [] });
      }
      const ipData = this.rateLimitTracker.get(ip);
      ipData.count++;
      ipData.events.push(event);

      // Trigger alert if threshold exceeded
      if (ipData.count >= this.options.alertThresholds.apiRateLimit) {
        this.triggerSecurityAlert('RATE_LIMIT_ABUSE', {
          ip,
          rateLimitExceedances: ipData.count,
          events: ipData.events
        });
      }
    }
  }

  /**
   * Log authentication event
   */
  logAuthenticationEvent(type, user, req, additionalData = {}) {
    const eventData = {
      userId: user.id,
      username: user.username || user.email,
      eventType: `AUTHENTICATION_${type.toUpperCase()}`,
      success: type !== 'FAILED',
      ...additionalData
    };

    return this.logSecurityEvent(eventData.eventType, eventData, req);
  }

  /**
   * Log authorization event
   */
  logAuthorizationEvent(type, user, resource, action, req, additionalData = {}) {
    const eventData = {
      userId: user?.id,
      resourceType: resource?.type,
      resourceId: resource?.id,
      action,
      eventType: `AUTHORIZATION_${type.toUpperCase()}`,
      success: type === 'SUCCESS',
      ...additionalData
    };

    return this.logSecurityEvent(eventData.eventType, eventData, req);
  }

  /**
   * Log data access event
   */
  logDataAccessEvent(user, resource, action, req, additionalData = {}) {
    const eventData = {
      userId: user?.id,
      resourceType: resource?.type,
      resourceId: resource?.id,
      action,
      eventType: 'DATA_ACCESS',
      ...additionalData
    };

    return this.logSecurityEvent('DATA_ACCESS', eventData, req);
  }

  /**
   * Log system security event
   */
  logSystemSecurityEvent(type, req, additionalData = {}) {
    const eventData = {
      eventType: `SYSTEM_SECURITY_${type.toUpperCase()}`,
      ...additionalData
    };

    return this.logSecurityEvent(eventData.eventType, eventData, req);
  }

  /**
   * Log configuration change
   */
  logConfigurationChange(user, configName, oldValue, newValue, req) {
    const eventData = {
      userId: user?.id,
      configName,
      oldValue,
      newValue,
      eventType: 'CONFIGURATION_CHANGE'
    };

    return this.logSecurityEvent('CONFIGURATION_CHANGE', eventData, req);
  }

  /**
   * Log file access event
   */
  logFileAccessEvent(user, filePath, action, req, additionalData = {}) {
    const eventData = {
      userId: user?.id,
      filePath,
      action,
      eventType: 'FILE_ACCESS',
      ...additionalData
    };

    return this.logSecurityEvent('FILE_ACCESS', eventData, req);
  }

  /**
   * Trigger security alert
   */
  triggerSecurityAlert(alertType, alertData) {
    if (!this.options.enableAlerting) { return; }

    const alert = {
      alertId: uuidv4(),
      alertType,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(alertType),
      ...alertData
    };

    // Log the alert
    this.auditLogger.warn('SECURITY_ALERT', alert);

    // Additional alert handling can be added here
    // For example, sending to security team, triggering incident response, etc.
    this.handleSecurityAlert(alert);

    return alert.alertId;
  }

  /**
   * Get alert severity based on type
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'BRUTE_FORCE_ATTEMPT': 'HIGH',
      'RATE_LIMIT_ABUSE': 'MEDIUM',
      'UNAUTHORIZED_ACCESS': 'HIGH',
      'PRIVILEGE_ESCALATION': 'CRITICAL',
      'DATA_BREACH_ATTEMPT': 'CRITICAL',
      'CONFIGURATION_CHANGE': 'MEDIUM',
      'SUSPICIOUS_ACTIVITY': 'MEDIUM'
    };

    return severityMap[alertType] || 'MEDIUM';
  }

  /**
   * Handle security alert (send notifications, etc.)
   */
  handleSecurityAlert(alert) {
    // In a real implementation, this would send alerts to security teams
    // via email, Slack, SMS, etc.
    console.log(`🚨 SECURITY ALERT: ${alert.alertType} - ${alert.severity} severity`);

    // Could integrate with external alerting systems here
    // For example: send to PagerDuty, Slack channel, email, etc.
  }

  /**
   * Start monitoring for security events
   */
  startMonitoring() {
    if (!this.options.enableRealTimeMonitoring) { return; }

    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform security checks
   */
  performSecurityChecks() {
    // Check for unusual patterns
    this.checkForUnusualActivity();

    // Check for potential security issues
    this.checkForSecurityIssues();

    // Clean up old events
    this.cleanupOldEvents();
  }

  /**
   * Check for unusual activity patterns
   */
  checkForUnusualActivity() {
    // Check for IPs with too many recent events
    for (const [ip, events] of this.securityEvents) {
      const recentEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp);
        const now = new Date();
        return (now - eventTime) < 300000; // Last 5 minutes
      });

      if (recentEvents.length > 50) { // More than 50 events in 5 minutes
        this.triggerSecurityAlert('HIGH_ACTIVITY_FROM_IP', {
          ip,
          eventCount: recentEvents.length,
          events: recentEvents.slice(0, 10) // Just sample first 10
        });
      }
    }
  }

  /**
   * Check for potential security issues
   */
  checkForSecurityIssues() {
    // Check for users with too many concurrent sessions
    for (const [userId, sessions] of this.sessionTracker) {
      if (sessions.length > this.options.alertThresholds.concurrentSessions) {
        this.triggerSecurityAlert('EXCESSIVE_CONCURRENT_SESSIONS', {
          userId,
          sessionCount: sessions.length
        });
      }
    }
  }

  /**
   * Clean up old events to prevent memory bloat
   */
  cleanupOldEvents() {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes

    // Clean up security events older than 30 minutes
    for (const [eventType, events] of this.securityEvents) {
      const filteredEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime > thirtyMinutesAgo;
      });
      this.securityEvents.set(eventType, filteredEvents);
    }

    // Clean up suspicious activities
    for (const [ip, data] of this.suspiciousActivities) {
      if (data.events) {
        data.events = data.events.filter(event => {
          const eventTime = new Date(event.timestamp);
          return eventTime > thirtyMinutesAgo;
        });
      }
    }

    // Clean up rate limit tracker
    for (const [ip, data] of this.rateLimitTracker) {
      if (data.events) {
        data.events = data.events.filter(event => {
          const eventTime = new Date(event.timestamp);
          return eventTime > thirtyMinutesAgo;
        });
      }
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get security audit logs
   */
  getAuditLogs(filters = {}) {
    // In a real implementation, this would query a database or log files
    // For now, return in-memory events
    const { eventType, userId, ip, startDate, endDate, limit = 100 } = filters;

    let events = [];

    // Collect all events
    for (const eventList of this.securityEvents.values()) {
      events = events.concat(eventList);
    }

    // Apply filters
    if (eventType) {
      events = events.filter(event => event.eventType === eventType);
    }

    if (userId) {
      events = events.filter(event => event.userId === userId);
    }

    if (ip) {
      events = events.filter(event => event.ip === ip);
    }

    if (startDate) {
      const start = new Date(startDate);
      events = events.filter(event => new Date(event.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      events = events.filter(event => new Date(event.timestamp) <= end);
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    return events.slice(0, limit);
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      eventsByIP: {},
      alertsTriggered: 0,
      suspiciousActivities: 0
    };

    // Count total events and events by type
    for (const [eventType, events] of this.securityEvents) {
      stats.totalEvents += events.length;
      stats.eventsByType[eventType] = events.length;
    }

    // Count events by IP
    for (const events of this.securityEvents.values()) {
      for (const event of events) {
        if (event.ip) {
          stats.eventsByIP[event.ip] = (stats.eventsByIP[event.ip] || 0) + 1;
        }
      }
    }

    // Count suspicious activities
    stats.suspiciousActivities = this.suspiciousActivities.size;

    return stats;
  }

  /**
   * Audit middleware for Express
   */
  middleware() {
    return (req, res, next) => {
      // Capture the original end method
      const originalEnd = res.end;

      res.end = (chunk, encoding, callback) => {
        // Log the request after response is sent
        setImmediate(() => {
          this.logSecurityEvent('REQUEST_COMPLETED', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: Date.now() - req.startTime,
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }, req);
        });

        // Restore the original end method and call it
        res.end = originalEnd;
        res.end(chunk, encoding, callback);
      };

      // Add start time for response time calculation
      req.startTime = Date.now();

      // Log the incoming request
      this.logSecurityEvent('REQUEST_RECEIVED', {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, req);

      next();
    };
  }

  /**
   * Close the auditor and clean up resources
   */
  async close() {
    this.stopMonitoring();

    // Flush logs if needed
    if (this.auditLogger.transports) {
      for (const transport of this.auditLogger.transports) {
        if (transport.close) {
          transport.close();
        }
      }
    }
  }
}

// Export singleton instance
const securityAuditor = new SecurityAuditor();

module.exports = {
  SecurityAuditor,
  securityAuditor,
  logSecurityEvent: securityAuditor.logSecurityEvent.bind(securityAuditor),
  logAuthenticationEvent: securityAuditor.logAuthenticationEvent.bind(securityAuditor),
  logAuthorizationEvent: securityAuditor.logAuthorizationEvent.bind(securityAuditor),
  logDataAccessEvent: securityAuditor.logDataAccessEvent.bind(securityAuditor),
  logSystemSecurityEvent: securityAuditor.logSystemSecurityEvent.bind(securityAuditor),
  logConfigurationChange: securityAuditor.logConfigurationChange.bind(securityAuditor),
  logFileAccessEvent: securityAuditor.logFileAccessEvent.bind(securityAuditor),
  triggerSecurityAlert: securityAuditor.triggerSecurityAlert.bind(securityAuditor),
  getAuditLogs: securityAuditor.getAuditLogs.bind(securityAuditor),
  getSecurityStats: securityAuditor.getSecurityStats.bind(securityAuditor),
  middleware: securityAuditor.middleware.bind(securityAuditor)
};