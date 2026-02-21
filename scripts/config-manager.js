#!/usr/bin/env node

/**
 * TalentSphere Configuration Management Script
 * Manages environment variables, validation, and configuration generation
 */

const fs = require('fs');
const path = require('path');
const { validateServiceConfig, generateEnvTemplate, validateAllServices } = require('../services/shared/config-validator');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
    colorLog('\n' + '='.repeat(60), 'cyan');
    colorLog(`  ${title}`, 'cyan');
    colorLog('='.repeat(60), 'cyan');
}

function printUsage() {
    colorLog('\nTalentSphere Configuration Management Script', 'blue');
    colorLog('='.repeat(50), 'blue');
    console.log('\nUsage: node config-manager.js [command] [options]\n');
    console.log('Commands:');
    console.log('  validate <service>     Validate configuration for a specific service');
    console.log('  validate-all           Validate configuration for all services');
    console.log('  generate <service>      Generate .env template for a service');
    console.log('  generate-all           Generate .env templates for all services');
    console.log('  check-env <env>        Check if environment file exists and is valid');
    console.log('  create-env <env>       Create environment file from template');
    console.log('  list-services          List all available services');
    console.log('  audit                  Audit environment variables for security issues');
    console.log('  help                   Show this help message\n');
    console.log('Examples:');
    console.log('  node config-manager.js validate analytics-service');
    console.log('  node config-manager.js generate-all');
    console.log('  node config-manager.js check-env development');
    console.log('  node config-manager.js create-env staging');
}

function listServices() {
    printHeader('Available Services');

    const servicesDir = path.join(__dirname, '../services');
    const services = fs.readdirSync(servicesDir)
        .filter(item => fs.statSync(path.join(servicesDir, item)).isDirectory())
        .filter(item => !item.startsWith('.') && item !== 'shared');

    services.forEach((service, index) => {
        colorLog(`  ${index + 1}. ${service}`, 'green');
    });

    colorLog(`\nTotal services: ${services.length}`, 'blue');
}

function loadEnvironmentFile(envName) {
    const envFile = path.join(__dirname, '..', `.env.${envName}`);

    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const lines = envContent.split('\n');

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });

        return true;
    }

    return false;
}

function validateService(serviceName, envName = null) {
    printHeader(`Validating Configuration for ${serviceName}`);

    // Load environment file if specified
    if (envName) {
        const loaded = loadEnvironmentFile(envName);
        if (loaded) {
            colorLog(`✅ Loaded environment file: .env.${envName}`, 'green');
        } else {
            colorLog(`⚠️  Environment file .env.${envName} not found, using system environment`, 'yellow');
        }
    }

    try {
        const result = validateServiceConfig(serviceName);

        if (result.isValid) {
            colorLog('✅ Configuration is valid!', 'green');
        } else {
            colorLog('❌ Configuration has errors:', 'red');
            result.errors.forEach((error, index) => {
                colorLog(`  ${index + 1}. ${error.key}: ${error.message}`, 'red');
                if (error.value !== undefined) {
                    colorLog(`     Current value: ${JSON.stringify(error.value)}`, 'yellow');
                }
            });
        }

        if (result.warnings.length > 0) {
            colorLog('\n⚠️  Warnings:', 'yellow');
            result.warnings.forEach((warning, index) => {
                colorLog(`  ${index + 1}. ${warning.key}: ${warning.message}`, 'yellow');
            });
        }

        // Print configuration summary
        colorLog('\n📊 Configuration Summary:', 'blue');
        const summary = result.summary;
        console.log(`  Environment: ${summary.environment}`);
        console.log(`  Port: ${summary.port}`);
        console.log(`  Database: ${summary.database.host}:${summary.database.port}/${summary.database.name}`);
        console.log(`  SSL Enabled: ${summary.database.ssl}`);
        console.log(`  Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);

    } catch (error) {
        colorLog(`❌ Error validating service: ${error.message}`, 'red');
        process.exit(1);
    }
}

function validateAll() {
    printHeader('Validating All Services');

    // Default to development environment for validation
    loadEnvironmentFile('development');

    try {
        const results = validateAllServices();
        let totalErrors = 0;
        let totalWarnings = 0;
        let validServices = 0;

        Object.entries(results).forEach(([serviceName, result]) => {
            console.log(`\n${serviceName}:`);

            if (result.isValid) {
                colorLog('  ✅ Valid', 'green');
                validServices++;
            } else {
                colorLog(`  ❌ ${result.errors.length} errors`, 'red');
                totalErrors += result.errors.length;
            }

            if (result.warnings.length > 0) {
                colorLog(`  ⚠️  ${result.warnings.length} warnings`, 'yellow');
                totalWarnings += result.warnings.length;
            }
        });

        printHeader('Validation Summary');
        colorLog(`Total Services: ${Object.keys(results).length}`, 'blue');
        colorLog(`Valid Services: ${validServices}`, 'green');
        colorLog(`Total Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
        colorLog(`Total Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');

        if (totalErrors > 0) {
            process.exit(1);
        }

    } catch (error) {
        colorLog(`❌ Error validating all services: ${error.message}`, 'red');
        process.exit(1);
    }
}

function generateTemplate(serviceName) {
    printHeader(`Generating .env Template for ${serviceName}`);

    try {
        const template = generateEnvTemplate(serviceName);
        const fileName = `.env.${serviceName}.template`;
        const filePath = path.join(__dirname, '..', fileName);

        fs.writeFileSync(filePath, template);
        colorLog(`✅ Template generated: ${fileName}`, 'green');

    } catch (error) {
        colorLog(`❌ Error generating template: ${error.message}`, 'red');
        process.exit(1);
    }
}

function generateAllTemplates() {
    printHeader('Generating All Service Templates');

    try {
        const servicesDir = path.join(__dirname, '../services');
        const services = fs.readdirSync(servicesDir)
            .filter(item => fs.statSync(path.join(servicesDir, item)).isDirectory())
            .filter(item => !item.startsWith('.') && item !== 'shared');

        services.forEach(serviceName => {
            generateTemplate(serviceName);
        });

        colorLog(`✅ Generated templates for ${services.length} services`, 'green');

    } catch (error) {
        colorLog(`❌ Error generating templates: ${error.message}`, 'red');
        process.exit(1);
    }
}

function checkEnvironment(envName) {
    printHeader(`Checking ${envName} Environment`);

    const envFile = path.join(__dirname, '..', `.env.${envName}`);

    if (!fs.existsSync(envFile)) {
        colorLog(`❌ Environment file .env.${envName} does not exist`, 'red');
        colorLog(`💡 Use 'node config-manager.js create-env ${envName}' to create it`, 'yellow');
        return;
    }

    try {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const variables = {};

        lines.forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                variables[key.trim()] = valueParts.join('=').trim();
            }
        });

        colorLog(`✅ Environment file found with ${Object.keys(variables).length} variables`, 'green');

        // Check for common issues
        const issues = [];

        Object.entries(variables).forEach(([key, value]) => {
            if (value.includes('CHANGE_ME')) {
                issues.push(`${key}: Contains placeholder value`);
            }
            if (key.includes('PASSWORD') && value.length < 8) {
                issues.push(`${key}: Password is too short`);
            }
            if (key.includes('SECRET') && value.length < 16) {
                issues.push(`${key}: Secret is too short`);
            }
        });

        if (issues.length > 0) {
            colorLog('\n⚠️  Security Issues Found:', 'yellow');
            issues.forEach(issue => colorLog(`  - ${issue}`, 'yellow'));
        } else {
            colorLog('✅ No obvious security issues found', 'green');
        }

    } catch (error) {
        colorLog(`❌ Error reading environment file: ${error.message}`, 'red');
        process.exit(1);
    }
}

function createEnvironment(envName) {
    printHeader(`Creating ${envName} Environment File`);

    const templateFile = path.join(__dirname, '..', `.env.${envName}.example`);
    const envFile = path.join(__dirname, '..', `.env.${envName}`);

    if (fs.existsSync(envFile)) {
        colorLog(`❌ Environment file .env.${envName} already exists`, 'red');
        return;
    }

    if (!fs.existsSync(templateFile)) {
        colorLog(`❌ Template file .env.${envName}.example does not exist`, 'red');
        return;
    }

    try {
        const templateContent = fs.readFileSync(templateFile, 'utf8');
        fs.writeFileSync(envFile, templateContent);
        colorLog(`✅ Environment file created: .env.${envName}`, 'green');
        colorLog(`💡 Please update the values in .env.${envName} with your actual configuration`, 'yellow');

    } catch (error) {
        colorLog(`❌ Error creating environment file: ${error.message}`, 'red');
        process.exit(1);
    }
}

function auditEnvironment() {
    printHeader('Security Audit');

    const envFiles = ['.env.development', '.env.staging', '.env.production']
        .filter(envFile => fs.existsSync(path.join(__dirname, '..', envFile)));

    if (envFiles.length === 0) {
        colorLog('❌ No environment files found', 'red');
        return;
    }

    envFiles.forEach(envFile => {
        console.log(`\nAuditing ${envFile}:`);
        colorLog('-'.repeat(40), 'cyan');

        try {
            const filePath = path.join(__dirname, '..', envFile);
            const content = fs.readFileSync(filePath, 'utf8');

            const issues = [];
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const trimmedLine = line.trim();

                if (trimmedLine.startsWith('#') || !trimmedLine) {return;}

                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=');

                // Security checks
                if (value.includes('CHANGE_ME')) {
                    issues.push(`Line ${index + 1}: ${key} - Contains placeholder`);
                }

                if (value.includes('password') || value.includes('secret') || value.includes('key')) {
                    if (value.length < 16) {
                        issues.push(`Line ${index + 1}: ${key} - Too short for security`);
                    }
                }

                if (value === 'true' || value === 'false') {
                    if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
                        issues.push(`Line ${index + 1}: ${key} - Boolean value for security field`);
                    }
                }
            });

            if (issues.length === 0) {
                colorLog('✅ No security issues found', 'green');
            } else {
                colorLog(`⚠️  ${issues.length} potential security issues:`, 'yellow');
                issues.forEach(issue => colorLog(`  - ${issue}`, 'yellow'));
            }

        } catch (error) {
            colorLog(`❌ Error auditing ${envFile}: ${error.message}`, 'red');
        }
    });
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        printUsage();
        return;
    }

    switch (command) {
        case 'list-services':
            listServices();
            break;

        case 'validate':
            if (!args[1]) {
                colorLog('❌ Service name is required', 'red');
                printUsage();
                process.exit(1);
            }
            const envName = args[2] || 'development';
            validateService(args[1], envName);
            break;

        case 'validate-all':
            validateAll();
            break;

        case 'generate':
            if (!args[1]) {
                colorLog('❌ Service name is required', 'red');
                printUsage();
                process.exit(1);
            }
            generateTemplate(args[1]);
            break;

        case 'generate-all':
            generateAllTemplates();
            break;

        case 'check-env':
            if (!args[1]) {
                colorLog('❌ Environment name is required', 'red');
                printUsage();
                process.exit(1);
            }
            checkEnvironment(args[1]);
            break;

        case 'create-env':
            if (!args[1]) {
                colorLog('❌ Environment name is required', 'red');
                printUsage();
                process.exit(1);
            }
            createEnvironment(args[1]);
            break;

        case 'audit':
            auditEnvironment();
            break;

        default:
            colorLog(`❌ Unknown command: ${command}`, 'red');
            printUsage();
            process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    validateService,
    validateAll,
    generateTemplate,
    generateAllTemplates,
    checkEnvironment,
    createEnvironment,
    auditEnvironment,
    listServices
};