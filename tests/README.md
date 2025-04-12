# CircleTube Testing Framework

This directory contains the comprehensive testing framework for CircleTube, an advanced AI-powered social networking platform. Our tests ensure API reliability, functionality, and correct implementation of social features.

## Testing Philosophy

Our testing approach follows these key principles:

1. **Strict API Validation**: Tests properly fail when API responses don't meet expectations
2. **Clear Failure Reporting**: Test failures point precisely to which API is not functioning correctly
3. **Two-Tier Testing**: Essential tests run quickly, comprehensive tests provide full coverage
4. **Progressive Testing**: Tests that depend on earlier functionality will skip if prerequisites fail

## Directory Structure

```
/tests
├── /api                    # API tests using CommonJS (.cjs)
│   ├── auth-endpoints.test.cjs
│   ├── auth-helper.test.cjs
│   ├── circles-api.test.cjs
│   ├── data-creation.test.cjs
│   ├── followers-api.test.cjs
│   ├── posts-api.test.cjs
│   ├── schema.test.cjs
│   ├── server-api.test.cjs
│   ├── simple.test.cjs
│   └── workflow.test.cjs
│
├── /config                 # Jest configurations
│   ├── jest.minimal.config.cjs
│   ├── jest.simple.config.ts
│   └── jest.ultra-simple.config.js
│
├── run-simple-tests.sh     # Main test runner script
├── RUN_TESTS.md            # Comprehensive testing guide
├── TESTING.md              # Quick reference guide
└── TEST_STRUCTURE.md       # Testing architecture documentation
```

## Running Tests

We offer two levels of test coverage, providing flexibility based on your needs:

### Essential Tests

For basic validation of critical functionality:

```bash
# Run essential test suite (faster)
chmod +x tests/run-simple-tests.sh
./tests/run-simple-tests.sh
```

### Comprehensive Tests

For complete validation of all API functionality:

```bash
# Run ALL tests (runs essential tests first, then additional tests)
chmod +x tests/run-comprehensive-tests.sh
./tests/run-comprehensive-tests.sh
```

### Individual Tests

For targeted testing of specific components:

```bash
# Run specific test file
npx jest tests/api/auth-endpoints.test.cjs --config tests/config/jest.minimal.config.cjs

# Run specific test case
npx jest tests/api/workflow.test.cjs -t "Update profile" --config tests/config/jest.minimal.config.cjs
```

## Understanding Test Output

Tests now properly fail when API endpoints don't meet expectations. This strict testing approach ensures clear visibility into which features need attention.

### Error Messages

If you see error messages like these, they indicate real API failures that need fixing:

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

```
Error: expect(received).toHaveProperty(path, value)

Expected path: "id"
Received path: []
```

The error messages point directly to the specific assertion that failed, making it easy to identify and fix the problematic API endpoint.

### Interpreting Results

- ✓ Green checkmarks indicate passing tests (and properly functioning APIs)
- ✗ Red X marks indicate failing tests (APIs not meeting expectations)
- Look for the final test summary for a quick overview of test results

For example:
```
Test Suites: 1 failed, 1 total
Tests:       3 passed, 1 failed, 4 total
```

This summary tells you that one test has failed, pointing to a specific API that needs attention.

## Documentation

- `RUN_TESTS.md` - Detailed documentation of the testing framework
- `TESTING.md` - Quick reference guide with examples and common fixes  
- `TEST_STRUCTURE.md` - Explanation of the testing architecture and history

## Stack

Our testing framework uses:
- Jest for test execution
- Supertest for API endpoint testing
- CommonJS modules for simplified test structure
- Custom utilities for authentication and data creation

For the full project architecture and additional testing approaches, see the `/server/test` directory which contains our historical TypeScript-based testing framework.