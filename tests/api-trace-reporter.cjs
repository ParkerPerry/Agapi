/**
 * API Trace Reporter for Jest
 * 
 * This reporter captures API request/response details during test execution
 * and generates a detailed report of all API interactions.
 */

const apiTraceUtils = require('./api-trace-utils.cjs');

class ApiTraceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.outputDir = options.outputDir || './test-reports';
    this.outputFile = options.outputFile || 'api-trace-report.json';
    this.htmlReport = options.htmlReport || 'api-trace-report.html';
    
    // Reset API calls collection on initialization
    apiTraceUtils.resetApiCalls();
    
    console.log('API Trace Reporter initialized');
  }

  onRunStart() {
    // Reset API calls at the start of the test run
    apiTraceUtils.resetApiCalls();
    console.log('API call collection started');
  }

  onTestStart(test) {
    // Set current test context
    apiTraceUtils.setCurrentTest({
      name: test.name,
      path: test.path,
      fullName: test.fullName
    });
  }

  onTestEnd() {
    // Clear current test context
    apiTraceUtils.clearCurrentTest();
  }

  onRunComplete() {
    // Save API trace reports
    const jsonPath = `${this.outputDir}/${this.outputFile}`;
    apiTraceUtils.saveApiTraces(jsonPath);
    
    console.log(`\nAPI Trace reports generated:`);
    console.log(`- JSON: ${jsonPath}`);
    console.log(`- HTML: ${jsonPath.replace('.json', '.html')}`);
  }
}

module.exports = ApiTraceReporter;