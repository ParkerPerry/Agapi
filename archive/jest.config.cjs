/**
 * Simple Jest configuration for tests
 * This file applies to all tests in the project
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Match test files
  testMatch: [
    "**/tests/**/*.test.cjs"
  ],
  
  // Other options
  testTimeout: 15000, // Increased timeout for network operations
  
  // Exit options
  forceExit: true,
  detectOpenHandles: true,
};