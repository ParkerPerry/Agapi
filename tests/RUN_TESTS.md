# CircleTube API Testing Framework

This document outlines CircleTube's comprehensive API testing framework designed to validate the functionality and reliability of the platform's core features.

## Testing Approaches in the Project

CircleTube maintains two different testing approaches:

1. **Active Testing Framework** - CommonJS (.cjs) tests in the root directory
   - Simpler, more direct API-focused tests
   - Used for active development and validation
   - Recently updated and maintained

2. **Legacy TypeScript Testing Framework** - TypeScript tests in `/server/test/` directory
   - More structured, TypeScript-based tests 
   - Contains unit, integration, and end-to-end tests
   - Serves as a reference but not actively maintained

> **Note:** The current development and testing focus is on the CommonJS-based tests in the root directory, which provide more straightforward API validation with fewer dependencies.

## Current Status (As of April 2025)

✅ **All Active Test Files Working Properly**:
- Authentication endpoints (tests/api/auth-endpoints.test.cjs)
- Data creation tests (tests/api/data-creation.test.cjs)  
- AI follower functionality (tests/api/followers-api.test.cjs)
- Circle operations (tests/api/circles-api.test.cjs)
- Post creation and retrieval (tests/api/posts-api.test.cjs)
- Schema validation (tests/api/schema.test.cjs)
- Server API connectivity (tests/api/server-api.test.cjs)
- Individual workflow scenarios (tests/api/workflow.test.cjs)

## Active Testing Architecture

The active CircleTube testing framework follows a layered architecture with three distinct testing levels:

### 1. Unit & Schema Tests
Tests that verify basic functionality and data structures:
- **simple.test.js/cjs**: Validates that the test environment itself is working correctly
- **schema.test.cjs**: Ensures database schemas and relationships are properly defined

### 2. API Component Tests
Tests for individual API endpoints and features:
- **auth-endpoints.test.cjs**: Authentication (registration, login)
- **followers-api.test.cjs**: AI followers management
- **posts-api.test.cjs**: Post operations
- **circles-api.test.cjs**: Circle/group functionality
- **data-creation.test.cjs**: Database record creation through API

### 3. Integration & Workflow Tests
Tests that simulate complete user journeys across multiple endpoints:
- **workflow.test.cjs**: End-to-end scenarios that reflect real user behaviors

## Testing Tools & Scripts

### run-simple-tests.sh
A shell script that provides a simplified way to run essential tests:
- Executes critical test files using a minimal configuration
- Focuses on key functionality to ensure system stability
- Uses port 5000 by default for API connections
- Perfect for quick validation during development
- Currently runs auth-endpoints.test.cjs and data-creation.test.cjs

```bash
# Run the simplified test suite
./tests/run-simple-tests.sh
```

### Jest Configurations
We maintain multiple Jest configurations to support different testing scenarios:

- **tests/config/jest.minimal.config.cjs**: Streamlined configuration with essential settings
- **tests/config/jest.ultra-simple.config.js**: Bare minimum configuration for basic tests
- **tests/config/jest.simple.config.ts**: TypeScript-based configuration for more complex tests

### Individual Test Execution
For targeted testing of specific components:

```bash
# Test format
npx jest tests/api/<test-file> --config tests/config/jest.minimal.config.cjs

# Examples
npx jest tests/api/auth-endpoints.test.cjs --config tests/config/jest.minimal.config.cjs
npx jest tests/api/workflow.test.cjs -t "Update profile" --config tests/config/jest.minimal.config.cjs
```

## Key Test Files

### tests/api/auth-helper.test.cjs
Provides authentication utilities for all other tests:
- User registration and login functionality
- Session management
- Base URL determination
- Test user cleanup

### tests/api/workflow.test.cjs
Contains complete user journey tests:
- Multiple interactions across different features
- Simulates realistic usage patterns
- Tests feature integration points
- Uses higher timeout limits (30 seconds) to accommodate complex workflows
- Examples:
  - Create follower → Create post → Verify follower response
  - Update profile → Change settings → Verify changes persisted
  - Create circle → Invite member → Member joins → Create post → View activity

## Design Principles

1. **Resilient Testing**: Tests employ defensive error handling to continue even when some components fail
2. **Independence**: Each test creates its own unique test data (users, circles, etc.)
3. **Realistic Scenarios**: Tests model actual user behavior rather than just API coverage
4. **Progressive Complexity**: Tests build from simple components to complex workflows
5. **Automatic Adaptation**: Tests detect environment settings like ports automatically

## Test Requirements

For AI follower tests to pass, create requests must include:
- `avatarUrl` (valid URL string)
- `responsiveness` (numeric value)
- `type` (follower type designation)

## Common Issues & Troubleshooting

### Timeout Errors
Some endpoints, particularly AI follower creation, may require extended timeouts:
```javascript
jest.setTimeout(10000); // Increase timeout for AI processing
```

### URL Formatting
API endpoints should be called without concatenating base URL:
```javascript
// CORRECT
await request(app).post('/api/followers').send(followerData);

// INCORRECT
await request(app).post(`${baseUrl}/api/followers`).send(followerData);
```

### Authentication Issues
If tests fail with 401 Unauthorized:
1. Check that auth-helper.test.cjs is being properly imported
2. Verify that cookie handling is configured in your test agent
3. Confirm the test user was successfully created before other tests run

## Adding New Tests

1. Follow existing patterns in similar test files
2. Include proper authentication using auth-helper.test.cjs
3. Create unique test data with timestamps or random identifiers
4. Implement defensive error handling for robustness
5. Document any new requirements in this file
6. Consider adding the test to run-simple-tests.sh if it's critical

## Future Testing Improvements

- Expanded workflow tests covering all user journeys
- Performance testing for high-load scenarios
- Security testing for authentication and data access
- Enhanced mock capabilities for external dependencies
- Database migration testing