const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

/**
 * CDN Deployment Manager
 * Manages static asset deployment to CDN (AWS CloudFront example)
 */
class CDNDeployer {
    constructor(options = {}) {
        this.options = {
            // AWS Configuration
            aws: {
                accessKeyId: options.aws?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: options.aws?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
                region: options.aws?.region || process.env.AWS_REGION || 'us-east-1'
            },

            // S3 Configuration
            s3: {
                bucket: options.s3?.bucket || process.env.CDN_S3_BUCKET,
                region: options.s3?.region || process.env.AWS_REGION || 'us-east-1'
            },

            // CloudFront Configuration
            cloudfront: {
                distributionId: options.cloudfront?.distributionId || process.env.CLOUDFRONT_DISTRIBUTION_ID,
                originPath: options.cloudfront?.originPath || '/'
            },

            // Asset configuration
            buildDir: options.buildDir || './dist',
            assetPath: options.assetPath || '/',
            cacheControl: options.cacheControl || {
                'default': 'public, max-age=31536000, immutable', // 1 year for hashed assets
                'html': 'public, max-age=3600', // 1 hour for HTML
                'manifest': 'public, max-age=300' // 5 minutes for manifest files
            },

            // Deployment settings
            dryRun: options.dryRun || false,
            verbose: options.verbose || false,
            ...options
        };

        // Initialize AWS services
        this.s3 = new aws.S3({
            accessKeyId: this.options.aws.accessKeyId,
            secretAccessKey: this.options.aws.secretAccessKey,
            region: this.options.s3.region
        });

        this.cloudfront = new aws.CloudFront({
            accessKeyId: this.options.aws.accessKeyId,
            secretAccessKey: this.options.aws.secretAccessKey,
            region: this.options.aws.region
        });

        this.deployedAssets = [];
        this.failedAssets = [];
    }

    async deploy() {
        console.log('🚀 Starting CDN deployment...');

        try {
            // Validate configuration
            await this.validateConfiguration();

            // Upload assets to S3
            await this.uploadAssets();

            // Create CloudFront invalidation
            await this.invalidateCloudFront();

            // Generate deployment report
            await this.generateReport();

            console.log('✅ CDN deployment completed successfully');
            return true;

        } catch (error) {
            console.error('❌ CDN deployment failed:', error);
            throw error;
        }
    }

    async validateConfiguration() {
        console.log('🔍 Validating configuration...');

        const required = [
            'aws.accessKeyId',
            'aws.secretAccessKey',
            's3.bucket'
        ];

        const missing = required.filter(key => {
            const parts = key.split('.');
            let value = this.options;
            for (const part of parts) {
                value = value[part];
                if (value === undefined) {return true;}
            }
            return false;
        });

        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        // Test S3 access
        try {
            await this.s3.headBucket({ Bucket: this.options.s3.bucket }).promise();
            console.log('✅ S3 bucket access verified');
        } catch (error) {
            throw new Error(`Cannot access S3 bucket ${this.options.s3.bucket}: ${error.message}`);
        }

        console.log('✅ Configuration validated');
    }

    async uploadAssets() {
        console.log(`📤 Uploading assets from ${this.options.buildDir}...`);

        if (!fs.existsSync(this.options.buildDir)) {
            throw new Error(`Build directory not found: ${this.options.buildDir}`);
        }

        const files = this.getFilesRecursive(this.options.buildDir);
        console.log(`Found ${files.length} files to upload`);

        const uploadPromises = files.map(file => this.uploadFile(file));
        const results = await Promise.allSettled(uploadPromises);

        results.forEach((result, index) => {
            const file = files[index];
            if (result.status === 'fulfilled') {
                this.deployedAssets.push({
                    key: result.value.Key,
                    etag: result.value.ETag,
                    location: result.value.Location
                });
                if (this.options.verbose) {
                    console.log(`✅ Uploaded: ${file.path}`);
                }
            } else {
                this.failedAssets.push({
                    file: file.path,
                    error: result.reason.message
                });
                console.error(`❌ Failed to upload ${file.path}: ${result.reason.message}`);
            }
        });

        console.log(`✅ Successfully uploaded ${this.deployedAssets.length} files`);
        if (this.failedAssets.length > 0) {
            console.log(`⚠️  Failed to upload ${this.failedAssets.length} files`);
        }
    }

    getFilesRecursive(dir, basePath = '') {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = path.join(basePath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...this.getFilesRecursive(fullPath, relativePath));
            } else {
                files.push({
                    path: fullPath,
                    key: path.posix.join(this.options.assetPath, relativePath),
                    contentType: mime.lookup(fullPath) || 'binary/octet-stream',
                    cacheControl: this.getCacheControl(fullPath)
                });
            }
        }

        return files;
    }

    getCacheControl(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.html') {
            return this.options.cacheControl.html;
        }

        if (ext === '.json' && filePath.includes('manifest')) {
            return this.options.cacheControl.manifest;
        }

        // Hashed assets (contain hash in filename)
        if (/\.[a-f0-9]{8,}\./.test(path.basename(filePath))) {
            return this.options.cacheControl.default;
        }

        return 'public, max-age=3600'; // Default 1 hour
    }

    async uploadFile(fileInfo) {
        if (this.options.dryRun) {
            console.log(`[DRY RUN] Would upload: ${fileInfo.path} -> ${fileInfo.key}`);
            return { Key: fileInfo.key, ETag: 'dry-run', Location: `https://${this.options.s3.bucket}.s3.amazonaws.com/${fileInfo.key}` };
        }

        const fileContent = fs.readFileSync(fileInfo.path);

        const params = {
            Bucket: this.options.s3.bucket,
            Key: fileInfo.key,
            Body: fileContent,
            ContentType: fileInfo.contentType,
            CacheControl: fileInfo.cacheControl,
            Metadata: {
                'deployed-at': new Date().toISOString(),
                'source-path': fileInfo.path
            }
        };

        // Add content encoding for compressed files
        if (fileInfo.path.endsWith('.gz')) {
            params.ContentEncoding = 'gzip';
            params.Key = fileInfo.key.replace('.gz', '');
        } else if (fileInfo.path.endsWith('.br')) {
            params.ContentEncoding = 'br';
            params.Key = fileInfo.key.replace('.br', '');
        }

        return await this.s3.upload(params).promise();
    }

    async invalidateCloudFront() {
        if (!this.options.cloudfront.distributionId) {
            console.log('⚠️  No CloudFront distribution ID provided, skipping invalidation');
            return;
        }

        if (this.options.dryRun) {
            console.log(`[DRY RUN] Would create CloudFront invalidation for ${this.deployedAssets.length} paths`);
            return;
        }

        console.log('🔄 Creating CloudFront invalidation...');

        // Create invalidation paths
        const paths = this.deployedAssets.map(asset => `/${asset.key}`);

        // Add common paths that might need invalidation
        paths.push('/index.html', '/manifest.json', '/sitemap.xml');

        const uniquePaths = [...new Set(paths)].slice(0, 3000); // CloudFront limit

        const params = {
            DistributionId: this.options.cloudfront.distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: uniquePaths.length,
                    Items: uniquePaths
                },
                CallerReference: `deploy-${Date.now()}`
            }
        };

        try {
            const result = await this.cloudfront.createInvalidation(params).promise();
            console.log(`✅ CloudFront invalidation created: ${result.Invalidation.Id}`);
            return result;
        } catch (error) {
            console.error('❌ CloudFront invalidation failed:', error.message);
            throw error;
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                s3Bucket: this.options.s3.bucket,
                cloudfrontDistribution: this.options.cloudfront.distributionId,
                buildDir: this.options.buildDir,
                assetPath: this.options.assetPath
            },
            deployment: {
                totalFiles: this.deployedAssets.length + this.failedAssets.length,
                successfulUploads: this.deployedAssets.length,
                failedUploads: this.failedAssets.length,
                successRate: ((this.deployedAssets.length / (this.deployedAssets.length + this.failedAssets.length)) * 100).toFixed(2)
            },
            assets: this.deployedAssets,
            failures: this.failedAssets
        };

        const reportPath = `cdn-deployment-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📋 Deployment report saved to: ${reportPath}`);

        return report;
    }

    // Utility methods
    async listDeployedAssets() {
        if (!this.options.s3.bucket) {return [];}

        const params = {
            Bucket: this.options.s3.bucket,
            Prefix: this.options.assetPath
        };

        try {
            const result = await this.s3.listObjectsV2(params).promise();
            return result.Contents || [];
        } catch (error) {
            console.error('Failed to list deployed assets:', error);
            return [];
        }
    }

    async deleteOldAssets(maxAgeHours = 24) {
        const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));

        const assets = await this.listDeployedAssets();
        const oldAssets = assets.filter(asset => new Date(asset.LastModified) < cutoffTime);

        if (oldAssets.length === 0) {
            console.log('No old assets to delete');
            return;
        }

        console.log(`Deleting ${oldAssets.length} old assets...`);

        const deleteParams = {
            Bucket: this.options.s3.bucket,
            Delete: {
                Objects: oldAssets.map(asset => ({ Key: asset.Key })),
                Quiet: false
            }
        };

        try {
            await this.s3.deleteObjects(deleteParams).promise();
            console.log(`✅ Deleted ${oldAssets.length} old assets`);
        } catch (error) {
            console.error('Failed to delete old assets:', error);
        }
    }

    static getCDNConfigurationTemplate() {
        return {
            aws: {
                region: 'us-east-1'
            },
            s3: {
                bucket: 'your-cdn-bucket-name',
                region: 'us-east-1'
            },
            cloudfront: {
                distributionId: 'YOUR_CLOUDFRONT_DISTRIBUTION_ID',
                originPath: '/'
            },
            cacheControl: {
                'default': 'public, max-age=31536000, immutable',
                'html': 'public, max-age=3600',
                'manifest': 'public, max-age=300'
            }
        };
    }
}

module.exports = CDNDeployer;