/**
 * Minimal Jest configuration for CommonJS tests
 * This configuration works when running from both the project root
 * and the tests directory
 */

// Get the current directory to determine where we're running from
const path = require('path');
const fs = require('fs');

// Check if running from project root or tests directory
const isRunFromRoot = fs.existsSync(path.resolve(process.cwd(), 'tests'));
const rootDir = isRunFromRoot ? './' : '../';

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Only match .cjs files in the root directory (for direct file tests)
  testMatch: [
    '**/*.test.cjs'
  ],
  
  // Root directory for tests
  rootDir: rootDir,
  
  // Short timeout
  testTimeout: 10000, // Increased timeout for slower operations
  
  // Verbose output for debugging
  verbose: true,
  
  // Other options
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect open handles that might keep Jest running
};