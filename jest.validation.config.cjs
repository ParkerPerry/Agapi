/**
 * Jest configuration for lab validation tests
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
      filename: 'validation-tests-report.html',
      pageTitle: 'CircleTube Validation Tests Report',
      expand: true,
    }]
  ],
  
  // Test testMatch to include only validation test file
  testMatch: [
    "**/tests/api/lab-validation.test.cjs"
  ],
  
  // Test environment
  testEnvironment: "node",
  
  // Transform settings based on the original jest.config.cjs
  transform: {},
};