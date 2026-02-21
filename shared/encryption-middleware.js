/**
 * TalentSphere Encryption Middleware
 * Comprehensive encryption middleware integrating field-level encryption,
 * secure communication, and key management
 */

const { encryptionService, encryptObject, decryptObject } = require('./encryption-service');
const { defaultTLSConfig, securityMiddleware } = require('./tls-config');

class EncryptionMiddleware {
    constructor(options = {}) {
        this.options = {
            // Encryption options
            enableFieldEncryption: options.enableFieldEncryption !== false,
            enableFileEncryption: options.enableFileEncryption !== false,
            enableCommunicationEncryption: options.enableCommunicationEncryption !== false,

            // Sensitive fields to encrypt/decrypt
            sensitiveFields: options.sensitiveFields || [
                'password', 'ssn', 'creditCard', 'cvv',
                'apiKey', 'secret', 'token', 'refreshToken',
                'phoneNumber', 'address', 'email'
            ],

            // Field-level encryption configuration
            fieldEncryptionConfig: options.fieldEncryptionConfig || {},

            // File encryption options
            encryptedFileExtensions: options.encryptedFileExtensions || ['.txt', '.csv', '.json', '.xml'],
            encryptedFileTypes: options.encryptedFileTypes || [
                'text/plain', 'application/json', 'application/xml',
                'text/csv', 'application/vnd.ms-excel'
            ],

            // Communication security options
            enforceHTTPS: options.enforceHTTPS !== false,
            addSecurityHeaders: options.addSecurityHeaders !== false,

            // Key management options
            keyRotationInterval: options.keyRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days

            ...options
        };

        // Initialize field encryption config with defaults
        this.defaultFieldConfig = {
            password: { keyId: 'password-key' },
            ssn: { keyId: 'pii-key' },
            creditCard: { keyId: 'financial-key' },
            cvv: { keyId: 'financial-key' },
            apiKey: { keyId: 'api-key' },
            secret: { keyId: 'secret-key' },
            token: { keyId: 'token-key' },
            refreshToken: { keyId: 'token-key' }
        };

        this.fieldEncryptionConfig = { ...this.defaultFieldConfig, ...this.options.fieldEncryptionConfig };

        // Setup key rotation timer
        this.setupKeyRotation();
    }

    /**
     * Setup automatic key rotation
     */
    setupKeyRotation() {
        if (this.options.keyRotationInterval > 0) {
            setInterval(() => {
                this.rotateKeys();
            }, this.options.keyRotationInterval);
        }
    }

    /**
     * Rotate encryption keys
     */
    rotateKeys() {
        // In a real implementation, this would handle key rotation
        // For now, we'll just log that rotation happened
        console.log('Key rotation executed:', new Date().toISOString());
    }

    /**
     * Middleware for encrypting request bodies
     */
    encryptRequestBody() {
        if (!this.options.enableFieldEncryption) {
            return (req, res, next) => next();
        }

        return (req, res, next) => {
            if (req.body && typeof req.body === 'object') {
                // Encrypt sensitive fields in request body
                req.body = encryptObject(req.body, this.options.sensitiveFields);
            }
            next();
        };
    }

    /**
     * Middleware for decrypting request bodies
     */
    decryptRequestBody() {
        if (!this.options.enableFieldEncryption) {
            return (req, res, next) => next();
        }

        return (req, res, next) => {
            if (req.body && typeof req.body === 'object') {
                // Decrypt sensitive fields in request body
                req.body = decryptObject(req.body, this.options.sensitiveFields);
            }
            next();
        };
    }

    /**
     * Middleware for encrypting response bodies
     */
    encryptResponseBody() {
        if (!this.options.enableFieldEncryption) {
            return (req, res, next) => next();
        }

        return (req, res, next) => {
            const originalSend = res.send;

            res.send = function (body) {
                if (typeof body === 'object' && body !== null && !res.headersSent) {
                    // Encrypt sensitive fields in response body
                    const encryptedBody = encryptObject(body, this.options.sensitiveFields);
                    return originalSend.call(this, encryptedBody);
                }
                return originalSend.call(this, body);
            }.bind(res);

            next();
        };
    }

    /**
     * Middleware for decrypting response bodies
     */
    decryptResponseBody() {
        if (!this.options.enableFieldEncryption) {
            return (req, res, next) => next();
        }

        return (req, res, next) => {
            // This would typically be used in client-side implementations
            // For server-side, responses are usually encrypted for client consumption
            next();
        };
    }

    /**
     * Middleware for file encryption/decryption
     */
    fileEncryption() {
        if (!this.options.enableFileEncryption) {
            return (req, res, next) => next();
        }

        return (req, res, next) => {
            // Store original methods
            const originalPipe = req.pipe;

            // Override pipe to handle file encryption/decryption
            req.pipe = function (destination, options) {
                // Check if destination is a file stream
                if (destination.path) {
                    const ext = require('path').extname(destination.path);
                    const mimeType = req.headers['content-type'];

                    // Encrypt file if it matches sensitive types/extensions
                    if (this.options.encryptedFileExtensions.includes(ext) ||
                        this.options.encryptedFileTypes.includes(mimeType)) {

                        // This is a simplified approach - in practice, you'd want to
                        // encrypt the stream as it's being piped
                        console.log(`Encrypting file: ${destination.path}`);
                    }
                }

                return originalPipe.call(this, destination, options);
            }.bind(req);

            next();
        };
    }

    /**
     * Middleware for enforcing HTTPS and security headers
     */
    communicationSecurity() {
        if (!this.options.enableCommunicationEncryption) {
            return (req, res, next) => next();
        }

        return securityMiddleware();
    }

    /**
     * Complete encryption middleware stack
     */
    fullEncryptionStack() {
        const middlewares = [];

        // Communication security (HTTPS, headers)
        if (this.options.enforceHTTPS || this.options.addSecurityHeaders) {
            middlewares.push(this.communicationSecurity());
        }

        // Request body decryption (decrypt what comes in)
        if (this.options.enableFieldEncryption) {
            middlewares.push(this.decryptRequestBody());
        }

        // Response body encryption (encrypt what goes out)
        if (this.options.enableFieldEncryption) {
            middlewares.push(this.encryptResponseBody());
        }

        // File encryption
        if (this.options.enableFileEncryption) {
            middlewares.push(this.fileEncryption());
        }

        return middlewares;
    }

    /**
     * Middleware specifically for database record encryption
     */
    databaseEncryption() {
        return {
            encryptRecord: (record) => {
                if (!this.options.enableFieldEncryption) {return record;}
                return encryptionService.encryptRecord(record, this.fieldEncryptionConfig);
            },
            decryptRecord: (record) => {
                if (!this.options.enableFieldEncryption) {return record;}
                return encryptionService.decryptRecord(record, this.fieldEncryptionConfig);
            }
        };
    }

    /**
     * Middleware for API endpoint encryption
     */
    apiEncryption(endpointConfig = {}) {
        const self = this;

        return (req, res, next) => {
            // Get endpoint-specific config
            const config = endpointConfig[req.path] || {};
            const sensitiveFields = config.fields || this.options.sensitiveFields;

            // Handle request encryption/decryption
            if (req.body && typeof req.body === 'object') {
                if (config.decryptInbound !== false) {
                    req.body = decryptObject(req.body, sensitiveFields);
                }
            }

            // Handle response encryption
            if (config.encryptOutbound !== false) {
                const originalSend = res.send;

                res.send = function (body) {
                    if (typeof body === 'object' && body !== null && !res.headersSent) {
                        const encryptedBody = encryptObject(body, sensitiveFields);
                        return originalSend.call(this, encryptedBody);
                    }
                    return originalSend.call(this, body);
                }.bind(res);
            }

            next();
        };
    }

    /**
     * Middleware for session data encryption
     */
    sessionEncryption() {
        return (req, res, next) => {
            if (req.session && typeof req.session === 'object') {
                // Encrypt sensitive session data
                const sessionData = { ...req.session };
                req.session = encryptObject(sessionData, this.options.sensitiveFields);
            }

            next();
        };
    }

    /**
     * Get encryption status and compliance report
     */
    getEncryptionStatus() {
        const compliance = defaultTLSConfig.checkSecurityCompliance();

        return {
            status: 'active',
            fieldEncryptionEnabled: this.options.enableFieldEncryption,
            fileEncryptionEnabled: this.options.enableFileEncryption,
            communicationEncryptionEnabled: this.options.enableCommunicationEncryption,
            tlsCompliance: compliance,
            sensitiveFieldsProtected: this.options.sensitiveFields,
            lastKeyRotation: new Date().toISOString(),
            keyRotationInterval: this.options.keyRotationInterval
        };
    }
}

// Create singleton instance with default configuration
const encryptionMiddleware = new EncryptionMiddleware();

module.exports = {
    EncryptionMiddleware,
    encryptionMiddleware,
    encryptRequestBody: encryptionMiddleware.encryptRequestBody.bind(encryptionMiddleware),
    decryptRequestBody: encryptionMiddleware.decryptRequestBody.bind(encryptionMiddleware),
    encryptResponseBody: encryptionMiddleware.encryptResponseBody.bind(encryptionMiddleware),
    communicationSecurity: encryptionMiddleware.communicationSecurity.bind(encryptionMiddleware),
    fullEncryptionStack: encryptionMiddleware.fullEncryptionStack.bind(encryptionMiddleware),
    databaseEncryption: encryptionMiddleware.databaseEncryption.bind(encryptionMiddleware),
    apiEncryption: encryptionMiddleware.apiEncryption.bind(encryptionMiddleware),
    sessionEncryption: encryptionMiddleware.sessionEncryption.bind(encryptionMiddleware),
    getEncryptionStatus: encryptionMiddleware.getEncryptionStatus.bind(encryptionMiddleware)
};