/**
 * TalentSphere CDN and Asset Optimization System
 * Provides comprehensive asset compression, CDN integration, and performance optimization
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class AssetOptimizationManager {
    constructor() {
        this.config = this.loadConfig();
        this.assetManifest = new Map();
        this.compressionCache = new Map();
        this.metrics = {
            assets: new Map(),
            compression: new Map(),
            cdn: new Map(),
        };
    }

    /**
     * Load asset optimization configuration
     */
    loadConfig() {
        return {
            // CDN Configuration
            cdn: {
                enabled: process.env.CDN_ENABLED === "true",
                baseUrl: process.env.CDN_BASE_URL || "https://cdn.talentsphere.com",
                regions: (process.env.CDN_REGIONS || "us-east-1,eu-west-1").split(","),
                cacheTTL: parseInt(process.env.CDN_CACHE_TTL) || 31536000, // 1 year
                compression: process.env.CDN_COMPRESSION !== "false",
                securityHeaders: process.env.CDN_SECURITY_HEADERS !== "false",
            },

            // Compression Configuration
            compression: {
                enabled: process.env.ASSET_COMPRESSION !== "false",
                algorithms: (process.env.COMPRESSION_ALGORITHMS || "gzip,br").split(","),
                level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
                threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024,
                cacheMaxAge: parseInt(process.env.COMPRESSION_CACHE_AGE) || 86400,
            },

            // Asset Configuration
            assets: {
                buildDir: process.env.BUILD_DIR || "dist",
                publicDir: process.env.PUBLIC_DIR || "public",
                manifestFile: process.env.ASSET_MANIFEST || "asset-manifest.json",
                hashLength: parseInt(process.env.ASSET_HASH_LENGTH) || 8,
                maxSize: parseInt(process.env.ASSET_MAX_SIZE) || 52428800, // 50MB
                formats: {
                    images: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
                    fonts: ["woff", "woff2", "ttf", "eot"],
                    scripts: ["js", "mjs"],
                    styles: ["css", "scss", "sass"],
                },
            },

            // Performance Configuration
            performance: {
                criticalCss: process.env.CRITICAL_CSS !== "false",
                lazyLoading: process.env.LAZY_LOADING !== "false",
                preloading: process.env.PRELOADING !== "false",
                prefetching: process.env.PREFETCHING !== "false",
                minification: process.env.MINIFICATION !== "false",
            },
        };
    }

    /**
     * Initialize asset optimization
     */
    async initialize() {
        console.log("Initializing asset optimization...");

        // Create build directories if they don't exist
        await this.ensureDirectory(this.config.assets.buildDir);
        await this.ensureDirectory(path.join(this.config.assets.buildDir, "assets"));

        // Load existing asset manifest
        await this.loadAssetManifest();

        // Clean up old assets
        await this.cleanupOldAssets();

        console.log("Asset optimization initialized");
    }

    /**
     * Optimize all assets
     */
    async optimizeAssets() {
        console.log("Starting asset optimization...");

        const startTime = Date.now();
        const results = {
            compressed: 0,
            optimized: 0,
            errors: [],
            totalSize: 0,
            compressedSize: 0,
        };

        try {
            // Process images
            await this.processImages(results);

            // Process scripts and styles
            await this.processScripts(results);
            await this.processStyles(results);

            // Process fonts
            await this.processFonts(results);

            // Generate critical CSS
            if (this.config.performance.criticalCss) {
                await this.generateCriticalCss(results);
            }

            // Create asset bundles
            await this.createAssetBundles(results);

            // Save updated manifest
            await this.saveAssetManifest();

            const duration = Date.now() - startTime;
            console.log(`Asset optimization completed in ${duration}ms`);
            console.log(`Compressed: ${results.compressed}, Optimized: ${results.optimized}`);

            this.recordOptimizationMetrics(results, duration);

            return results;
        } catch (error) {
            console.error("Asset optimization failed:", error);
            results.errors.push(error.message);
            return results;
        }
    }

    /**
     * Process and optimize images
     */
    async processImages(results) {
        const imageDir = path.join(this.config.assets.buildDir, "assets", "images");
        const imageFiles = await this.getFilesByExtension(
            imageDir,
            this.config.assets.formats.images
        );

        for (const file of imageFiles) {
            try {
                const stats = await fs.stat(file);
                const originalSize = stats.size;

                // Generate optimized versions
                const optimized = await this.optimizeImage(file);

                // Update manifest
                const relativePath = path.relative(this.config.assets.buildDir, file);
                const hash = await this.generateFileHash(file);
                const optimizedName = this.addHashToFilename(file, hash);

                this.assetManifest.set(relativePath, {
                    original: relativePath,
                    optimized: path.relative(this.config.assets.buildDir, optimizedName),
                    hash,
                    size: {
                        original: originalSize,
                        optimized: optimized.size,
                    },
                    type: "image",
                    cdnUrl: this.getCdnUrl(optimizedName),
                });

                results.optimized++;
                results.totalSize += originalSize;
                results.compressedSize += optimized.size;
            } catch (error) {
                console.error(`Failed to optimize image ${file}:`, error);
                results.errors.push(`Image optimization failed: ${file}`);
            }
        }
    }

    /**
     * Optimize a single image
     */
    async optimizeImage(filePath) {
        const sharp = require("sharp");
        const imagemin = require("imagemin");
        const imageminWebp = require("imagemin-webp");
        const imageminMozjpeg = require("imagemin-mozjpeg");
        const imageminPngquant = require("imagemin-pngquant");

        const ext = path.extname(filePath).toLowerCase();
        let optimizedPath = filePath;
        let optimizedSize = 0;

        try {
            if ([".jpg", ".jpeg"].includes(ext)) {
                // Optimize JPEG
                const result = await imagemin([filePath], {
                    plugins: [imageminMozjpeg({ quality: 80 })],
                });
                optimizedPath = result[0].dataPath;
                optimizedSize = result[0].data.length;

                // Create WebP version
                const webpPath = filePath.replace(/\.(jpg|jpeg)$/i, ".webp");
                await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
            } else if ([".png"].includes(ext)) {
                // Optimize PNG
                const result = await imagemin([filePath], {
                    plugins: [imageminPngquant({ quality: [0.6, 0.8] })],
                });
                optimizedPath = result[0].dataPath;
                optimizedSize = result[0].data.length;

                // Create WebP version
                const webpPath = filePath.replace(/\.png$/i, ".webp");
                await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
            } else if ([".gif"].includes(ext)) {
                // Convert animated GIF to WebP
                const webpPath = filePath.replace(/\.gif$/i, ".webp");
                await sharp(filePath, { animated: true }).webp().toFile(webpPath);

                const stats = await fs.stat(webpPath);
                optimizedSize = stats.size;
            }
        } catch (error) {
            console.error(`Image optimization failed for ${filePath}:`, error);
            throw error;
        }

        return { path: optimizedPath, size: optimizedSize };
    }

    /**
     * Process JavaScript files
     */
    async processScripts(results) {
        const scriptDir = path.join(this.config.assets.buildDir, "assets", "js");
        const scriptFiles = await this.getFilesByExtension(
            scriptDir,
            this.config.assets.formats.scripts
        );

        for (const file of scriptFiles) {
            try {
                const stats = await fs.stat(file);
                const originalSize = stats.size;

                // Minify if enabled
                let optimizedPath = file;
                let optimizedSize = originalSize;

                if (this.config.performance.minification) {
                    const minified = await this.minifyJavaScript(file);
                    optimizedPath = minified.path;
                    optimizedSize = minified.size;
                }

                // Create compressed versions
                if (this.config.compression.enabled) {
                    await this.createCompressedVersions(optimizedPath);
                    results.compressed++;
                }

                // Update manifest
                const relativePath = path.relative(this.config.assets.buildDir, file);
                const hash = await this.generateFileHash(optimizedPath);
                const hashedName = this.addHashToFilename(optimizedPath, hash);

                this.assetManifest.set(relativePath, {
                    original: relativePath,
                    optimized: path.relative(this.config.assets.buildDir, hashedName),
                    hash,
                    size: { original: originalSize, optimized: optimizedSize },
                    type: "script",
                    cdnUrl: this.getCdnUrl(hashedName),
                    compressed: this.config.compression.enabled,
                });

                results.optimized++;
                results.totalSize += originalSize;
                results.compressedSize += optimizedSize;
            } catch (error) {
                console.error(`Failed to process script ${file}:`, error);
                results.errors.push(`Script processing failed: ${file}`);
            }
        }
    }

    /**
     * Minify JavaScript
     */
    async minifyJavaScript(filePath) {
        const Terser = require("terser");
        const content = await fs.readFile(filePath, "utf8");

        const result = await Terser.minify(content, {
            compress: {
                drop_console: process.env.NODE_ENV === "production",
                drop_debugger: true,
            },
            mangle: true,
            format: {
                comments: false,
            },
        });

        if (result.error) {
            throw new Error(`JavaScript minification failed: ${result.error}`);
        }

        const minifiedPath = filePath.replace(/\.js$/, ".min.js");
        await fs.writeFile(minifiedPath, result.code);

        return { path: minifiedPath, size: Buffer.byteLength(result.code) };
    }

    /**
     * Process CSS files
     */
    async processStyles(results) {
        const styleDir = path.join(this.config.assets.buildDir, "assets", "css");
        const styleFiles = await this.getFilesByExtension(
            styleDir,
            this.config.assets.formats.styles
        );

        for (const file of styleFiles) {
            try {
                const stats = await fs.stat(file);
                const originalSize = stats.size;

                // Minify if enabled
                let optimizedPath = file;
                let optimizedSize = originalSize;

                if (this.config.performance.minification) {
                    const minified = await this.minifyCSS(file);
                    optimizedPath = minified.path;
                    optimizedSize = minified.size;
                }

                // Create compressed versions
                if (this.config.compression.enabled) {
                    await this.createCompressedVersions(optimizedPath);
                    results.compressed++;
                }

                // Update manifest
                const relativePath = path.relative(this.config.assets.buildDir, file);
                const hash = await this.generateFileHash(optimizedPath);
                const hashedName = this.addHashToFilename(optimizedPath, hash);

                this.assetManifest.set(relativePath, {
                    original: relativePath,
                    optimized: path.relative(this.config.assets.buildDir, hashedName),
                    hash,
                    size: { original: originalSize, optimized: optimizedSize },
                    type: "style",
                    cdnUrl: this.getCdnUrl(hashedName),
                    compressed: this.config.compression.enabled,
                });

                results.optimized++;
                results.totalSize += originalSize;
                results.compressedSize += optimizedSize;
            } catch (error) {
                console.error(`Failed to process style ${file}:`, error);
                results.errors.push(`Style processing failed: ${file}`);
            }
        }
    }

    /**
     * Minify CSS
     */
    async minifyCSS(filePath) {
        const postcss = require("postcss");
        const cssnano = require("cssnano");
        const content = await fs.readFile(filePath, "utf8");

        const result = await postcss([cssnano]).process(content, { from: filePath });

        const minifiedPath = filePath.replace(/\.css$/, ".min.css");
        await fs.writeFile(minifiedPath, result.css);

        return { path: minifiedPath, size: Buffer.byteLength(result.css) };
    }

    /**
     * Process font files
     */
    async processFonts(results) {
        const fontDir = path.join(this.config.assets.buildDir, "assets", "fonts");
        const fontFiles = await this.getFilesByExtension(fontDir, this.config.assets.formats.fonts);

        for (const file of fontFiles) {
            try {
                const stats = await fs.stat(file);
                const originalSize = stats.size;

                // Create compressed versions
                if (this.config.compression.enabled) {
                    await this.createCompressedVersions(file);
                    results.compressed++;
                }

                // Update manifest
                const relativePath = path.relative(this.config.assets.buildDir, file);
                const hash = await this.generateFileHash(file);
                const hashedName = this.addHashToFilename(file, hash);

                this.assetManifest.set(relativePath, {
                    original: relativePath,
                    optimized: path.relative(this.config.assets.buildDir, hashedName),
                    hash,
                    size: { original: originalSize },
                    type: "font",
                    cdnUrl: this.getCdnUrl(hashedName),
                    compressed: this.config.compression.enabled,
                });

                results.optimized++;
                results.totalSize += originalSize;
                results.compressedSize += originalSize;
            } catch (error) {
                console.error(`Failed to process font ${file}:`, error);
                results.errors.push(`Font processing failed: ${file}`);
            }
        }
    }

    /**
     * Create compressed versions of a file
     */
    async createCompressedVersions(filePath) {
        const zlib = require("zlib");
        const content = await fs.readFile(filePath);

        for (const algorithm of this.config.compression.algorithms) {
            let compressed;

            switch (algorithm) {
                case "gzip":
                    compressed = await this.gzipCompress(content);
                    break;
                case "br":
                    compressed = await this.brotliCompress(content);
                    break;
                default:
                    continue;
            }

            const compressedPath = `${filePath}.${algorithm}`;
            await fs.writeFile(compressedPath, compressed);
        }
    }

    /**
     * Gzip compression
     */
    async gzipCompress(content) {
        return new Promise((resolve, reject) => {
            const gzip = zlib.createGzip({
                level: this.config.compression.level,
            });

            const chunks = [];
            gzip.on("data", chunk => chunks.push(chunk));
            gzip.on("end", () => resolve(Buffer.concat(chunks)));
            gzip.on("error", reject);

            gzip.end(content);
        });
    }

    /**
     * Brotli compression
     */
    async brotliCompress(content) {
        return new Promise((resolve, reject) => {
            const brotli = zlib.createBrotliCompress({
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.compression.level,
                },
            });

            const chunks = [];
            brotli.on("data", chunk => chunks.push(chunk));
            brotli.on("end", () => resolve(Buffer.concat(chunks)));
            brotli.on("error", reject);

            brotli.end(content);
        });
    }

    /**
     * Generate critical CSS
     */
    async generateCriticalCss(results) {
        const { Critical } = require("critical");

        try {
            const htmlFiles = await this.getFilesByExtension(this.config.assets.buildDir, ["html"]);

            for (const htmlFile of htmlFiles) {
                const critical = await Critical.generate({
                    base: this.config.assets.buildDir,
                    src: htmlFile,
                    target: {
                        css: path.join(path.dirname(htmlFile), "critical.css"),
                        uncritical: path.join(path.dirname(htmlFile), "non-critical.css"),
                    },
                    dimensions: [
                        { width: 320, height: 480 }, // Mobile
                        { width: 768, height: 1024 }, // Tablet
                        { width: 1920, height: 1080 }, // Desktop
                    ],
                });

                results.optimized++;
            }
        } catch (error) {
            console.error("Critical CSS generation failed:", error);
            results.errors.push("Critical CSS generation failed");
        }
    }

    /**
     * Create asset bundles
     */
    async createAssetBundles(results) {
        // Create vendor bundle
        await this.createVendorBundle(results);

        // Create common bundle
        await this.createCommonBundle(results);
    }

    /**
     * Create vendor bundle
     */
    async createVendorBundle(results) {
        // This would integrate with your bundler (Webpack, Vite, etc.)
        // Placeholder implementation
        console.log("Creating vendor bundle...");
        results.optimized++;
    }

    /**
     * Create common bundle
     */
    async createCommonBundle(results) {
        // This would integrate with your bundler (Webpack, Vite, etc.)
        // Placeholder implementation
        console.log("Creating common bundle...");
        results.optimized++;
    }

    /**
     * Get CDN URL for an asset
     */
    getCdnUrl(assetPath) {
        if (!this.config.cdn.enabled) {
            return `/assets/${path.basename(assetPath)}`;
        }

        const relativePath = path.relative(this.config.assets.buildDir, assetPath);
        return `${this.config.cdn.baseUrl}/${relativePath}`;
    }

    /**
     * Generate file hash
     */
    async generateFileHash(filePath) {
        const content = await fs.readFile(filePath);
        return crypto
            .createHash("md5")
            .update(content)
            .digest("hex")
            .slice(0, this.config.assets.hashLength);
    }

    /**
     * Add hash to filename
     */
    addHashToFilename(filePath, hash) {
        const parsedPath = path.parse(filePath);
        return path.join(parsedPath.dir, `${parsedPath.name}.${hash}${parsedPath.ext}`);
    }

    /**
     * Get files by extension
     */
    async getFilesByExtension(dir, extensions) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.getFilesByExtension(fullPath, extensions);
                    files.push(...subFiles);
                } else if (extensions.includes(entry.name.split(".").pop().toLowerCase())) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist
            console.warn(`Directory not found: ${dir}`);
        }

        return files;
    }

    /**
     * Ensure directory exists
     */
    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== "EEXIST") {
                throw error;
            }
        }
    }

    /**
     * Load asset manifest
     */
    async loadAssetManifest() {
        try {
            const manifestPath = path.join(
                this.config.assets.buildDir,
                this.config.assets.manifestFile
            );
            const content = await fs.readFile(manifestPath, "utf8");
            const manifest = JSON.parse(content);

            for (const [key, value] of Object.entries(manifest)) {
                this.assetManifest.set(key, value);
            }
        } catch (error) {
            console.log("No existing asset manifest found, starting fresh");
        }
    }

    /**
     * Save asset manifest
     */
    async saveAssetManifest() {
        const manifest = Object.fromEntries(this.assetManifest);
        const manifestPath = path.join(
            this.config.assets.buildDir,
            this.config.assets.manifestFile
        );

        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Asset manifest saved to ${manifestPath}`);
    }

    /**
     * Clean up old assets
     */
    async cleanupOldAssets() {
        // Implementation would clean up old hashed files that are no longer referenced
        console.log("Cleaning up old assets...");
    }

    /**
     * Record optimization metrics
     */
    recordOptimizationMetrics(results, duration) {
        const metrics = {
            timestamp: new Date().toISOString(),
            duration,
            assets: results.optimized,
            compressed: results.compressed,
            errors: results.errors.length,
            sizeReduction:
                results.totalSize > 0
                    ? (
                          ((results.totalSize - results.compressedSize) / results.totalSize) *
                          100
                      ).toFixed(2)
                    : 0,
            totalSize: results.totalSize,
            compressedSize: results.compressedSize,
        };

        this.metrics.optimization = metrics;
    }

    /**
     * Get optimization metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            manifest: Object.fromEntries(this.assetManifest),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Express middleware for serving optimized assets
     */
    createAssetMiddleware() {
        return (req, res, next) => {
            // Check if this is an asset request
            if (req.path.startsWith("/assets/")) {
                const assetKey = req.path.replace("/assets/", "");
                const asset = this.assetManifest.get(assetKey);

                if (asset) {
                    // Set appropriate headers
                    if (this.config.cdn.securityHeaders) {
                        res.setHeader("X-Content-Type-Options", "nosniff");
                        res.setHeader("X-Frame-Options", "DENY");
                        res.setHeader("X-XSS-Protection", "1; mode=block");
                    }

                    // Set cache headers
                    res.setHeader("Cache-Control", `public, max-age=${this.config.cdn.cacheTTL}`);

                    // Set compression headers if available
                    const acceptEncoding = req.headers["accept-encoding"] || "";

                    if (acceptEncoding.includes("br") && this.assetManifest.has(`${assetKey}.br`)) {
                        res.setHeader("Content-Encoding", "br");
                    } else if (
                        acceptEncoding.includes("gzip") &&
                        this.assetManifest.has(`${assetKey}.gzip`)
                    ) {
                        res.setHeader("Content-Encoding", "gzip");
                    }
                }
            }

            next();
        };
    }
}

module.exports = {
    AssetOptimizationManager,
    assetOptimizer: new AssetOptimizationManager(),
};
