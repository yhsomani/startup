/**
 * TalentSphere API Versioning Strategy
 * Consistent versioning across all microservices
 */

class APIVersionManager {
    constructor() {
        this.currentVersion = '1.0.0';
        this.versions = new Map();
        
        this.loadVersionConfig();
        this.setupVersioningMiddleware();
    }

    /**
     * Load version configuration
     */
    loadVersionConfig() {
        this.versions.set('v1.0.0', {
            description: 'Initial API version',
            deprecated: false,
            sunsetDate: null,
            breakingChanges: false
        });
        
        this.versions.set('v1.1.0', {
            description: 'Added authentication improvements',
            deprecated: false,
            sunsetDate: null,
            breakingChanges: false
        });
        
        this.versions.set('v1.2.0', {
            description: 'Enhanced API response structure',
            deprecated: false,
            sunsetDate: null,
            breakingChanges: true
        });
        
        this.versions.set('v2.0.0', {
            description: 'Breaking changes for API consistency',
            deprecated: true,
            sunsetDate: '2024-06-30',
            breakingChanges: true
        });
    }

    /**
     * Setup versioning middleware for Express
     */
    setupVersioningMiddleware() {
        return (req, res, next) => {
            const requestedVersion = req.headers['api-version'];
            const supportedVersions = Array.from(this.versions.keys());
            
            // Check if version is supported
            if (requestedVersion && !supportedVersions.includes(requestedVersion)) {
                return res.status(410).json({
                    error: 'Unsupported API version',
                    message: `Version ${requestedVersion} is not supported. Supported versions: ${supportedVersions.join(', ')}`,
                    supportedVersions
                });
            }

            // Get latest version if none specified
            const apiVersion = requestedVersion || this.getCurrentVersion();
            
            // Add version headers
            res.setHeader('API-Version', apiVersion);
            res.setHeader('X-API-Supported-Versions', supportedVersions.join(', '));
            
            req.apiVersion = apiVersion;
            next();
        };
    }

    /**
     * Get current version
     */
    getCurrentVersion() {
        return this.currentVersion;
    }

    /**
     * Get version information
     */
    getVersionInfo(version) {
        if (!this.versions.has(version)) {
            throw new Error(`Unknown API version: ${version}`);
        }
        
        return {
            version,
            ...this.versions.get(version),
            isLatest: version === this.getLatestVersion(),
            isDeprecated: this.versions.get(version).deprecated,
            sunsetDate: this.versions.get(version).sunsetDate
        };
    }

    /**
     * Get latest version
     */
    getLatestVersion() {
        const versions = Array.from(this.versions.keys());
        const sortedVersions = versions.sort((a, b) => {
            const versionA = a.split('.').map(Number);
            const versionB = b.split('.').map(Number);
            
            for (let i = 0; i < versionA.length; i++) {
                if (versionA[i] > versionB[i]) return 1;
                if (versionA[i] < versionB[i]) return -1;
                if (versionA[i] === versionB[i]) return 0;
            }
            
            return 0;
        }).reverse()[0];
        
        return sortedVersions;
    }

    /**
     * Deprecate a version
     */
    deprecateVersion(version, sunsetDate = null) {
        if (!this.versions.has(version)) {
            throw new Error(`Unknown API version: ${version}`);
        }
        
        const versionInfo = this.versions.get(version);
        this.versions.set(version, {
            ...versionInfo,
            deprecated: true,
            sunsetDate: sunsetDate || '2024-06-30'
        });
    }

    /**
     * Create versioned route handler
     */
    createVersionedRoute(basePath, handler, version = 'v1.0.0') {
        return (req, res, next) => {
            req.apiVersion = version;
            
            // Call handler with version context
            return handler(req, res, next, {
                version,
                requestedVersion: req.headers['api-version']
            });
        };
    }

    /**
     * Version migration helper
     */
    migrateRoute(oldVersion, newVersion, handler) {
        return this.createVersionedRoute(oldVersion, (req, res, next) => {
            const requestedVersion = req.headers['api-version'];
            
            // Redirect deprecated versions to latest
            if (requestedVersion && requestedVersion < newVersion) {
                return res.status(301).json({
                    message: 'API version has been deprecated',
                    redirectTo: req.originalUrl,
                    latestVersion: this.getCurrentVersion()
                });
            }
            
            return handler(req, res, next, {
                version: newVersion,
                requestedVersion: req.headers['api-version']
            });
        };
    }

    /**
     * Check breaking changes between versions
     */
    hasBreakingChanges(version1, version2) {
        if (version1 === version2) return false;
        
        const changes = this.getBreakingChanges(version1, version2);
        return changes.length > 0;
    }

    /**
     * Get breaking changes for version
     */
    getBreakingChanges(version) {
        const versionInfo = this.versions.get(version);
        
        if (!versionInfo.breakingChanges) {
            return [];
        }
        
        return versionInfo.breakingChanges;
    }

    /**
     * Validate API request version compatibility
     */
    validateRequest(req, requiredVersion = 'v1.0.0') {
        const requestVersion = req.headers['api-version'] || this.getCurrentVersion();
        return this.isVersionCompatible(requestVersion, requiredVersion);
    }

    /**
     * Check if version is compatible
     */
    isVersionCompatible(requestVersion, requiredVersion) {
        // Exact match
        if (requestVersion === requiredVersion) return true;
        
        // Major version check
        const requestMajor = this.getMajorVersion(requestVersion);
        const requiredMajor = this.getMajorVersion(requiredVersion);
        
        if (requestMajor < requiredMajor) return false;
        if (requestMajor > requiredMajor) return true;
        
        // Same major version - check minor version
        if (requestMajor === requiredMajor) {
            const requestMinor = this.getMinorVersion(requestVersion);
            const requiredMinor = this.getMinorVersion(requiredVersion);
            return requestMinor >= requiredMinor;
        }
        
        // Allow pre-release versions
        if (requestVersion.includes('-alpha') || requestVersion.includes('-beta') || requestVersion.includes('-rc')) {
            return true;
        }
        
        return false;
    }

    /**
     * Extract major version
     */
    getMajorVersion(version) {
        return parseInt(version.split('.')[0]);
    }

    /**
     * Extract minor version
     */
    getMinorVersion(version) {
        return parseInt(version.split('.')[1]);
    }

    /**
     * Update current version
     */
    updateCurrentVersion(newVersion) {
        this.currentVersion = newVersion;
    }
}

module.exports = {
    APIVersionManager,
    apiVersionManager: new APIVersionManager()
};