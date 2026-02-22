/**
 * API Versioning Middleware
 *
 * Supports multiple versioning strategies:
 * - URL Path: /api/v1/users
 * - Header: Accept: application/vnd.talentsphere.v1+json
 * - Query: /api/users?version=1
 */

class ApiVersioner {
    constructor(options = {}) {
        this.defaultVersion = options.defaultVersion || "v1";
        this.supportedVersions = options.supportedVersions || ["v1", "v2"];
        this.strategy = options.strategy || "path"; // 'path', 'header', 'query', 'accept'
        this.headerName = options.headerName || "Accept-Version";
    }

    middleware() {
        return (req, res, next) => {
            const version = this.getVersion(req);

            if (!this.isSupported(version)) {
                return res.status(400).json({
                    error: "Unsupported API Version",
                    message: `Version '${version}' is not supported. Supported: ${this.supportedVersions.join(", ")}`,
                    supportedVersions: this.supportedVersions,
                    documentation: "/api/docs",
                });
            }

            req.apiVersion = version;
            res.setHeader("API-Version", version);
            res.setHeader("X-API-Version", version);

            next();
        };
    }

    getVersion(req) {
        switch (this.strategy) {
            case "path":
                return this.getVersionFromPath(req.path);
            case "header":
                return req.headers[this.headerName.toLowerCase()] || this.defaultVersion;
            case "query":
                return req.query.version || req.query.v || this.defaultVersion;
            case "accept":
                return this.getVersionFromAcceptHeader(req.headers.accept);
            default:
                return this.defaultVersion;
        }
    }

    getVersionFromPath(path) {
        const match = path.match(/api\/(v\d+)/);
        return match ? match[1] : this.defaultVersion;
    }

    getVersionFromAcceptHeader(acceptHeader) {
        if (!acceptHeader) return this.defaultVersion;

        const match = acceptHeader.match(/vnd\.talentsphere\.v(\d+)/);
        return match ? `v${match[1]}` : this.defaultVersion;
    }

    isSupported(version) {
        return this.supportedVersions.includes(version);
    }

    routeHandler(versions) {
        return (req, res, next) => {
            const version = req.apiVersion || this.defaultVersion;

            if (versions[version]) {
                return versions[version](req, res, next);
            }

            return versions[this.defaultVersion](req, res, next);
        };
    }
}

const versioner = new ApiVersioner({
    strategy: "path",
    supportedVersions: ["v1", "v2"],
    defaultVersion: "v1",
});

module.exports = {
    ApiVersioner,
    versioner,
};
