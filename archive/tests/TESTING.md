# CircleTube Testing Quick Reference Guide

## Testing Status
- Tests have been updated to enforce strict API validation
- All tests now properly fail when API expectations aren't met
- Tests include API endpoints, data creation, and user workflows
- Fixed issues with URL formatting, AI follower creation, and timeouts

## Running Tests

### Quickest Way
```bash
./tests/run-simple-tests.sh
```
This runs essential tests with minimal configuration.

### Individual Test Files
```bash
npx jest tests/api/auth-endpoints.test.cjs --config tests/config/jest.minimal.config.cjs
npx jest tests/api/data-creation.test.cjs --config tests/config/jest.minimal.config.cjs
npx jest tests/api/circles-api.test.cjs --config tests/config/jest.minimal.config.cjs
npx jest tests/api/followers-api.test.cjs --config tests/config/jest.minimal.config.cjs
npx jest tests/api/workflow.test.cjs --config tests/config/jest.minimal.config.cjs
```

### Specific Test Case
```bash
npx jest tests/api/workflow.test.cjs -t "Update profile" --config tests/config/jest.minimal.config.cjs
```

## Key Test Files
1. **Individual API Tests**
   - tests/api/auth-endpoints.test.cjs - Authentication
   - tests/api/circles-api.test.cjs - Circle operations
   - tests/api/followers-api.test.cjs - AI follower functionality
   - tests/api/posts-api.test.cjs - Posts operations

2. **Data & Integration Tests**
   - tests/api/data-creation.test.cjs - Database record creation via APIs
   - tests/api/workflow.test.cjs - Complete user journeys across multiple features

## Common Issues & Fixes

### URL Formatting
- API endpoints should be called **without** concatenating base URL
  ```javascript
  // ✅ CORRECT
  await request(app).post('/api/followers').send(followerData);
  
  // ❌ INCORRECT
  await request(app).post(`${baseUrl}/api/followers`).send(followerData);
  ```

### AI Follower Creation
- Must include required fields:
  ```javascript
  const followerData = {
    name: "Test Follower",
    personality: "Helpful test bot",
    avatarUrl: "https://example.com/avatar.png", // Required
    responsiveness: 5, // Required
    type: "assistant" // Required
  };
  ```

### Timeouts
- Some tests (especially AI follower creation) need longer timeouts:
  ```javascript
  // Add at the top of your test file
  jest.setTimeout(10000); // 10 seconds
  ```

### Error Handling
- Tests are now strict and will fail when APIs don't meet expectations:
  ```javascript
  // No try/catch blocks that mask failures
  // Tests will properly fail when assertions aren't met
  const response = await authenticatedAgent.get(`/api/posts/${testPostId}`);
  
  // These assertions must pass for the test to pass
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('id', testPostId);
  ```
- If an API endpoint is being implemented, consider skipping the test instead of adding fake passes

## Interpreting Test Output

### Understanding Test Failures

With our strict testing approach, warning messages in the console should be treated as indicators of real issues. Tests are designed to fail properly when API expectations aren't met.

If you see messages like these, they indicate API failures that need to be fixed:

```
Error: expect(received).toHaveProperty(path, value)
Expected path: "id"
Received path: []
```

```
Error: expect(received).toBe(expected)
Expected: 200
Received: 404
```

### Success Indicators

The true indicator of test success is:

1. Green checkmarks (✓) next to test names
2. The final summary showing all tests passed
3. Exit code 0 from the test command

For example:
```
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

This means all tests passed successfully, which now indicates that API endpoints are functioning properly according to specifications.

## For More Information
See the complete [RUN_TESTS.md](./RUN_TESTS.md) for detailed documentation about the testing architecture, testing philosophy, and troubleshooting guides.