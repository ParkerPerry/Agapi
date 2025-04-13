/**
 * Jest configuration for comprehensive tests with reporting
 * 
 * IMPORTANT: This configuration is intended for the full suite of ADVANCED tests
 * that verify complete system functionality. These tests should be run AFTER the
 * simple/foundational tests pass, as they build upon that functionality.
 * 
 * Due to Replit agent timeouts, it's recommended to test specific parts directly with:
 * npx jest tests/api/specific-test-file.test.cjs --config jest.comprehensive-report.config.cjs
 * 
 * See TEST-README.md for more information on testing strategy.
 */
module.exports = {
  // Run tests sequentially to avoid port conflicts
  maxWorkers: 1,
  
  // Increase timeout for API tests
  testTimeout: 30000,
  
  // Use more descriptive test reports
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'comprehensive-tests-report.html',
      pageTitle: 'CircleTube Comprehensive Tests Report',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'comprehensive-tests-junit.xml',
    }],
    ['./tests/custom-reporter.cjs', {}],
    ['./tests/api-trace-reporter.cjs', {
      outputDir: './test-reports',
      outputFile: 'api-traces.json', // Let's use the file name that's already being created
      htmlReport: 'comprehensive-api-trace.html'
    }]
  ],
  
  // Test all API test files for comprehensive coverage
  testMatch: [
    "**/tests/api/*.test.cjs"
  ],
  
  // Test environment
  testEnvironment: "node",
  
  // Transform settings based on the original jest.config.cjs
  transform: {},
};