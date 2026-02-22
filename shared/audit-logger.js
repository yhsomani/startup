/**
 * Audit Logger Middleware
 *
 * Comprehensive API audit logging for:
 * - Security compliance
 * - Data access tracking
 * - Change history
 * - Forensic analysis
 */

const { createLogger } = require("./logger");

class AuditLogger {
    constructor(options = {}) {
        this.logger = createLogger("audit", {
            enableFileLogging: true,
            logDir: options.logDir || "./logs/audit",
        });
        this.excludePaths = options.excludePaths || ["/health", "/metrics", "/ready"];
        this.includeBody = options.includeBody !== false;
        this.includeQuery = options.includeQuery !== false;
        this.sensitiveFields = options.sensitiveFields || [
            "password",
            "token",
            "secret",
            "apiKey",
            "authorization",
            "creditCard",
            "ssn",
        ];
    }

    sanitizeData(data) {
        if (!data || typeof data !== "object") return data;

        const sanitized = { ...data };

        for (const field of this.sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = "[REDACTED]";
            }
        }

        return sanitized;
    }

    extractUser(req) {
        return {
            id: req.user?.id || req.headers["x-user-id"] || "anonymous",
            role: req.user?.role || "unknown",
            ip: req.ip || req.connection?.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"],
        };
    }

    middleware() {
        const audit = this;

        return async (req, res, next) => {
            if (audit.excludePaths.some(path => req.path.startsWith(path))) {
                return next();
            }

            const startTime = Date.now();
            const user = audit.extractUser(req);
            const requestId =
                req.headers["x-correlation-id"] ||
                req.headers["x-request-id"] ||
                require("uuid").v4();

            const auditEntry = {
                timestamp: new Date().toISOString(),
                requestId,
                method: req.method,
                path: req.path,
                query: audit.includeQuery ? audit.sanitizeData(req.query) : undefined,
                user,
                request: {
                    headers: audit.sanitizeData(req.headers),
                    body: audit.includeBody ? audit.sanitizeData(req.body) : undefined,
                },
            };

            const originalEnd = res.end;
            res.end = function (...args) {
                auditEntry.response = {
                    statusCode: res.statusCode,
                    headers: audit.sanitizeData(res.getHeaders()),
                };
                auditEntry.duration = Date.now() - startTime;

                if (auditEntry.duration > 1000) {
                    auditEntry.warning = "Slow request detected";
                }

                if (res.statusCode >= 400) {
                    auditEntry.error = true;
                }

                if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
                    audit.logger.info("API Audit", auditEntry);
                } else {
                    audit.logger.debug("API Audit", auditEntry);
                }

                originalEnd.apply(res, args);
            };

            req.auditId = requestId;
            next();
        };
    }

    logSecurityEvent(event) {
        this.logger.warn("Security Event", {
            timestamp: new Date().toISOString(),
            event,
            severity: "HIGH",
        });
    }

    logDataAccess(action, resource, user, details) {
        this.logger.info("Data Access", {
            timestamp: new Date().toISOString(),
            action,
            resource,
            user,
            details: this.sanitizeData(details),
        });
    }

    logChange(entity, entityId, user, oldValue, newValue) {
        this.logger.info("Data Change", {
            timestamp: new Date().toISOString(),
            entity,
            entityId,
            user,
            oldValue: this.sanitizeData(oldValue),
            newValue: this.sanitizeData(newValue),
        });
    }
}

const auditLogger = new AuditLogger();

module.exports = {
    AuditLogger,
    auditLogger,
};
