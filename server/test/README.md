# CircleTube API Testing Guide

This document provides an overview of the testing infrastructure for CircleTube's API layer.

## Testing Architecture

Our testing approach follows a multi-tier strategy:

1. **Unit Tests**: Test individual functions and components in isolation.
2. **Integration Tests**: Test API endpoints with mocked dependencies.
3. **End-to-End Tests**: Test complete user flows through the API.

## Test Directory Structure

```
/server/test
  /helpers             - Reusable testing utilities
    /auth.ts           - Authentication helpers
    /setup.ts          - Test app setup helpers
    /validation.ts     - Response validation utilities
  /schemas             - Zod schemas for response validation
  /unit                - Unit tests for business logic
  /integration         - API endpoint integration tests
    /auth              - Authentication endpoints
    /followers         - AI follower endpoints
    /posts             - Post management endpoints 
    /circles           - Circle management endpoints
```

## Running Tests

You can use the provided scripts to run tests:

1. **Run All Tests**:
   ```
   ./run-tests.sh all
   ```

2. **Run Specific Test Categories**:
   ```
   ./run-tests.sh unit           # Run unit tests only
   ./run-tests.sh integration    # Run integration tests only
   ./run-tests.sh auth           # Run authentication tests only
   ./run-tests.sh followers      # Run follower tests only
   ./run-tests.sh posts          # Run post tests only
   ./run-tests.sh circles        # Run circle tests only
   ```

3. **Run Tests with Coverage**:
   ```
   ./run-tests.sh coverage
   ```

4. **Simple API Testing**:

   For quick API testing without running the full test suite, use the `test-api.js` script:
   ```
   node test-api.js            # Test all endpoints
   node test-api.js health     # Test health endpoints only
   node test-api.js auth       # Test auth endpoints only
   node test-api.js --verbose  # Show detailed responses
   node test-api.js --with-auth # Attempt real authentication
   ```

## Test Helpers

### Authentication Helpers (`helpers/auth.ts`)

- `getAuthenticatedAgent`: Creates a supertest agent with authenticated session
- `mockAuthentication`: Injects authentication data for testing
- `createTestUser`: Creates a test user for authentication

### Test Setup Helpers (`helpers/setup.ts`)

- `setupTestApp`: Configures an Express app for testing
- `closeTestApp`: Properly closes the test server
- `resetAppState`: Resets application state between tests

### Validation Helpers (`helpers/validation.ts`)

- `validateResponseAgainstSchema`: Validates response against Zod schema
- `validateStatus`: Checks HTTP status code
- `validateContentType`: Verifies response content type

## Response Schemas

Schemas for validating API responses are defined in `schemas/test-schemas.ts`:

- `userResponseSchema`: Validates user objects
- `followerResponseSchema`: Validates AI follower objects
- `postResponseSchema`: Validates post objects
- `circleResponseSchema`: Validates circle objects

## Mocking Strategy

Our tests use Jest mocks to isolate the API layer from dependencies:

1. **Database Mocking**: 
   - We mock the storage interface methods
   - This isolates tests from the database

2. **Authentication Mocking**:
   - We can either mock authentication or use a real session
   - Most tests use mocked authentication for simplicity

3. **External Service Mocking**:
   - OpenAI and other external services are mocked in the setup file

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Assertions**: Use specific assertions with clear failure messages
3. **Validate Responses**: Always validate response structure
4. **Mock Consistently**: Use a consistent mocking approach
5. **Test Error Cases**: Include tests for error conditions