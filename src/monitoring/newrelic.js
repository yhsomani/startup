/**
 * New Relic APM Integration for TalentSphere
 * Provides application performance monitoring, error tracking, and analytics
 */

require("newrelic");

const newrelic = require("newrelic");

// Custom metrics and events
class TalentSphereMonitoring {
    constructor() {
        this.serviceName = process.env.NEW_RELIC_APP_NAME || "TalentSphere";
        this.environment = process.env.NODE_ENV || "development";
    }

    // Record custom business metrics
    recordCustomMetric(name, value, unit = "count") {
        newrelic.recordMetric(`Custom/${name}`, value, unit);
    }

    // Track user registration
    trackUserRegistration(userId, method = "email") {
        newrelic.addCustomAttribute("userId", userId);
        newrelic.addCustomAttribute("registrationMethod", method);
        this.recordCustomMetric("User/Registration", 1);

        // Send custom event
        newrelic.recordCustomEvent("UserRegistered", {
            userId,
            method,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track job applications
    trackJobApplication(userId, jobId, companyName) {
        newrelic.addCustomAttribute("userId", userId);
        newrelic.addCustomAttribute("jobId", jobId);
        newrelic.addCustomAttribute("companyName", companyName);
        this.recordCustomMetric("Job/Application", 1);

        newrelic.recordCustomEvent("JobApplicationSubmitted", {
            userId,
            jobId,
            companyName,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track API performance
    trackApiCall(endpoint, method, duration, statusCode) {
        const metricName = `Api/${method}/${endpoint.replace(/\//g, "_")}`;
        newrelic.recordMetric(metricName, duration, "seconds");

        // Track error rates
        if (statusCode >= 400) {
            this.recordCustomMetric(`Api/Error/${method}/${endpoint.replace(/\//g, "_")}`, 1);
        }

        newrelic.recordCustomEvent("ApiCall", {
            endpoint,
            method,
            duration,
            statusCode,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track database operations
    trackDatabaseOperation(operation, collection, duration) {
        const metricName = `Database/${operation}/${collection}`;
        newrelic.recordMetric(metricName, duration, "seconds");

        newrelic.recordCustomEvent("DatabaseOperation", {
            operation,
            collection,
            duration,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track external service calls
    trackExternalService(service, operation, duration, success) {
        const metricName = `External/${service}/${operation}`;
        newrelic.recordMetric(metricName, duration, "seconds");

        if (!success) {
            this.recordCustomMetric(`External/Error/${service}/${operation}`, 1);
        }

        newrelic.recordCustomEvent("ExternalServiceCall", {
            service,
            operation,
            duration,
            success,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track file uploads
    trackFileUpload(userId, fileType, fileSize, success) {
        this.recordCustomMetric("File/Upload", 1);

        if (!success) {
            this.recordCustomMetric("File/Upload/Error", 1);
        }

        newrelic.recordCustomEvent("FileUpload", {
            userId,
            fileType,
            fileSize,
            success,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track email notifications
    trackEmailNotification(userId, type, success) {
        this.recordCustomMetric("Email/Sent", 1);

        if (!success) {
            this.recordCustomMetric("Email/Error", 1);
        }

        newrelic.recordCustomEvent("EmailNotification", {
            userId,
            type,
            success,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track authentication events
    trackAuthentication(userId, method, success, failureReason = null) {
        this.recordCustomMetric("Auth/Attempt", 1);

        if (success) {
            this.recordCustomMetric("Auth/Success", 1);
        } else {
            this.recordCustomMetric("Auth/Failure", 1);
            if (failureReason) {
                this.recordCustomMetric(`Auth/Failure/${failureReason}`, 1);
            }
        }

        newrelic.recordCustomEvent("AuthenticationEvent", {
            userId,
            method,
            success,
            failureReason,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Track feature usage
    trackFeatureUsage(userId, feature, action) {
        this.recordCustomMetric(`Feature/${feature}/${action}`, 1);

        newrelic.recordCustomEvent("FeatureUsage", {
            userId,
            feature,
            action,
            timestamp: new Date().toISOString(),
            environment: this.environment,
        });
    }

    // Add error context
    addErrorContext(error, context = {}) {
        newrelic.addCustomAttribute("errorType", error.constructor.name);
        newrelic.addCustomAttribute("errorMessage", error.message);

        Object.keys(context).forEach(key => {
            newrelic.addCustomAttribute(`context_${key}`, context[key]);
        });

        newrelic.noticeError(error, context);
    }

    // Set user attributes
    setUserAttributes(user) {
        if (user && user.id) {
            newrelic.setCustomAttribute("userId", user.id);
            newrelic.setCustomAttribute("userRole", user.role || "unknown");
            newrelic.setCustomAttribute("userEmail", user.email || "unknown");

            // Set user as the current transaction user
            newrelic.setUserID(user.id);
        }
    }

    // Create custom transaction
    createCustomTransaction(name, callback) {
        return newrelic.startSegment(name, true, callback);
    }

    // Ignore specific transactions
    ignoreTransaction(pattern) {
        // Add patterns to ignore in newrelic.js config instead
        console.log(`Transaction pattern to ignore: ${pattern}`);
    }
}

// Initialize monitoring
const monitoring = new TalentSphereMonitoring();

// Express middleware for automatic API tracking
const createMonitoringMiddleware = () => {
    return (req, res, next) => {
        const startTime = Date.now();

        // Add request context to New Relic
        newrelic.addCustomAttribute("requestMethod", req.method);
        newrelic.addCustomAttribute("requestUrl", req.url);
        newrelic.addCustomAttribute("userAgent", req.get("User-Agent"));
        newrelic.addCustomAttribute("ipAddress", req.ip);

        // Set transaction name based on route
        if (req.route && req.route.path) {
            newrelic.setTransactionName(`${req.method} ${req.route.path}`);
        }

        // Track response
        res.on("finish", () => {
            const duration = (Date.now() - startTime) / 1000;

            monitoring.trackApiCall(
                req.route ? req.route.path : req.path,
                req.method,
                duration,
                res.statusCode
            );

            // Add response attributes
            newrelic.addCustomAttribute("responseStatusCode", res.statusCode);
            newrelic.addCustomAttribute("responseTime", duration);
        });

        next();
    };
};

// Database monitoring helper
const createDatabaseMonitor = db => {
    const originalMethod = db.collection;

    db.collection = function (name) {
        const collection = originalMethod.call(this, name);

        // Monitor common operations
        [
            "find",
            "findOne",
            "insertOne",
            "insertMany",
            "updateOne",
            "updateMany",
            "deleteOne",
            "deleteMany",
        ].forEach(method => {
            if (collection[method]) {
                const original = collection[method];
                collection[method] = function (...args) {
                    const startTime = Date.now();

                    return original
                        .apply(this, args)
                        .then(result => {
                            const duration = (Date.now() - startTime) / 1000;
                            monitoring.trackDatabaseOperation(method, name, duration);
                            return result;
                        })
                        .catch(error => {
                            const duration = (Date.now() - startTime) / 1000;
                            monitoring.trackDatabaseOperation(method, name, duration);
                            monitoring.addErrorContext(error, {
                                operation: method,
                                collection: name,
                            });
                            throw error;
                        });
                };
            }
        });

        return collection;
    };

    return db;
};

// Graceful error handling
process.on("uncaughtException", error => {
    monitoring.addErrorContext(error, { type: "uncaughtException" });
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    const error = new Error(`Unhandled Promise Rejection: ${reason}`);
    monitoring.addErrorContext(error, {
        type: "unhandledRejection",
        reason: reason.toString(),
        promise: promise.toString(),
    });
});

module.exports = {
    monitoring,
    createMonitoringMiddleware,
    createDatabaseMonitor,
    TalentSphereMonitoring,
};
