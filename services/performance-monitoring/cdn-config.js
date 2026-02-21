/**
 * CDN Configuration Manager
 * Handles CDN setup, configuration, and optimization
 */
class CDNConfiguration {
    constructor(options = {}) {
        this.options = {
            providers: {
                cloudflare: {
                    enabled: options.providers?.cloudflare?.enabled || false,
                    zoneId: options.providers?.cloudflare?.zoneId,
                    apiKey: options.providers?.cloudflare?.apiKey,
                    email: options.providers?.cloudflare?.email
                },
                cloudfront: {
                    enabled: options.providers?.cloudfront?.enabled || false,
                    distributionId: options.providers?.cloudfront?.distributionId,
                    accessKeyId: options.providers?.cloudfront?.accessKeyId,
                    secretAccessKey: options.providers?.cloudfront?.secretAccessKey
                },
                custom: {
                    enabled: options.providers?.custom?.enabled || false,
                    baseUrl: options.providers?.custom?.baseUrl
                }
            },

            // Asset optimization
            optimization: {
                compression: options.optimization?.compression !== false,
                imageOptimization: options.optimization?.imageOptimization !== false,
                minification: options.optimization?.minification !== false,
                cacheHeaders: options.optimization?.cacheHeaders !== false
            },

            // Routing rules
            routing: {
                staticAssets: '/static/*',
                images: '/images/*',
                fonts: '/fonts/*',
                scripts: '/js/*',
                styles: '/css/*'
            },

            ...options
        };
    }

    // Generate CDN configuration for different providers
    generateProviderConfig(provider) {
        switch (provider) {
            case 'cloudflare':
                return this.generateCloudflareConfig();
            case 'cloudfront':
                return this.generateCloudFrontConfig();
            case 'custom':
                return this.generateCustomConfig();
            default:
                throw new Error(`Unsupported CDN provider: ${provider}`);
        }
    }

    generateCloudflareConfig() {
        return {
            zoneId: this.options.providers.cloudflare.zoneId,
            settings: {
                // Performance settings
                minify: {
                    css: 'on',
                    html: 'on',
                    js: 'on'
                },
                rocketLoader: 'on',
                brotli: 'on',

                // Caching settings
                cacheLevel: 'aggressive',
                browserCacheTtl: 14400, // 4 hours
                edgeCacheTtl: 7200, // 2 hours

                // Security settings
                securityLevel: 'medium',
                ssl: 'strict'
            },

            pageRules: [
                {
                    target: '*.js',
                    actions: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': 2678400 // 31 days
                    }
                },
                {
                    target: '*.css',
                    actions: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': 2678400
                    }
                },
                {
                    target: '*.(jpg|jpeg|png|gif|webp|avif)',
                    actions: {
                        'Cache Level': 'Cache Everything',
                        'Edge Cache TTL': 2678400,
                        'Polish': 'lossless'
                    }
                }
            ]
        };
    }

    generateCloudFrontConfig() {
        return {
            distributionConfig: {
                Origins: [
                    {
                        Id: 'S3-origin',
                        DomainName: '${S3_BUCKET}.s3.amazonaws.com',
                        CustomOriginConfig: {
                            HTTPPort: 80,
                            HTTPSPort: 443,
                            OriginProtocolPolicy: 'https-only'
                        }
                    }
                ],

                DefaultCacheBehavior: {
                    TargetOriginId: 'S3-origin',
                    ViewerProtocolPolicy: 'redirect-to-https',
                    AllowedMethods: ['GET', 'HEAD'],
                    CachedMethods: ['GET', 'HEAD'],
                    ForwardedValues: {
                        QueryString: false,
                        Cookies: { Forward: 'none' }
                    },
                    MinTTL: 0,
                    DefaultTTL: 86400, // 24 hours
                    MaxTTL: 31536000 // 1 year
                },

                CacheBehaviors: [
                    {
                        PathPattern: '*.js',
                        TargetOriginId: 'S3-origin',
                        ViewerProtocolPolicy: 'redirect-to-https',
                        MinTTL: 31536000,
                        DefaultTTL: 31536000,
                        MaxTTL: 31536000
                    },
                    {
                        PathPattern: '*.css',
                        TargetOriginId: 'S3-origin',
                        ViewerProtocolPolicy: 'redirect-to-https',
                        MinTTL: 31536000,
                        DefaultTTL: 31536000,
                        MaxTTL: 31536000
                    },
                    {
                        PathPattern: '*.(jpg|jpeg|png|gif|webp|avif)',
                        TargetOriginId: 'S3-origin',
                        ViewerProtocolPolicy: 'redirect-to-https',
                        MinTTL: 31536000,
                        DefaultTTL: 31536000,
                        MaxTTL: 31536000
                    }
                ],

                PriceClass: 'PriceClass_All',
                Enabled: true,
                HttpVersion: 'http2'
            }
        };
    }

    generateCustomConfig() {
        return {
            baseUrl: this.options.providers.custom.baseUrl,
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*'
            },
            compression: {
                gzip: true,
                brotli: true
            }
        };
    }

    // Generate asset optimization rules
    getAssetOptimizationRules() {
        return {
            javascript: {
                extensions: ['.js', '.mjs'],
                compression: ['gzip', 'brotli'],
                cacheControl: 'public, max-age=31536000, immutable',
                minify: true
            },

            css: {
                extensions: ['.css'],
                compression: ['gzip', 'brotli'],
                cacheControl: 'public, max-age=31536000, immutable',
                minify: true
            },

            images: {
                extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'],
                compression: ['gzip'],
                cacheControl: 'public, max-age=31536000, immutable',
                optimize: true,
                webpFallback: true
            },

            fonts: {
                extensions: ['.woff', '.woff2', '.ttf', '.eot'],
                compression: ['gzip'],
                cacheControl: 'public, max-age=31536000, immutable'
            },

            html: {
                extensions: ['.html'],
                compression: ['gzip', 'brotli'],
                cacheControl: 'public, max-age=3600',
                minify: true
            }
        };
    }

    // Generate HTTP headers for CDN
    generateHTTPHeaders() {
        return {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

            // CDN-specific headers
            'CDN-Cache-Control': 'public, max-age=31536000, immutable',
            'Timing-Allow-Origin': '*'
        };
    }

    // Generate service worker caching strategy
    generateServiceWorkerConfig() {
        return {
            cacheStrategies: {
                staticAssets: {
                    name: 'static-assets-v1',
                    urls: [
                        '/static/**/*.{js,css}',
                        '/images/**/*.{jpg,png,webp,svg}',
                        '/fonts/**/*.{woff,woff2}'
                    ],
                    strategy: 'CacheFirst',
                    maxEntries: 100,
                    maxAgeSeconds: 31536000
                },

                apiResponses: {
                    name: 'api-cache-v1',
                    urls: ['/api/**'],
                    strategy: 'NetworkFirst',
                    maxEntries: 50,
                    maxAgeSeconds: 300
                },

                pages: {
                    name: 'pages-cache-v1',
                    urls: ['/**/*.html'],
                    strategy: 'StaleWhileRevalidate',
                    maxEntries: 20,
                    maxAgeSeconds: 3600
                }
            },

            precache: [
                '/index.html',
                '/manifest.json',
                '/favicon.ico'
            ]
        };
    }

    // Generate preload and prefetch hints
    generatePreloadHints() {
        return {
            critical: [
                { url: '/static/css/main.css', as: 'style' },
                { url: '/static/js/vendor.js', as: 'script' },
                { url: '/fonts/main.woff2', as: 'font', crossorigin: true }
            ],

            prefetch: [
                { url: '/static/js/routes/home.chunk.js', as: 'script' },
                { url: '/static/js/routes/jobs.chunk.js', as: 'script' }
            ]
        };
    }

    // Validate CDN configuration
    validateConfiguration(config) {
        const errors = [];

        if (!config.provider) {
            errors.push('CDN provider must be specified');
        }

        if (config.provider === 'cloudflare' && !config.zoneId) {
            errors.push('Cloudflare Zone ID is required');
        }

        if (config.provider === 'cloudfront' && !config.distributionId) {
            errors.push('CloudFront Distribution ID is required');
        }

        if (config.provider === 'custom' && !config.baseUrl) {
            errors.push('Custom CDN base URL is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Generate deployment script
    generateDeploymentScript() {
        return `
#!/bin/bash

# CDN Deployment Script

set -e

echo "🚀 Starting CDN deployment..."

# Build the application
npm run build

# Deploy to CDN
node ./scripts/cdn-deploy.js

# Invalidate CDN cache
node ./scripts/cdn-invalidate.js

echo "✅ CDN deployment completed!"
    `.trim();
    }
}

module.exports = CDNConfiguration;