# CircleTube API Testing Guide

This document provides a comprehensive overview of the testing infrastructure for CircleTube's API layer.

## Testing Architecture

Our testing approach follows a multi-tier strategy:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints with mocked dependencies
3. **End-to-End Tests**: Test complete user flows through the API

## Test Directory Structure

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

## Running Tests

### Using Jest

You can use Jest to run tests directly:

```bash
# Run all tests
npx jest

# Run specific test file
npx jest server/test/integration/example.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="Authentication"

# Run tests with coverage
npx jest --coverage
```

### Using Helper Script

For convenience, you can use the provided `run-tests.sh` script:

```bash
# Make sure script is executable
chmod +x run-tests.sh

# Run all tests
./run-tests.sh all

# Run specific test categories
./run-tests.sh unit           # Run unit tests only
./run-tests.sh integration    # Run integration tests only
./run-tests.sh auth           # Run authentication tests only
./run-tests.sh followers      # Run follower tests only
./run-tests.sh posts          # Run post tests only
./run-tests.sh circles        # Run circle tests only

# Run tests with coverage
./run-tests.sh coverage
```

### Quick API Testing

For fast API testing without running the full test suite, use the `test-api.js` script:

```bash
# Test all endpoints
node test-api.js  

# Test specific endpoint groups
node test-api.js health      # Test health endpoints 
node test-api.js auth        # Test auth endpoints
node test-api.js followers   # Test AI follower endpoints
node test-api.js posts       # Test post endpoints
node test-api.js circles     # Test circle endpoints

# Command options
node test-api.js --verbose   # Show detailed responses
node test-api.js --with-auth # Attempt real authentication
node test-api.js --save      # Save all responses
```

## Creating Tests

### Basic Test Structure

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

### Authentication in Tests

There are three ways to handle authentication in tests:

1. **Mock Authentication Middleware**:
   ```typescript
   // Mock authentication for all routes
   mockAuthentication(app, { id: 1, username: 'testuser' });
   
   const response = await request(app).get('/api/protected-route');
   ```

2. **Authenticate a Test Agent**:
   ```typescript
   // Create an authenticated agent that maintains session
   const agent = await getAuthenticatedAgent(app, { id: 1, username: 'testuser' });
   
   const response = await agent.get('/api/protected-route');
   ```

3. **Test Real Authentication Flow**:
   ```typescript
   // Get an unauthenticated agent
   const agent = request.agent(app);
   
   // Login
   await agent.post('/api/login').send({
     username: 'testuser',
     password: 'password'
   });
   
   // Make authenticated request
   const response = await agent.get('/api/protected-route');
   ```

### Validating Responses

Use validation helpers to check responses:

```typescript
// Check status code
validateStatus(response, 200);

// Validate content type
validateContentType(response, 'application/json');

// Validate against schema
validateResponseAgainstSchema(response.body, userResponseSchema);

// Use Jest assertions
expect(response.body).toHaveProperty('id');
expect(response.body.items).toHaveLength(3);
```

### Mocking Storage

Use the mock storage helpers to control database behavior:

```typescript
// Mock a specific method
jest.spyOn(storage, 'getUser').mockResolvedValue({
  id: 1,
  username: 'testuser',
  password: 'hashedpassword',
  avatarUrl: null,
  bio: null,
  createdAt: new Date()
});

// Mock method to throw error
jest.spyOn(storage, 'createPost').mockRejectedValue(new Error('Database error'));
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on state from other tests
2. **Clear Assertions**: Use specific assertions with clear failure messages
3. **Validate Responses**: Always validate both status codes and response structure
4. **Mock Consistently**: Use a consistent mocking approach across tests
5. **Test Error Cases**: Include tests for error conditions and edge cases
6. **Keep Tests Fast**: Minimize dependencies between tests to keep the test suite fast
7. **Use TypeScript**: Take advantage of TypeScript types for better IDE support and fewer bugs