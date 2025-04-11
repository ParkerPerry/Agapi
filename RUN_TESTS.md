# CircleTube API Testing Guide

This document outlines the testing approach for the CircleTube API. The testing framework is designed to be lightweight, easy to extend, and compatible with the CommonJS module system to avoid TypeScript configuration issues.

## Running the Tests

To run all tests, use the provided bash script:

```bash
./run-simple-tests.sh
```

This will execute all the test files and provide a summary of test results at the end.

If the script is not executable, you may need to make it executable first:

```bash
chmod +x run-simple-tests.sh
```

## Test Structure

The tests are organized by feature area:

- `simple.test.cjs` - Basic math tests to verify Jest is working correctly
- `schema.test.cjs` - Tests for Zod schema validation
- `server-api.test.cjs` - Tests for basic server endpoints
- `followers-api.test.cjs` - Tests for AI followers endpoints
- `posts-api.test.cjs` - Tests for posts endpoints
- `circles-api.test.cjs` - Tests for circles endpoints
- `auth-endpoints.test.cjs` - Tests for authentication endpoints

## Configuration

Tests use a minimal Jest configuration defined in `jest.minimal.config.cjs`. This configuration is designed to work with CommonJS modules and avoid TypeScript complexities.

## Authentication Testing

The authentication tests use a helper file (`auth-helper.test.cjs`) that provides utilities for testing authentication flows. Key functions include:

- `registerTestUser()` - Registers a new user for testing
- `loginTestUser()` - Logs in the test user and returns auth tokens/cookies

## Understanding Public vs. Protected Endpoints

When writing tests, it's important to note which endpoints are public vs. protected:

- Public endpoints (no authentication required):
  - `GET /api` - Server health check
  - `GET /api/posts/:id` - Viewing a single post
  - `GET /api/circles/:id/members` - Viewing circle members
  - `POST /api/circles/:id/members` - Adding a member to a circle
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login

- Protected endpoints (authentication required):
  - `GET /api/user` - Getting current user
  - `GET /api/posts` - Getting all posts
  - `POST /api/posts` - Creating a post
  - `GET /api/followers` - Getting all followers
  - `GET /api/followers/:id` - Getting a specific follower
  - `GET /api/circles` - Getting all circles
  - `GET /api/circles/:id` - Getting a specific circle
  - `POST /api/circles` - Creating a circle

## Schema Validation

The tests use Zod for schema validation. Model schemas are defined in the test files and used to validate API responses.

## Extending the Tests

### Adding a New Test File

1. Create a new CommonJS file with the `.cjs` extension
2. Add your tests using the Jest `describe` and `test` functions
3. Add the test file to the `run-simple-tests.sh` script

### Example Test Structure

```javascript
/**
 * Test file for [Feature] API endpoints
 */
const supertest = require('supertest');
const { z } = require('zod');

// Define validation schema if needed
const mySchema = z.object({
  // Define schema properties
});

describe('[Feature] API', () => {
  const request = supertest('http://localhost:5000');
  
  test('Endpoint description', async () => {
    const response = await request.get('/api/endpoint');
    
    // Add assertions
    expect(response.status).toBe(200);
    
    // If needed, validate response schema
    const validationResult = mySchema.safeParse(response.body);
    expect(validationResult.success).toBe(true);
  });
});
```

### Adding Authentication to Tests

To test endpoints that require authentication, you'll need to extend the current tests to include authentication support. This can be done by:

1. Updating the `auth-helper.test.cjs` file to support authenticated requests
2. Modifying test files to use the authenticated request helper

## Best Practices

1. Always test authentication requirements for protected endpoints
2. Validate response schemas when appropriate
3. Test both success and error cases
4. Keep tests focused on a single unit of functionality
5. Use descriptive test names

## Future Improvements

- Add integration tests for complete workflows
- Implement test fixtures for generating test data
- Add mock services for external dependencies
- Expand test coverage to include edge cases and error handling