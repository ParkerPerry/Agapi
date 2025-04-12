# CircleTube Testing Structure

This document explains the testing framework and file organization used in the CircleTube platform.

## Testing Architecture Overview

CircleTube employs two distinct testing approaches:

1. **Active Testing Framework** - CommonJS (.cjs) tests in the `tests/api` directory
   - Current testing focus
   - Simple setup with minimal dependencies
   - Provides comprehensive API validation

2. **Historical/Reference Testing** - TypeScript tests in the `/server/test` directory
   - Maintained for reference purposes
   - May contain more complex configurations
   - Demonstrates TypeScript-based testing approaches

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
├── README.md               # Testing framework overview
├── RUN_TESTS.md            # Comprehensive testing guide
├── TESTING.md              # Quick reference guide
└── TEST_STRUCTURE.md       # This file - architecture documentation
```

## Test Categories and Purpose

### 1. Basic Tests
- **simple.test.cjs**: Verifies the test environment works correctly
- **schema.test.cjs**: Validates database schemas and relationships

### 2. Authentication Tests
- **auth-endpoints.test.cjs**: Tests registration, login, and logout
- **auth-helper.test.cjs**: Provides authentication utilities for other tests

### 3. API Feature Tests
- **followers-api.test.cjs**: Tests AI follower creation/management
- **circles-api.test.cjs**: Tests circle/group functionality
- **posts-api.test.cjs**: Tests post creation and interaction

### 4. Integration Tests
- **data-creation.test.cjs**: Tests database record creation via API
- **workflow.test.cjs**: Tests complete user journeys across features

## Test Configuration Files

Multiple Jest configurations are available to support different testing needs:

1. **tests/config/jest.minimal.config.cjs**
   - Primary configuration for most tests
   - Essential settings without unnecessary complexity
   - Used by the run-simple-tests.sh script

2. **tests/config/jest.ultra-simple.config.js**
   - Bare minimum configuration
   - Used for the most basic tests

3. **tests/config/jest.simple.config.ts**
   - TypeScript-based configuration
   - More comprehensive settings for complex tests

## Test Execution

The test framework prioritizes ease of use:

1. **Simplified Script**
   ```bash
   ./tests/run-simple-tests.sh
   ```
   Executes critical test files through a simple interface

2. **Individual Test Execution**
   ```bash
   npx jest tests/api/<test-file> --config tests/config/jest.minimal.config.cjs
   ```

3. **Specific Test Cases**
   ```bash
   npx jest tests/api/workflow.test.cjs -t "Update profile" --config tests/config/jest.minimal.config.cjs
   ```

## Design Philosophy

1. **Resilience**: Tests use defensive error handling
2. **Independence**: Each test creates its own test data
3. **Realism**: Tests model actual user behavior
4. **Adaptability**: Tests detect environment settings automatically
5. **Simplicity**: Tests use direct methods without complex abstractions

## Migration History

The testing framework has evolved through several iterations:

1. **Initial Implementation**
   - TypeScript tests in `/server/test`
   - Comprehensive TypeScript typing

2. **CommonJS Migration**
   - Simplified testing with CommonJS modules
   - Reduced dependencies and complexity

3. **Infrastructure Consolidation**
   - Created the `tests` directory
   - Organized tests by category
   - Centralized configuration management

Each migration has preserved test coverage while improving developer experience.