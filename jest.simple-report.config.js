/**
 * Jest configuration for simple tests with reporting
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
      filename: 'simple-tests-report.html',
      pageTitle: 'CircleTube Simple Tests Report',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'simple-tests-junit.xml',
    }],
    ['./tests/custom-reporter.js']
  ],
  
  // Test testMatch to include only simple test files
  testMatch: [
    "**/tests/api/auth-endpoints.test.cjs",
    "**/tests/api/data-creation.test.cjs",
    "**/tests/api/circles-api.test.cjs",
    "**/tests/api/followers-api.test.cjs",
    "**/tests/api/tools-api.test.cjs",
    "**/tests/api/circle-follower-api.test.cjs",
    "**/tests/api/default-circle-api.test.cjs"
  ],
  
  // Test environment
  testEnvironment: "node",
  
  // Transform settings based on the original jest.config.cjs
  transform: {},
};