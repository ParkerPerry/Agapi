/**
 * Jest configuration for simple tests with reporting
 */
export default {
  // Run tests sequentially to avoid port conflicts
  maxWorkers: 1,
  
  // Increase timeout for API tests and ensure tests exit properly
  testTimeout: 60000,
  
  // Force Jest to exit after tests complete (prevents hanging)
  forceExit: true,
  
  // Show open handles that might prevent proper termination
  detectOpenHandles: true,
  
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
    ['<rootDir>/tests/custom-reporter.cjs', {}],
    ['<rootDir>/tests/api-trace-reporter.cjs', {
      outputDir: './test-reports',
      outputFile: 'simple-api-trace.json',
      htmlReport: 'simple-api-trace.html'
    }]
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