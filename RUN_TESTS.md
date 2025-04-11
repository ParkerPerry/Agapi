# CircleTube Test Runner Guide

We've created a simplified testing approach that you can run manually. Here's how to use it:

## 1. Basic Tests

Run our simple math test (guaranteed to work):

```bash
npx jest --config=jest.minimal.config.cjs
```

This will run the `simple.test.cjs` file with minimal configuration.

## 2. Schema Validation Tests

To verify that our schema validation is working:

```bash
npx jest --config=jest.minimal.config.cjs schema.test.cjs
```

## 3. Running with Verbose Output

For more detailed test output:

```bash
npx jest --config=jest.minimal.config.cjs --verbose
```

## 4. Adding Your Own Tests

If you want to add more tests:

1. Create new test files with `.test.cjs` extension
2. Write tests using CommonJS syntax (require instead of import)
3. Run them with the minimal config:

```bash
npx jest --config=jest.minimal.config.cjs your-new-test.test.cjs
```

## 5. Testing Against the Running Server

Since your server is running on port 5000, you can write integration tests that interact with it:

```javascript
// server-api.test.cjs
const supertest = require('supertest');

describe('Server API', () => {
  const request = supertest('http://localhost:5000');
  
  test('GET /api/user returns 401 when not authenticated', async () => {
    const response = await request.get('/api/user');
    expect(response.status).toBe(401);
  });
});
```

## 6. Adding a Test Script to package.json

If you want to add a test script to package.json, you can run:

```bash
npm pkg set "scripts.test"="jest --config=jest.minimal.config.cjs"
```

Then you can run tests with:

```bash
npm test
```

## 7. Debugging Test Issues

If tests aren't running as expected:

```bash
# Run with more debugging output
npx jest --config=jest.minimal.config.cjs --detectOpenHandles --verbose
```

## 8. Writing More Complex Tests

When you want to write more complex tests, remember to:

1. Use CommonJS modules (require instead of import)
2. Keep dependencies minimal
3. Handle promises properly with async/await
4. Clean up any resources or connections when tests complete

## Sample Test Template

```javascript
// template.test.cjs
const supertest = require('supertest');

describe('Feature Test', () => {
  // Setup before tests
  beforeEach(() => {
    // Test setup code
  });
  
  // Cleanup after tests
  afterEach(() => {
    // Test cleanup code
  });
  
  test('test description', async () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

The simple approach we've provided should work reliably for testing basic functionality without running into the environment conflicts we encountered earlier.