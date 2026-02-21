/**
 * Express.js Integration for TalentSphere API Versioning
 * Provides middleware and route helpers for consistent API versioning
 */

const { apiVersionManager } = require("./api-versioning");

class APIVersioningExpress {
    constructor() {
        this.versionManager = apiVersionManager;
    }

    /**
     * Create versioning middleware for Express
     */
    middleware() {
        return (req, res, next) => {
            const requestedVersion = req.headers["api-version"] || req.query.version;
            const supportedVersions = Array.from(this.versionManager.versions.keys());

            // Check if version is supported
            if (requestedVersion && !supportedVersions.includes(requestedVersion)) {
                return res.status(410).json({
                    error: "Unsupported API version",
                    message: `Version ${requestedVersion} is not supported`,
                    supportedVersions,
                    latestVersion: this.versionManager.getCurrentVersion(),
                });
            }

            // Get latest version if none specified
            const apiVersion = requestedVersion || this.versionManager.getCurrentVersion();
            const versionInfo = this.versionManager.getVersionInfo(apiVersion);

            // Add version headers
            res.setHeader("API-Version", apiVersion);
            res.setHeader("X-API-Supported-Versions", supportedVersions.join(", "));
            res.setHeader("X-API-Latest-Version", this.versionManager.getCurrentVersion());

            // Add deprecation warnings
            if (versionInfo.isDeprecated) {
                res.setHeader("X-API-Deprecated", "true");
                res.setHeader("X-API-Sunset-Date", versionInfo.sunsetDate);
            }

            req.apiVersion = apiVersion;
            req.versionInfo = versionInfo;
            next();
        };
    }

    /**
     * Create versioned route
     */
    versionedRoute(version, handler) {
        return (req, res, next) => {
            const requestedVersion = req.apiVersion;

            // Check if route version matches requested version
            if (requestedVersion && requestedVersion !== version) {
                return res.status(404).json({
                    error: "Route not found in this API version",
                    message: `This route is only available in API version ${version}`,
                    requestedVersion: req.apiVersion,
                });
            }

            // Add route context
            req.routeVersion = version;
            req.versionedContext = {
                version,
                isLatest: version === this.versionManager.getCurrentVersion(),
                hasBreakingChanges: this.versionManager.hasBreakingChanges(
                    version,
                    requestedVersion
                ),
            };

            return handler(req, res, next);
        };
    }

    /**
     * Create versioned router
     */
    versionedRouter(version, router) {
        router.use((req, res, next) => {
            req.routeVersion = version;
            req.versionedContext = {
                version,
                isLatest: version === this.versionManager.getCurrentVersion(),
                hasBreakingChanges: this.versionManager.hasBreakingChanges(version, req.apiVersion),
            };
            next();
        });

        return router;
    }

    /**
     * Version compatibility check middleware
     */
    compatibilityCheck(requiredVersion) {
        return (req, res, next) => {
            const requestVersion = req.apiVersion;

            if (!this.versionManager.isVersionCompatible(requestVersion, requiredVersion)) {
                return res.status(400).json({
                    error: "API version compatibility error",
                    message: `This endpoint requires API version ${requiredVersion} or higher`,
                    currentVersion: requestVersion,
                    requiredVersion,
                    upgradeTo: this.versionManager.getCurrentVersion(),
                });
            }

            next();
        };
    }

    /**
     * Deprecation middleware for routes
     */
    deprecationWarning(newVersion, message = "This endpoint is deprecated") {
        return (req, res, next) => {
            res.setHeader("X-API-Deprecated", "true");
            res.setHeader("X-API-Deprecation-Message", message);
            res.setHeader("X-API-Migrate-To", newVersion);

            // Add warning to response if not production
            if (process.env.NODE_ENV !== "production") {
                const originalJson = res.json;
                res.json = function (data) {
                    if (!data.warnings) {data.warnings = [];}
                    data.warnings.push({
                        type: "deprecation",
                        message,
                        migrateTo: newVersion,
                    });
                    return originalJson.call(this, data);
                };
            }

            next();
        };
    }

    /**
     * API version info endpoint
     */
    versionInfoEndpoint() {
        return (req, res) => {
            const supportedVersions = Array.from(this.versionManager.versions.keys());
            const versionsInfo = supportedVersions.map(version => ({
                ...this.versionManager.getVersionInfo(version),
            }));

            res.json({
                current: this.versionManager.getCurrentVersion(),
                latest: this.versionManager.getLatestVersion(),
                supported: supportedVersions,
                versions: versionsInfo,
                requestInfo: {
                    version: req.apiVersion,
                    headers: {
                        "API-Version": req.apiVersion,
                        "X-API-Supported-Versions": res.getHeader("X-API-Supported-Versions"),
                        "X-API-Latest-Version": res.getHeader("X-API-Latest-Version"),
                    },
                },
            });
        };
    }

    /**
     * Version transformation helper
     */
    transformResponse(req, response, transformer) {
        const version = req.apiVersion;
        const versionInfo = req.versionInfo;

        if (typeof transformer === "function") {
            return transformer(response, {
                version,
                versionInfo,
                requestedVersion: req.headers["api-version"],
                isLatest: versionInfo.isLatest,
                isDeprecated: versionInfo.isDeprecated,
            });
        }

        return response;
    }

    /**
     * Version-specific error handler
     */
    versionedErrorHandler() {
        return (err, req, res, next) => {
            const version = req.apiVersion;
            const versionInfo = req.versionInfo;

            // Base error structure
            const errorResponse = {
                error: err.name || "Internal Server Error",
                message: err.message,
                timestamp: new Date().toISOString(),
                version: version,
                requestId: req.id || req.headers["x-request-id"],
            };

            // Add version-specific information
            if (versionInfo) {
                errorResponse.deprecated = versionInfo.isDeprecated;
                if (versionInfo.isDeprecated) {
                    errorResponse.sunsetDate = versionInfo.sunsetDate;
                    errorResponse.migrateTo = this.versionManager.getCurrentVersion();
                }
            }

            // Add stack trace in development
            if (process.env.NODE_ENV === "development") {
                errorResponse.stack = err.stack;
            }

            res.status(err.status || 500).json(errorResponse);
        };
    }
}

module.exports = {
    APIVersioningExpress,
    apiVersioningExpress: new APIVersioningExpress(),
};
