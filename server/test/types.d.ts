/**
 * TypeScript type declarations for tests
 */

import { SuperAgentTest } from 'supertest';
import { ZodSchema } from 'zod';
import { mockStorage } from './helpers/mock-storage';

// Extend Jest with custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchAPISchema: (schema: ZodSchema) => R;
      toBeValidSchema: () => R;
    }
  }
  
  // Global test environment
  var testEnv: {
    mockStorage: typeof mockStorage;
  };
}

// SuperTest agent for authenticated requests
declare module 'supertest' {
  interface SuperAgentTest {
    authenticateAs(username: string, password: string): Promise<SuperAgentTest>;
  }
}

// Express with context
declare namespace Express {
  interface Request {
    context: {
      storage: any;
      openai: any;
    };
    isAuthenticated(): boolean;
    user?: {
      id: number;
      [key: string]: any;
    };
  }
}