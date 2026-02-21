#!/usr/bin/env node
/**
 * Project Structure Validation Script
 * Ensures consistency across TalentSphere project
 */

const fs = require('fs');
const path = require('path');

class ProjectValidator {
    constructor() {
        this.rootDir = path.join(__dirname, '../');
        this.servicesDir = path.join(this.rootDir, 'services');
        this.issues = [];
        this.fixes = [];
    }

    async validate() {
        console.log('🔍 Starting TalentSphere project validation...\n');
        
        await this.validateServiceStructures();
        await this.validatePackageConsistency();
        await this.validateImportPaths();
        await this.validateDocumentation();
        await this.validateConfiguration();
        
        this.generateReport();
        this.applyFixes();
        
        console.log('✅ Project validation complete!');
    }

    async validateServiceStructures() {
        console.log('📁 Validating service structures...');
        
        const requiredServiceDirs = [
            'analytics-service',
            'file-service', 
            'log-aggregator-service',
            'messaging-service',
            'notification-service',
            'performance-monitoring',
            'recruitment-service',
            'search-service',
            'shared',
            'video-service'
        ];

        for (const serviceDir of requiredServiceDirs) {
            const servicePath = path.join(this.servicesDir, serviceDir);
            
            if (!fs.existsSync(servicePath)) {
                this.addIssue(`Missing service directory: ${serviceDir}`, 'critical');
            } else {
                // Check for required files
                const requiredFiles = ['package.json', 'server.js'];
                for (const file of requiredFiles) {
                    const filePath = path.join(servicePath, file);
                    if (!fs.existsSync(filePath)) {
                        this.addIssue(`Missing ${file} in ${serviceDir}`, 'high');
                    }
                }
                
                // Check for test directory
                const testDir = path.join(servicePath, 'tests');
                if (fs.existsSync(testDir)) {
                    const testSubdirs = ['unit', 'integration'];
                    for (const subdir of testSubdirs) {
                        const subPath = path.join(testDir, subdir);
                        if (!fs.existsSync(subPath)) {
                            this.addIssue(`Missing test subdirectory: ${serviceDir}/tests/${subdir}`, 'medium');
                        }
                    }
                }
            }
        }
    }

    async validatePackageConsistency() {
        console.log('📦 Validating package.json consistency...');
        
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

    validateSinglePackage(serviceName, packageJson, template) {
        const issues = [];
        
        // Check required fields
        const requiredFields = ['name', 'version', 'description', 'scripts'];
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
        
        // Check dependency versions for consistency
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
            this.addFix(`Fix ${serviceName} package.json`, () => this.fixPackageJson(serviceName, issues));
        }
    }

    async validateImportPaths() {
        console.log('🔗 Validating import paths...');
        
        // Check for common import path issues
        const serviceFiles = this.findJavaScriptFiles(this.servicesDir);
        
        for (const file of serviceFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for broken relative imports
                const importMatches = content.match(/require\(['"][\.\/\.\.\/.*?['"])/g);
                if (importMatches) {
                    for (const match of importMatches) {
                        const importPath = match[1];
                        if (importPath.includes('../shared/')) {
                            this.addIssue(`Relative shared import in ${file}: ${importPath}`, 'medium');
                        }
                        
                        if (importPath.includes('../../../shared/')) {
                            this.addIssue(`Deep relative shared import in ${file}: ${importPath}`, 'medium');
                        }
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
    }

    async validateDocumentation() {
        console.log('📚 Validating documentation...');
        
        const docsDir = path.join(this.rootDir, 'docs');
        if (!fs.existsSync(docsDir)) {
            this.addIssue('Missing docs directory', 'medium');
            return;
        }
        
        const requiredDocs = [
            'README.md',
            'API_REFERENCE.md',
            'CHANGELOG.md',
            'DEVELOPMENT.md',
            'OPERATIONS.md'
        ];
        
        for (const doc of requiredDocs) {
            const docPath = path.join(docsDir, doc);
            if (!fs.existsSync(docPath)) {
                this.addIssue(`Missing documentation: ${doc}`, 'medium');
            }
        }
    }

    async validateConfiguration() {
        console.log('⚙️ Validating configuration...');
        
        const configDir = path.join(this.rootDir, 'config');
        if (!fs.existsSync(configDir)) {
            this.addIssue('Missing config directory', 'high');
            return;
        }
        
        const requiredConfigs = ['.env.example', '.env.cors', '.env.database'];
        for (const config of requiredConfigs) {
            const configPath = path.join(configDir, config);
            if (!fs.existsSync(configPath)) {
                this.addIssue(`Missing config file: ${config}`, 'medium');
            }
        }
    }

    getServices() {
        const services = [];
        const serviceNames = fs.readdirSync(this.servicesDir);
        
        for (const serviceName of serviceNames) {
            const servicePath = path.join(this.servicesDir, serviceName);
            
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

    findJavaScriptFiles(dir, files = []) {
        if (!fs.existsSync(dir)) return files;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                this.findJavaScriptFiles(itemPath, files);
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
                "uuid": "^9.0.1"
            },
            scripts: {
                "start": "node server.js",
                "dev": "nodemon server.js", 
                "test": "jest",
                "test:unit": "jest --testPathPattern=unit",
                "test:integration": "jest --testPathPattern=integration",
                "test:coverage": "jest --coverage",
                "lint": "eslint . --ext .js"
            },
            engines: {
                "node": ">=18.0.0",
                "npm": ">=9.0.0"
            }
        };
    }

    fixPackageJson(serviceName, issues) {
        const packagePath = path.join(this.servicesDir, serviceName, 'package.json');
        
        if (!fs.existsSync(packagePath)) {
            return;
        }
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Auto-fix common issues
            if (issues.some(issue => issue.includes('Missing required script'))) {
                packageJson.scripts = packageJson.scripts || {};
                const requiredScripts = ['start', 'dev', 'test', 'lint'];
                for (const script of requiredScripts) {
                    if (!packageJson.scripts[script]) {
                        if (script === 'test') {
                            packageJson.scripts.test = 'jest';
                        } else if (script === 'lint') {
                            packageJson.scripts.lint = 'eslint . --ext .js';
                        } else {
                            packageJson.scripts[script] = `node ${script}.js`;
                        }
                    }
                }
            }
            
            // Add missing engines field
            if (issues.some(issue => issue.includes('Missing engines field'))) {
                packageJson.engines = {
                    "node": ">=18.0.0",
                    "npm": ">=9.0.0"
                };
            }
            
            // Standardize dependencies
            if (packageJson.dependencies) {
                const template = this.getPackageTemplate();
                for (const [dep, version] of Object.entries(template.dependencies)) {
                    if (packageJson.dependencies[dep]) {
                        packageJson.dependencies[dep] = version;
                    }
                }
            }
            
            fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
            
        } catch (error) {
            console.error(`Error fixing ${serviceName} package.json:`, error.message);
        }
    }

    addIssue(message, severity = 'medium') {
        this.issues.push({ message, severity, timestamp: new Date().toISOString() });
    }

    addFix(description, fixFunction) {
        this.fixes.push({ description, fixFunction, timestamp: new Date().toISOString() });
    }

    generateReport() {
        console.log('\n📊 VALIDATION REPORT');
        console.log('=====================\n');
        
        if (this.issues.length === 0) {
            console.log('✅ No issues found!');
        } else {
            console.log(`Found ${this.issues.length} issues:`);
            this.issues.forEach((issue, index) => {
                const icon = issue.severity === 'critical' ? '🚨' : 
                           issue.severity === 'high' ? '🔴' : 
                           issue.severity === 'medium' ? '🟡' : '🟡';
                console.log(`${index + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
            });
        }
        
        if (this.fixes.length > 0) {
            console.log(`\n🔧 ${this.fixes.length} auto-fixes available:`);
            this.fixes.forEach((fix, index) => {
                console.log(`${index + 1}. ${fix.description}`);
            });
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            issues: this.issues,
            fixes: this.fixes,
            summary: {
                totalIssues: this.issues.length,
                critical: this.issues.filter(i => i.severity === 'critical').length,
                high: this.issues.filter(i => i.severity === 'high').length,
                medium: this.issues.filter(i => i.severity === 'medium').length,
                totalFixes: this.fixes.length
            }
        };
        
        fs.writeFileSync(
            path.join(this.rootDir, 'validation-report.json'),
            JSON.stringify(report, null, 2)
        );
    }

    async applyFixes() {
        console.log('\n🔧 Applying auto-fixes...');
        
        for (const fix of this.fixes) {
            try {
                await fix.fixFunction();
                console.log(`✅ Applied: ${fix.description}`);
            } catch (error) {
                console.error(`❌ Failed to apply ${fix.description}:`, error.message);
            }
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ProjectValidator();
    validator.validate().catch(console.error);
}

module.exports = ProjectValidator;