/**
 * Ultra-simple Jest configuration
 * Uses only bare minimum configuration
 */

module.exports = {
  // Use Node.js environment
  testEnvironment: 'node',
  
  // Only run the simple test file
  testMatch: [
    '**/simple.test.js'
  ],
  
  // Short timeout
  testTimeout: 3000,
  
  // Verbose output
  verbose: true
};