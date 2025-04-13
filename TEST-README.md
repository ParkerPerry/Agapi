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

# For lab validation tests only
npx jest --config jest.validation.config.cjs
```

## Test Reports

Test results are generated in multiple formats for better visibility:

1. **Console Output** - Real-time test results in the terminal
2. **HTML Reports** - Detailed reports at `./test-reports/simple-tests-report.html` and `./test-reports/comprehensive-tests-report.html`
3. **JUnit XML** - CI/CD compatible reports at `./test-reports/simple-tests-junit.xml` and `./test-reports/comprehensive-tests-junit.xml`
4. **Custom Summary** - API group categorization with success percentages
5. **API Trace Reports** - Detailed logs of all API requests and responses in both JSON and HTML formats:
   - `test-reports/simple-api-trace.json` and `test-reports/simple-api-trace.html`
   - `test-reports/comprehensive-api-trace.json` and `test-reports/comprehensive-api-trace.html`
   - `test-reports/validation-api-trace.json` and `test-reports/validation-api-trace.html`

### API Trace Reports

The API trace reports provide complete visibility into all API interactions during test execution:

- **Request details**: Method, URL, headers, and body data
- **Response details**: Status code, headers, and complete response data 
- **Timing information**: Duration of each API call for performance analysis
- **Error details**: Complete error information when API calls fail
- **Test context**: Which test triggered the API call

These reports are particularly useful for:
- Debugging failing tests by examining the exact API responses
- Verifying that the API behaves as expected even when tests pass
- Understanding the sequence of API calls in complex workflow tests
- Documenting the API for future reference
- Performance analysis of API endpoints

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

### Focused Lab Validation Testing

For targeted testing of just the lab validation functionality, use the dedicated test file:

```bash
npx jest --config jest.validation.config.cjs
```

This test (`lab-validation.test.cjs`) creates a minimal setup to focus on verifying AI response queuing:
1. Creates a single test circle and lab
2. Associates the circle with the lab as a control group
3. Creates a test post in the circle
4. Activates the lab to trigger response scheduling
5. Creates an AI follower for the circle
6. Manually creates a pending response for the post
7. Verifies the pending response structure and accessibility via API

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