/**
 * Jest configuration for comprehensive tests with reporting
 */
export default {
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
    ['<rootDir>/tests/custom-reporter.cjs', {}]
  ],
  
  // Test all API test files
  testMatch: [
    "**/tests/api/*.test.cjs"
  ],
  
  // Test environment
  testEnvironment: "node",
  
  // Transform settings based on the original jest.config.cjs
  transform: {},
};