const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const ssotPath = path.join(rootPath, 'docs', 'SSOT.md');

console.log('Validating microservice coverage in SSOT.md...');

try {
    const ssotContent = fs.readFileSync(ssotPath, 'utf8');
    let errors = 0;

    // Directories where microservices reside
    const searchDirs = [
        path.join(rootPath, 'backends', 'backend-enhanced'),
        path.join(rootPath, 'spring-boot'),
        path.join(rootPath, 'services')
    ];

    const actualServices = new Set();
    const ignoreList = ['shared', 'test', 'common', 'database', 'helm', 'k8s', 'monitoring', 'mock-api'];

    // 1. Gather actual service names from filesystem
    searchDirs.forEach(dir => {
        if (!fs.existsSync(dir)) return;

        const contents = fs.readdirSync(dir, { withFileTypes: true });
        contents.forEach(item => {
            if (item.isDirectory() && item.name.endsWith('-service') && !ignoreList.includes(item.name)) {
                actualServices.add(item.name);
            }
            if (item.isDirectory() && item.name === 'api-gateway') {
                actualServices.add(item.name);
            }
        });
    });

    console.log(`Discovered ${actualServices.size} actual services across backend directories.`);

    // 2. Check if each discovered service is mentioned in SSOT.md
    // We'll look for exact matches of the directory name in the text
    const undocumentedServices = [];

    for (const service of actualServices.values()) {
        // Check if the service name exists anywhere in the SSOT
        // We do a simple indexOf, but one could make this stricter (e.g., must be in Section 6)
        if (!ssotContent.includes(service)) {
            undocumentedServices.push(service);
            errors++;
        }
    }

    if (undocumentedServices.length > 0) {
        console.error(`❌ Undocumented Services Found. The following services exist in the codebase but are missing from SSOT.md:`);
        undocumentedServices.forEach(svc => console.error(`   - ${svc}`));
        console.error(`Please add them to the Service Catalog in SSOT.md.`);
    }

    if (errors > 0) {
        console.error(`\nValidation failed: ${errors} service(s) are undocumented.`);
        process.exit(1);
    } else {
        console.log('✅ SSOT.md includes all discovered backend services.');
        process.exit(0);
    }

} catch (e) {
    console.error('Failed to validate coverage in SSOT.md:', e.message);
    process.exit(1);
}
