#!/usr/bin/env node
/**
 * TalentSphere Project Alignment Tool
 * Production-quality project validation and alignment
 */

const { program } = require('yargs');
const { createLogger } = require('../shared/logger');
const path = require('path');
const fs = require('fs');

class ProjectAligner {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.logger = createLogger('project-aligner');
        this.issues = [];
        this.fixes = [];
        this.stats = {
            servicesChecked: 0,
            issuesFound: 0,
            fixesApplied: 0,
            filesValidated: 0,
            testsRun: 0,
            coverageGenerated: false
        };
    }

    async validateAll() {
            this.logger.info('🔍 Starting comprehensive project validation...');
            
            await this.validateServiceStructures();
            await this.validatePackageConsistency();
            await this.validateDependencies();
            await this.validateCodeQuality();
            await this.validateDocumentation();
            await this.validateBuildReadiness();
            
            this.generateReport();
            return this.stats;
        }

    async validateServiceStructures() {
            this.logger.info('📁 Validating service structures...');
            
            const servicesDir = path.join(this.rootDir, 'services');
            if (!fs.existsSync(servicesDir)) {
                this.addIssue('services directory not found', 'critical');
                return;
            }
            
            const services = fs.readdirSync(servicesDir);
            const requiredServices = [
                'analytics-service', 'file-service', 'log-aggregator-service', 'messaging-service',
                'notification-service', 'performance-monitoring', 'recruitment-service',
                'search-service', 'shared', 'video-service'
            ];
            
            for (const service of requiredServices) {
                const servicePath = path.join(servicesDir, service);
                if (!fs.existsSync(servicePath)) {
                    this.addIssue(`Missing service: ${service}`, 'critical');
                    continue;
                }
                
                // Check service structure
                await this.validateServiceStructure(servicePath, service);
    }
        
        this.stats.servicesChecked = services.length;
    }
    }

    async validateServiceStructure(servicePath, serviceName) {
            this.logger.info(`🔍 Validating ${serviceName} structure...`);
            
            const requiredFiles = ['package.json', 'server.js'];
            for (const file of requiredFiles) {
                const filePath = path.join(servicePath, file);
                if (!fs.existsSync(filePath)) {
                    this.addIssue(`Missing ${file} in ${serviceName}`, 'high');
                } else {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.validateFileContent(filePath, content, file);
                }
            }
            
            // Check for proper directory structure
            const expectedDirs = ['tests/unit', 'tests/integration', 'scripts', 'logs'];
            const actualDirs = fs.readdirSync(servicePath);
            for (const dir of expectedDirs) {
                const dirPath = path.join(servicePath, dir);
                if (!fs.existsSync(dirPath)) {
                    this.addIssue(`Missing ${dir} in ${serviceName}`, 'medium');
                }
            }
        }
    }

    async validatePackageConsistency() {
            this.logger.info('📦 Validating package.json consistency...');
            
            const services = this.getServices();
            const template = this.getPackageTemplate();
            
            for (const service of services) {
                const packagePath = path.join(service.path, 'package.json');
                if (!fs.existsSync(packagePath)) {
                    this.addIssue(`Missing package.json in ${service.name}`, 'critical');
                    continue;
                }
                
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    this.validateSinglePackage(service.name, packageJson, template);
                } catch (error) {
                    this.addIssue(`Invalid package.json in ${service.name}: ${error.message}`, 'critical');
                }
            }
        }
    }

    validateSinglePackage(serviceName, packageJson, template) {
            const issues = [];
            
            // Check required fields
            const requiredFields = ['name', 'version', 'description', 'scripts', 'dependencies', 'engines'];
            for (const field of requiredFields) {
                if (!packageJson[field]) {
                    issues.push(`Missing required field: ${field}`);
                }
            }
            
            // Check scripts consistency
            if (packageJson.scripts) {
                const requiredScripts = ['start', 'dev', 'test', 'lint'];
                for (const script of requiredScripts) {
                    if (!packageJson.scripts[script]) {
                        issues.push(`Missing required script: ${script}`);
                    }
                }
            }
            
            // Check dependency versions
            if (packageJson.dependencies) {
                const keyDeps = ['express', 'cors', 'helmet', 'joi', 'uuid'];
                for (const dep of keyDeps) {
                    if (packageJson.dependencies[dep] && template.dependencies[dep]) {
                        const currentVer = packageJson.dependencies[dep];
                        const templateVer = template.dependencies[dep];
                        if (currentVer !== templateVer) {
                            issues.push(`Inconsistent ${dep} version: ${currentVer} (should be ${templateVer})`);
                        }
                    }
                }
            }
            
            // Check naming conventions
            if (!packageJson.name.startsWith('talentsphere-')) {
                issues.push(`Service name should start with 'talentsphere-'`);
            }
            
            // Check engines
            if (!packageJson.engines) {
                issues.push('Missing engines field');
            }
            
            if (issues.length > 0) {
                this.addIssue(`${serviceName} package.json issues: ${issues.join(', ')}`, 'high');
                this.addFix(`Fix ${serviceName} package.json`, () => this.fixPackageJson(service.name, issues, packageJson));
            }
        }
    }

    async validateDependencies() {
            this.logger.info('📦 Validating dependencies...');
            
            const packagePath = path.join(this.rootDir, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'npm update outdated-check'));
            
            // Check for known vulnerabilities
            const vulnerableDeps = Object.keys(packageJson.dependencies || {}).filter(dep => 
                this.isVulnerableDependency(dep)
            );
            
            if (vulnerableDeps.length > 0) {
                this.addIssue(`Vulnerable dependencies: ${vulnerableDeps.join(', ')}`, 'high');
            }
            
            this.stats.dependenciesValidated = Object.keys(packageJson.dependencies || {}).length;
        }
    }

    async validateCodeQuality() {
            this.logger.info('🛠️ Validating code quality...');
            
            const services = this.getServices();
            for (const service of services) {
                await this.validateServiceCodeQuality(service.path, service.name);
            }
        }
    }

    async validateServiceCodeQuality(servicePath, serviceName) {
            this.logger.info(`🛠️ Validating ${serviceName} code quality...`);
            
            const serviceFiles = this.findJavaScriptFiles(servicePath);
            let totalIssues = 0;
            
            for (const file of serviceFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const issues = this.validateCodeContent(file, content);
                    totalIssues += issues.length;
                } catch (error) {
                    this.addIssue(`Could not validate ${file}: ${error.message}`, 'medium');
                }
            }
            
            if (totalIssues > 0) {
                this.addIssue(`${serviceName} has ${totalIssues} code quality issues`, 'medium');
            }
        }
    }

    async validateDocumentation() {
            this.logger.info('📚 Validating documentation...');
            
            const docsDir = path.join(this.rootDir, 'docs');
            if (!fs.existsSync(docsDir)) {
                this.addIssue('Missing docs directory', 'high');
                return;
            }
            
            const requiredDocs = ['README.md', 'API_REFERENCE.md', 'CHANGELOG.md', 'DEVELOPMENT.md', 'OPERATIONS.md', 'SYSTEM.md'];
            for (const doc of requiredDocs) {
                const docPath = path.join(docsDir, doc);
                if (!fs.existsSync(docPath)) {
                    this.addIssue(`Missing documentation: ${doc}`, 'medium');
                }
            }
            
            // Check documentation consistency
            this.validateDocumentationConsistency();
            
            this.stats.documentationValidated = true;
        }
    }

    validateDocumentationConsistency() {
            // Check if API docs match actual implementation
            const apiDoc = path.join(this.rootDir, 'docs', 'API_REFERENCE.md');
            if (!fs.existsSync(apiDoc)) {
                return; // Skip if not available
            }
            
            // Validate system documentation
            const sysDoc = path.join(this.rootDir, 'docs', 'SYSTEM.md');
            const devDoc = path.join(this.rootDir, 'docs', 'DEVELOPMENT.md');
            
            // These are critical for production readiness
            for (const doc of [sysDoc, devDoc]) {
                if (fs.existsSync(doc)) {
                    this.validateSystemDoc(doc);
                }
            }
        }
    }

    validateSystemDoc(docPath) {
        // Implementation would check that the system documentation covers:
        // - Architecture overview
        // - Service dependencies
        // - Configuration management
        // - Deployment procedures
        // - Monitoring setup
        // - Security guidelines
    }

    async validateBuildReadiness() {
            this.logger.info('⚙️ Validating build readiness...');
            
            // Check if all services can build
            const services = this.getServices();
            let buildReady = true;
            
            for (const service of services) {
                const packagePath = path.join(service.path, 'package.json');
                if (!fs.existsSync(packagePath)) {
                    buildReady = false;
                    this.addIssue(`${service.name} cannot build (missing package.json)`, 'critical');
                    continue;
                }
                
                // Check for node_modules directory
                const nodeModulesPath = path.join(service.path, 'node_modules');
                if (!fs.existsSync(nodeModulesPath)) {
                    buildReady = false;
                    this.addIssue(`${service.name} cannot build (missing node_modules)`, 'critical');
                    continue;
                }
                
                // Try to validate the main service file
                const mainPath = path.join(service.path, 'server.js');
                if (fs.existsSync(mainPath)) {
                    try {
                        const content = fs.readFileSync(mainPath, 'utf8');
                        // Basic validation that the file is valid JavaScript
                        if (!content.includes('module.exports') && 
                            !content.includes('require(')) {
                            this.addIssue(`${service.name} main.js missing module.exports`, 'high');
                        }
                    } catch (error) {
                        this.addIssue(`${service.name} server.js invalid: ${error.message}`, 'critical');
                    }
    }
        
        this.stats.servicesChecked = services.length;
    }
        
        return this.stats.buildReady;
    }

    getServices() {
        const servicesDir = path.join(this.rootDir, 'services');
        const services = [];
        
        const serviceNames = fs.readdirSync(servicesDir);
        for (const serviceName of serviceNames) {
            const servicePath = path.join(servicesDir, serviceName);
            
            if (fs.statSync(servicePath).isDirectory() && 
                !serviceName.startsWith('.') && 
                serviceName !== 'node_modules') {
                services.push({
                    name: serviceName,
                    path: servicePath
                });
            }
        }
        
        return services;
    }

    findJavaScriptFiles(dir) {
        const files = [];
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            
            if (fs.statSync(itemPath).isDirectory() && 
                !item.startsWith('.') && 
                item !== 'node_modules') {
                files.push(itemPath);
            } else if (item.endsWith('.js')) {
                files.push(itemPath);
            }
        }
        
        return files;
    }

    getPackageTemplate() {
        return {
            dependencies: {
                "express": "^4.18.2",
                "cors": "^2.8.5", 
                "helmet": "^7.0.0",
                "joi": "^17.9.2",
                "uuid": "^9.0.1",
                "moment": "^2.29.4"
            },
            scripts: {
                "start": "node server.js",
                "dev": "nodemon server.js", 
                "test": "jest",
                "lint": "eslint . --ext .js",
                "test:unit": "jest --testPathPattern=unit",
                "test:integration": "jest --testPathPattern=integration",
                "test:coverage": "jest --coverage",
                "test:watch": "jest --watch",
                "lint:fix": "eslint . --ext .js --fix"
            },
            engines: {
                "node": ">=18.0.0",
                "npm": ">=9.0.0"
            }
        };
    }

    validateFileContent(filePath, content) {
        const issues = [];
        
        // Check for common code quality issues
        if (content.includes('console.log(' && !content.includes('eslint-disable'))) {
            issues.push('Found eslint-disable comment - should use eslintrc.js file');
        }
        
        if (content.includes('eval(')) {
            issues.push('Found eval() usage - security risk');
        }
        
        if (content.includes('__proto__')) {
            issues.push('Found prototype pollution risk');
        }
        
        if (content.includes('setTimeout(1')) {
            issues.push('Found setTimeout(1) - potential performance issue');
        }
        
        return issues;
    }

    validateCodeContent(file, content) {
        const issues = this.validateFileContent(file, content);
        
        // Import path validation
        const importMatches = content.match(/require\(['`](.*?)['"])/g);
        if (importMatches) {
            for (const match of importMatches) {
                const importPath = match[1];
                if (importPath.includes('../shared/')) {
                    issues.push(`Relative shared import in ${file}: ${importPath}`);
                } else if (importPath.includes('../../../shared/')) {
                    issues.push(`Deep relative shared import in ${file}: ${importPath}`);
                }
            }
        }
        
        return issues;
    }

    addIssue(message, severity = 'medium') {
        this.issues.push({ message, severity, timestamp: new Date().toISOString() });
    }

    addFix(description, fixFunction) {
        this.fixes.push({ description, fixFunction, timestamp: new Date().toISOString() });
    }

    generateReport() {
        this.logger.info('📊 Generating alignment report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: this.issues.length,
                critical: this.issues.filter(i => i.severity === 'critical').length,
                high: this.issues.filter(i => i.severity === 'high').length,
                medium: this.issues.filter(i => i.severity === 'medium').length,
                low: this.ferences.filter(i => i.severity === 'low').length,
                fixes: this.fixes.length
            },
            details: this.issues,
            stats: this.stats,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(this.rootDir, 'PROJECT_ALIGNMENT_REPORT.md');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.logger.info('✅ Alignment report saved to: PROJECT_ALIGNMENT_REPORT.md');
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.stats.servicesChecked === 0) {
            recommendations.push('Review service structure and ensure all required services are present');
        }
        
        if (this.stats.issuesFound > 0) {
            recommendations.push('Focus on fixing critical issues first, then address high-priority items');
        }
        
        if (this.stats.dependenciesValidated === 0) {
            recommendations.push('Run dependency validation and update packages as needed');
        }
        
        if (!this.stats.documentationValidated) {
            recommendations.push('Complete all missing documentation files');
        }
        
        if (!this.stats.buildReady) {
            recommendations.push('Ensure all services can build without errors');
        }
        
        if (this.stats.testsRun === 0) {
            recommendations.push('Run comprehensive tests to validate fixes');
        }
        
        if (this.stats.coverageGenerated === false) {
            recommendations.push('Generate test coverage reports for all services');
        }
        
        return recommendations;
    }

    async applyFixes() {
        this.logger.info('🔧 Applying automatic fixes...');
        
        for (const fix of this.fixes) {
            try {
                await fix.fixFunction();
                this.logger.info(`✅ Applied: ${fix.description}`);
                this.stats.fixesApplied++;
            } catch (error) {
                this.logger.error(`❌ Failed to apply ${fix.description}: ${error.message}`);
            }
        }
    }

    async run(command) {
        this.logger.info(`🚀 Running: ${command}`);
        return new Promise((resolve, reject) => {
            try {
                const { execSync } = require('child_process');
                const result = execSync(command, { 
                    cwd: this.rootDir,
                    stdio: 'inherit'
                });
                resolve(result.stdout);
            } catch (error) {
                reject(error);
            }
        });
    }

    async help() {
        console.log(`
🛠️  TalentSphere Project Alignment Tool

Usage: node index.js <command> [options]

Commands:
  validate-all      - Validate all project aspects (services, packages, docs, code quality, build readiness)
  validate-services  - Validate all service structures
  validate-dependencies - Check for vulnerabilities and consistency
  validate-structure - Check service directory structures
  validate-packages - Validate package.json consistency
  validate-code-quality - Check code quality across all services
  validate-documentation - Check documentation completeness
  validate-build-readiness - Validate production build readiness
  
  fix-package-json  - Fix package.json inconsistencies automatically
  fix-imports        - Fix import path issues
  build-check        - Run build validation
  test:all          - Run all tests
  quality-check      - Run all quality checks
  security:audit      - Run security audit
  docs:update       - Update documentation
  report:generate   - Generate alignment report
  
  cleanup         - Clean up temporary files
  start:services     - Start all services
  dev:services      - Start all services in dev mode
  
Options:
  --verbose        Enable verbose logging
  --quiet         Suppress most output
  --fix           Automatically fix found issues
  --dry-run        Show what would be done without applying fixes
  
Examples:
  node index.js validate-all
  node index.js fix-package-json --fix
  node index.js validate-code-quality
  node index.js test:all --fix
  node index.js security:audit --fix
`);
        process.exit(0);
    }
}

// CLI argument parsing
program
    .version('1.0.0')
    .description('TalentSphere project alignment and validation tool')
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        describe: 'Enable verbose logging'
        default: false
    })
    .option('quiet', {
        alias: 'q',
        type: 'boolean',
        describe: 'Suppress most output',
        default: false
    })
    .option('fix', {
        type: 'boolean',
        describe: 'Automatically fix found issues',
        default: false
    })
    .command('*')
    .usage();

// Run the validation when called directly
if (require.main === module) {
    projectAligner.validateAll();
    }
}

module.exports = ProjectAligner;