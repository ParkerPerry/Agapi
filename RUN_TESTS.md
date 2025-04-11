# CircleTube API Testing Framework

This directory contains a comprehensive API testing framework for CircleTube's backend services. The framework is designed to validate the functionality and reliability of the platform's core features.

## Testing Approach

The testing framework is organized into three progressive levels:

1. **Basic Tests**: Verify the test infrastructure itself and schema validation.
2. **API Tests**: Test individual API endpoints, authentication, and data retrieval.
3. **Workflow Tests**: Test complete user journeys, including data creation and complex interactions.

## How to Run Tests

### Running All Tests

```bash
./run-simple-tests.sh
```

This script will:
1. Execute all test files in sequence
2. Provide a summary of test results
3. Handle test dependencies (e.g., skipping dependent tests when prerequisites fail)

### Running Specific Tests

For more targeted testing:

```bash
npx jest <test-file> --config jest.minimal.config.cjs
```

Example:
```bash
npx jest auth-endpoints.test.cjs --config jest.minimal.config.cjs
```

## Test Files Overview

- **simple.test.js**: Basic math operations to verify Jest is working
- **schema.test.cjs**: Validates the database schema structure
- **auth-helper.test.cjs**: Helpers for authentication in other tests
- **auth-endpoints.test.cjs**: Tests user registration and login
- **followers-api.test.cjs**: Tests AI followers functionality
- **posts-api.test.cjs**: Tests post creation and retrieval
- **circles-api.test.cjs**: Tests circle creation and management
- **data-creation.test.cjs**: Tests creating actual data in the database
- **workflow.test.cjs**: Tests complete user workflows

## Test Configuration

- **jest.minimal.config.cjs**: Simple CommonJS-based Jest configuration
- **jest.ultra-simple.config.js**: Minimal configuration for basic tests

## Important Notes

- Tests automatically detect the correct port (trying 80, 5000, 5001)
- Authentication state is managed through cookie session handling
- Error tolerance is built in to prevent cascading test failures
- Skip logic allows tests to continue even when prerequisites fail

## Troubleshooting

If tests are failing:

1. Ensure the server is running (`npm run dev`)
2. Check for authentication errors (most tests require working login)
3. Verify API endpoints match what tests expect
4. Look for port conflicts or network connectivity issues

## Adding New Tests

1. Follow the patterns in existing test files
2. Ensure proper authentication handling
3. Add appropriate error handling and skip logic
4. Update this documentation when adding major new test areas