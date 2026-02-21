const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Frontend Bundle Analyzer and Optimizer
 * Analyzes bundle sizes and suggests optimizations
 */
class BundleAnalyzer {
    constructor(options = {}) {
        this.options = {
            projectRoot: options.projectRoot || process.cwd(),
            buildDir: options.buildDir || 'dist',
            maxSize: options.maxSize || 244000, // 244KB (gzip)
            criticalSize: options.criticalSize || 100000, // 100KB (gzip)
            ...options
        };

        this.analysisResults = {
            bundles: [],
            totalSize: 0,
            totalGzipSize: 0,
            oversizedBundles: [],
            recommendations: []
        };
    }

    async analyzeBuild() {
        const buildPath = path.join(this.options.projectRoot, this.options.buildDir);

        if (!fs.existsSync(buildPath)) {
            throw new Error(`Build directory not found: ${buildPath}`);
        }

        console.log('🔍 Analyzing frontend bundles...');

        await this.scanBundleFiles(buildPath);
        this.calculateTotals();
        this.generateRecommendations();

        return this.analysisResults;
    }

    async scanBundleFiles(dirPath, prefix = '') {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                await this.scanBundleFiles(filePath, path.join(prefix, file));
            } else if (this.isBundleFile(file)) {
                await this.analyzeBundleFile(filePath, path.join(prefix, file));
            }
        }
    }

    isBundleFile(filename) {
        const bundleExtensions = ['.js', '.css', '.html'];
        const bundlePatterns = [
            /bundle/,
            /chunk/,
            /main/,
            /vendor/,
            /[a-f0-9]{8}\.js$/,
            /\.min\./
        ];

        const ext = path.extname(filename);
        if (!bundleExtensions.includes(ext)) {return false;}

        return bundlePatterns.some(pattern => pattern.test(filename));
    }

    async analyzeBundleFile(filePath, relativePath) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath);
            const gzipSize = zlib.gzipSync(content).length;

            const bundleInfo = {
                name: path.basename(relativePath),
                path: relativePath,
                size: stats.size,
                gzipSize: gzipSize,
                sizeFormatted: this.formatBytes(stats.size),
                gzipSizeFormatted: this.formatBytes(gzipSize),
                isOversized: gzipSize > this.options.maxSize,
                isCritical: gzipSize > this.options.criticalSize
            };

            this.analysisResults.bundles.push(bundleInfo);

            if (bundleInfo.isOversized) {
                this.analysisResults.oversizedBundles.push(bundleInfo);
            }

            console.log(`📦 ${bundleInfo.name}: ${bundleInfo.sizeFormatted} (${bundleInfo.gzipSizeFormatted} gzipped)`);

        } catch (error) {
            console.error(`Error analyzing ${filePath}:`, error.message);
        }
    }

    calculateTotals() {
        this.analysisResults.totalSize = this.analysisResults.bundles.reduce((sum, bundle) => sum + bundle.size, 0);
        this.analysisResults.totalGzipSize = this.analysisResults.bundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);

        this.analysisResults.totalSizeFormatted = this.formatBytes(this.analysisResults.totalSize);
        this.analysisResults.totalGzipSizeFormatted = this.formatBytes(this.analysisResults.totalGzipSize);
    }

    generateRecommendations() {
        const recommendations = [];

        // Size-based recommendations
        if (this.analysisResults.totalGzipSize > this.options.maxSize * 3) {
            recommendations.push({
                type: 'critical',
                message: 'Total bundle size is extremely large',
                solution: 'Implement code splitting and lazy loading'
            });
        } else if (this.analysisResults.totalGzipSize > this.options.maxSize * 2) {
            recommendations.push({
                type: 'warning',
                message: 'Total bundle size is quite large',
                solution: 'Consider removing unused dependencies'
            });
        }

        // Individual bundle recommendations
        this.analysisResults.oversizedBundles.forEach(bundle => {
            recommendations.push({
                type: 'bundle',
                message: `Bundle ${bundle.name} is oversized (${bundle.gzipSizeFormatted})`,
                solution: 'Split this bundle or lazy load parts of it'
            });
        });

        // Dependency analysis recommendations
        const vendorBundles = this.analysisResults.bundles.filter(b => b.name.includes('vendor'));
        if (vendorBundles.length > 0) {
            const totalVendorSize = vendorBundles.reduce((sum, b) => sum + b.gzipSize, 0);
            if (totalVendorSize > this.options.maxSize) {
                recommendations.push({
                    type: 'dependencies',
                    message: 'Vendor bundle is very large',
                    solution: 'Analyze and remove unused dependencies with webpack-bundle-analyzer'
                });
            }
        }

        this.analysisResults.recommendations = recommendations;
    }

    formatBytes(bytes) {
        if (bytes === 0) {return '0 Bytes';}

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalBundles: this.analysisResults.bundles.length,
                totalSize: this.analysisResults.totalSizeFormatted,
                totalGzipSize: this.analysisResults.totalGzipSizeFormatted,
                oversizedCount: this.analysisResults.oversizedBundles.length
            },
            bundles: this.analysisResults.bundles.sort((a, b) => b.gzipSize - a.gzipSize),
            oversizedBundles: this.analysisResults.oversizedBundles,
            recommendations: this.analysisResults.recommendations
        };
    }

    async saveReport(report, outputPath = null) {
        const filename = outputPath || `bundle-analysis-${Date.now()}.json`;
        const filepath = path.join(this.options.projectRoot, filename);

        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`📋 Analysis report saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            console.error('Failed to save report:', error);
            return null;
        }
    }

    printSummary() {
        console.log('\n📊 Bundle Analysis Summary:');
        console.log(`Total Bundles: ${this.analysisResults.bundles.length}`);
        console.log(`Total Size: ${this.analysisResults.totalSizeFormatted}`);
        console.log(`Total Gzipped Size: ${this.analysisResults.totalGzipSizeFormatted}`);
        console.log(`Oversized Bundles: ${this.analysisResults.oversizedBundles.length}`);

        if (this.analysisResults.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.analysisResults.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.message}`);
                console.log(`   Solution: ${rec.solution}`);
            });
        }
    }
}

module.exports = BundleAnalyzer;