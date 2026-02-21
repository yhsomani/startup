#!/usr/bin/env node
/**
 * Test Coverage Visualization Script
 * Generates comprehensive coverage reports and visualizations
 */

const fs = require('fs');
const path = require('path');
const { basename } = require('path');

class CoverageReporter {
    constructor() {
        this.coverageDir = path.join(__dirname, '../coverage');
        this.outputDir = path.join(__dirname, '../coverage-reports');
        
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    generateCoverageSummary() {
        try {
            const coverageFile = path.join(this.coverageDir, 'coverage-final.json');
            
            if (!fs.existsSync(coverageFile)) {
                console.log('No coverage data found. Run tests with coverage first.');
                return;
            }

            const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
            const summary = this.analyzeCoverage(coverage);
            
            this.writeSummaryReport(summary);
            this.generateBadge(summary.total);
            this.generateMarkdownReport(summary);
            
            console.log('✅ Coverage reports generated successfully!');
            console.log(`📊 Total Coverage: ${summary.total.lines.pct.toFixed(1)}%`);
            console.log(`📁 Reports available in: ${this.outputDir}`);
            
        } catch (error) {
            console.error('❌ Error generating coverage reports:', error.message);
        }
    }

    analyzeCoverage(coverage) {
        const summary = {
            files: {},
            total: {
                statements: { covered: 0, total: 0, pct: 0 },
                branches: { covered: 0, total: 0, pct: 0 },
                functions: { covered: 0, total: 0, pct: 0 },
                lines: { covered: 0, total: 0, pct: 0 }
            }
        };

        // Analyze each file
        Object.keys(coverage).forEach(filePath => {
            const fileData = coverage[filePath];
            const fileSummary = this.calculateFileMetrics(fileData);
            
            summary.files[filePath] = fileSummary;
            
            // Add to totals
            Object.keys(summary.total).forEach(metric => {
                summary.total[metric].covered += fileSummary[metric].covered;
                summary.total[metric].total += fileSummary[metric].total;
            });
        });

        // Calculate percentages
        Object.keys(summary.total).forEach(metric => {
            const metricData = summary.total[metric];
            metricData.pct = metricData.total > 0 ? 
                (metricData.covered / metricData.total) * 100 : 0;
        });

        return summary;
    }

    calculateFileMetrics(fileData) {
        const metrics = {
            statements: { covered: 0, total: 0, pct: 0 },
            branches: { covered: 0, total: 0, pct: 0 },
            functions: { covered: 0, total: 0, pct: 0 },
            lines: { covered: 0, total: 0, pct: 0 }
        };

        // Calculate statements
        if (fileData.s) {
            Object.values(fileData.s).forEach(stmt => {
                metrics.statements.total++;
                if (stmt > 0) {metrics.statements.covered++;}
            });
        }

        // Calculate branches
        if (fileData.b) {
            Object.values(fileData.b).forEach(branch => {
                metrics.branches.total += branch.length;
                metrics.branches.covered += branch.filter(hit => hit > 0).length;
            });
        }

        // Calculate functions
        if (fileData.f) {
            Object.values(fileData.f).forEach(func => {
                metrics.functions.total++;
                if (func > 0) {metrics.functions.covered++;}
            });
        }

        // Calculate lines
        if (fileData.l) {
            Object.values(fileData.l).forEach(line => {
                metrics.lines.total++;
                if (line > 0) {metrics.lines.covered++;}
            });
        }

        // Calculate percentages
        Object.keys(metrics).forEach(metric => {
            const metricData = metrics[metric];
            metricData.pct = metricData.total > 0 ? 
                (metricData.covered / metricData.total) * 100 : 0;
        });

        return metrics;
    }

    writeSummaryReport(summary) {
        const report = {
            generated: new Date().toISOString(),
            summary: summary.total,
            files: Object.keys(summary.files).map(filePath => ({
                path: filePath,
                ...summary.files[filePath]
            }))
        };

        const outputPath = path.join(this.outputDir, 'coverage-summary.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }

    generateBadge(summary) {
        const coverage = summary.lines.pct;
        const color = this.getCoverageColor(coverage);
        
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="Coverage: ${coverage.toFixed(1)}%">
  <title>Coverage: ${coverage.toFixed(1)}%</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="75" height="20" fill="${color}"/>
    <rect x="75" width="45" height="20" fill="#555"/>
    <rect x="75" width="45" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="37.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
    <text x="37.5" y="14">coverage</text>
    <text x="97.5" y="15" fill="#010101" fill-opacity=".3">${coverage.toFixed(1)}%</text>
    <text x="97.5" y="14">${coverage.toFixed(1)}%</text>
  </g>
</svg>`.trim();

        fs.writeFileSync(path.join(this.outputDir, 'coverage-badge.svg'), svg);
    }

    getCoverageColor(coverage) {
        if (coverage >= 80) {return '#4c1';}
        if (coverage >= 60) {return '#dfb317';}
        return '#e05d44';
    }

    generateMarkdownReport(summary) {
        const markdown = `
# 📊 Test Coverage Report

## 📈 Overall Coverage

| Metric | Covered | Total | Percentage |
|--------|---------|--------|------------|
| Statements | ${summary.total.statements.covered} | ${summary.total.statements.total} | ${summary.total.statements.pct.toFixed(1)}% |
| Branches | ${summary.total.branches.covered} | ${summary.total.branches.total} | ${summary.total.branches.pct.toFixed(1)}% |
| Functions | ${summary.total.functions.covered} | ${summary.total.functions.total} | ${summary.total.functions.pct.toFixed(1)}% |
| Lines | ${summary.total.lines.covered} | ${summary.total.lines.total} | ${summary.total.lines.pct.toFixed(1)}% |

### 🎯 Coverage Status: ${this.getCoverageStatus(summary.total.lines.pct)}

![Coverage](coverage-badge.svg)

## 📁 File Coverage

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
${Object.keys(summary.files).map(filePath => {
    const file = summary.files[filePath];
    const fileName = basename(filePath);
    return `| ${fileName} | ${file.statements.pct.toFixed(1)}% | ${file.branches.pct.toFixed(1)}% | ${file.functions.pct.toFixed(1)}% | ${file.lines.pct.toFixed(1)}% |`;
}).join('\n')}

## 🔍 Coverage Quality

- **High Coverage (>80%)**: ${this.countFilesByCoverage(summary.files, 80)} files
- **Medium Coverage (60-80%)**: ${this.countFilesByCoverage(summary.files, 60, 80)} files  
- **Low Coverage (<60%)**: ${this.countFilesByCoverage(summary.files, 0, 60)} files

## 📋 Recommendations

${this.generateRecommendations(summary)}

---

*Report generated on ${new Date().toLocaleDateString()}*
        `.trim();

        fs.writeFileSync(path.join(this.outputDir, 'COVERAGE.md'), markdown);
    }

    getCoverageStatus(coverage) {
        if (coverage >= 80) {return '🟢 Excellent';}
        if (coverage >= 60) {return '🟡 Good';}
        return '🔴 Needs Improvement';
    }

    countFilesByCoverage(files, minCoverage, maxCoverage = Infinity) {
        return Object.values(files).filter(file => {
            const coverage = file.lines.pct;
            return coverage >= minCoverage && coverage < maxCoverage;
        }).length;
    }

    generateRecommendations(summary) {
        const recommendations = [];
        const lowCoverageFiles = Object.entries(summary.files)
            .filter(([_, file]) => file.lines.pct < 60)
            .map(([filePath, _]) => basename(filePath));

        if (summary.total.lines.pct < 80) {
            recommendations.push('- 🎯 **Overall**: Aim for at least 80% coverage');
        }

        if (lowCoverageFiles.length > 0) {
            recommendations.push(`- 📝 **Low Coverage Files**: Add tests for ${lowCoverageFiles.join(', ')}`);
        }

        if (summary.total.branches.pct < 60) {
            recommendations.push('- 🔀 **Branch Coverage**: Add tests for conditional logic');
        }

        if (recommendations.length === 0) {
            recommendations.push('- ✅ **Great job!** Coverage is excellent');
        }

        return recommendations.join('\n');
    }
}

// Run if called directly
if (require.main === module) {
    const reporter = new CoverageReporter();
    reporter.generateCoverageSummary();
}

module.exports = CoverageReporter;