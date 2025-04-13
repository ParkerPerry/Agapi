# CircleTube API Testing Guide

## Overview

This document outlines the CircleTube testing architecture and best practices for running and maintaining tests.

## Testing Architecture

CircleTube uses a dual-level testing approach:

1. **Foundational Tests** (Simple) - Core functionality that must pass for the application to be usable
2. **Advanced Tests** (Comprehensive) - Complete functionality including edge cases and complex integrations

### Test Execution Flow

The recommended approach is to run tests in this order:

```
Foundational Tests → Advanced Tests
```

This ensures that basic functionality is working before attempting to test more complex features.

## Test Scripts

CircleTube provides two main test scripts:

### Foundational Tests

```bash
./tests/run-simple-tests.sh
```

This script runs essential API tests that validate core system functionality.

### Advanced Tests

```bash
./tests/run-comprehensive-tests.sh
```

This script runs all API tests including advanced functionality.

## Handling Replit Agent Timeouts

When running in Replit, agent timeouts may occur due to the large number of tests. To work around this limitation:

### Recommended Approach for Direct Testing

Instead of running the full test suite, use direct Jest commands to test specific functionality:

```bash
# For foundational tests
npx jest tests/api/auth-endpoints.test.cjs --config jest.simple-report.config.cjs

# For advanced tests
npx jest tests/api/labs-api.test.cjs --config jest.comprehensive-report.config.cjs

# For workflow tests
npx jest tests/api/lab-wizard-flow.test.cjs --config jest.comprehensive-report.config.cjs
```

## Test Reports

Test results are generated in multiple formats for better visibility:

1. **Console Output** - Real-time test results in the terminal
2. **HTML Reports** - Detailed reports at `./test-reports/simple-tests-report.html` and `./test-reports/comprehensive-tests-report.html`
3. **JUnit XML** - CI/CD compatible reports at `./test-reports/simple-tests-junit.xml` and `./test-reports/comprehensive-tests-junit.xml`
4. **Custom Summary** - API group categorization with success percentages

## Test Structure

Tests are organized by API endpoint groups:

- **Authentication** - User registration, login, session management
- **Circles** - Group functionality
- **Followers** - AI follower management
- **Tools** - External tools and utilities
- **Labs** - Experiment functionality
- **Posts** - Content creation and management
- **Response Queuing** - AI follower response scheduling and delivery

### Lab Wizard Flow Testing

The lab wizard flow test (`lab-wizard-flow.test.cjs`) simulates a complete user journey through lab creation and validation:

1. **Basic Information** - Creates a lab with required fields
2. **Goals & Description** - Updates lab with additional information
3. **Success Metrics** - Adds quantifiable metrics
4. **Circle Creation** - Associates test and control circles
5. **Content Creation** - Creates posts in lab circles
6. **Lab Activation** - Activates the lab for testing
7. **Lab Validation** - Verifies AI follower response queuing functionality

Step 7 specifically tests that AI followers correctly queue responses to posts in lab circles, validating that:
- AI followers can be created and associated with lab circles
- Pending responses can be created for posts
- The API properly returns pending response information
- ThreadManager correctly processes post interactions and responses

## Best Practices

1. **Test Independence** - Each test should create its own data and not depend on other tests except when intentionally testing workflow sequences
2. **Authentication** - Always use `authenticatedAgent` from auth helper for tests requiring login
3. **Cleanup** - Tests should clean up after themselves when possible
4. **Error Tolerance** - Test both success and error cases
5. **Exact Response Matching** - Validate exact API response formats

## Adding New Tests

When adding new tests:

1. Add the test file to `tests/api/` with a descriptive name ending in `.test.cjs`
2. Ensure proper test isolation and cleanup
3. Use the existing patterns for authentication and data creation
4. Run the test individually first before adding to the full suite
5. Consider which test suite (simple or comprehensive) the test belongs in

## CI/CD Integration

The JUnit XML reports are designed to integrate with most CI/CD systems for automated test reporting.