#!/usr/bin/env node
/**
 * Simple Project Structure Validation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting TalentSphere project validation...\n');

// Validate core project structure
const rootDir = path.join(__dirname, '../');
const servicesDir = path.join(rootDir, 'services');
const issues = [];

// Check services directory
const requiredServices = [
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

for (const service of requiredServices) {
    const servicePath = path.join(servicesDir, service);
    
    if (!fs.existsSync(servicePath)) {
        issues.push(`❌ Missing service directory: ${service}`);
        continue;
    }
    
    // Check package.json
    const packagePath = path.join(servicePath, 'package.json');
    if (!fs.existsSync(packagePath)) {
        issues.push(`❌ Missing package.json in ${service}`);
        continue;
    }
    
    // Check server.js
    const serverPath = path.join(servicePath, 'server.js');
    if (!fs.existsSync(serverPath)) {
        issues.push(`❌ Missing server.js in ${service}`);
    }
    
    // Check tests directory
    const testDir = path.join(servicePath, 'tests');
    if (fs.existsSync(testDir)) {
        const testSubdirs = ['unit', 'integration'];
        for (const subdir of testSubdirs) {
            const subPath = path.join(testDir, subdir);
            if (!fs.existsSync(subPath)) {
                issues.push(`⚠️  Missing test subdirectory: ${service}/tests/${subdir}`);
            }
        }
    }
}

// Validate documentation
const docsDir = path.join(rootDir, 'docs');
if (fs.existsSync(docsDir)) {
    const requiredDocs = ['README.md', 'API_REFERENCE.md', 'CHANGELOG.md'];
    for (const doc of requiredDocs) {
        const docPath = path.join(docsDir, doc);
        if (!fs.existsSync(docPath)) {
            issues.push(`⚠️  Missing documentation: ${doc}`);
        }
    }
}

// Generate report
console.log('\n📊 VALIDATION RESULTS:');
console.log('====================');

if (issues.length === 0) {
    console.log('✅ All checks passed! Project structure is consistent.');
} else {
    console.log(`Found ${issues.length} issues:`);
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
    });
}

// Save validation report
const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    issues: issues,
    servicesChecked: requiredServices.length
};

fs.writeFileSync(
    path.join(rootDir, 'validation-report.json'),
    JSON.stringify(report, null, 2)
);

console.log('\n📁 Detailed report saved to: validation-report.json');
console.log('✅ Validation complete!');