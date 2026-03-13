const fs = require('fs');
const path = require('path');

const ssotPath = path.join(__dirname, '..', 'docs', 'SSOT.md');
console.log('Validating SSOT.md ports against Master Port Map...');

try {
    const content = fs.readFileSync(ssotPath, 'utf8');
    let errors = 0;

    // 1. Extract Master Service Port Map
    // Expecting format: | Service Name | 3001 | ...
    const portMapRegex = /\|\s*([^|]+)\s*\|\s*(\d{4})\s*\|\s*(\d{4})\s*\|/g;
    let inMasterTable = false;
    const masterPorts = {};

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('### Master Service Port Map')) {
            inMasterTable = true;
            continue;
        }
        if (inMasterTable && line.startsWith('## ')) {
            break; // Left master table section
        }

        if (inMasterTable) {
            const match = /\|\s*(?!Service|[-]+)([^|]+)\s*\|\s*(\d{4})\s*\|\s*(\d{4})\s*\|/.exec(line);
            if (match) {
                const serviceName = match[1].trim();
                const prodPort = match[2];
                const testPort = match[3];
                masterPorts[serviceName] = { prodPort, testPort };
            }
        }
    }

    if (Object.keys(masterPorts).length === 0) {
        console.error('❌ Failed to extract Master Service Port Map from SSOT.md.');
        process.exit(1);
    }

    console.log(`Discovered ${Object.keys(masterPorts).length} services in Master Port Map.`);

    // 2. Scan entire document for hardcoded ports, verify they match
    const masterPortNumbers = new Set();
    Object.values(masterPorts).forEach(ports => {
        masterPortNumbers.add(ports.prodPort);
        masterPortNumbers.add(ports.testPort);
    });

    // Specifically check for ports that don't match the port map context
    // This is a naive check: any 4-digit number starting with 3-9 might be a port
    const possiblePortRegex = /\b([3-9]\d{3})\b/g;
    let lineNum = 1;
    const ignoredLines = [
        /Master Service Port Map/,
        /Example:/,
        /Version History/,
        /^\|/ // We ignore table rows outside master table, assume they might be valid or we just check text
    ];

    for (const line of lines) {
        if (ignoredLines.some(regex => regex.test(line))) {
            lineNum++;
            continue;
        }

        let match;
        while ((match = possiblePortRegex.exec(line)) !== null) {
            const foundPort = match[1];
            // Only complain if it looks like a port context 
            if (line.toLowerCase().includes('port') && !masterPortNumbers.has(foundPort)) {
                console.warn(`⚠️ Warning: Found undocumented port ${foundPort} at line ${lineNum}: ${line.trim()}`);
            }
        }
        lineNum++;
    }

    // 3. Find duplicates in the master port map
    const usedProdPorts = {};
    Object.entries(masterPorts).forEach(([service, ports]) => {
        if (usedProdPorts[ports.prodPort]) {
            console.error(`❌ Port Conflict: ${service} and ${usedProdPorts[ports.prodPort]} both use prod port ${ports.prodPort}`);
            errors++;
        }
        usedProdPorts[ports.prodPort] = service;
    });

    if (errors > 0) {
        console.error(`\nValidation failed with ${errors} port conflict error(s).`);
        process.exit(1);
    } else {
        console.log('✅ SSOT.md port references and uniqueness passed.');
        process.exit(0);
    }

} catch (e) {
    console.error('Failed to validate ports in SSOT.md:', e.message);
    process.exit(1);
}
