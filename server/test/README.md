# CircleTube TypeScript Testing Framework (Historical)

> **IMPORTANT NOTE:**  
> This TypeScript testing framework is being maintained for historical reference and is no longer the active testing approach for CircleTube.
>
> **For active testing:**  
> Please use the CommonJS (.cjs) tests in the root directory and refer to the `RUN_TESTS.md` and `TEST_STRUCTURE.md` files for current testing guidance.

## Historical Testing Architecture

This directory contains a comprehensive TypeScript-based testing framework that was originally used for CircleTube. It follows a multi-tier testing strategy:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints with mocked dependencies
3. **End-to-End Tests**: Test complete user flows through the API

## Directory Structure

```
/server/test
  /helpers             - Reusable testing utilities
    /auth.ts           - Authentication helpers
    /setup.ts          - Test app setup helpers
    /validation.ts     - Response validation utilities
    /mock-storage.ts   - Storage mocking utilities
  /schemas             - Zod schemas for response validation
  /types.d.ts          - TypeScript type extensions
  /jest-setup.ts       - Jest environment setup
  /unit                - Unit tests for business logic
  /integration         - API endpoint integration tests
    /auth              - Authentication endpoints
    /followers         - AI follower endpoints
    /posts             - Post management endpoints 
    /circles           - Circle management endpoints
```

## Test Structure Example

A typical test file follows this structure:

```typescript
import { setupTestApp, closeTestApp } from '../helpers/setup';
import { mockAuthentication } from '../helpers/auth';
import { validateStatus } from '../helpers/validation';
import { storage } from '../../storage';
import { expect, jest, describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

describe('Feature Name', () => {
  let app: any;
  let server: any;
  
  // Setup before tests
  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    server = setup.server;
  });
  
  // Cleanup after tests
  afterAll(async () => {
    await closeTestApp(server);
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/endpoint', () => {
    it('should return expected data', async () => {
      // Mock storage methods
      jest.spyOn(storage, 'getMethod').mockResolvedValue({ id: 1, name: 'Test' });
      
      // Make request
      const response = await request(app).get('/api/endpoint');
      
      // Validate response
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', 1);
    });
  });
});
```

## Key Testing Features

This framework includes advanced features such as:

1. **Authentication Helpers**:
   - Mock authentication middleware
   - Authenticated test agents
   - Real authentication flow testing

2. **Response Validation**:
   - Status code checks
   - Content type validation
   - Schema-based validation with Zod

3. **Storage Mocking**:
   - Controlled database behavior
   - Error simulation

## Why We Transitioned to CommonJS Tests

The project moved from this TypeScript framework to the simpler CommonJS tests in the root directory for several reasons:

1. **Reduced Complexity**: Simpler setup and fewer dependencies
2. **Faster Execution**: No TypeScript compilation step needed
3. **Direct API Focus**: Tests API behavior rather than implementation details
4. **Easier Maintenance**: More straightforward for ongoing development

## Learning From This Framework

While not actively used, this framework contains valuable patterns that can inform future testing:

1. **Structured Organization**: Well-organized test directory structure
2. **Advanced Mocking**: Sophisticated mocking techniques for databases and services
3. **Type Safety**: TypeScript integration with testing
4. **Validation Utilities**: Reusable validation logic

## Interested in Using These Tests?

If you need to run these TypeScript tests, you'll need to:

1. Ensure TypeScript is properly configured
2. Use a Jest configuration that supports TypeScript
3. Understand that these tests may not reflect the current API structure

However, we recommend using the current CommonJS tests in the root directory for active development.