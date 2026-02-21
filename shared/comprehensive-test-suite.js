/**
 * TalentSphere Comprehensive Test Suite
 * Complete testing framework with unit, integration, and E2E tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ComprehensiveTestSuite {
  constructor(options = {}) {
    this.options = {
      testDir: path.join(__dirname, '../tests'),
      coverageDir: path.join(__dirname, '../coverage'),
      timeout: 30000,
      parallel: options.parallel || false,
      ...options
    };

    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {},
      coverage: {},
      duration: 0
    };

    this.testCategories = {
      unit: {
        description: 'Unit Tests',
        patterns: ['**/*.test.js', '**/*.spec.js'],
        framework: 'jest'
      },
      integration: {
        description: 'Integration Tests',
        patterns: ['**/integration/**/*.test.js'],
        framework: 'jest'
      },
      e2e: {
        description: 'End-to-End Tests',
        patterns: ['**/e2e/**/*.test.js'],
        framework: 'playwright'
      },
      api: {
        description: 'API Tests',
        patterns: ['**/api/**/*.test.js'],
        framework: 'jest'
      },
      security: {
        description: 'Security Tests',
        patterns: ['**/security/**/*.test.js'],
        framework: 'jest'
      },
      performance: {
        description: 'Performance Tests',
        patterns: ['**/performance/**/*.test.js'],
        framework: 'artillery'
      }
    };
  }

  // Run all tests
  async runAllTests(categories = Object.keys(this.testCategories)) {
    const startTime = Date.now();
    
    console.log('🧪 Starting Comprehensive Test Suite');
    console.log(`📋 Test Categories: ${categories.join(', ')}`);
    console.log(`🔧 Parallel: ${this.options.parallel}`);
    console.log('=' .repeat(80));

    try {
      // Prepare test environment
      await this.prepareTestEnvironment();

      // Run tests for each category
      if (this.options.parallel) {
        await this.runTestsParallel(categories);
      } else {
        await this.runTestsSequential(categories);
      }

      // Calculate results
      this.results.duration = Date.now() - startTime;
      
      // Generate reports
      await this.generateReports();
      
      // Print summary
      this.printSummary();

      return this.results;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  // Prepare test environment
  async prepareTestEnvironment() {
    console.log('🔧 Preparing test environment...');
    
    // Create necessary directories
    await fs.mkdir(path.join(this.options.testDir, 'logs'), { recursive: true });
    await fs.mkdir(path.join(this.options.testDir, 'reports'), { recursive: true });
    await fs.mkdir(this.options.coverageDir, { recursive: true });

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    process.env.DB_NAME = 'talentsphere_test';
    
    // Start test database if needed
    await this.startTestServices();
  }

  // Run tests sequentially
  async runTestsSequential(categories) {
    for (const category of categories) {
      console.log(`\n📋 Running ${this.testCategories[category].description}...`);
      await this.runTestCategory(category);
    }
  }

  // Run tests in parallel
  async runTestsParallel(categories) {
    const promises = categories.map(category => 
      this.runTestCategory(category)
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const category = categories[index];
      if (result.status === 'rejected') {
        console.error(`❌ ${category} tests failed:`, result.reason);
        this.results.suites[category] = {
          status: 'error',
          error: result.reason
        };
      }
    });
  }

  // Run specific test category
  async runTestCategory(category) {
    const config = this.testCategories[category];
    const startTime = Date.now();

    try {
      let result;
      
      switch (config.framework) {
        case 'jest':
          result = await this.runJestTests(config.patterns, category);
          break;
        case 'playwright':
          result = await this.runPlaywrightTests(config.patterns, category);
          break;
        case 'artillery':
          result = await this.runArtilleryTests(config.patterns, category);
          break;
        default:
          throw new Error(`Unknown test framework: ${config.framework}`);
      }

      const duration = Date.now() - startTime;
      
      this.results.suites[category] = {
        status: 'completed',
        duration,
        ...result
      };

      // Update totals
      this.results.total += result.total || 0;
      this.results.passed += result.passed || 0;
      this.results.failed += result.failed || 0;
      this.results.skipped += result.skipped || 0;

      console.log(`✅ ${category} completed in ${duration}ms`);
      console.log(`   📊 ${result.passed}/${result.total} passed`);
      
      if (result.failed > 0) {
        console.log(`   ❌ ${result.failed} failed`);
      }

    } catch (error) {
      console.error(`❌ ${category} failed:`, error.message);
      this.results.suites[category] = {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  // Run Jest tests
  async runJestTests(patterns, category) {
    return new Promise((resolve, reject) => {
      const jestConfig = {
        testEnvironment: 'node',
        testMatch: patterns,
        collectCoverage: true,
        coverageDirectory: path.join(this.options.coverageDir, category),
        coverageReporters: ['json', 'lcov', 'text'],
        verbose: false,
        silent: !process.env.DEBUG_TESTS,
        setupFilesAfterEnv: [path.join(this.options.testDir, 'setup.js')]
      };

      const jestProcess = spawn('npx', ['jest', '--json', '--config', JSON.stringify(jestConfig)], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      jestProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      jestProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      jestProcess.on('close', (code) => {
        try {
          const jestResults = output ? JSON.parse(output) : { testResults: [] };
          
          const stats = jestResults.testResults.reduce((acc, test) => {
            acc.total++;
            if (test.status === 'passed') {acc.passed++;}
            else if (test.status === 'failed') {acc.failed++;}
            else {acc.skipped++;}
            return acc;
          }, { total: 0, passed: 0, failed: 0, skipped: 0 });

          resolve({
            ...stats,
            tests: jestResults.testResults,
            coverage: jestResults.coverageMap
          });
        } catch (parseError) {
          reject(parseError);
        }
      });

      jestProcess.on('error', reject);
    });
  }

  // Run Playwright E2E tests
  async runPlaywrightTests(patterns, category) {
    return new Promise((resolve, reject) => {
      const playwrightProcess = spawn('npx', ['playwright', 'test', '--reporter=json', ...patterns], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      playwrightProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      playwrightProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      playwrightProcess.on('close', (code) => {
        try {
          const playwrightResults = this.parsePlaywrightOutput(output);
          
          resolve({
            ...playwrightResults.stats,
            tests: playwrightResults.tests
          });
        } catch (parseError) {
          reject(parseError);
        }
      });

      playwrightProcess.on('error', reject);
    });
  }

  // Run Artillery performance tests
  async runArtilleryTests(patterns, category) {
    return new Promise((resolve, reject) => {
      const artilleryProcess = spawn('npx', ['artillery', 'run', '--output', 'json', ...patterns], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';

      artilleryProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      artilleryProcess.on('close', (code) => {
        try {
          const artilleryResults = JSON.parse(output);
          
          resolve({
            total: artilleryResults.scenarios?.length || 0,
            passed: code === 0 ? artilleryResults.scenarios?.length || 0 : 0,
            failed: code === 0 ? 0 : 1,
            skipped: 0,
            performance: artilleryResults.aggregate
          });
        } catch (parseError) {
          reject(parseError);
        }
      });

      artilleryProcess.on('error', reject);
    });
  }

  // Parse Playwright output
  parsePlaywrightOutput(output) {
    const lines = output.split('\n');
    const tests = [];
    const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };

    for (const line of lines) {
      try {
        if (line.includes('{') && line.includes('}')) {
          const result = JSON.parse(line);
          if (result.type === 'test') {
            tests.push(result);
            stats.total++;
            if (result.status === 'passed') {stats.passed++;}
            else if (result.status === 'failed') {stats.failed++;}
            else {stats.skipped++;}
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    return { tests, stats };
  }

  // Start test services
  async startTestServices() {
    console.log('🚀 Starting test services...');
    
    // Start test database if needed
    try {
      // This would start Docker containers for testing
      // For now, just check if test database is available
    } catch (error) {
      console.warn('Test services startup warning:', error.message);
    }
  }

  // Generate test reports
  async generateReports() {
    console.log('\n📊 Generating test reports...');
    
    // Generate HTML report
    await this.generateHtmlReport();
    
    // Generate JSON report
    await this.generateJsonReport();
    
    // Generate coverage report
    await this.generateCoverageReport();
  }

  // Generate HTML report
  async generateHtmlReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>TalentSphere Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; }
        .metric.passed { background: #e8f5e8; }
        .metric.failed { background: #ffebee; }
        .suites { margin-top: 20px; }
        .suite { background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
        .test-result { padding: 5px 0; }
        .test-passed { color: #4caf50; }
        .test-failed { color: #f44336; }
        .test-skipped { color: #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 TalentSphere Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Total Duration: ${this.results.duration}ms</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${this.results.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric passed">
            <h3>${this.results.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric failed">
            <h3>${this.results.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${this.results.skipped}</h3>
            <p>Skipped</p>
        </div>
    </div>
    
    <div class="suites">
        <h2>Test Suites</h2>
        ${Object.entries(this.results.suites).map(([category, suite]) => `
            <div class="suite">
                <h3>${this.testCategories[category].description}</h3>
                <p>Status: ${suite.status}</p>
                <p>Duration: ${suite.duration || 0}ms</p>
                ${suite.tests ? `<p>Tests: ${suite.tests.length}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.options.testDir, 'reports', 'test-report.html'),
      htmlTemplate
    );
  }

  // Generate JSON report
  async generateJsonReport() {
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        duration: this.results.duration,
        timestamp: new Date().toISOString()
      },
      suites: this.results.suites,
      coverage: this.results.coverage,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    await fs.writeFile(
      path.join(this.options.testDir, 'reports', 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  // Generate coverage report
  async generateCoverageReport() {
    const coverageReport = {
      total: Object.keys(this.results.coverage).length,
      lines: {
        total: 0,
        covered: 0,
        percentage: 0
      },
      functions: {
        total: 0,
        covered: 0,
        percentage: 0
      },
      branches: {
        total: 0,
        covered: 0,
        percentage: 0
      },
      statements: {
        total: 0,
        covered: 0,
        percentage: 0
      }
    };

    // Aggregate coverage from all suites
    for (const coverage of Object.values(this.results.coverage)) {
      if (coverage.lines) {
        coverageReport.lines.total += coverage.lines.total || 0;
        coverageReport.lines.covered += coverage.lines.covered || 0;
      }
      if (coverage.functions) {
        coverageReport.functions.total += coverage.functions.total || 0;
        coverageReport.functions.covered += coverage.functions.covered || 0;
      }
      if (coverage.branches) {
        coverageReport.branches.total += coverage.branches.total || 0;
        coverageReport.branches.covered += coverage.branches.covered || 0;
      }
      if (coverage.statements) {
        coverageReport.statements.total += coverage.statements.total || 0;
        coverageReport.statements.covered += coverage.statements.covered || 0;
      }
    }

    // Calculate percentages
    coverageReport.lines.percentage = coverageReport.lines.total > 0 
      ? (coverageReport.lines.covered / coverageReport.lines.total * 100).toFixed(2) 
      : 0;
    coverageReport.functions.percentage = coverageReport.functions.total > 0 
      ? (coverageReport.functions.covered / coverageReport.functions.total * 100).toFixed(2) 
      : 0;
    coverageReport.branches.percentage = coverageReport.branches.total > 0 
      ? (coverageReport.branches.covered / coverageReport.branches.total * 100).toFixed(2) 
      : 0;
    coverageReport.statements.percentage = coverageReport.statements.total > 0 
      ? (coverageReport.statements.covered / coverageReport.statements.total * 100).toFixed(2) 
      : 0;

    await fs.writeFile(
      path.join(this.options.testDir, 'reports', 'coverage-report.json'),
      JSON.stringify(coverageReport, null, 2)
    );
  }

  // Print test summary
  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(1) 
      : 0;

    console.log(`📈 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️ Skipped: ${this.results.skipped}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`⏱️ Duration: ${this.results.duration}ms`);

    console.log('\n📋 Suite Results:');
    Object.entries(this.results.suites).forEach(([category, suite]) => {
      const status = suite.status === 'completed' ? '✅' : suite.status === 'error' ? '❌' : '⚠️';
      console.log(`  ${status} ${this.testCategories[category].description}: ${suite.status} (${suite.duration || 0}ms)`);
    });

    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! 🎉');
    } else {
      console.log('\n⚠️ Some tests failed. Check reports for details.');
    }

    console.log('\n📄 Reports generated:');
    console.log(`   HTML: ${path.join(this.options.testDir, 'reports', 'test-report.html')}`);
    console.log(`   JSON: ${path.join(this.options.testDir, 'reports', 'test-report.json')}`);
    console.log(`   Coverage: ${path.join(this.options.testDir, 'reports', 'coverage-report.json')}`);
    console.log('='.repeat(80));
  }

  // Cleanup test environment
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
    delete process.env.JWT_SECRET;
    delete process.env.DB_NAME;
    
    // Stop test services if needed
    try {
      // This would stop Docker containers for testing
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
}

// Export test runner function
const runTests = async (options = {}) => {
  const testSuite = new ComprehensiveTestSuite(options);
  return testSuite.runAllTests();
};

module.exports = {
  ComprehensiveTestSuite,
  runTests
};