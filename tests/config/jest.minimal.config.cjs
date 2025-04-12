/**
 * Minimal Jest configuration for CommonJS tests
 */

// Determine the root directory based on file existence
const fs = require('fs');
const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Only match .cjs files in the root directory (for direct file tests)
  testMatch: [
    '**/*.test.cjs'
  ],
  
  // Modify paths
  moduleDirectories: ['node_modules'],
  
  // Short timeout
  testTimeout: 5000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Other options
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect open handles that might keep Jest running
};