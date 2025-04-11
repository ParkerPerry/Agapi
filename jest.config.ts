/**
 * Jest Configuration
 */

import type { Config } from 'jest';

const config: Config = {
  // Base directory for Jest
  rootDir: '.',
  
  // Test environment
  testEnvironment: 'node',
  
  // File patterns for tests
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/server/test/jest-setup.ts',
  ],
  
  // Module name mapper for @ imports
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@client/(.*)$': '<rootDir>/client/src/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'server/**/*.{ts,tsx}',
    '!server/test/**/*',
    '!server/vite.ts',
    '!**/node_modules/**',
  ],
  
  // Test coverage threshold
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Use verbose output
  verbose: true,
  
  // Timeout settings
  testTimeout: 10000,
  
  // Mock API calls in tests by default
  automock: false,
};

export default config;