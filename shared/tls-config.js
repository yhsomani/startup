/**
 * TalentSphere TLS/SSL Configuration
 * Implements secure communication for services
 */

const fs = require('fs');
const tls = require('tls');
const https = require('https');
const http = require('http');

class TLSConfiguration {
    constructor(options = {}) {
        this.options = {
            // Certificate options
            keyPath: options.keyPath || process.env.TLS_KEY_PATH,
            certPath: options.certPath || process.env.TLS_CERT_PATH,
            caPath: options.caPath || process.env.TLS_CA_PATH,

            // Cipher suites (ordered by security strength)
            ciphers: options.ciphers || [
                'TLS_AES_256_GCM_SHA384',
                'TLS_CHACHA20_POLY1305_SHA256',
                'TLS_AES_128_GCM_SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-SHA384',
                'ECDHE-RSA-AES128-SHA256',
                'ECDHE-RSA-AES256-SHA',
                'ECDHE-RSA-AES128-SHA',
                'DHE-RSA-AES256-GCM-SHA384',
                'DHE-RSA-AES128-GCM-SHA256',
                'DHE-RSA-AES256-SHA256',
                'DHE-RSA-AES128-SHA256',
                'DHE-RSA-AES256-SHA',
                'DHE-RSA-AES128-SHA'
            ].join(':'),

            // Secure defaults
            minVersion: options.minVersion || 'TLSv1.2',
            maxVersion: options.maxVersion || 'TLSv1.3',
            honorCipherOrder: options.honorCipherOrder !== false,
            rejectUnauthorized: options.rejectUnauthorized !== false,

            // Additional security options
            secureProtocol: options.secureProtocol,
            secureOptions: options.secureOptions,
            passphrase: options.passphrase || process.env.TLS_PASSPHRASE,

            // HSTS options
            hstsMaxAge: options.hstsMaxAge || 31536000, // 1 year
            hstsIncludeSubDomains: options.hstsIncludeSubDomains !== false,
            hstsPreload: options.hstsPreload || false,

            ...options
        };

        this.serverOptions = this.buildServerOptions();
    }

    /**
     * Build TLS server options
     */
    buildServerOptions() {
        const options = {};

        // Load certificates if paths are provided
        if (this.options.keyPath && this.options.certPath) {
            options.key = fs.readFileSync(this.options.keyPath);
            options.cert = fs.readFileSync(this.options.certPath);

            if (this.options.caPath) {
                options.ca = fs.readFileSync(this.options.caPath);
            }
        }

        // Add security options
        options.ciphers = this.options.ciphers;
        options.minVersion = this.options.minVersion;
        options.maxVersion = this.options.maxVersion;
        options.honorCipherOrder = this.options.honorCipherOrder;
        options.rejectUnauthorized = this.options.rejectUnauthorized;

        if (this.options.passphrase) {
            options.passphrase = this.options.passphrase;
        }

        if (this.options.secureProtocol) {
            options.secureProtocol = this.options.secureProtocol;
        }

        if (this.options.secureOptions) {
            options.secureOptions = this.options.secureOptions;
        }

        return options;
    }

    /**
     * Create a secure HTTPS server
     */
    createSecureServer(requestListener) {
        return https.createServer(this.serverOptions, requestListener);
    }

    /**
     * Create a TLS server
     */
    createTLSServer(connectionListener) {
        return tls.createServer(this.serverOptions, connectionListener);
    }

    /**
     * Create secure client options for outbound connections
     */
    createSecureClientOptions(host, port) {
        return {
            host,
            port,
            ...this.serverOptions,
            servername: host, // Enable SNI
        };
    }

    /**
     * Make a secure HTTP request
     */
    secureRequest(url, options = {}) {
        const parsedUrl = new URL(url);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            ...this.createSecureClientOptions(parsedUrl.hostname, parsedUrl.port || 443)
        };

        return new Promise((resolve, reject) => {
            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });

            req.on('error', reject);
            req.write(options.body || '');
            req.end();
        });
    }

    /**
     * Middleware to enforce HTTPS and add security headers
     */
    securityMiddleware() {
        return (req, res, next) => {
            // Force HTTPS in production
            if (process.env.NODE_ENV === 'production' && !req.secure && !req.headers['x-forwarded-proto'] === 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
            }

            // Add security headers
            res.setHeader('Strict-Transport-Security', this.buildHSTSStrategy());
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            // Add Content Security Policy
            res.setHeader('Content-Security-Policy', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self' https://api.talentsphere.com ws: wss:",
                "frame-ancestors 'none'"
            ].join('; '));

            next();
        };
    }

    /**
     * Build HSTS header value
     */
    buildHSTSStrategy() {
        const directives = [`max-age=${this.options.hstsMaxAge}`];

        if (this.options.hstsIncludeSubDomains) {
            directives.push('includeSubDomains');
        }

        if (this.options.hstsPreload) {
            directives.push('preload');
        }

        return directives.join('; ');
    }

    /**
     * Validate certificate chain
     */
    validateCertificateChain(cert) {
        if (!cert) {return false;}

        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);

        // Check validity period
        if (now < validFrom || now > validTo) {
            return false;
        }

        // Check signature algorithm (avoid weak algorithms)
        const weakAlgorithms = ['MD5', 'SHA-1'];
        if (weakAlgorithms.some(algo => cert.signatureAlgorithm.includes(algo))) {
            return false;
        }

        return true;
    }

    /**
     * Get recommended TLS configuration for different environments
     */
    static getRecommendedConfig(environment = 'production') {
        const configs = {
            development: {
                minVersion: 'TLSv1.2',
                ciphers: [
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_AES_128_GCM_SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-GCM-SHA256'
                ].join(':')
            },
            staging: {
                minVersion: 'TLSv1.2',
                ciphers: [
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_AES_128_GCM_SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-SHA384',
                    'ECDHE-RSA-AES128-SHA256'
                ].join(':')
            },
            production: {
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                ciphers: [
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_AES_128_GCM_SHA256'
                ].join(':'),
                hstsMaxAge: 31536000, // 1 year
                hstsIncludeSubDomains: true,
                hstsPreload: true
            }
        };

        return configs[environment] || configs.production;
    }

    /**
     * Check if current TLS configuration meets security standards
     */
    checkSecurityCompliance() {
        const compliance = {
            minVersionOK: this.options.minVersion >= 'TLSv1.2',
            hasStrongCiphers: this.options.ciphers.split(':').some(cipher =>
                ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256'].includes(cipher)
            ),
            hstsConfigured: this.options.hstsMaxAge > 0,
            hstsIncludeSubdomains: this.options.hstsIncludeSubDomains,
            hstsPreload: this.options.hstsPreload,
            compliant: false
        };

        compliance.compliant =
            compliance.minVersionOK &&
            compliance.hasStrongCiphers &&
            compliance.hstsConfigured;

        return compliance;
    }
}

// Create default instance with production-recommended settings
const defaultTLSConfig = new TLSConfiguration(
    TLSConfiguration.getRecommendedConfig(process.env.NODE_ENV || 'production')
);

module.exports = {
    TLSConfiguration,
    defaultTLSConfig,
    createSecureServer: defaultTLSConfig.createSecureServer.bind(defaultTLSConfig),
    createTLSServer: defaultTLSConfig.createTLSServer.bind(defaultTLSConfig),
    secureRequest: defaultTLSConfig.secureRequest.bind(defaultTLSConfig),
    securityMiddleware: defaultTLSConfig.securityMiddleware.bind(defaultTLSConfig),
    getRecommendedConfig: TLSConfiguration.getRecommendedConfig
};