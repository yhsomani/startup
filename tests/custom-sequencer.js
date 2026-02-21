/**
 * Custom Test Sequencer for TalentSphere
 * Controls test execution order and prioritization
 */

class CustomSequencer {
  constructor(tests, options) {
    this.tests = tests;
    this.options = options;
  }

  /**
   * Sort tests by priority and category
   */
  sort(tests) {
    const categorized = {
      unit: [],
      integration: [],
      api: [],
      e2e: [],
      security: [],
      performance: []
    };

    // Categorize tests
    tests.forEach(test => {
      const testPath = test.path;
      
      if (testPath.includes('/unit/')) {
        categorized.unit.push(test);
      } else if (testPath.includes('/integration/')) {
        categorized.integration.push(test);
      } else if (testPath.includes('/api/')) {
        categorized.api.push(test);
      } else if (testPath.includes('/e2e/')) {
        categorized.e2e.push(test);
      } else if (testPath.includes('/security/')) {
        categorized.security.push(test);
      } else if (testPath.includes('/performance/')) {
        categorized.performance.push(test);
      } else {
        categorized.unit.push(test); // Default to unit
      }
    });

    // Sort within categories
    const sortTests = (testArray) => {
      return testArray.sort((a, b) => {
        // Prioritize critical services
        const serviceOrder = ['auth', 'user', 'job', 'company', 'database'];
        
        const getPriority = (path) => {
          for (let i = 0; i < serviceOrder.length; i++) {
            if (path.includes(serviceOrder[i])) {
              return i;
            }
          }
          return 999;
        };

        const priorityA = getPriority(a.path);
        const priorityB = getPriority(b.path);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Alphabetical sort within same priority
        return a.path.localeCompare(b.path);
      });
    };

    // Return tests in optimal order
    return [
      ...sortTests(categorized.unit),
      ...sortTests(categorized.integration),
      ...sortTests(categorized.api),
      ...sortTests(categorized.security),
      ...sortTests(categorized.performance),
      ...sortTests(categorized.e2e)
    ];
  }

  allTests() {
    return this.sort(this.tests);
  }
}

module.exports = CustomSequencer;