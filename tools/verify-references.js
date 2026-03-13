const fs = require('fs');
const path = require('path');

const ssotPath = path.join(__dirname, '..', 'docs', 'SSOT.md');
console.log('Verifying all internal references in SSOT.md...');

try {
    const content = fs.readFileSync(ssotPath, 'utf8');
    let errors = 0;

    // 1. Extract all generated heading anchors
    // GitHub markdown creates anchors by lowercasing, replacing spaces with hyphens, removing punctuation
    const anchors = new Set();
    const headingsRegex = /^(#+)\s+(.+)$/gm;
    let match;

    while ((match = headingsRegex.exec(content)) !== null) {
        let headingText = match[2];

        // GitHub markdown anchor generation rules
        let anchor = headingText.toLowerCase();
        // Remove punctuation
        anchor = anchor.replace(/[^\w\s-]/g, '');
        // Replace spaces with hyphens
        anchor = anchor.replace(/\s+/g, '-');

        anchors.add(anchor);
    }

    // Add the explicit anchors that might be in the text (like <a name="something"></a>)
    const explicitAnchorRegex = /<a\s+name=["']([^"']+)["']\s*>/g;
    while ((match = explicitAnchorRegex.exec(content)) !== null) {
        anchors.add(match[1]);
    }

    console.log(`Discovered ${anchors.size} valid anchors in the document.`);

    // 2. Extract all markdown links and find internal ones
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    let lineNum = 1;
    const internalLinks = [];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        while ((linkMatch = linkRegex.exec(line)) !== null) {
            if (linkMatch[2].startsWith('#')) {
                internalLinks.push({
                    text: linkMatch[1],
                    target: linkMatch[2].substring(1), // strip the #
                    line: index + 1
                });
            }
        }
    });

    console.log(`Found ${internalLinks.length} internal links to verify.`);

    // 3. Verify all internal links point to valid anchors
    internalLinks.forEach(link => {
        if (!anchors.has(link.target)) {
            console.error(`❌ Broken reference at line ${link.line}: [${link.text}](#${link.target})`);
            errors++;
        }
    });

    if (errors > 0) {
        console.error(`\nValidation failed: ${errors} broken internal reference(s) found.`);
        process.exit(1);
    } else {
        console.log('✅ All internal references and anchors are valid.');
        process.exit(0);
    }

} catch (e) {
    console.error('Failed to verify references in SSOT.md:', e.message);
    process.exit(1);
}
