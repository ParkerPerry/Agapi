# CircleTube Testing Documentation

## Overview

This document describes the testing strategy and implementation for the CircleTube application. We've adopted a comprehensive testing approach with several layers of tests to ensure robustness and code quality.

## Testing Architecture

Our testing approach consists of three main layers:

1. **Unit Tests**: For testing individual functions, components and utilities in isolation.
2. **Integration Tests**: For testing API endpoints and interactions between components.
3. **End-to-End Tests**: For testing complete user flows from the frontend to the backend.

## Test Structure

Tests are organized in the following directory structure:

```
server/
├── test/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   │   ├── auth/              # Authentication tests 
│   │   ├── followers/         # AI Follower tests
│   │   ├── posts/             # Posts tests
│   │   └── circles/           # Circles tests
│   ├── e2e/                   # End-to-end tests
│   ├── helpers/               # Testing utilities and helpers
│   │   ├── auth.ts            # Authentication test helpers
│   │   ├── setup.ts           # Test environment setup
│   │   ├── mock-storage.ts    # Mock storage implementation
│   │   ├── validation.ts      # Response validation helpers
│   │   └── test-factories.ts  # Test data factories
│   ├── schemas/               # API schema validation
│   │   └── test-schemas.ts    # Zod schemas for API responses
│   └── jest-setup.ts          # Jest setup file
```

## Key Testing Components

### 1. Mock Storage

The `mock-storage.ts` file implements an in-memory version of our storage interface, allowing tests to run without a real database. This implementation:
- Maintains in-memory collections for all entity types
- Provides the same API as the real storage implementation
- Can be reset between tests to ensure isolation

### 2. Test Schemas

The `test-schemas.ts` file defines Zod schemas that match expected API responses. These schemas are used to validate:
- Response structure and data types
- Required and optional fields
- Business rules encoded in the schemas

### 3. Authentication Helpers

The `auth.ts` file provides utilities for:
- Creating test users
- Authenticating test requests
- Simulating different authentication states

### 4. Test Factories

The `test-factories.ts` file contains functions to generate test data, ensuring:
- Consistent test data across different tests
- Easy creation of complex entity relationships
- Customization options for specific test scenarios

## Test Types and Examples

### Unit Tests

Unit tests verify the behavior of individual functions in isolation.

Example:
```typescript
describe('User authentication', () => {
  test('validatePassword should verify correct passwords', () => {
    const validPassword = validatePassword('user123', 'password123');
    expect(validPassword).toBe(true);
  });
});
```

### Integration Tests

Integration tests verify API endpoints and database interactions.

Example:
```typescript
describe('POST /api/posts', () => {
  test('should create a new post when authenticated', async () => {
    const agent = await getAuthenticatedAgent(testUser);
    const response = await agent
      .post('/api/posts')
      .send({ content: 'Test post content' });
      
    expect(response.status).toBe(201);
    expect(response.body).toMatchAPISchema(postResponseSchema);
  });
});
```

### End-to-End Tests

End-to-end tests verify complete user flows.

Example:
```typescript
describe('User creates a post and gets responses', () => {
  test('should show post and AI responses in feed', async () => {
    await loginUser('testuser', 'password');
    await createPost('Hello world!');
    await waitForResponses();
    
    const feed = await getFeed();
    expect(feed).toContainPost('Hello world!');
    expect(feed).toContainResponseTo('Hello world!');
  });
});
```

## Running Tests

Tests can be run using the provided scripts:

```bash
# Run all tests
./run-tests.sh

# Run with coverage
./run-tests.sh -c

# Run specific test file
./run-tests.sh -f server/test/integration/auth/login.test.ts

# Run tests matching a specific name
./run-tests.sh -t "should create a new post"
```

## Test Environment

Our tests use the following environment:

- **Jest**: As the test runner and assertion library
- **Supertest**: For testing HTTP endpoints
- **Zod**: For schema validation
- **ts-jest**: For TypeScript integration

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests.
2. **Mock External Services**: Always mock external APIs and services.
3. **Use Factory Functions**: Use test factories to create test data.
4. **Validate Responses**: Always validate API responses against schemas.
5. **Clean Up**: Reset the test state between tests.

## Test Coverage Goals

We aim for the following coverage goals:

- **Unit Tests**: 90% coverage of utility functions and business logic
- **Integration Tests**: 85% coverage of API endpoints
- **End-to-End Tests**: Coverage of critical user flows

## Debugging Tests

When tests fail, consider the following debugging steps:

1. Check the test logs for specific error messages
2. Verify that the test data is correctly set up
3. Ensure that mocks and stubs are properly configured
4. Add more detailed assertions to pinpoint the issue
5. Add console.log statements to track the flow of execution

## Continuous Integration

Tests are automatically run in our CI pipeline on:
- Pull requests to the main branch
- Direct commits to the main branch
- Nightly builds

Failed tests will block merging until resolved.