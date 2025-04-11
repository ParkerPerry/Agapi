# CircleTube API Testing Guide

This document outlines the testing approach for the CircleTube API. The testing framework is designed to be lightweight, easy to extend, and compatible with the CommonJS module system to avoid TypeScript configuration issues.

## Important Notes About This Test Suite

1. The test suite is designed to work even when the server is not running by focusing on validating test structure rather than live data.
2. Basic tests (simple.test.cjs, schema.test.cjs) run independently of the server and should always pass.
3. API tests now include dynamic port detection that automatically tries ports 80, 5000, and 5001 to find a working server connection.
4. If all port attempts fail, the tests will report connection errors but still complete without crashing the test suite.
5. In different environments, the server may run on different ports (80, 5000, or 5001), but the dynamic port detection handles this automatically.

## Running the Tests

To run all tests, use the provided bash script:

```bash
./run-simple-tests.sh
```

This will execute all the test files and provide a summary of test results at the end. The script gives you the option to run basic authentication tests only, or to include advanced tests that create actual data in the database.

If the script is not executable, you may need to make it executable first:

```bash
chmod +x run-simple-tests.sh
```

## Test Structure

The tests are organized into three main categories:

### Basic Tests
- `simple.test.cjs` - Basic math tests to verify Jest is working correctly
- `schema.test.cjs` - Tests for Zod schema validation

### API Authentication Tests
- `server-api.test.cjs` - Tests for basic server endpoints
- `followers-api.test.cjs` - Tests for AI followers endpoints
- `posts-api.test.cjs` - Tests for posts endpoints
- `circles-api.test.cjs` - Tests for circles endpoints
- `auth-endpoints.test.cjs` - Tests for authentication endpoints

### Advanced Tests (Data Creation and Workflows)
- `data-creation.test.cjs` - Tests for creating and manipulating actual data
- `workflow.test.cjs` - Tests for complete user workflows and interactions

## Configuration

Tests use a minimal Jest configuration defined in `jest.minimal.config.cjs`. This configuration is designed to work with CommonJS modules and avoid TypeScript complexities.

## Authentication Testing and Helpers

The authentication helper module (`auth-helper.test.cjs`) provides utilities for testing authentication flows and maintaining session state across requests. Key functions include:

- `registerTestUser(agent, userData)` - Registers a new user for testing
- `loginTestUser(agent, username, password)` - Logs in the test user
- `getAuthenticatedAgent()` - Creates a pre-authenticated supertest agent
- `isAuthenticated(agent)` - Checks if an agent is authenticated
- `cleanupTestData(userId)` - Cleans up test data after tests run

Example of using the authenticated agent:

```javascript
const { getAuthenticatedAgent } = require('./auth-helper.test.cjs');

describe('Authenticated API Tests', () => {
  let authenticatedAgent;
  let testUser;
  
  beforeAll(async () => {
    // Get an authenticated agent for testing
    const auth = await getAuthenticatedAgent();
    authenticatedAgent = auth.agent;
    testUser = auth.user;
  });
  
  test('Create a post when authenticated', async () => {
    const postData = { content: 'Test post' };
    const response = await authenticatedAgent.post('/api/posts').send(postData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.content).toBe(postData.content);
  });
});
```

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

## Data Creation Testing

Data creation tests verify the API's ability to create, read, update, and delete entities like users, posts, circles, and followers. These tests:

1. Create an authenticated session
2. Create test entities in the database
3. Verify the entities were created correctly
4. Update the entities
5. Verify the updates were applied
6. (Optionally) Clean up the created test data

Example of a data creation test:

```javascript
test('Can create and update a circle', async () => {
  // Create a circle
  const circleData = {
    name: 'Test Circle',
    description: 'Circle created by automated tests',
    visibility: 'private'
  };
  
  const createResponse = await authenticatedAgent.post('/api/circles').send(circleData);
  expect(createResponse.status).toBe(200);
  const circleId = createResponse.body.id;
  
  // Update the circle
  const updates = {
    name: 'Updated Test Circle',
    description: 'This circle was updated by automated tests'
  };
  
  const updateResponse = await authenticatedAgent.patch(`/api/circles/${circleId}`).send(updates);
  expect(updateResponse.status).toBe(200);
  expect(updateResponse.body.name).toBe(updates.name);
});
```

## Workflow Testing

Workflow tests simulate complete user journeys through the application by combining multiple API calls in sequence. These tests ensure that different components of the API work together correctly. Examples include:

1. Creating a circle, adding a member, and creating a post in the circle
2. Creating an AI follower, creating a post, and verifying follower responses
3. Updating user profile and verifying changes are persisted

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
const { 
  getAuthenticatedAgent, 
  initializeBaseUrl, 
  BASE_URLS 
} = require('./auth-helper.test.cjs');

// Base URL will be determined dynamically
let BASE_URL = BASE_URLS[0]; // Start with first option

// Define validation schema if needed
const mySchema = z.object({
  // Define schema properties
});

describe('[Feature] API', () => {
  // For unauthenticated tests
  // Initialize before running tests
  beforeAll(async () => {
    BASE_URL = await initializeBaseUrl();
    console.log(`Feature API tests using base URL: ${BASE_URL}`);
  });
  
  // Get a new request object with the correct base URL
  const getRequest = () => supertest(BASE_URL);
  
  // For authenticated tests
  let authenticatedAgent;
  let testUser;
  
  beforeAll(async () => {
    // Initialize base URL is already handled above
    const auth = await getAuthenticatedAgent();
    authenticatedAgent = auth.agent;
    testUser = auth.user;
  });
  
  test('Unauthenticated endpoint test', async () => {
    const response = await getRequest().get('/api/public-endpoint');
    expect(response.status).toBe(200);
  });
  
  test('Authenticated endpoint test', async () => {
    const response = await authenticatedAgent.get('/api/protected-endpoint');
    expect(response.status).toBe(200);
  });
});
```

## Best Practices

1. Always test authentication requirements for protected endpoints
2. Validate response schemas when appropriate
3. Test both success and error cases
4. Keep tests focused on a single unit of functionality
5. Use descriptive test names
6. Create isolated test data that doesn't interfere with existing data
7. Clean up test data after tests run
8. Test complete workflows to ensure components work together correctly

## Troubleshooting

### Connection Issues

If API tests are failing with "ECONNREFUSED" errors despite the dynamic port detection:

1. Verify the server is running with `npm run dev`
2. Check which port the server is using in the logs (look for `serving on port X`)
3. The tests automatically try connecting to ports 80, 5000, and 5001
4. If the server is running on a different port, you can modify the BASE_URLS array in auth-helper.test.cjs
5. Port detection logs are output during test execution to help diagnose connection issues
6. If all ports fail, the tests will still run but will report connection errors

### Authentication Issues

If authentication tests are failing:

1. Check the server logs for any auth-related errors
2. Verify the auth-helper.test.cjs file is properly maintaining session cookies
3. Try using longer timeouts for auth tests (Jest's third parameter to `test`)

## Future Improvements

- Add test database setup for isolated testing
- Implement more comprehensive test data generation
- Add mock services for external dependencies (OpenAI, etc.)
- Add performance and load testing
- Implement test coverage reporting
- Add continuous integration setup for automated test runs
- ✓ Added dynamic port detection for improved connectivity across environments
- ✓ Enhanced session management in authentication tests
- ✓ Implemented test suite organization with basic, authentication, and workflow tests
- Consider adding environment-specific configuration options
- Extend test coverage to newer API endpoints as they're developed