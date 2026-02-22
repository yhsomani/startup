/**
 * API Deprecation Manager
 *
 * Tracks and communicates API deprecation to consumers.
 */

class DeprecationManager {
    constructor() {
        this.deprecations = new Map();
    }

    register(path, version, sunsetDate, alternative = null) {
        this.deprecations.set(path, {
            path,
            deprecatedIn: version,
            sunsetDate: new Date(sunsetDate),
            alternative,
            registeredAt: new Date(),
        });
    }

    getDeprecation(path) {
        return this.deprecations.get(path);
    }

    isDeprecated(path) {
        const deprecation = this.deprecations.get(path);
        if (!deprecation) return false;
        return new Date() >= deprecation.sunsetDate;
    }

    getDeprecationHeader(path) {
        const deprecation = this.deprecations.get(path);
        if (!deprecation) return {};

        const daysUntilSunset = Math.ceil(
            (deprecation.sunsetDate - new Date()) / (1000 * 60 * 60 * 24)
        );

        return {
            Deprecation: `api="${deprecation.deprecatedIn}"`,
            Sunset: deprecation.sunsetDate.toUTCString(),
            Link: deprecation.alternative ? `<${deprecation.alternative}>; rel="alternate"` : null,
        };
    }

    middleware() {
        const manager = this;

        return (req, res, next) => {
            const deprecation = manager.getDeprecation(req.path);

            if (deprecation) {
                const headers = manager.getDeprecationHeader(req.path);
                Object.entries(headers).forEach(([key, value]) => {
                    if (value) res.set(key, value);
                });

                if (manager.isDeprecated(req.path)) {
                    return res.status(410).json({
                        error: "Gone",
                        message: `API ${req.path} has been deprecated and removed`,
                    });
                }
            }

            next();
        };
    }
}

const deprecationManager = new DeprecationManager();

deprecationManager.register("/api/v1/users/search", "v2", "2025-06-01", "/api/v2/users/search");
deprecationManager.register("/api/v1/analytics", "v2", "2025-07-01", "/api/v2/metrics");

module.exports = {
    DeprecationManager,
    deprecationManager,
};
