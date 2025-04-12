# CircleTube Testing Framework

This directory contains the comprehensive testing framework for CircleTube, an advanced AI-powered social networking platform. Our tests ensure API reliability, functionality, and correct implementation of social features.

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

The simplest way to run tests is using our test runner script:

```bash
# Run the essential test suite
./tests/run-simple-tests.sh
```

For individual tests:

```bash
# Run specific test file
npx jest tests/api/auth-endpoints.test.cjs --config tests/config/jest.minimal.config.cjs

# Run specific test case
npx jest tests/api/workflow.test.cjs -t "Update profile" --config tests/config/jest.minimal.config.cjs
```

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