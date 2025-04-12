/**
 * Minimal Jest configuration for CommonJS tests
 */

// Determine the root directory based on file existence
const fs = require('fs');
const path = require('path');

// Check if we're running from the project root or tests directory
const isRunFromProjectRoot = fs.existsSync(path.resolve(process.cwd(), 'tests/api'));

// Set the root directory dynamically
const rootDir = isRunFromProjectRoot ? './tests' : '../';

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Only match .cjs files in the root directory (for direct file tests)
  testMatch: [
    '**/*.test.cjs'
  ],
  
  // Allow explicit file paths - configure dynamically based on where we're running from
  rootDir: rootDir,
  
  // Short timeout
  testTimeout: 5000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Other options
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect open handles that might keep Jest running
};