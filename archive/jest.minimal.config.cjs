/**
 * Minimal Jest configuration for CommonJS tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Only match .cjs files
  testMatch: [
    '**/*.test.cjs'
  ],
  
  // Short timeout
  testTimeout: 5000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Other options
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect open handles that might keep Jest running
};