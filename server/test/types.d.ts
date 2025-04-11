import 'jest';
import { SuperAgentTest } from 'supertest';

/**
 * Custom TypeScript declarations for test environment
 */

// Add custom matchers to Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResponse(status?: number): R;
    }
  }
}

// Fix supertest type issues
declare module 'supertest' {
  export function agent(app: any): SuperAgentTest;
}

// Extend the storage interface to include testing-specific methods
declare module '../storage' {
  interface IStorage {
    hasCirclePermission(userId: number, circleId: number): Promise<boolean>;
  }
}