/**
 * Jest setup file
 * Configures the test environment for all tests
 */

import '@testing-library/jest-dom';
import { ZodSchema } from 'zod';
import { mockStorage } from './helpers/mock-storage';

// Set up global test environment
beforeAll(() => {
  // Create the global test environment
  global.testEnv = {
    mockStorage
  };
});

// Add custom matchers
expect.extend({
  /**
   * Custom matcher to validate response against a Zod schema
   * @param {any} received - The value to test
   * @param {ZodSchema} schema - Zod schema to validate against
   */
  toMatchAPISchema(received: any, schema: ZodSchema) {
    const result = schema.safeParse(received);
    
    if (result.success) {
      return {
        message: () => 'Response matches the schema',
        pass: true
      };
    } else {
      return {
        message: () => `Response does not match schema: ${result.error.message}`,
        pass: false
      };
    }
  },
  
  /**
   * Custom matcher to check if an object is a valid schema
   * @param {any} received - The value to test
   */
  toBeValidSchema(received: any) {
    if (
      typeof received === 'object' && 
      received !== null && 
      typeof received.safeParse === 'function'
    ) {
      return {
        message: () => 'Object is a valid schema',
        pass: true
      };
    } else {
      return {
        message: () => 'Object is not a valid schema',
        pass: false
      };
    }
  }
});

// Mock console.error to suppress expected test errors
jest.spyOn(console, 'error').mockImplementation(() => {});

// Add timeout for async tests (10 seconds)
jest.setTimeout(10000);

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});