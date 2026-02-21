/**
 * TalentSphere Comprehensive CORS Testing Script
 * Tests CORS configuration across all services
 */

const axios = require('axios');
const WebSocket = require('ws');

// Test configuration
const tests = [
  {
    name: 'API Gateway',
    url: 'http://localhost:8000/health',
    methods: ['GET', 'OPTIONS'],
    origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  },
  {
    name: 'Shell MFE',
    url: 'http://localhost:3000',
    methods: ['GET', 'OPTIONS']
  },
  {
    name: 'LMS MFE',
    url: 'http://localhost:3001',
    methods: ['GET', 'OPTIONS']
  },
  {
    name: 'Challenge MFE',
    url: 'http://localhost:3002',
    methods: ['GET', 'OPTIONS']
  },
  {
    name: 'Notification Service',
    url: 'http://localhost:3030/health',
    methods: ['GET', 'OPTIONS'],
    origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  },
  {
    name: 'Collaboration Service',
    url: 'http://localhost:1234',
    methods: ['GET', 'OPTIONS'],
    websocket: true,
    origins: ['http://localhost:3000', 'http://localhost:3002']
  }
];

// ANSI colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test CORS headers
async function testCORSEndpoint(test, method, origin) {
  try {
    const config = {
      method: method || 'GET',
      url: test.url,
      headers: {}
    };

    if (origin) {
      config.headers['Origin'] = origin;
    }

    const response = await axios(config);

    // Check CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };

    return {
      status: response.status,
      corsHeaders,
      success: true
    };

  } catch (err) {
    return {
      status: err.response?.status || 'ERROR',
      corsHeaders: err.response?.headers || {},
      success: false,
      error: err.message
    };
  }
}

// Test WebSocket CORS
async function testWebSocketCORS(test, origin) {
  return new Promise((resolve) => {
    try {
      const wsUrl = test.url.replace('http://', 'ws://');
      const headers = origin ? { Origin: origin } : {};

      const ws = new WebSocket(wsUrl, { headers });

      const timeout = setTimeout(() => {
        ws.terminate();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true });
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });

    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

// Run single test
async function runTest(test) {
  log(`\n🧪 Testing ${test.name}`, colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  let allPassed = true;

  // Test different origins
  const origins = test.origins || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3010'
  ];

  for (const origin of origins) {
    log(`\n  🌐 Origin: ${origin}`, colors.blue);

    // Test OPTIONS request
    if (test.methods.includes('OPTIONS')) {
      const optionsResult = await testCORSEndpoint(test, 'OPTIONS', origin);
      if (optionsResult.success) {
        log(`    ✅ OPTIONS: ${optionsResult.status}`);
        
        // Check OPTIONS CORS headers
        if (optionsResult.corsHeaders['access-control-allow-origin']) {
          log(`    ✅ ACACO: ${optionsResult.corsHeaders['access-control-allow-origin']}`);
        } else {
          error(`    ❌ Missing Access-Control-Allow-Origin header`);
          allPassed = false;
        }

        if (optionsResult.corsHeaders['access-control-allow-methods']) {
          log(`    ✅ ACM: ${optionsResult.corsHeaders['access-control-allow-methods']}`);
        } else {
          warning(`    ⚠️  Missing Access-Control-Allow-Methods header`);
        }
      } else {
        error(`    ❌ OPTIONS Failed: ${optionsResult.error}`);
        allPassed = false;
      }
    }

    // Test GET request
    if (test.methods.includes('GET')) {
      const getResult = await testCORSEndpoint(test, 'GET', origin);
      if (getResult.success) {
        log(`    ✅ GET: ${getResult.status}`);
        
        // Check GET CORS headers
        if (getResult.corsHeaders['access-control-allow-origin']) {
          log(`    ✅ ACACO: ${getResult.corsHeaders['access-control-allow-origin']}`);
        } else {
          warning(`    ⚠️  Missing Access-Control-Allow-Origin header in GET`);
        }
      } else {
        error(`    ❌ GET Failed: ${getResult.error}`);
        allPassed = false;
      }
    }
  }

  // Test WebSocket if applicable
  if (test.websocket) {
    log(`\n  🔌 Testing WebSocket Connection`, colors.blue);
    
    for (const origin of origins) {
      const wsResult = await testWebSocketCORS(test, origin);
      if (wsResult.success) {
        log(`    ✅ WS (${origin}): Connected`);
      } else {
        error(`    ❌ WS (${origin}): ${wsResult.error}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

// Main test runner
async function runAllTests() {
  log('🎯 TalentSphere CORS Configuration Test', colors.bright);
  log('==========================================\n', colors.bright);

  let totalTests = 0;
  let passedTests = 0;

  for (const test of tests) {
    totalTests++;
    const passed = await runTest(test);
    if (passed) {
      passedTests++;
      success(`${test.name} - PASSED`);
    } else {
      error(`${test.name} - FAILED`);
    }
  }

  // Summary
  log('\n📊 Test Summary', colors.bright);
  log('================\n', colors.bright);
  
  const passRate = Math.round((passedTests / totalTests) * 100);
  
  if (passRate === 100) {
    success(`All tests passed! (${passedTests}/${totalTests})`);
    log('\n🎉 CORS configuration is working correctly!', colors.green);
  } else {
    error(`Tests failed: ${totalTests - passedTests}/${totalTests}`);
    log(`\n⚠️  Pass rate: ${passRate}%`, colors.yellow);
    log('\n💡 Suggestions:', colors.blue);
    log('  1. Check that all services are running');
    log('  2. Verify .env.cors configuration');
    log('  3. Ensure proper CORS middleware is applied');
    log('  4. Check for port conflicts');
  }

  log('\n📋 Tested Services:', colors.bright);
  log('===================\n', colors.bright);
  tests.forEach(test => {
    log(`  • ${test.name} (${test.url})`);
  });

  log('\n🔗 Expected Origins:', colors.bright);
  log('=====================\n', colors.bright);
  log('  • http://localhost:3000 (Shell MFE)');
  log('  • http://localhost:3001 (LMS MFE)');
  log('  • http://localhost:3002 (Challenge MFE)');
  log('  • http://localhost:3010 (Shell Dev)');
  
  process.exit(passRate === 100 ? 0 : 1);
}

// Check if services are running before testing
async function checkServices() {
  log('🔍 Checking service availability...\n', colors.blue);

  for (const test of tests) {
    try {
      if (test.websocket) {
        const wsUrl = test.url.replace('http://', 'ws://');
        const ws = new WebSocket(wsUrl);
        await new Promise((resolve, reject) => {
          ws.on('open', () => {
            ws.close();
            resolve();
          });
          ws.on('error', reject);
          setTimeout(() => reject(new Error('Timeout')), 2000);
        });
        log(`  🟢 ${test.name} (WebSocket)`, colors.green);
      } else {
        await axios.get(test.url, { timeout: 2000 });
        log(`  🟢 ${test.name}`, colors.green);
      }
    } catch (error) {
      log(`  🔴 ${test.name} - ${error.message}`, colors.red);
    }
  }
  
  log('\n');
}

// Main execution
if (require.main === module) {
  checkServices().then(() => {
    runAllTests().catch(error => {
      error(`Test execution failed: ${error.message}`);
      process.exit(1);
    });
  });
}

module.exports = { runTest, testCORSEndpoint, testWebSocketCORS };