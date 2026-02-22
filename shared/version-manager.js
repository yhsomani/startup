/**
 * API Version Compatibility & Deprecation Manager
 *
 * Tracks version support, deprecation schedules, and breaking changes.
 */

const API_VERSIONS = {
    v1: {
        status: "deprecated",
        released: "2024-01-01",
        deprecated: "2025-01-01",
        sunset: "2025-06-01",
        breakingChanges: [],
        features: ["users", "jobs", "courses", "auth"],
        responseFormat: "json",
    },
    v2: {
        status: "active",
        released: "2025-01-01",
        deprecated: null,
        sunset: null,
        breakingChanges: [
            "Removed: user.profile field (use user.profile_data)",
            "Changed: job.salary now returns object {min, max, currency}",
            "Added: pagination meta.total_pages field",
        ],
        features: ["users", "jobs", "courses", "auth", "challenges"],
        responseFormat: "json",
    },
};

class VersionManager {
    constructor() {
        this.versions = API_VERSIONS;
    }

    getVersionInfo(version) {
        return this.versions[version] || null;
    }

    getActiveVersion() {
        return Object.keys(this.versions).find(v => this.versions[v].status === "active");
    }

    getDeprecatedVersions() {
        return Object.keys(this.versions).filter(v => this.versions[v].status === "deprecated");
    }

    isDeprecated(version) {
        const info = this.versions[version];
        return info && info.status === "deprecated";
    }

    getSunsetDate(version) {
        const info = this.versions[version];
        return info ? info.sunset : null;
    }

    shouldShowDeprecationWarning(version) {
        if (!this.isDeprecated(version)) return false;

        const sunsetDate = this.getSunsetDate(version);
        if (!sunsetDate) return false;

        const daysUntilSunset = Math.ceil(
            (new Date(sunsetDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        return daysUntilSunset <= 30;
    }

    getDeprecationHeaders(version) {
        const info = this.versions[version];
        if (!info || !info.deprecated) return {};

        const headers = {
            Deprecation: `api="${info.deprecated}"`,
            Link: `<${this.getDocsUrl()}>; rel="deprecation"; title="API Deprecation Guide"`,
        };

        if (info.sunset) {
            headers["Sunset"] = info.sunset;
        }

        return headers;
    }

    getDocsUrl() {
        return "https://docs.talentsphere.com/api/v2-migration";
    }

    middleware() {
        return (req, res, next) => {
            const version = req.apiVersion || "v1";

            if (this.shouldShowDeprecationWarning(version)) {
                res.set(
                    "X-Deprecation-Warning",
                    `API version ${version} will be sunset on ${this.getSunsetDate(version)}. Please migrate to v2.`
                );
            }

            const deprecationHeaders = this.getDeprecationHeaders(version);
            Object.entries(deprecationHeaders).forEach(([key, value]) => {
                res.set(key, value);
            });

            next();
        };
    }
}

const versionManager = new VersionManager();

module.exports = {
    VersionManager,
    versionManager,
    API_VERSIONS,
};
