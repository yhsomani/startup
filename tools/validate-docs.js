const fs = require('fs');
const path = require('path');

const ssotPath = path.join(__dirname, '..', 'docs', 'SSOT.md');

console.log('Validating SSOT.md markdown structure...');

try {
    const content = fs.readFileSync(ssotPath, 'utf8');
    let errors = 0;

    // 1. Check metadata (Version and Last Updated)
    if (!content.match(/\*\*Version\b.*\*\*/i)) {
        console.error('❌ Missing or invalid Version metadata in SSOT.md');
        errors++;
    }
    if (!content.match(/\*\*Last Updated:\s.*\*\*/i)) {
        console.error('❌ Missing or invalid Last Updated metadata in SSOT.md');
        errors++;
    }

    // 2. Check heading hierarchy (no skipping from H1 to H3 or similar)
    const lines = content.split('\n');
    let previousLevel = 0;
    let insideCodeBlock = false;

    lines.forEach((line, index) => {
        // Track code blocks to ignore markdown inside them
        if (line.trim().startsWith('```')) {
            insideCodeBlock = !insideCodeBlock;
            return;
        }

        if (!insideCodeBlock && line.trim().startsWith('#')) {
            const match = line.match(/^(#+)\s+/);
            if (match) {
                const currentLevel = match[1].length;
                if (previousLevel > 0 && currentLevel > previousLevel + 1) {
                    console.error(`❌ Heading hierarchy violation at line ${index + 1}: Skipped from H${previousLevel} to H${currentLevel}`);
                    console.error(`   "${line.trim()}"`);
                    errors++;
                }
                previousLevel = currentLevel;
            }
        }
    });

    // 3. Check for unclosed code blocks
    if (insideCodeBlock) {
        console.error('❌ Found unclosed markdown code block (```)');
        errors++;
    }

    if (errors > 0) {
        console.error(`\nValidation failed with ${errors} error(s).`);
        process.exit(1);
    } else {
        console.log('✅ SSOT.md syntax and structure validation passed.');
        process.exit(0);
    }

} catch (e) {
    console.error('Failed to read SSOT.md:', e.message);
    process.exit(1);
}
