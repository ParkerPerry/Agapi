/**
 * Simplified Jest Configuration for basic tests
 * This configuration avoids complex setup and external dependencies
 */

import type { Config } from 'jest';

const config: Config = {
  // Test environment
  testEnvironment: 'node',
  
  // Only run simplified tests
  testMatch: [
    '**/test/simplified/**/*.test.+(ts|tsx|js)'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Module name mapper for @ imports
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@client/(.*)$': '<rootDir>/client/src/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  
  // Use verbose output
  verbose: true,
  
  // Timeout settings - shorter for faster feedback
  testTimeout: 5000,
  
  // No automock
  automock: false,
};

export default config;